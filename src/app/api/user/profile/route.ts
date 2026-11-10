import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { getOrCreateCreatorProfile } from "@/lib/server/profile";
import {
  notifyDisplayNameUpdated,
  notifyBioUpdated,
  notifyAvatarUpdated,
} from "@/lib/server/settings-notifications";
import { AvatarType, AvatarSource, PresetAvatarId } from "@/types/profile";

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

    // Persist updates to public.profiles
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updatedProfile) {
      return NextResponse.json(
        { success: false, error: { message: updateError?.message || "Failed to update profile" } },
        { status: 500 }
      );
    }

    // Synchronize display name with auth.users metadata
    if (displayNameChanged && typeof updates.display_name === "string") {
      try {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: updates.display_name },
        });
      } catch {
        // Safe fallback; database profiles is authoritative
      }
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
        profile: updatedProfile,
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
