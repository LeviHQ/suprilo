import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { getOrCreateCreatorProfile } from "@/lib/server/profile";
import { notifyDataExported } from "@/lib/server/settings-notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/export-data
 * Streams a structured JSON archive of all creator data owned by the authenticated user.
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

    const userId = authResult.user.id;
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: { message: "Database service unavailable" } },
        { status: 503 }
      );
    }

    // 1. Fetch Creator Profile
    const profile = await getOrCreateCreatorProfile(userId, authResult.user.email);

    // 2. Fetch Gamification Stats
    const { data: gamificationStats } = await adminClient
      .from("user_gamification_stats")
      .select("total_xp, current_level, badges_shared_count, cards_shared_count, created_at, studio_visited_at")
      .eq("user_id", userId)
      .maybeSingle();

    // 3. Fetch Earned Badges
    const { data: userBadges } = await adminClient
      .from("user_badges")
      .select("badge_id, points_awarded, unlocked_at, share_token, badges(name, category, rarity, description, artwork_path)")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    // 4. Fetch Creator Scratch Cards & Metrics
    const { data: cards } = await adminClient
      .from("cards")
      .select(`
        id,
        slug,
        status,
        creation_mode,
        template_id,
        recipient_name,
        sender_name,
        occasion_tag,
        primary_message,
        secondary_message,
        foil_style,
        cover_text,
        bg_palette,
        sticker,
        font_family,
        reveal_threshold,
        sound_enabled,
        created_at,
        published_at,
        card_metrics(views_count, reveals_count, last_viewed_at, last_revealed_at)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 5. Fetch Notification Preferences
    const { data: notificationPreferences } = await adminClient
      .from("notification_preferences")
      .select("in_app_enabled, push_enabled, notify_on_reveal, notify_on_badge, notify_on_level")
      .eq("user_id", userId)
      .maybeSingle();

    // Format full JSON archive
    const exportPayload = {
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      creator: {
        id: profile.user_id,
        email: authResult.user.email,
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        avatar_type: profile.avatar_type,
        avatar_preset_id: profile.avatar_preset_id,
        custom_avatar_url: profile.custom_avatar_url,
        member_since: profile.created_at,
        allow_card_analytics: profile.allow_card_analytics,
      },
      gamification: {
        total_xp: gamificationStats?.total_xp ?? 0,
        current_level: gamificationStats?.current_level ?? 1,
        badges_shared_count: gamificationStats?.badges_shared_count ?? 0,
        cards_shared_count: gamificationStats?.cards_shared_count ?? 0,
        earned_badges: userBadges || [],
      },
      cards: (cards || []).map((c) => ({
        id: c.id,
        slug: c.slug,
        status: c.status,
        creation_mode: c.creation_mode,
        template_id: c.template_id,
        recipient_name: c.recipient_name,
        sender_name: c.sender_name,
        occasion_tag: c.occasion_tag,
        primary_message: c.primary_message,
        secondary_message: c.secondary_message,
        foil_style: c.foil_style,
        cover_text: c.cover_text,
        bg_palette: c.bg_palette,
        sticker: c.sticker,
        font_family: c.font_family,
        reveal_threshold: c.reveal_threshold,
        sound_enabled: c.sound_enabled,
        created_at: c.created_at,
        published_at: c.published_at,
        metrics: Array.isArray(c.card_metrics) ? c.card_metrics[0] : c.card_metrics || {
          views_count: 0,
          reveals_count: 0,
        },
      })),
      notification_preferences: notificationPreferences || {
        in_app_enabled: true,
        push_enabled: false,
        notify_on_reveal: true,
        notify_on_badge: true,
        notify_on_level: true,
      },
    };

    await notifyDataExported(userId);

    const formattedDate = new Date().toISOString().split("T")[0];
    const filename = `suprilo-creator-data-${formattedDate}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate creator data export";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
