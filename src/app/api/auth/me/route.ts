import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/**
 * Diagnostic Authentication Verification Endpoint
 * GET /api/auth/me
 *
 * Validates the caller's Supabase session (via HttpOnly cookies or Bearer token)
 * and returns the normalized authenticated identity.
 * Strictly used to verify server-side authentication without exposing tokens, cookies, or credentials.
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyUserAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authResult.user.id,
          uid: authResult.user.uid,
          email: authResult.user.email,
          emailVerified: authResult.user.emailVerified,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTH_SERVICE_UNAVAILABLE",
          message: "An unexpected error occurred during session verification.",
        },
      },
      { status: 500 }
    );
  }
}
