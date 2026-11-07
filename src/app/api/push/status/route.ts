import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { isPushInfrastructureAvailable } from "@/lib/server/push-dispatcher";

export const dynamic = "force-dynamic";

/**
 * Check Push Service & User Subscription Status
 * GET /api/push/status
 *
 * Requirements:
 * 1. Authenticated user only.
 * 2. Returns server VAPID readiness (never exposes VAPID private key).
 * 3. Returns caller's push preference state and active subscription count.
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

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: "SERVICE_UNAVAILABLE", message: "Database administrative service unavailable." },
        { status: 503 }
      );
    }

    const infra = isPushInfrastructureAvailable();
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;

    // Fetch user's push preference
    const { data: pref } = await adminClient
      .from("notification_preferences")
      .select("push_enabled")
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    // Fetch user's active push subscriptions count
    const { count: subsCount } = await adminClient
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authResult.user.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          push_enabled: Boolean(pref?.push_enabled),
          active_subscriptions_count: subsCount ?? 0,
          vapid_configured: infra.vapidConfigured,
          library_installed: infra.libraryInstalled,
          public_key: publicKey,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[GET /api/push/status] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

