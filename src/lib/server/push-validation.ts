// Server-Side WebPush Subscription Validation & SSRF Defense
// Server-only boundary.

const DISALLOWED_HOST_PREFIXES = [
  "127.",
  "10.",
  "192.168.",
  "169.254.",
  "0.",
  "100.64.",
  "::1",
  "fe80:",
  "::ffff:",
];

/**
 * Exact hostname boundary validator for approved WebPush providers.
 * Validates against known push service gateways:
 * - Google FCM / Android Push: fcm.googleapis.com, android.googleapis.com
 * - Mozilla Autopush: updates.push.services.mozilla.com, push.services.mozilla.com, or *.push.services.mozilla.com
 * - Apple APNs WebPush: push.apple.com or *.push.apple.com
 * - Microsoft WNS: notify.windows.com or *.notify.windows.com
 */
function isApprovedPushHost(hostname: string): boolean {
  if (hostname === "fcm.googleapis.com" || hostname === "android.googleapis.com") {
    return true;
  }
  if (
    hostname === "updates.push.services.mozilla.com" ||
    hostname === "push.services.mozilla.com" ||
    hostname.endsWith(".push.services.mozilla.com")
  ) {
    return true;
  }
  if (hostname === "push.apple.com" || hostname.endsWith(".push.apple.com")) {
    return true;
  }
  if (hostname === "notify.windows.com" || hostname.endsWith(".notify.windows.com")) {
    return true;
  }
  return false;
}

export interface ValidatedPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}

export type PushValidationError =
  | "MISSING_SUBSCRIPTION_DATA"
  | "INVALID_ENDPOINT_URL"
  | "UNSUPPORTED_PUSH_PROVIDER"
  | "DISALLOWED_INTERNAL_HOST"
  | "INVALID_P256DH_KEY"
  | "INVALID_AUTH_KEY";

export type PushValidationResult =
  | { success: true; data: ValidatedPushSubscription }
  | { success: false; error: PushValidationError; message: string };

const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

/**
 * Validates a client-submitted PushSubscription payload.
 * Defends against Server-Side Request Forgery (SSRF) and validates cryptographic keys.
 */
export function validatePushSubscriptionPayload(body: unknown): PushValidationResult {
  if (!body || typeof body !== "object") {
    return {
      success: false,
      error: "MISSING_SUBSCRIPTION_DATA",
      message: "Request body must be a valid JSON object.",
    };
  }

  const obj = body as Record<string, unknown>;
  const endpoint = typeof obj.endpoint === "string" ? obj.endpoint.trim() : "";
  const keys = (obj.keys && typeof obj.keys === "object") ? (obj.keys as Record<string, unknown>) : null;
  const userAgent = typeof obj.user_agent === "string" ? obj.user_agent.slice(0, 255) : null;

  if (!endpoint) {
    return {
      success: false,
      error: "INVALID_ENDPOINT_URL",
      message: "Push subscription endpoint URL is required.",
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(endpoint);
  } catch {
    return {
      success: false,
      error: "INVALID_ENDPOINT_URL",
      message: "Malformed push subscription endpoint URL.",
    };
  }

  if (parsedUrl.protocol !== "https:") {
    return {
      success: false,
      error: "INVALID_ENDPOINT_URL",
      message: "Push subscription endpoint must use HTTPS protocol.",
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // SSRF Protection: Reject private/internal IP ranges, raw IP literals and local hostnames
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost") ||
    DISALLOWED_HOST_PREFIXES.some((prefix) => hostname.startsWith(prefix)) ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  ) {
    return {
      success: false,
      error: "DISALLOWED_INTERNAL_HOST",
      message: "Push endpoint targets a prohibited internal, private or raw IP network destination.",
    };
  }

  // Allowlist validation with exact domain boundaries
  if (!isApprovedPushHost(hostname)) {
    return {
      success: false,
      error: "UNSUPPORTED_PUSH_PROVIDER",
      message: `Push gateway host '${hostname}' is not in the approved provider allowlist.`,
    };
  }

  if (!keys) {
    return {
      success: false,
      error: "INVALID_P256DH_KEY",
      message: "Push subscription keys (p256dh and auth) are required.",
    };
  }

  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = typeof keys.auth === "string" ? keys.auth.trim() : "";

  if (!p256dh || p256dh.length < 32 || !BASE64URL_REGEX.test(p256dh)) {
    return {
      success: false,
      error: "INVALID_P256DH_KEY",
      message: "Invalid p256dh client public key format.",
    };
  }

  if (!auth || auth.length < 12 || !BASE64URL_REGEX.test(auth)) {
    return {
      success: false,
      error: "INVALID_AUTH_KEY",
      message: "Invalid auth secret format.",
    };
  }

  return {
    success: true,
    data: {
      endpoint: parsedUrl.href,
      p256dh,
      auth,
      userAgent,
    },
  };
}

