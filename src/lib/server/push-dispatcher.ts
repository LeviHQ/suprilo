// Server-Side Push Dispatcher Engine
// Implements SPEC-2C-5.7.5-REV6 Push Worker Lifecycle with Fencing and Pre-Send Checks.
// Server-only boundary.

import { setVapidDetails, sendNotification } from "web-push";
import { getSupabaseAdminClient } from "./card-recipient";
import { deriveSafeActionUrl } from "./notification-url";

export interface ClaimedPushDelivery {
  delivery_id: string;
  notification_id: string;
  subscription_id: string;
  target_user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  claimed_attempt: number;
}

export interface DispatchResult {
  processed: number;
  sent: number;
  cancelled: number;
  failed: number;
  stale_purged: number;
}

let vapidConfigured = false;

function ensureVapidConfig(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@suprilo.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  try {
    setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("[PushDispatcher] Failed to initialize VAPID details:", err);
    return false;
  }
}

/**
 * Checks whether the WebPush delivery infrastructure is ready on the server.
 */
export function isPushInfrastructureAvailable(): {
  available: boolean;
  libraryInstalled: boolean;
  vapidConfigured: boolean;
} {
  const hasKeys = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );

  return {
    available: hasKeys,
    libraryInstalled: true,
    vapidConfigured: hasKeys,
  };
}

/**
 * Processes a single batch of pending push deliveries with attempt fencing.
 */
export async function dispatchPendingPushDeliveries(batchSize = 50): Promise<DispatchResult> {
  const supabase = getSupabaseAdminClient();
  const result: DispatchResult = {
    processed: 0,
    sent: 0,
    cancelled: 0,
    failed: 0,
    stale_purged: 0,
  };

  if (!supabase) {
    console.warn("[PushDispatcher] Supabase admin client unavailable.");
    return result;
  }

  // Pre-flight infrastructure check:
  // If VAPID is unconfigured, DO NOT claim deliveries.
  // Claiming rows while infrastructure is unready burns attempt counters and exhausts retries.
  const infraReady = ensureVapidConfig();
  if (!infraReady) {
    const reason = "Push delivery paused: VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) are unconfigured.";
    console.warn(`[PushDispatcher] ${reason} Pending deliveries will remain safely queued in PENDING state.`);
    return result;
  }

  // 1. Claim pending delivery batch using SKIP LOCKED
  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_pending_push_deliveries",
    { p_batch_size: batchSize }
  );

  if (claimError || !claimedRows || claimedRows.length === 0) {
    if (claimError) {
      console.error("[PushDispatcher] claim_pending_push_deliveries RPC error:", claimError);
    }
    return result;
  }

  const tasks = claimedRows as ClaimedPushDelivery[];
  result.processed = tasks.length;

  for (const task of tasks) {
    // 2. Pre-Send Check: Re-verify current push_enabled preference immediately before sending
    const { data: pref, error: prefError } = await supabase
      .from("notification_preferences")
      .select("push_enabled")
      .eq("user_id", task.target_user_id)
      .maybeSingle();

    // CASE A: Transient database or network error during pre-send query
    // Do NOT cancel! Record retryable transient failure (HTTP 503) so it backs off and retries
    if (prefError) {
      await supabase.rpc("record_push_delivery_result", {
        p_delivery_id: task.delivery_id,
        p_claimed_attempt: task.claimed_attempt,
        p_http_status: 503,
        p_error_message: `Pre-send preference check transient failure: ${prefError.message}`,
      });
      result.failed++;
      continue;
    }

    // CASE B: User explicitly opted out or has no preference row (default disabled)
    // Safely invoke fenced cancel_push_delivery (preserves subscription)
    if (!pref || pref.push_enabled === false) {
      await supabase.rpc("cancel_push_delivery", {
        p_delivery_id: task.delivery_id,
        p_claimed_attempt: task.claimed_attempt,
        p_reason: !pref
          ? "Delivery cancelled: User has no notification preferences record"
          : "Delivery cancelled: User disabled push notifications prior to network dispatch",
      });
      result.cancelled++;
      continue;
    }

    // CASE C: Confirmed opted in -> verify VAPID configuration
    if (!ensureVapidConfig()) {
      await supabase.rpc("record_push_delivery_result", {
        p_delivery_id: task.delivery_id,
        p_claimed_attempt: task.claimed_attempt,
        p_http_status: 503,
        p_error_message: "Push delivery paused: VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) are unconfigured",
      });
      result.failed++;
      continue;
    }

    // CASE D: Transmit WebPush payload over HTTP to provider gateway
    let httpStatus = 0;
    let errorMessage: string | null = null;

    try {
      // Derive strictly validated navigation destination URL
      const inferredType = typeof task.metadata?.type === "string" ? task.metadata.type : "SYSTEM";
      const safeUrl = deriveSafeActionUrl(inferredType, task.metadata) || "/profile";

      const payloadString = JSON.stringify({
        title: task.title,
        body: task.body,
        data: {
          url: safeUrl,
          notification_id: task.notification_id,
        },
      });

      const response = await sendNotification(
        {
          endpoint: task.endpoint,
          keys: {
            p256dh: task.p256dh,
            auth: task.auth,
          },
        },
        payloadString,
        {
          TTL: 86400,
          urgency: "high",
        }
      );

      httpStatus = response?.statusCode || 200;
    } catch (err: unknown) {
      const errorObj = err as { statusCode?: number; message?: string };
      httpStatus = errorObj?.statusCode || 500;
      errorMessage = errorObj?.message || "WebPush network transport error";
    }

    // 3. Record provider response with attempt fencing
    await supabase.rpc("record_push_delivery_result", {
      p_delivery_id: task.delivery_id,
      p_claimed_attempt: task.claimed_attempt,
      p_http_status: httpStatus,
      p_error_message: errorMessage,
    });

    if (httpStatus >= 200 && httpStatus <= 299) {
      result.sent++;
    } else if (httpStatus === 404 || httpStatus === 410) {
      result.stale_purged++;
    } else {
      result.failed++;
    }
  }

  return result;
}
