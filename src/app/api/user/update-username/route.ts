import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";
import { reserveCreatorUsername, ProfileError } from "@/lib/server/profile";
import { notifyHandleReserved } from "@/lib/server/settings-notifications";
import { getUsernameEligibility } from "@/types/profile";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/update-username
 * Reserves a new unique creator handle with server-enforced 30-day throttle lock.
 */
export async function POST(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    let body: { username?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const username = body?.username;
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, error: { message: "Username is required." } },
        { status: 400 }
      );
    }

    const updatedProfile = await reserveCreatorUsername(authResult.user.id, username);

    const eligibility = getUsernameEligibility(updatedProfile.username_updated_at);
    await notifyHandleReserved(authResult.user.id, updatedProfile.username, eligibility.formattedDate);

    return NextResponse.json(
      {
        success: true,
        profile: updatedProfile,
        nextEligibleDate: eligibility.formattedDate,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof ProfileError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : "Failed to reserve handle";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
