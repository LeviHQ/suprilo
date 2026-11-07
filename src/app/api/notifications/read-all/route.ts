import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Mark All Notifications As Read Endpoint
 * PATCH /api/notifications/read-all
 *
 * Scoped strictly to the authenticated caller's own unread notifications.
 */
export async function PATCH(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const supabase = await createClient();
    const readAt = new Date().toISOString();

    const { data: updatedRows, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: readAt,
      })
      .eq("user_id", authResult.user.id)
      .eq("is_read", false)
      .select("id");

    if (error) {
      console.error("[PATCH /api/notifications/read-all] Update error:", error);
      return NextResponse.json(
        { success: false, error: "DATABASE_ERROR", message: "Failed to mark all notifications as read." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          updated_count: updatedRows ? updatedRows.length : 0,
          read_at: readAt,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[PATCH /api/notifications/read-all] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

