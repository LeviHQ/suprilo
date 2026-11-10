import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { checkUsernameAvailability } from "@/lib/server/profile";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/check-username?username=...
 * Performs real-time validation and case-insensitive uniqueness check for a candidate handle.
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

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, available: false, reason: "Username parameter is required." },
        { status: 400 }
      );
    }

    const result = await checkUsernameAvailability(username, authResult.user.id);

    return NextResponse.json(
      {
        success: true,
        available: result.available,
        reason: result.reason,
        username: username.trim().toLowerCase(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error validating username availability";
    return NextResponse.json(
      { success: false, available: false, reason: message },
      { status: 500 }
    );
  }
}
