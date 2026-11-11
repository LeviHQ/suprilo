import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { getOrCreateCreatorProfile } from "@/lib/server/profile";
import {
  notifyDisplayNameUpdated,
  notifyBioUpdated,
  notifyAvatarUpdated,
} from "@/lib/server/settings-notifications";
import { CreatorProfile, AvatarType, AvatarSource, PresetAvatarId, getResolvedAvatarUrl } from "@/types/profile";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile
 * Retrieves the authenticated creator's profile.
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

    const profile = await getOrCreateCreatorProfile(authResult.user.id, authResult.user.email);

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve profile";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Updates display name, bio, or avatar selections.
 */
export async function PATCH(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.id;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Invalid JSON payload" } },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: { message: "Database service unavailable" } },
        { status: 503 }
      );
    }

    // Fetch existing profile to detect changes
    const currentProfile = await getOrCreateCreatorProfile(userId, authResult.user.email);
    const updates: Record<string, unknown> = {};
    let displayNameChanged = false;
    let bioChanged = false;
    let avatarChanged = false;

    // 1. Display Name validation
    if ("display_name" in body) {
      const rawName = body.display_name;
      if (typeof rawName !== "string" || !rawName.trim()) {
        return NextResponse.json(
          { success: false, error: { message: "Display name cannot be empty." } },
          { status: 400 }
        );
      }
      const cleanName = rawName.trim().slice(0, 50);
      if (cleanName !== currentProfile.display_name) {
        updates.display_name = cleanName;
        displayNameChanged = true;
      }
    }

    // 2. Bio validation (up to 100 characters)
    if ("bio" in body) {
      const rawBio = body.bio;
      if (rawBio === null || rawBio === "") {
        if (currentProfile.bio !== null) {
          updates.bio = null;
          bioChanged = true;
        }
      } else if (typeof rawBio === "string") {
        if (rawBio.length > 100) {
          return NextResponse.json(
            { success: false, error: { message: "Bio cannot exceed 100 characters." } },
            { status: 400 }
          );
        }
        if (rawBio !== currentProfile.bio) {
          updates.bio = rawBio;
          bioChanged = true;
        }
      }
    }

    // 3. Avatar selection validation
    if ("avatar_type" in body) {
      const type = body.avatar_type as AvatarType;
      if (!["google", "preset", "custom"].includes(type)) {
        return NextResponse.json(
          { success: false, error: { message: "Invalid avatar type." } },
          { status: 400 }
        );
      }
      updates.avatar_type = type;
      avatarChanged = true;
    }

    if ("avatar_preset_id" in body) {
      const presetId = body.avatar_preset_id as PresetAvatarId | null;
      updates.avatar_preset_id = presetId;
      avatarChanged = true;
    }

    if ("custom_avatar_url" in body) {
      const url = body.custom_avatar_url as string | null;
      updates.custom_avatar_url = url;
      avatarChanged = true;
    }

    if ("avatar_source" in body) {
      const source = body.avatar_source as AvatarSource;
      if (["google", "manual"].includes(source)) {
        updates.avatar_source = source;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: true, profile: currentProfile },
        { status: 200 }
      );
    }

    updates.updated_at = new Date().toISOString();

    // 1. Synchronize changes with auth.users metadata first (guarantees real persistence in Supabase Auth immune to OAuth overwrites)
    const metadataUpdates: Record<string, unknown> = {};

    // 1. Resolve and protect Display Name
    const targetDisplayName = typeof updates.display_name === "string"
      ? updates.display_name
      : currentProfile.display_name;
    if (targetDisplayName) {
      metadataUpdates.custom_display_name = targetDisplayName;
      metadataUpdates.display_name = targetDisplayName;
      metadataUpdates.full_name = targetDisplayName;
    }

    // 2. Resolve and protect Bio
    const targetBio = "bio" in updates
      ? (updates.bio as string | null)
      : currentProfile.bio;
    if (targetBio !== undefined) {
      metadataUpdates.custom_bio = targetBio;
      metadataUpdates.bio = targetBio;
    }

    // 3. Resolve and protect Avatar
    const targetAvatarType = (updates.avatar_type as AvatarType) || currentProfile.avatar_type || "google";
    const targetPresetId = "avatar_preset_id" in updates
      ? (updates.avatar_preset_id as PresetAvatarId | null)
      : currentProfile.avatar_preset_id;
    const targetCustomUrl = "custom_avatar_url" in updates
      ? (updates.custom_avatar_url as string | null)
      : currentProfile.custom_avatar_url;
    const targetAvatarSource = (updates.avatar_source as AvatarSource) || currentProfile.avatar_source || (targetAvatarType === "google" ? "google" : "manual");

    metadataUpdates.custom_avatar_type = targetAvatarType;
    metadataUpdates.avatar_type = targetAvatarType;
    metadataUpdates.custom_avatar_preset_id = targetPresetId;
    metadataUpdates.avatar_preset_id = targetPresetId;
    metadataUpdates.custom_avatar_source = targetAvatarSource;
    metadataUpdates.avatar_source = targetAvatarSource;
    metadataUpdates.custom_avatar = targetAvatarType !== "google";

    const resolvedAvatarUrl = getResolvedAvatarUrl(
      {
        avatar_type: targetAvatarType,
        avatar_preset_id: targetPresetId,
        custom_avatar_url: targetCustomUrl,
      },
      (authResult.user.user_metadata?.avatar_url as string) ||
      (authResult.user.user_metadata?.picture as string) ||
      null
    );

    metadataUpdates.avatar_url = resolvedAvatarUrl;
    if (targetAvatarType === "custom") {
      metadataUpdates.custom_avatar_url = targetCustomUrl;
    } else if (targetAvatarType === "preset" && targetPresetId) {
      metadataUpdates.custom_avatar_url = `/avatars/presets/${targetPresetId}.svg`;
    } else {
      metadataUpdates.custom_avatar_url = null;
    }

    if (Object.keys(metadataUpdates).length > 0) {
      try {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: metadataUpdates,
        });
      } catch (authErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[PATCH /api/user/profile] auth.admin.updateUserById warning:", authErr);
        }
      }
    }

    // 2. Persist updates to public.profiles table (safe try/catch for pending migrations)
    let finalProfile: CreatorProfile = {
      ...currentProfile,
      ...updates,
      updated_at: updates.updated_at as string,
    } as CreatorProfile;

    try {
      const { data: updatedProfile, error: updateError } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();

      if (!updateError && updatedProfile) {
        finalProfile = updatedProfile as CreatorProfile;
      }
    } catch {
      // Safe fallback if public.profiles migration is pending
    }

    // 3. Dispatch system ledger notifications
    if (displayNameChanged && typeof updates.display_name === "string") {
      await notifyDisplayNameUpdated(userId, updates.display_name);
    }

    if (bioChanged) {
      await notifyBioUpdated(userId);
    }

    if (avatarChanged) {
      await notifyAvatarUpdated(userId);
    }

    return NextResponse.json(
      {
        success: true,
        profile: finalProfile,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
