/**
 * Suprilo Creator Badges & Gamification Type System
 * Canonical Specification: SPEC-2C-5.6.1-FINAL, Version 3.0.0
 */

export type BadgeCategory =
  | "getting-started"
  | "creator-journey"
  | "sharing-impact"
  | "milestones"
  | "creative-mastery";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export type BadgeClass = "A" | "B";

export interface BadgeDefinition {
  id: string; // canonical slug
  name: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  points: number;
  description: string;
  artwork_path: string;
  display_order: number;
  badge_class: BadgeClass;
  requirement_summary: string;
  is_active?: boolean;
  xp_award?: number;
  lore?: string;
  criteria?: string;
}

export interface UserBadgeRecord {
  id: string;
  user_id: string;
  badge_id: string;
  points_awarded: number;
  unlocked_at: string;
  share_token: string;
}

export interface UserGamificationStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  timezone: string;
  badges_shared_count: number;
  cards_shared_count: number;
  studio_visited_at: string | null;
  pending_generation: number;
  processed_generation: number;
  needs_evaluation: boolean;
  last_evaluated_at: string | null;
  evaluation_errors_count: number;
  last_evaluation_error: string | null;
  show_profile_publicly: boolean;
}

export interface UserBadgeSummary {
  user_id: string;
  total_xp: number;
  current_level: number;
  unlocked_count: number;
  total_badges: number;
  badges_shared_count: number;
  cards_shared_count: number;
  recent_badges: Array<{
    badge_id: string;
    name: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    points_awarded: number;
    unlocked_at: string;
    share_token: string;
    artwork_path: string;
  }>;
}

export interface PublicBadgeVerification {
  badge_id: string;
  badge_name: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  points_awarded: number;
  description: string;
  artwork_path: string;
  unlocked_at: string;
  creator_display_name: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  requiredXp: number;
  nextLevelXp: number | null;
  deltaToNext: number | null;
}

export const LEVEL_DEFINITIONS: readonly LevelInfo[] = [
  { level: 1, title: "Novice Crafter", requiredXp: 0, nextLevelXp: 250, deltaToNext: 250 },
  { level: 2, title: "Rising Artisan", requiredXp: 250, nextLevelXp: 750, deltaToNext: 500 },
  { level: 3, title: "Celebration Specialist", requiredXp: 750, nextLevelXp: 1500, deltaToNext: 750 },
  { level: 4, title: "Studio Virtuoso", requiredXp: 1500, nextLevelXp: 2750, deltaToNext: 1250 },
  { level: 5, title: "Master Crafter", requiredXp: 2750, nextLevelXp: 4500, deltaToNext: 1750 },
  { level: 6, title: "Grand Architect", requiredXp: 4500, nextLevelXp: 7000, deltaToNext: 2500 },
  { level: 7, title: "Suprilo Legend", requiredXp: 7000, nextLevelXp: 10000, deltaToNext: 3000 },
  { level: 8, title: "Mythic Creator", requiredXp: 10000, nextLevelXp: 13500, deltaToNext: 3500 },
  { level: 9, title: "Celestial Artisan", requiredXp: 13500, nextLevelXp: 17000, deltaToNext: 3500 },
  { level: 10, title: "Hall of Fame Immortal", requiredXp: 17000, nextLevelXp: null, deltaToNext: null },
] as const;

export function getLevelProgress(xp: number): {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo | null;
  progressPercent: number;
  xpInCurrentLevel: number;
} {
  const safeXp = Math.max(0, xp);
  let currentLevel = LEVEL_DEFINITIONS[0];
  let nextLevel: LevelInfo | null = LEVEL_DEFINITIONS[1];

  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (safeXp >= LEVEL_DEFINITIONS[i].requiredXp) {
      currentLevel = LEVEL_DEFINITIONS[i];
      nextLevel = i < LEVEL_DEFINITIONS.length - 1 ? LEVEL_DEFINITIONS[i + 1] : null;
      break;
    }
  }

  if (!nextLevel || currentLevel.deltaToNext === null) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercent: 100,
      xpInCurrentLevel: safeXp - currentLevel.requiredXp,
    };
  }

  const xpInCurrentLevel = safeXp - currentLevel.requiredXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / currentLevel.deltaToNext) * 100));

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    xpInCurrentLevel,
  };
}

