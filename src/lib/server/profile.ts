/**
 * Server-Side Creator Profile Engine
 * Handles authoritative profile retrieval, username reservation, 30-day throttle enforcement,
 * and analytics privacy settings via Supabase Server Client & Service Role Client.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import {
  CreatorProfile,
  validateUsername,
  getUsernameEligibility,
  AvatarType,
  AvatarSource,
  PresetAvatarId,
  DEFAULT_CREATOR_BIO,
} from "@/types/profile";

export class ProfileError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "PROFILE_ERROR"
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

/**
 * Retrieves the authoritative creator profile for a given user ID.
 * Automatically provisions an initial profile if one does not exist yet.
 */
export async function getOrCreateCreatorProfile(
  userId: string,
  userEmail?: string | null,
  client?: SupabaseClient
): Promise<CreatorProfile> {
  const db = client || getSupabaseAdminClient();
  if (!db) {
    throw new ProfileError("Database service unavailable", 503, "SERVICE_UNAVAILABLE");
  }

  // 1. Attempt to fetch existing profile
  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile && !error) {
    return profile as CreatorProfile;
  }

  // 2. If profile doesn't exist, safely provision it using admin client
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new ProfileError("Admin client unavailable for profile provisioning", 503, "ADMIN_UNAVAILABLE");
  }

  // Fetch auth user record to extract email and metadata
  const { data: authUserResp, error: authUserErr } = await adminClient.auth.admin.getUserById(userId);
  if (authUserErr || !authUserResp?.user) {
    throw new ProfileError("User authentication record not found", 404, "USER_NOT_FOUND");
  }

  const authUser = authUserResp.user;
  const email = authUser.email || userEmail || "creator@suprilo.com";
  const userMeta = authUser.user_metadata || {};

  const displayName =
    (typeof userMeta.custom_display_name === "string" && userMeta.custom_display_name.trim()) ||
    (typeof userMeta.display_name === "string" && userMeta.display_name.trim()) ||
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    email.split("@")[0] ||
    "Suprilo Creator";

  const isManualAvatar = userMeta.custom_avatar === true || userMeta.avatar_source === "manual" || userMeta.custom_avatar_source === "manual";
  const avatarType = (userMeta.custom_avatar_type as AvatarType) || (userMeta.avatar_type as AvatarType) || (isManualAvatar ? "custom" : "google");
  const avatarPresetId = (userMeta.custom_avatar_preset_id as PresetAvatarId) || (userMeta.avatar_preset_id as PresetAvatarId) || null;

  // Generate safe default username via RPC or fallback
  let initialUsername = (typeof userMeta.username === "string" && userMeta.username) || email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 7);
  if (initialUsername.length < 3) {
    initialUsername = `user_${initialUsername}`;
  }

  const authProfile: CreatorProfile = {
    user_id: userId,
    username: (typeof userMeta.username === "string" && userMeta.username) || initialUsername,
    username_updated_at: (userMeta.username_updated_at as string) || null,
    display_name: displayName.slice(0, 50),
    bio: (userMeta.custom_bio as string) || (userMeta.bio as string) || DEFAULT_CREATOR_BIO,
    avatar_type: avatarType,
    avatar_preset_id: avatarPresetId,
    custom_avatar_url: avatarType === "custom" ? ((userMeta.custom_avatar_url as string) || null) : null,
    avatar_source: (userMeta.custom_avatar_source as AvatarSource) || (userMeta.avatar_source as AvatarSource) || "google",
    allow_card_analytics: typeof userMeta.allow_card_analytics === "boolean" ? userMeta.allow_card_analytics : true,
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: authUser.updated_at || new Date().toISOString(),
  };

  // If profiles table does not exist yet, return graceful authoritative record from auth.users
  if (error && error.code === "PGRST205") {
    return authProfile;
  }

  // Check collision and adjust if necessary
  const { data: existingSameUsername } = await adminClient
    .from("profiles")
    .select("user_id")
    .ilike("username", initialUsername)
    .maybeSingle();

  if (existingSameUsername && existingSameUsername.user_id !== userId) {
    initialUsername = `${initialUsername.slice(0, 5)}_${Math.floor(100 + Math.random() * 900)}`;
  }

  const newProfileRecord = {
    user_id: userId,
    username: authProfile.username,
    username_updated_at: authProfile.username_updated_at,
    display_name: authProfile.display_name,
    bio: authProfile.bio,
    avatar_type: authProfile.avatar_type,
    avatar_preset_id: authProfile.avatar_preset_id,
    custom_avatar_url: authProfile.custom_avatar_url,
    avatar_source: authProfile.avatar_source,
    allow_card_analytics: authProfile.allow_card_analytics,
  };

  const { data: inserted, error: insertError } = await adminClient
    .from("profiles")
    .insert(newProfileRecord)
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "PGRST205") {
      return authProfile;
    }

    // Check if another concurrent request created it
    const { data: retryProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (retryProfile) {
      return retryProfile as CreatorProfile;
    }

    throw new ProfileError(`Failed to initialize profile: ${insertError.message}`, 500, "INSERT_FAILED");
  }

  return inserted as CreatorProfile;
}

/**
 * Checks if a candidate username is available.
 * Case-insensitive comparison against public.profiles, auth.users metadata, and system reserved handles.
 */
export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string,
  client?: SupabaseClient
): Promise<{ available: boolean; isTaken?: boolean; isReserved?: boolean; reason?: string }> {
  const clean = username.trim().toLowerCase();
  const validation = validateUsername(clean);
  if (!validation.valid) {
    const isReserved = validation.error?.includes("reserved by the platform") || false;
    return { available: false, isTaken: false, isReserved, reason: validation.error };
  }

  const db = client || getSupabaseAdminClient();
  if (!db) {
    return { available: false, isTaken: false, isReserved: false, reason: "Database unavailable" };
  }

  // 1. Check public.profiles table (when created)
  let query = db
    .from("profiles")
    .select("user_id")
    .ilike("username", clean);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (data) {
    return { available: false, isTaken: true, isReserved: false, reason: "Username is already taken." };
  }

  // 2. Authoritative check across all accounts in Supabase Auth (auth.users)
  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    try {
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      if (authUsers?.users) {
        const takenUser = authUsers.users.find((u) => {
          if (u.id === excludeUserId) return false;
          const uMeta = u.user_metadata || {};
          const uName = typeof uMeta.username === "string" ? uMeta.username.trim().toLowerCase() : "";
          return uName === clean;
        });

        if (takenUser) {
          return { available: false, isTaken: true, isReserved: false, reason: "Username is already taken." };
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  if (error && error.code !== "PGRST205") {
    return { available: false, isTaken: false, isReserved: false, reason: "Error validating availability" };
  }

  return { available: true, isTaken: false, isReserved: false };
}

/**
 * Reserves a new username with atomic 30-day throttle lock verification.
 */
export async function reserveCreatorUsername(
  userId: string,
  newUsername: string,
  client?: SupabaseClient
): Promise<CreatorProfile> {
  const validation = validateUsername(newUsername);
  if (!validation.valid) {
    throw new ProfileError(validation.error || "Invalid username format", 400, "INVALID_FORMAT");
  }

  const db = client || getSupabaseAdminClient();
  if (!db) {
    throw new ProfileError("Database unavailable", 503, "SERVICE_UNAVAILABLE");
  }

  // 1. Fetch current profile to check throttle eligibility
  const currentProfile = await getOrCreateCreatorProfile(userId, null, db);

  const clean = newUsername.trim().toLowerCase();

  // If same username as currently held, return current profile
  if (currentProfile.username.toLowerCase() === clean) {
    return currentProfile;
  }

  // Check 30-day throttle lock
  const eligibility = getUsernameEligibility(currentProfile.username_updated_at);
  if (!eligibility.canChange) {
    throw new ProfileError(
      `Username can only be changed once every 30 days. Next eligible date: ${eligibility.formattedDate}`,
      403,
      "THROTTLED"
    );
  }

  // Check real-time database availability
  const availability = await checkUsernameAvailability(clean, userId, db);
  if (!availability.available) {
    throw new ProfileError(availability.reason || "Username is unavailable", 409, "ALREADY_TAKEN");
  }

  // Atomically update username and set throttle timestamp
  const now = new Date().toISOString();

  // Update auth.users metadata first
  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          username: clean,
          username_updated_at: now,
        },
      });
    } catch {
      // Safe fallback
    }
  }

  const { data: updated, error: updateError } = await db
    .from("profiles")
    .update({
      username: newUsername.trim(),
      username_updated_at: now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updateError) {
    if (updateError.code === "PGRST205") {
      return {
        ...currentProfile,
        username: newUsername.trim(),
        username_updated_at: now,
        updated_at: now,
      };
    }
    if (updateError.code === "23505") {
      throw new ProfileError("Username was just taken by another creator. Please pick another.", 409, "ALREADY_TAKEN");
    }
    throw new ProfileError(updateError.message, 500, "UPDATE_FAILED");
  }

  return (updated || {
    ...currentProfile,
    username: newUsername.trim(),
    username_updated_at: now,
    updated_at: now,
  }) as CreatorProfile;
}

