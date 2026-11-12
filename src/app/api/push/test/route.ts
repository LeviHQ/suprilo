import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { dispatchPendingPushDeliveries } from "@/lib/server/push-dispatcher";

export const dynamic = "force-dynamic";

/**
 * Send Test Push Notification Endpoint
 * POST /api/push/test
 *
 * Allows authenticated users to verify their device's WebPush delivery
 * directly from the Notification Preferences Panel.
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

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "SERVICE_UNAVAILABLE", message: "Database administrative service unavailable." },
        { status: 503 }
      );
    }

    const userId = authResult.user.id;

    // Check that user has at least one registered push subscription
    const { data: subs, error: subError } = await adminClient
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (subError || !subs || subs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_SUBSCRIPTION",
          message: "No active push subscription registered on this device. Please enable push notifications first.",
        },
        { status: 400 }
      );
    }

    // Ensure push_enabled preference is true
    await adminClient
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          push_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    // Enqueue test notification
    const dedupKey = `test:${userId}:${Date.now()}`;
    await adminClient.rpc("enqueue_notification_safe", {
      p_user_id: userId,
      p_type: "SYSTEM",
      p_title: "Suprilo Push Alert 🔔",
      p_body: "Web Push notifications are working perfectly on your device!",
      p_dedup_key: dedupKey,
      p_metadata: { url: "/profile/notifications" },
    });

    // Dispatch immediately
    const dispatchResult = await dispatchPendingPushDeliveries(10);

    return NextResponse.json(
      {
        success: true,
        data: {
          sent: dispatchResult.sent,
          processed: dispatchResult.processed,
          failed: dispatchResult.failed,
        },
        message: "Test push notification dispatched successfully.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/push/test] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
