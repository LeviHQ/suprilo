import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";
import { deriveSafeActionUrl } from "@/lib/server/notification-url";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";

export const dynamic = "force-dynamic";

const VALID_FILTERS = ["all", "unread", "read"] as const;
type NotificationFilter = (typeof VALID_FILTERS)[number];

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Paginated In-App Notifications Endpoint
 * GET /api/notifications
 *
 * Query Parameters:
 * - filter: 'all' | 'unread' | 'read' (default: 'all')
 * - limit: 1..50 (default: 20)
 * - cursor: ISO timestamp string (optional, cursor-based pagination)
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

    const { searchParams } = new URL(request.url);
    const filterParam = searchParams.get("filter") || "all";
    const filter: NotificationFilter = VALID_FILTERS.includes(filterParam as NotificationFilter)
      ? (filterParam as NotificationFilter)
      : "all";

    let limit = parseInt(searchParams.get("limit") || `${DEFAULT_PAGE_SIZE}`, 10);
    if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

    const cursor = searchParams.get("cursor");
    let cursorDate: string | null = null;
    let cursorId: string | null = null;

    if (cursor) {
      if (cursor.includes("|")) {
        const [cDate, cId] = cursor.split("|");
        if (isNaN(Date.parse(cDate))) {
          return NextResponse.json(
            { success: false, error: "INVALID_CURSOR", message: "Cursor timestamp component must be a valid ISO 8601 string." },
            { status: 400 }
          );
        }
        cursorDate = cDate;
        cursorId = cId;
      } else {
        if (isNaN(Date.parse(cursor))) {
          return NextResponse.json(
            { success: false, error: "INVALID_CURSOR", message: "Cursor must be a valid ISO 8601 timestamp string." },
            { status: 400 }
          );
        }
        cursorDate = cursor;
      }
    }

    // Self-healing: If user reached Level > 1, ensure their LEVEL_UP notifications exist (only on first page load)
    if (!cursorDate) {
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
          console.warn("[notifications] Level-up check warning:", recErr);
        }
      }
    }

    const supabase = await createClient();

    // Query scoped to authenticated user via RLS and explicit filter
    let query = supabase
      .from("notifications")
      .select("id, type, title, body, event_dedup_key, metadata, is_read, read_at, created_at")
      .eq("user_id", authResult.user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1); // Fetch one extra to evaluate has_more

    if (filter === "unread") {
      query = query.eq("is_read", false);
    } else if (filter === "read") {
      query = query.eq("is_read", true);
    }

    if (cursorDate) {
      if (cursorId) {
        query = query.or(`created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`);
      } else {
        query = query.lt("created_at", cursorDate);
      }
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[GET /api/notifications] Query error:", error);
      return NextResponse.json(
        { success: false, error: "DATABASE_ERROR", message: "Failed to fetch notifications." },
        { status: 500 }
      );
    }

    const hasMore = rows ? rows.length > limit : false;
    const rawItems = rows ? rows.slice(0, limit) : [];
    const items = rawItems.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      event_dedup_key: row.event_dedup_key,
      metadata: row.metadata,
      action_url: deriveSafeActionUrl(row.type, row.metadata),
      is_read: row.is_read,
      read_at: row.read_at,
      created_at: row.created_at,
    }));

    const nextCursor =
      hasMore && items.length > 0
        ? `${items[items.length - 1].created_at}|${items[items.length - 1].id}`
        : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          items,
          next_cursor: nextCursor,
          has_more: hasMore,
          filter,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[GET /api/notifications] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

