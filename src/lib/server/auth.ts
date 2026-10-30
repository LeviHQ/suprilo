// Server-Side Authentication Verification Helper
// Validates Firebase ID tokens sent via Bearer Authorization headers.
// Server-only boundary: never import into client components.

import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "./firebaseAdmin";

if (typeof window !== "undefined") {
  throw new Error("Security Violation: auth server helper cannot be executed on the client.");
}

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

export type VerifyAuthResult =
  | {
      success: true;
      user: AuthenticatedUser;
    }
  | {
      success: false;
      error: {
        code:
          | "AUTH_HEADER_MISSING"
          | "AUTH_HEADER_MALFORMED"
          | "AUTH_TOKEN_EMPTY"
          | "AUTH_TOKEN_EXPIRED"
          | "AUTH_TOKEN_INVALID"
          | "AUTH_SERVICE_UNAVAILABLE";
        message: string;
      };
      status: number;
    };

/**
 * Validates the incoming Request's Authorization header against Firebase Admin Auth.
 * Derives user identity strictly from the cryptographically verified JWT payload.
 *
 * @param request Standard incoming HTTP Request
 * @returns Discriminated union with authenticated user or error descriptor
 */
export async function verifyUserAuth(request: Request): Promise<VerifyAuthResult> {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");

  // 1. Check existence of Authorization header
  if (!authHeader) {
    return {
      success: false,
      error: {
        code: "AUTH_HEADER_MISSING",
        message: "Missing Authorization header. An authenticated 'Bearer <token>' is required.",
      },
      status: 401,
    };
  }

  // 2. Validate Bearer scheme format
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return {
      success: false,
      error: {
        code: "AUTH_HEADER_MALFORMED",
        message: "Malformed Authorization header. Format must be 'Bearer <firebase_id_token>'.",
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

  // 3. Verify server environment configuration
  if (!isFirebaseAdminConfigured()) {
    return {
      success: false,
      error: {
        code: "AUTH_SERVICE_UNAVAILABLE",
        message:
          "Authentication service is not fully configured on the server. Missing server credentials.",
      },
      status: 503,
    };
  }

  // 4. Verify ID Token cryptographically with Firebase Admin SDK
  try {
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        emailVerified: Boolean(decodedToken.email_verified),
      },
    };
  } catch (err: unknown) {
    const firebaseError = err as { code?: string; message?: string };

    if (firebaseError.code === "auth/id-token-expired") {
      return {
        success: false,
        error: {
          code: "AUTH_TOKEN_EXPIRED",
          message: "Firebase ID token has expired. Please refresh your session.",
        },
        status: 401,
      };
    }

    return {
      success: false,
      error: {
        code: "AUTH_TOKEN_INVALID",
        message: "Invalid or revoked Firebase ID token.",
      },
      status: 401,
    };
  }
}

