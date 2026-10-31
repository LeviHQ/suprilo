import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Validates and sanitizes redirect destination to prevent Open Redirect attacks.
 * Only allows relative paths on the same origin (e.g., "/create", "/templates").
 * Blocks protocol-relative paths ("//evil.com") and external URLs ("https://...").
 */
function sanitizeRedirectDestination(nextParam: string | null, origin: string): string {
  if (!nextParam) {
    return `${origin}/`;
  }

  // Must start with a single forward slash and not contain protocol schemes or backslashes
  if (
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\") &&
    !nextParam.includes("://")
  ) {
    return `${origin}${nextParam}`;
  }

  // Fallback to application root if an unsafe or malformed path is detected
  return `${origin}/`;
}

/**
 * OAuth PKCE Callback Route Handler
 * GET /auth/callback
 *
 * Receives the authorization code from Supabase Auth after Google sign-in,
 * exchanges it for a secure HttpOnly session, and redirects to the intended destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const destination = sanitizeRedirectDestination(next, origin);

  // If no authorization code is present in the callback, return to home with generic error
  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Redirection with generic flag, never exposing error details or credentials in query
      return NextResponse.redirect(`${origin}/?auth_error=exchange_failed`);
    }

    // Successfully exchanged session; redirect to verified internal destination
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(`${origin}/?auth_error=service_unavailable`);
  }
}

