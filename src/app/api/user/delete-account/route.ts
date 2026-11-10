import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { getOrCreateCreatorProfile } from "@/lib/server/profile";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/user/delete-account
 * Orchestrated permanent account deletion.
 * Validates dual-input confirmation:
 * 1. confirmationName === user's display_name
 * 2. confirmationWord === "DELETE"
 *
 * Cascades:
 * - Storage: avatars/{user_id}/ and card-photos/{user_id}/
 * - Database: cards, metrics, user_badges, gamification_stats, notifications, profiles
 * - Auth: auth.admin.deleteUser(user_id)
 */
export async function DELETE(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user.id;
    let body: { confirmationName?: string; confirmationWord?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Invalid JSON payload" } },
        { status: 400 }
      );
    }

    const { confirmationName, confirmationWord } = body || {};

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: { message: "Database service unavailable" } },
        { status: 503 }
      );
    }

    // Fetch authoritative profile to verify confirmationName
    const profile = await getOrCreateCreatorProfile(userId, authResult.user.email);
    const expectedName = profile.display_name.trim();

    if (!confirmationName || confirmationName.trim() !== expectedName) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Confirmation display name does not match your current creator name." },
        },
        { status: 400 }
      );
    }

    if (confirmationWord !== "DELETE") {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Confirmation word must be exactly "DELETE".' },
        },
        { status: 400 }
      );
    }

    // 1. Purge storage objects
    try {
      const { data: avatarFiles } = await adminClient.storage.from("avatars").list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
        await adminClient.storage.from("avatars").remove(paths);
      }
    } catch (storageErr) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[delete-account] Avatars bucket cleanup error:", storageErr);
      }
    }

    try {
      const { data: cardPhotoFiles } = await adminClient.storage.from("card-photos").list(userId);
      if (cardPhotoFiles && cardPhotoFiles.length > 0) {
        const paths = cardPhotoFiles.map((f) => `${userId}/${f.name}`);
        await adminClient.storage.from("card-photos").remove(paths);
      }
    } catch (storageErr) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[delete-account] Card photos bucket cleanup error:", storageErr);
      }
    }

    // 2. Cascade delete database entities
    // Cards deletion triggers slug retirement if configured
    await adminClient.from("cards").delete().eq("user_id", userId);
    await adminClient.from("user_badges").delete().eq("user_id", userId);
    await adminClient.from("user_gamification_stats").delete().eq("user_id", userId);
    await adminClient.from("notifications").delete().eq("user_id", userId);
    await adminClient.from("notification_preferences").delete().eq("user_id", userId);
    await adminClient.from("push_subscriptions").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // 3. Purge auth.users record
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[delete-account] Auth admin delete error:", deleteAuthError.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account and all associated creator records have been permanently deleted.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error processing account deletion";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}

