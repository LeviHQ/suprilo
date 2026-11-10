/**
 * Suprilo Creator Profile & Identity Types
 * Specification Reference: SPEC-2C-5.8.0-ACCOUNT-SETTINGS
 */

export type AvatarType = "google" | "preset" | "custom";
export type AvatarSource = "google" | "manual";

export type PresetAvatarId =
  | "preset-male-1"
  | "preset-male-2"
  | "preset-male-3"
  | "preset-female-1"
  | "preset-female-2"
  | "preset-female-3"
  | "preset-girl-1"
  | "preset-boy-1"
  | "preset-elder-male-1"
  | "preset-elder-female-1";

export interface PresetAvatarDefinition {
  id: PresetAvatarId;
  label: string;
  category: "adult-male" | "adult-female" | "boy" | "girl" | "elder-male" | "elder-female";
  gender: "male" | "female" | "neutral";
  src: string;
}

export const PRESET_AVATARS: readonly PresetAvatarDefinition[] = [
  // 3 Adult Male
  {
    id: "preset-male-1",
    label: "Leo (Adventurer)",
    category: "adult-male",
    gender: "male",
    src: "/avatars/presets/preset-male-1.svg",
  },
  {
    id: "preset-male-2",
    label: "Marcus (Creative)",
    category: "adult-male",
    gender: "male",
    src: "/avatars/presets/preset-male-2.svg",
  },
  {
    id: "preset-male-3",
    label: "Devon (Tech Craftsman)",
    category: "adult-male",
    gender: "male",
    src: "/avatars/presets/preset-male-3.svg",
  },
  // 3 Adult Female
  {
    id: "preset-female-1",
    label: "Maya (Artist)",
    category: "adult-female",
    gender: "female",
    src: "/avatars/presets/preset-female-1.svg",
  },
  {
    id: "preset-female-2",
    label: "Elena (Storyteller)",
    category: "adult-female",
    gender: "female",
    src: "/avatars/presets/preset-female-2.svg",
  },
  {
    id: "preset-female-3",
    label: "Aria (Celebrator)",
    category: "adult-female",
    gender: "female",
    src: "/avatars/presets/preset-female-3.svg",
  },
  // 1 Girl & 1 Boy
  {
    id: "preset-girl-1",
    label: "Lily (Dreamer)",
    category: "girl",
    gender: "female",
    src: "/avatars/presets/preset-girl-1.svg",
  },
  {
    id: "preset-boy-1",
    label: "Noah (Explorer)",
    category: "boy",
    gender: "male",
    src: "/avatars/presets/preset-boy-1.svg",
  },
  // 1 Older Man & 1 Older Woman
  {
    id: "preset-elder-male-1",
    label: "Arthur (Grand Mentor)",
    category: "elder-male",
    gender: "male",
    src: "/avatars/presets/preset-elder-male-1.svg",
  },
  {
    id: "preset-elder-female-1",
    label: "Evelyn (Grand Storyteller)",
    category: "elder-female",
    gender: "female",
    src: "/avatars/presets/preset-elder-female-1.svg",
  },
] as const;

export interface CreatorProfile {
  user_id: string;
  username: string;
  username_updated_at: string | null;
  display_name: string;
  bio: string | null;
  avatar_type: AvatarType;
  avatar_preset_id: PresetAvatarId | null;
  custom_avatar_url: string | null;
  avatar_source: AvatarSource;
  allow_card_analytics: boolean;
  created_at: string;
  updated_at: string;
}

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "auth",
  "billing",
  "card",
  "cards",
  "create",
  "creator",
  "dashboard",
  "delete",
  "dev",
  "developer",
  "edit",
  "explore",
  "export",
  "feed",
  "feedback",
  "help",
  "home",
  "legal",
  "login",
  "logout",
  "new",
  "notification",
  "notifications",
  "null",
  "privacy",
  "profile",
  "root",
  "security",
  "settings",
  "signin",
  "signout",
  "signup",
  "status",
  "studio",
  "suprilo",
  "support",
  "system",
  "team",
  "terms",
  "undefined",
  "user",
  "users",
  "webhook",
  "webhooks",
]);

export const DAYS_BETWEEN_USERNAME_CHANGES = 30;

/**
 * Validates a candidate creator username handle.
 * Must be 3 to 20 characters, alphanumeric + underscores, not reserved.
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: "Username is required." };
  }

  const clean = username.trim().toLowerCase();

  if (clean.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters." };
  }

  if (clean.length > 20) {
    return { valid: false, error: "Username cannot exceed 20 characters." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores." };
  }

  if (RESERVED_USERNAMES.has(clean)) {
    return { valid: false, error: "This username is reserved by the platform." };
  }

  return { valid: true };
}

/**
 * Calculates whether the user is eligible to update their username under the 30-day throttle.
 */
export function getUsernameEligibility(usernameUpdatedAt: string | null): {
  canChange: boolean;
  nextEligibleDate: Date | null;
  daysRemaining: number;
  formattedDate: string | null;
} {
  if (!usernameUpdatedAt) {
    return {
      canChange: true,
      nextEligibleDate: null,
      daysRemaining: 0,
      formattedDate: null,
    };
  }

  const lastChange = new Date(usernameUpdatedAt).getTime();
  if (isNaN(lastChange)) {
    return {
      canChange: true,
      nextEligibleDate: null,
      daysRemaining: 0,
      formattedDate: null,
    };
  }

  const lockDurationMs = DAYS_BETWEEN_USERNAME_CHANGES * 24 * 60 * 60 * 1000;
  const eligibleTimestamp = lastChange + lockDurationMs;
  const now = Date.now();

  if (now >= eligibleTimestamp) {
    return {
      canChange: true,
      nextEligibleDate: null,
      daysRemaining: 0,
      formattedDate: null,
    };
  }

  const diffMs = eligibleTimestamp - now;
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const nextEligibleDate = new Date(eligibleTimestamp);

  const formattedDate = nextEligibleDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    canChange: false,
    nextEligibleDate,
    daysRemaining,
    formattedDate,
  };
}

