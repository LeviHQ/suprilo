import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_PREFERENCES = {
  in_app_enabled: true,
  push_enabled: false,
  notify_on_reveal: true,
  notify_on_badge: true,
  notify_on_level: true,
};

/**
 * Get User Notification Preferences Endpoint
 * GET /api/notification-preferences
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

    const supabase = await createClient();

    const { data: pref, error } = await supabase
      .from("notification_preferences")
      .select("in_app_enabled, push_enabled, notify_on_reveal, notify_on_badge, notify_on_level, updated_at")
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/notification-preferences] Query error:", error);
      return NextResponse.json(
        { success: false, error: "DATABASE_ERROR", message: "Failed to fetch notification preferences." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: pref || { user_id: authResult.user.id, ...DEFAULT_PREFERENCES },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[GET /api/notification-preferences] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

/**
 * Update User Notification Preferences Endpoint
 * PATCH /api/notification-preferences
 *
 * Updates only user-editable preferences:
 * - in_app_enabled
 * - notify_on_reveal
 * - notify_on_badge
 * - notify_on_level
 *
 * Strictly rejects any client-supplied push_enabled field.
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON", message: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY", message: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const payloadKeys = Object.keys(payload);

    // Security check: push_enabled is strictly server-controlled
    if ("push_enabled" in payload) {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN_FIELD",
          message: "push_enabled is server-controlled and cannot be modified directly via this endpoint.",
        },
        { status: 403 }
      );
    }

    const ALLOWED_PREFERENCE_FIELDS = [
      "in_app_enabled",
      "notify_on_reveal",
      "notify_on_badge",
      "notify_on_level",
    ] as const;

    // Reject unsupported fields (e.g., streak_reminder_enabled, card_reveal_enabled, etc.)
    const unsupportedKeys = payloadKeys.filter(
      (key) => !ALLOWED_PREFERENCE_FIELDS.includes(key as typeof ALLOWED_PREFERENCE_FIELDS[number])
    );
    if (unsupportedKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "UNSUPPORTED_FIELD",
          message: `Unsupported preference field(s): ${unsupportedKeys.join(", ")}. Allowed fields: ${ALLOWED_PREFERENCE_FIELDS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (payloadKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: "EMPTY_PAYLOAD", message: "At least one preference field must be provided." },
        { status: 400 }
      );
    }

    const updates: Record<string, boolean | string> = {
      updated_at: new Date().toISOString(),
    };

    if ("in_app_enabled" in payload) {
      if (typeof payload.in_app_enabled !== "boolean") {
        return NextResponse.json(
          { success: false, error: "INVALID_TYPE", message: "in_app_enabled must be a boolean." },
          { status: 400 }
        );
      }
      updates.in_app_enabled = payload.in_app_enabled;
    }

    if ("notify_on_reveal" in payload) {
      if (typeof payload.notify_on_reveal !== "boolean") {
        return NextResponse.json(
          { success: false, error: "INVALID_TYPE", message: "notify_on_reveal must be a boolean." },
          { status: 400 }
        );
      }
      updates.notify_on_reveal = payload.notify_on_reveal;
    }

    if ("notify_on_badge" in payload) {
      if (typeof payload.notify_on_badge !== "boolean") {
        return NextResponse.json(
          { success: false, error: "INVALID_TYPE", message: "notify_on_badge must be a boolean." },
          { status: 400 }
        );
      }
      updates.notify_on_badge = payload.notify_on_badge;
    }

    if ("notify_on_level" in payload) {
      if (typeof payload.notify_on_level !== "boolean") {
        return NextResponse.json(
          { success: false, error: "INVALID_TYPE", message: "notify_on_level must be a boolean." },
          { status: 400 }
        );
      }
      updates.notify_on_level = payload.notify_on_level;
    }

    const supabase = await createClient();

    // Upsert preferences for the authenticated user
    const { data: updatedPref, error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: authResult.user.id,
          ...updates,
        },
        { onConflict: "user_id" }
      )
      .select("in_app_enabled, push_enabled, notify_on_reveal, notify_on_badge, notify_on_level, updated_at")
      .single();

    if (error) {
      console.error("[PATCH /api/notification-preferences] Upsert error:", error);
      return NextResponse.json(
        { success: false, error: "DATABASE_ERROR", message: "Failed to update notification preferences." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPref,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[PATCH /api/notification-preferences] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

