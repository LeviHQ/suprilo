// Server-Side Cron Authentication Helper
// Validates Vercel CRON_SECRET using timing-safe comparison.
// Server-only boundary.

import crypto from "crypto";

export interface CronAuthResult {
  authenticated: boolean;
  status: number;
  error?: string;
}

/**
 * Validates whether an incoming HTTP request is authorized to execute cron jobs.
 * Compares the Bearer token or x-cron-secret header against process.env.CRON_SECRET.
 * Uses timingSafeEqual to protect against timing attacks.
 */
export function verifyCronAuth(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET;

  if (!secret || secret.trim().length === 0) {
    return {
      authenticated: false,
      status: 503,
      error: "CRON_SERVICE_UNCONFIGURED: CRON_SECRET environment variable is not configured on the server.",
    };
  }

  // Extract secret from Authorization header or custom header
  let token: string | null = null;
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (authHeader) {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    token = request.headers.get("x-cron-secret");
  }

  if (!token) {
    return {
      authenticated: false,
      status: 401,
      error: "UNAUTHORIZED: Missing Authorization Bearer token or x-cron-secret header.",
    };
  }

  // Timing-safe comparison
  const expectedBuf = Buffer.from(secret, "utf-8");
  const providedBuf = Buffer.from(token, "utf-8");

  if (expectedBuf.length !== providedBuf.length) {
    return {
      authenticated: false,
      status: 403,
      error: "FORBIDDEN: Invalid cron secret.",
    };
  }

  if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return {
      authenticated: false,
      status: 403,
      error: "FORBIDDEN: Invalid cron secret.",
    };
  }

  return {
    authenticated: true,
    status: 200,
  };
}

