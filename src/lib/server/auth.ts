// Server-Side Authentication Verification Helper
// Validates Supabase Auth sessions via HttpOnly cookies or Bearer Authorization tokens.
// Server-only boundary: never import into client components.

import { createClient } from "@/lib/supabase/server";

if (typeof window !== "undefined") {
  throw new Error("Security Violation: auth server helper cannot be executed on the client.");
}

export interface AuthenticatedUser {
  id: string; // Supabase user UUID
  uid: string; // Backward-compatible alias of id
  email: string | null;
  emailVerified: boolean;
}

export type AuthErrorCode =
  | "AUTH_HEADER_MALFORMED"
  | "AUTH_TOKEN_EMPTY"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_SESSION_MISSING"
  | "AUTH_SERVICE_UNAVAILABLE";

export type VerifyAuthResult =
  | {
      success: true;
      user: AuthenticatedUser;
    }
  | {
      success: false;
      error: {
        code: AuthErrorCode;
        message: string;
      };
      status: number;
    };

/**
 * Normalizes Supabase Auth user into canonical server identity model.
 */
function normalizeServerUser(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AuthenticatedUser {
  const emailVerified = Boolean(
    user.email_confirmed_at ||
      user.confirmed_at ||
      user.user_metadata?.email_verified
  );

  return {
    id: user.id,
    uid: user.id,
    email: user.email || null,
    emailVerified,
  };
}

/**
 * Validates the caller's Supabase session cryptographically.
 *
 * Supports two authentication paths:
 * 1. Bearer Token: If an 'Authorization: Bearer <jwt>' header is present, validates the JWT against Supabase Auth.
 * 2. Cookie Session: If no Authorization header is present, validates the SSR HttpOnly cookie session via `@supabase/ssr`.
 *
 * Never trusts user IDs supplied directly in request bodies or query parameters.
 * Does not use a service-role key for user session verification.
 *
 * @param request Optional standard incoming HTTP Request
 * @returns Discriminated union with authenticated user or error descriptor
 */
export async function verifyUserAuth(request?: Request): Promise<VerifyAuthResult> {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch (err: unknown) {
    return {
      success: false,
      error: {
        code: "AUTH_SERVICE_UNAVAILABLE",
        message:
          err instanceof Error
            ? err.message
            : "Supabase authentication service is not configured on the server.",
      },
      status: 503,
    };
  }

  // 1. Check for Authorization header (Bearer token)
  const authHeader =
    request?.headers.get("authorization") || request?.headers.get("Authorization");

  if (authHeader) {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return {
        success: false,
        error: {
          code: "AUTH_HEADER_MALFORMED",
          message:
            "Malformed Authorization header. Format must be 'Bearer <access_token>'.",
        },
        status: 401,
      };
    }

    const token = parts[1];
    if (!token || token.length < 10) {
      return {
        success: false,
        error: {
          code: "AUTH_TOKEN_EMPTY",
          message: "Bearer token cannot be empty.",
        },
        status: 401,
      };
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        const isExpired =
          error?.message?.toLowerCase().includes("expired") ||
          error?.name === "AuthSessionMissingError";

        return {
          success: false,
          error: {
            code: isExpired ? "AUTH_TOKEN_EXPIRED" : "AUTH_TOKEN_INVALID",
            message: error?.message || "Invalid or expired authorization token.",
          },
          status: 401,
        };
      }

      return {
        success: true,
        user: normalizeServerUser(user),
      };
    } catch {
      return {
        success: false,
        error: {
          code: "AUTH_TOKEN_INVALID",
          message: "Failed to verify authorization token.",
        },
        status: 401,
      };
    }
  }

  // 2. Cookie-based authentication (default for browser SSR & Route Handlers)
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        error: {
          code: "AUTH_SESSION_MISSING",
          message: "No active authentication session found. Please sign in.",
        },
        status: 401,
      };
    }

    return {
      success: true,
      user: normalizeServerUser(user),
    };
  } catch {
    return {
      success: false,
      error: {
        code: "AUTH_SESSION_MISSING",
        message: "No active authentication session found. Please sign in.",
      },
      status: 401,
    };
  }
}
