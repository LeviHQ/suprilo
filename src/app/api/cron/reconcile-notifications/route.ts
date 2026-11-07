import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/server/cron-auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";

export const dynamic = "force-dynamic";

/**
 * Daily Notification Reconciliation Cron Endpoint
 * GET /api/cron/reconcile-notifications
 *
 * Requirements:
 * 1. Protected by CRON_SECRET.
 * 2. Invokes reconcile_missing_notifications() RPC.
 * 3. Reconciles unnotified card reveals and badge awards within the 30-day window.
 * 4. Respects user category preferences and suppression tombstones.
 * 5. Reconciled notifications do NOT create push deliveries (push_intended = false).
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

  const { data: rows, error } = await adminClient.rpc("reconcile_missing_notifications");

  if (error) {
    console.error("[GET /api/cron/reconcile-notifications] RPC Error:", error);
    return NextResponse.json(
      { success: false, error: "RECONCILIATION_FAILED", message: error.message },
      { status: 500 }
    );
  }

  const result = rows && rows.length > 0 ? rows[0] : { reveals_reconciled: 0, badges_reconciled: 0 };
  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      data: {
        reveals_reconciled: result.reveals_reconciled ?? 0,
        badges_reconciled: result.badges_reconciled ?? 0,
        elapsed_ms: durationMs,
      },
    },
    { status: 200 }
  );
}

