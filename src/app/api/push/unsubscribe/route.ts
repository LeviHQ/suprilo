import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";

export const dynamic = "force-dynamic";

/**
 * Remove Push Subscription Endpoint
 * POST /api/push/unsubscribe
 *
 * Requirements:
 * 1. Authenticated user only.
 * 2. Removes specified endpoint (or all endpoints if full opt-out requested).
 * 3. Disables push_enabled preference ONLY when the user has zero remaining active subscriptions.
 * 4. Cancels pending push deliveries for removed endpoints.
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

    let body: { endpoint?: string } = {};
    try {
      body = (await request.json()) || {};
    } catch {
      // Empty body treated as full opt-out for this user
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "SERVICE_UNAVAILABLE", message: "Database administrative service unavailable." },
        { status: 503 }
      );
    }

    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : null;

    if (endpoint) {
      // Remove specific endpoint owned by this user
      const { error: delError } = await adminClient
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint)
        .eq("user_id", authResult.user.id);

      if (delError) {
        console.error("[POST /api/push/unsubscribe] Delete error:", delError);
        return NextResponse.json(
          { success: false, error: "DATABASE_ERROR", message: "Failed to remove subscription." },
          { status: 500 }
        );
      }
    } else {
      // Full opt-out: remove all push endpoints for this user
      const { error: delAllError } = await adminClient
        .from("push_subscriptions")
        .delete()
        .eq("user_id", authResult.user.id);

      if (delAllError) {
        console.error("[POST /api/push/unsubscribe] Delete all error:", delAllError);
        return NextResponse.json(
          { success: false, error: "DATABASE_ERROR", message: "Failed to remove subscriptions." },
          { status: 500 }
        );
      }
    }

    // Check remaining subscriptions count for user
    const { count, error: countError } = await adminClient
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authResult.user.id);

    const remainingCount = countError ? 0 : (count ?? 0);

    // If zero subscriptions remain, disable push_enabled in preferences
    if (remainingCount === 0) {
      await adminClient
        .from("notification_preferences")
        .update({
          push_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", authResult.user.id);

      // Cancel any remaining queued deliveries for this user
      await adminClient
        .from("notification_push_deliveries")
        .update({
          status: "CANCELLED",
          last_error: "Delivery cancelled: User disabled push notifications",
          updated_at: new Date().toISOString(),
        })
        .in(
          "notification_id",
          (
            await adminClient
              .from("notifications")
              .select("id")
              .eq("user_id", authResult.user.id)
          ).data?.map((n) => n.id) || []
        )
        .eq("status", "PENDING");
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          unsubscribed: true,
          remaining_subscriptions_count: remainingCount,
          push_enabled: remainingCount > 0,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/push/unsubscribe] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

