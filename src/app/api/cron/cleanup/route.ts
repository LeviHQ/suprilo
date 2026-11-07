import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/server/cron-auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";

export const dynamic = "force-dynamic";

const TIME_BUDGET_MS = 7000;
const BATCH_SIZE = 5000;

interface PruneResult {
  deleted_notifications: number;
  deleted_suppressions: number;
  remaining_notification_backlog: number;
  remaining_suppression_backlog: number;
}

/**
 * 30-Day Notification & Suppression Pruning Cron Endpoint
 * GET /api/cron/cleanup
 *
 * Requirements:
 * 1. Protected by CRON_SECRET.
 * 2. Prunes notifications and suppression tombstones older than 30 days.
 * 3. Uses bounded batches with FOR UPDATE SKIP LOCKED.
 * 4. Loops iteratively up to a 7-second time budget.
 * 5. Returns separate backlog counts for notifications and suppressions.
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

  let totalDeletedNotifs = 0;
  let totalDeletedSupp = 0;
  let remainingNotifs = 0;
  let remainingSupp = 0;

  while (Date.now() - startTime < TIME_BUDGET_MS) {
    const { data: rows, error } = await adminClient.rpc("prune_expired_notifications", {
      p_batch_size: BATCH_SIZE,
    });

    if (error) {
      console.error("[GET /api/cron/cleanup] RPC Error:", error);
      return NextResponse.json(
        { success: false, error: "PRUNING_FAILED", message: error.message },
        { status: 500 }
      );
    }

    const batch = (rows && rows.length > 0 ? rows[0] : null) as PruneResult | null;
    if (!batch) break;

    totalDeletedNotifs += batch.deleted_notifications;
    totalDeletedSupp += batch.deleted_suppressions;
    remainingNotifs = Number(batch.remaining_notification_backlog);
    remainingSupp = Number(batch.remaining_suppression_backlog);

    // If both backlogs are cleared, exit early
    if (remainingNotifs === 0 && remainingSupp === 0) break;
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      data: {
        deleted_notifications: totalDeletedNotifs,
        deleted_suppressions: totalDeletedSupp,
        remaining_notification_backlog: remainingNotifs,
        remaining_suppression_backlog: remainingSupp,
        elapsed_ms: durationMs,
      },
    },
    { status: 200 }
  );
}

