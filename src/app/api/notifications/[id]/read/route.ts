import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Mark Single Notification As Read Endpoint
 * PATCH /api/notifications/[id]/read
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await context.params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "INVALID_NOTIFICATION_ID", message: "Path parameter id must be a valid UUID." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const readAt = new Date().toISOString();

    // Authenticated user can ONLY update their own notification's read state
    const { data: updatedRows, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: readAt,
      })
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .select("id, is_read, read_at");

    if (error) {
      console.error("[PATCH /api/notifications/[id]/read] Update error:", error);
      return NextResponse.json(
        { success: false, error: "DATABASE_ERROR", message: "Failed to update notification." },
        { status: 500 }
      );
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Notification not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedRows[0],
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[PATCH /api/notifications/[id]/read] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

