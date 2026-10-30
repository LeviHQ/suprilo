import { NextResponse } from "next/server";
import { verifyUserAuth } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/**
 * Diagnostic Authentication Verification Endpoint
 * GET /api/auth/me
 *
 * Validates the caller's Firebase ID token and returns authenticated identity.
 * Strictly used to verify server-side authentication without exposing tokens or credentials.
 */
export async function GET(request: Request) {
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
        uid: authResult.user.uid,
        email: authResult.user.email,
        emailVerified: authResult.user.emailVerified,
      },
    },
    { status: 200 }
  );
}

