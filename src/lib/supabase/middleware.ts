import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SB_VID_COOKIE_NAME = "sb_vid";
const SB_VID_MAX_AGE = 31536000; // 365 days in seconds

/**
 * Refreshes Supabase Auth session tokens and bootstraps visitor identity in middleware.
 * Ensures that HttpOnly auth cookies stay up-to-date across all App Router requests.
 * Bootstraps the pseudonymous sb_vid visitor cookie with Path=/ if absent.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 1. First-visit pseudonymous visitor cookie bootstrap (SPEC-2C-5.6.1-FINAL v3.0.0)
  let bootstrappedVid: string | null = null;
  if (!request.cookies.get(SB_VID_COOKIE_NAME)) {
    bootstrappedVid = crypto.randomUUID();
    request.cookies.set(SB_VID_COOKIE_NAME, bootstrappedVid);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 2. Supabase Auth session token refresh
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Calling getUser() validates the token against Supabase Auth and triggers cookie refresh
    try {
      await supabase.auth.getUser();
    } catch {
      // Session refresh failed; proceed with unauthenticated response
    }
  }

  // 3. Guarantee sb_vid cookie attachment on outgoing response if newly bootstrapped
  if (bootstrappedVid) {
    supabaseResponse.cookies.set(SB_VID_COOKIE_NAME, bootstrappedVid, {
      path: "/",
      maxAge: SB_VID_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
  }

  return supabaseResponse;
}
