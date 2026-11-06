import type { User as SupabaseUser } from "@supabase/supabase-js";

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

  // Resolve display name across standard Google OAuth metadata conventions
  const displayName =
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    (typeof userMeta.given_name === "string" && userMeta.given_name.trim()) ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Creator";

  // Resolve avatar URL across standard Google OAuth metadata conventions
  const photoURL =
    (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
    (typeof userMeta.picture === "string" && userMeta.picture) ||
    null;

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
    isGoogleVerified,
    metadata: {
      creationTime,
      lastSignInTime,
    },
  };
}

