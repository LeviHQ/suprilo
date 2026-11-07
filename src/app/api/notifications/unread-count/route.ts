import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";

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

    // Self-healing: If user reached Level > 1, ensure their LEVEL_UP notifications exist
    const admin = getSupabaseAdminClient();
    if (admin) {
      try {
        const { data: stats } = await admin
          .from("user_gamification_stats")
          .select("current_level")
          .eq("user_id", authResult.user.id)
          .maybeSingle();

        if (stats?.current_level && stats.current_level > 1) {
          for (let lvl = 2; lvl <= stats.current_level; lvl++) {
            const dedupKey = `level:${authResult.user.id}:${lvl}`;
            const { data: existing } = await admin
              .from("notifications")
              .select("id")
              .eq("user_id", authResult.user.id)
              .eq("event_dedup_key", dedupKey)
              .maybeSingle();

            if (!existing) {
              await admin.from("notifications").insert({
                user_id: authResult.user.id,
                type: "LEVEL_UP",
                title: "Level Up!",
                body: `Congratulations! You reached Level ${lvl}!`,
                event_dedup_key: dedupKey,
                metadata: { level: lvl, reconciled: true, url: "/profile" },
                push_intended: false,
                is_read: false,
              });
            }
          }
        }
      } catch (recErr) {
        console.warn("[unread-count] Level-up check warning:", recErr);
      }
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
        unread_count: count ?? 0,
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

