import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DEFAULT_CREATOR_BIO } from "@/types/profile";

/**
 * Normalized application-level user model.
 * Preserves complete backward compatibility with existing components (Navbar, UserAvatar,
 * Profile, Card Studio, Template Gallery) while backed purely by Supabase Auth.
 */
export interface SupriloUser {
  id: string; // Supabase user UUID
  uid: string; // Backward-compatible alias of id
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  googlePhotoURL?: string | null;
  bio?: string | null;
  isGoogleVerified?: boolean;
  metadata: {
    creationTime: string; // ISO 8601 timestamp string from created_at
    lastSignInTime: string; // ISO 8601 timestamp string from last_sign_in_at
  };
}

/**
 * Transforms a Supabase Auth user into the normalized application SupriloUser format.
 * Safely handles missing, null, or undefined OAuth provider metadata.
 */
export function normalizeSupabaseUser(user: SupabaseUser | null): SupriloUser | null {
  if (!user) return null;

  const userMeta = user.user_metadata || {};

  // Resolve authentic Google OAuth photo URL (never polluted by preset paths)
  const googlePhotoURL =
    (typeof userMeta.picture === "string" && userMeta.picture) ||
    (typeof userMeta.avatar_url === "string" && !userMeta.avatar_url.startsWith("/avatars/") && userMeta.avatar_url) ||
    (typeof user.identities?.find((id) => id.provider === "google")?.identity_data?.picture === "string" &&
      (user.identities?.find((id) => id.provider === "google")?.identity_data?.picture as string)) ||
    (typeof user.identities?.find((id) => id.provider === "google")?.identity_data?.avatar_url === "string" &&
      (user.identities?.find((id) => id.provider === "google")?.identity_data?.avatar_url as string)) ||
    null;

  // Resolve display name: custom_display_name takes absolute precedence over Google OAuth defaults
  const displayName =
    (typeof userMeta.custom_display_name === "string" && userMeta.custom_display_name.trim()) ||
    (typeof userMeta.display_name === "string" && userMeta.display_name.trim()) ||
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    (typeof userMeta.given_name === "string" && userMeta.given_name.trim()) ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Creator";

  // Resolve avatar URL: preset or custom avatar takes absolute precedence over Google OAuth picture
  const avatarType = (userMeta.custom_avatar_type || userMeta.avatar_type) as string | undefined;
  const presetId = (userMeta.custom_avatar_preset_id || userMeta.avatar_preset_id) as string | undefined;

  let photoURL: string | null = null;
  if (avatarType === "preset" && presetId) {
    photoURL = `/avatars/presets/${presetId}.svg`;
  } else if (avatarType === "custom" && typeof userMeta.custom_avatar_url === "string" && userMeta.custom_avatar_url) {
    photoURL = userMeta.custom_avatar_url;
  } else if (avatarType === "google") {
    photoURL = googlePhotoURL;
  } else if (userMeta.custom_avatar === true && typeof userMeta.custom_avatar_url === "string" && userMeta.custom_avatar_url) {
    photoURL = userMeta.custom_avatar_url;
  } else {
    photoURL = googlePhotoURL || (typeof userMeta.avatar_url === "string" && !userMeta.avatar_url.startsWith("/avatars/") ? userMeta.avatar_url : null);
  }

  // Resolve creator bio: custom_bio takes absolute precedence
  const bio =
    (typeof userMeta.custom_bio === "string" && userMeta.custom_bio.trim()) ||
    (typeof userMeta.bio === "string" && userMeta.bio.trim()) ||
    DEFAULT_CREATOR_BIO;

  const creationTime = user.created_at || new Date().toISOString();
  const lastSignInTime = user.last_sign_in_at || creationTime;

  const appMeta = user.app_metadata || {};
  const isGoogleProvider =
    appMeta.provider === "google" ||
    (Array.isArray(appMeta.providers) && appMeta.providers.includes("google")) ||
    (Array.isArray(user.identities) && user.identities.some((id) => id.provider === "google"));

  const isEmailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
  const isGoogleVerified = isGoogleProvider && isEmailConfirmed;

  return {
    id: user.id,
    uid: user.id,
    email: user.email || null,
    displayName,
    photoURL,
    bio,
    isGoogleVerified,
    metadata: {
      creationTime,
      lastSignInTime,
    },
  };
}

