import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/server/card-recipient";
import { notifyPrivacyUpdated } from "@/lib/server/settings-notifications";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/user/privacy
 * Updates creator's card activity analytics collection preference.
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

    let body: { allow_card_analytics?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Invalid JSON payload" } },
        { status: 400 }
      );
    }

    if (typeof body?.allow_card_analytics !== "boolean") {
      return NextResponse.json(
        { success: false, error: { message: "allow_card_analytics boolean is required." } },
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

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        allow_card_analytics: body.allow_card_analytics,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", authResult.user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { message: updateError.message } },
        { status: 500 }
      );
    }

    await notifyPrivacyUpdated(authResult.user.id, body.allow_card_analytics);

    return NextResponse.json(
      {
        success: true,
        allow_card_analytics: body.allow_card_analytics,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update privacy preference";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
