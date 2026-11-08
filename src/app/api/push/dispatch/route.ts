import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/server/cron-auth";
import { dispatchPendingPushDeliveries } from "@/lib/server/push-dispatcher";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Instant WebPush Dispatch Endpoint
 * POST /api/push/dispatch
 *
 * Allows low-latency, real-time push dispatching when triggered by:
 * 1. Supabase Database Webhook (via CRON_SECRET Bearer token)
 * 2. Authenticated creator client sessions (e.g. after earning badges/levels or upon realtime alerts)
 * 3. Scheduled workers or automated runners
 */
export async function POST(request: Request) {
  // 1. Check CRON_SECRET / Webhook bearer token
  const cronAuth = verifyCronAuth(request);
  let isAuthorized = cronAuth.authenticated;

  // 2. If not cron auth, verify caller authenticated Supabase session
  if (!isAuthorized) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        isAuthorized = true;
      }
    } catch {
      // Unauthenticated session
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED: Invalid authorization credentials or session." },
      { status: 401 }
    );
  }

  // 3. Process pending push deliveries immediately
  try {
    const result = await dispatchPendingPushDeliveries(25);

    return NextResponse.json(
      {
        success: true,
        data: {
          processed: result.processed,
          sent: result.sent,
          cancelled: result.cancelled,
          failed: result.failed,
          stale_purged: result.stale_purged,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error dispatching pending push deliveries";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
