import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { validatePushSubscriptionPayload } from "@/lib/server/push-validation";

export const dynamic = "force-dynamic";

/**
 * Register Browser Push Subscription Endpoint
 * POST /api/push/subscribe
 *
 * Requirements:
 * 1. Requires authenticated user session.
 * 2. Validates endpoint URL against approved push providers (SSRF protection).
 * 3. Validates base64url keys (p256dh and auth).
 * 4. Persists subscription via service_role.
 * 5. Enables push_enabled preference ONLY after successful subscription persistence.
 * 6. Supports multiple subscriptions per user (unique by endpoint).
 */
export async function POST(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON", message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const validation = validatePushSubscriptionPayload(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error, message: validation.message },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "SERVICE_UNAVAILABLE", message: "Database administrative service unavailable." },
        { status: 503 }
      );
    }

    const validSub = validation.data;
    const nowIso = new Date().toISOString();

    // Check for existing endpoint ownership to handle device transfer cleanly
    const { data: existingSub } = await adminClient
      .from("push_subscriptions")
      .select("id, user_id")
      .eq("endpoint", validSub.endpoint)
      .maybeSingle();

    const previousOwnerId =
      existingSub && existingSub.user_id !== authResult.user.id
        ? existingSub.user_id
        : null;

    // 1. Persist or transfer endpoint ownership to current authenticated user
    const { error: subError } = await adminClient
      .from("push_subscriptions")
      .upsert(
        {
          user_id: authResult.user.id,
          endpoint: validSub.endpoint,
          p256dh: validSub.p256dh,
          auth: validSub.auth,
          user_agent: validSub.userAgent,
          updated_at: nowIso,
        },
        { onConflict: "endpoint" }
      );

    if (subError) {
      console.error("[POST /api/push/subscribe] Failed to persist subscription:", subError);
      return NextResponse.json(
        { success: false, error: "SUBSCRIPTION_PERSISTENCE_FAILED", message: "Failed to store push subscription." },
        { status: 500 }
      );
    }

    // If transferred from another user, reconcile previous owner's push_enabled state
    if (previousOwnerId) {
      const { count: prevRemaining } = await adminClient
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", previousOwnerId);

      if ((prevRemaining ?? 0) === 0) {
        await adminClient
          .from("notification_preferences")
          .update({
            push_enabled: false,
            updated_at: nowIso,
          })
          .eq("user_id", previousOwnerId);
      }
    }

    // 2. Enable push preference ONLY after subscription persistence succeeds
    const { error: prefError } = await adminClient
      .from("notification_preferences")
      .upsert(
        {
          user_id: authResult.user.id,
          push_enabled: true,
          updated_at: nowIso,
        },
        { onConflict: "user_id" }
      );

    if (prefError) {
      console.error("[POST /api/push/subscribe] Failed to update preference:", prefError);
      return NextResponse.json(
        {
          success: false,
          error: "PREFERENCE_UPDATE_FAILED",
          message: "Subscription saved, but failed to enable push notification preferences.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          subscribed: true,
          endpoint: validSub.endpoint,
          push_enabled: true,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/push/subscribe] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

