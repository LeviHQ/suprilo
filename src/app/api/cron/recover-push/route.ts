import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/server/cron-auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";

export const dynamic = "force-dynamic";

/**
 * Orphaned Push Delivery Fan-Out Recovery Cron Endpoint
 * GET /api/cron/recover-push
 *
 * Requirements:
 * 1. Protected by CRON_SECRET.
 * 2. Invokes recover_orphaned_push_deliveries() RPC.
 * 3. Bounded to a 2-hour recovery window.
 * 4. Strictly requires push_intended = true at original event creation.
 * 5. Excludes subscriptions registered after the notification timestamp (ps.created_at <= n.created_at).
 * 6. Completely idempotent: duplicate recovery calls do not generate duplicate delivery tasks.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  const auth = verifyCronAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { success: false, error: "SERVICE_UNAVAILABLE", message: "Database administrative service unavailable." },
      { status: 503 }
    );
  }

  const { data: recoveredCount, error } = await adminClient.rpc("recover_orphaned_push_deliveries", {
    p_batch_size: 100,
  });

  if (error) {
    console.error("[GET /api/cron/recover-push] RPC Error:", error);
    return NextResponse.json(
      { success: false, error: "RECOVERY_FAILED", message: error.message },
      { status: 500 }
    );
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      data: {
        recovered_count: recoveredCount ?? 0,
        elapsed_ms: durationMs,
      },
    },
    { status: 200 }
  );
}

