import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/server/cron-auth";
import { dispatchPendingPushDeliveries } from "@/lib/server/push-dispatcher";

export const dynamic = "force-dynamic";

const TIME_BUDGET_MS = 7000;
const BATCH_SIZE = 50;

/**
 * Push Dispatch Cron Worker Endpoint
 * GET /api/cron/push-dispatch
 *
 * Requirements:
 * 1. Protected by CRON_SECRET.
 * 2. Iteratively processes pending push delivery batches within a 7-second time budget.
 * 3. Applies pre-send preference checks, worker attempt fencing, and exponential backoff.
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

  let totalProcessed = 0;
  let totalSent = 0;
  let totalCancelled = 0;
  let totalFailed = 0;
  let totalStalePurged = 0;

  while (Date.now() - startTime < TIME_BUDGET_MS) {
    const batch = await dispatchPendingPushDeliveries(BATCH_SIZE);
    if (batch.processed === 0) break;

    totalProcessed += batch.processed;
    totalSent += batch.sent;
    totalCancelled += batch.cancelled;
    totalFailed += batch.failed;
    totalStalePurged += batch.stale_purged;

    if (batch.processed < BATCH_SIZE) break;
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      data: {
        processed: totalProcessed,
        sent: totalSent,
        cancelled: totalCancelled,
        failed: totalFailed,
        stale_purged: totalStalePurged,
        elapsed_ms: durationMs,
      },
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  return GET(request);
}

