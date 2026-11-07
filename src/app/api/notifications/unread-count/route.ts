import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Lightweight Unread Notifications Count Endpoint
 * GET /api/notifications/unread-count
 *
 * Returns the exact database count of unread notifications for the caller.
 * Used by Navbar notification bell badge without loading full notification items.
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const supabase = await createClient();

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authResult.user.id)
      .eq("is_read", false);

    if (error) {
      console.error("[GET /api/notifications/unread-count] Error:", error);
      return NextResponse.json(
        { success: false, error: "DATABASE_ERROR", message: "Failed to compute unread count." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          unread_count: count ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[GET /api/notifications/unread-count] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

