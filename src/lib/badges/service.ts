import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  UserBadgeRecord,
  UserBadgeSummary,
  PublicBadgeVerification,
} from "@/types/badges";

export interface RecordCreatorShareParams {
  targetType: "card" | "badge";
  targetId: string;
  actionType: "link_copied" | "native_share_opened" | "story_card_downloaded";
}

export interface CreatorShareResult {
  success: boolean;
  deduplicated: boolean;
}

export interface AchievementEvaluationResult {
  user_id: string;
  new_badges_awarded: number;
  total_xp: number;
  current_level: number;
}

/**
 * Resolves a viable Supabase client for execution:
 * Prefers explicitly injected client, or falls back to browser client in browser context.
 */
function resolveClient(client?: SupabaseClient): SupabaseClient | null {
  if (client) return client;
  if (typeof window !== "undefined") {
    return createBrowserClient();
  }
  return null;
}

/**
 * Synchronously evaluates a creator's gamification achievements.
 * Invokes public.evaluate_user_achievements(p_user_id) RPC.
 */
export async function evaluateUserAchievements(
  userId: string,
  client?: SupabaseClient
): Promise<AchievementEvaluationResult | null> {
  const sb = resolveClient(client);
  if (!sb || !userId) return null;

  try {
    const { data, error } = await sb.rpc("evaluate_user_achievements", {
      p_user_id: userId,
    });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[evaluateUserAchievements] RPC error:", error.message);
      }
      return null;
    }

    return data as AchievementEvaluationResult;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[evaluateUserAchievements] Exception:", err);
    }
    return null;
  }
}

/**
 * Retrieves the creator's gamification overview for the Studio Hub.
 * Invokes public.get_user_badges_summary(p_user_id) RPC.
 */
export async function getUserBadgesSummary(
  userId: string,
  client?: SupabaseClient
): Promise<UserBadgeSummary | null> {
  const sb = resolveClient(client);
  if (!sb || !userId) return null;

  try {
    const { data, error } = await sb.rpc("get_user_badges_summary", {
      p_user_id: userId,
    });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[getUserBadgesSummary] RPC error:", error.message);
      }
      return null;
    }

    return data as UserBadgeSummary;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getUserBadgesSummary] Exception:", err);
    }
    return null;
  }
}

/**
 * Retrieves all badges unlocked by the authenticated user with share tokens.
 */
export async function getUserUnlockedBadges(
  userId: string,
  client?: SupabaseClient
): Promise<UserBadgeRecord[]> {
  const sb = resolveClient(client);
  if (!sb || !userId) return [];

  try {
    const { data, error } = await sb
      .from("user_badges")
      .select("id, user_id, badge_id, unlocked_at, points_awarded, share_token")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[getUserUnlockedBadges] Query error:", error.message);
      }
      return [];
    }

    return (data || []) as UserBadgeRecord[];
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getUserUnlockedBadges] Exception:", err);
    }
    return [];
  }
}

/**
 * Records a creator share event (link copy, native share, or story card download).
 * Enforces transactional advisory locks and 5-minute deduplication window in the database.
 */
export async function recordCreatorShareEvent(
  params: RecordCreatorShareParams,
  client?: SupabaseClient
): Promise<CreatorShareResult> {
  const sb = resolveClient(client);
  if (!sb) return { success: false, deduplicated: false };

  try {
    const { data, error } = await sb.rpc("record_creator_share_event", {
      p_target_type: params.targetType,
      p_target_id: params.targetId,
      p_action_type: params.actionType,
    });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[recordCreatorShareEvent] RPC error:", error.message);
      }
      return { success: false, deduplicated: false };
    }

    return {
      success: Boolean(data?.success),
      deduplicated: Boolean(data?.deduplicated),
    };
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[recordCreatorShareEvent] Exception:", err);
    }
    return { success: false, deduplicated: false };
  }
}

/**
 * Tracks users whose studio visits have already been recorded in the current session.
 * Prevents repeating expensive upsert and PL/pgSQL evaluation queries on every route change.
 */
const recordedStudioVisits = new Set<string>();

/**
 * Records a Studio visit to satisfy the criteria for Badge #1 ('first-step').
 * Sets studio_visited_at if currently null and triggers an achievement evaluation.
 * Session-guarded to execute at most once per user session.
 */
export async function recordStudioVisit(
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const sb = resolveClient(client);
  if (!sb || !userId) return;

  // Once recorded in memory or sessionStorage during this session, skip redundant writes
  if (recordedStudioVisits.has(userId)) {
    return;
  }

  if (typeof window !== "undefined") {
    try {
      const key = `suprilo_visited_${userId}`;
      if (sessionStorage.getItem(key)) {
        recordedStudioVisits.add(userId);
        return;
      }
    } catch {
      // Safe ignore storage access errors
    }
  }

  recordedStudioVisits.add(userId);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`suprilo_visited_${userId}`, "1");
    } catch {
      // Safe ignore
    }
  }

  try {
    // Upsert or update studio_visited_at
    await sb
      .from("user_gamification_stats")
      .upsert(
        {
          user_id: userId,
          studio_visited_at: new Date().toISOString(),
          needs_evaluation: true,
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

    // Evaluate badges to unlock first-step
    await evaluateUserAchievements(userId, sb);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[recordStudioVisit] Exception:", err);
    }
  }
}

/**
 * Resolves a public badge share token for verification.
 * Invokes public.get_public_badge_by_token(p_share_token) RPC.
 */
export async function getPublicBadgeByToken(
  shareToken: string,
  client?: SupabaseClient
): Promise<PublicBadgeVerification | null> {
  const sb = resolveClient(client);
  if (!sb || !shareToken || !/^[a-f0-9]{24}$/.test(shareToken.trim())) {
    return null;
  }

  try {
    const { data, error } = await sb.rpc("get_public_badge_by_token", {
      p_share_token: shareToken.trim(),
    });

    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      if (process.env.NODE_ENV !== "production" && error) {
        console.warn("[getPublicBadgeByToken] RPC error:", error.message);
      }
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return row as PublicBadgeVerification;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getPublicBadgeByToken] Exception:", err);
    }
    return null;
  }
}

