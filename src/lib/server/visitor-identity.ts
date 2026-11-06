// Server-Side Visitor Identity & Handshake Token Helpers
// Canonical Specification: SPEC-2C-5.6.1-FINAL, Version 3.0.0
// Server-only boundary: never import into client components.

import crypto from "crypto";

try {
  // Use framework server-only boundary if available in the runtime environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("server-only");
} catch {
  // Fallback when server-only package is not installed in the workspace
}

if (typeof window !== "undefined" || typeof document !== "undefined") {
  throw new Error("Security Violation: visitor-identity server helper cannot be executed on the client.");
}

export const SB_VID_COOKIE_NAME = "sb_vid";
export const SB_VID_MAX_AGE = 31536000; // 365 days in seconds
export const HANDSHAKE_TOKEN_TTL_SECONDS = 300; // 5 minutes

export interface VisitorSecrets {
  handshakeSigningSecret: string;
  visitorSecretCurrent: string;
  visitorSecretPrevious: string | null;
}

/**
 * Retrieves environment secrets for telemetry handshake and visitor hashing.
 * Provides resilient fallbacks based on SUPABASE_SERVICE_ROLE_KEY if dedicated secrets are unset.
 */
export function getVisitorSecrets(): VisitorSecrets {
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY || "suprilo_telemetry_secure_salt_default_2026";

  const handshakeSigningSecret =
    process.env.HANDSHAKE_SIGNING_SECRET && process.env.HANDSHAKE_SIGNING_SECRET.trim().length >= 16
      ? process.env.HANDSHAKE_SIGNING_SECRET.trim()
      : `hss_${fallback.slice(0, 32)}`;

  const visitorSecretCurrent =
    process.env.HMAC_VISITOR_SECRET_CURRENT && process.env.HMAC_VISITOR_SECRET_CURRENT.trim().length >= 16
      ? process.env.HMAC_VISITOR_SECRET_CURRENT.trim()
      : `vsc_${fallback.slice(0, 32)}`;

  const visitorSecretPrevious =
    process.env.HMAC_VISITOR_SECRET_PREVIOUS && process.env.HMAC_VISITOR_SECRET_PREVIOUS.trim().length >= 16
      ? process.env.HMAC_VISITOR_SECRET_PREVIOUS.trim()
      : null;

  return {
    handshakeSigningSecret,
    visitorSecretCurrent,
    visitorSecretPrevious,
  };
}

/**
 * Generates a cryptographically random UUIDv4 visitor pseudonym.
 */
export function generateVisitorId(): string {
  return crypto.randomUUID();
}

/**
 * Validates whether an incoming string is a well-formed UUID.
 */
export function isValidUuid(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

export interface VisitorHashResult {
  currentHash: string | null;
  previousHash: string | null;
  isUntracked: boolean;
}

/**
 * Derives current and previous 64-character SHA-256 HMAC visitor hashes
 * from the trusted server-read sb_vid cookie value.
 *
 * Untracked Policy:
 * If sb_vid is missing, malformed, or rejected, returns currentHash = null,
 * previousHash = null, and isUntracked = true. No fake identity is generated.
 */
export function computeVisitorHashes(
  sbVid?: string | null,
  secretsOverride?: VisitorSecrets
): VisitorHashResult {
  if (!sbVid || typeof sbVid !== "string" || !isValidUuid(sbVid.trim())) {
    return {
      currentHash: null,
      previousHash: null,
      isUntracked: true,
    };
  }

  const cleanVid = sbVid.trim();
  const secrets = secretsOverride || getVisitorSecrets();

  const currentHash = crypto
    .createHmac("sha256", secrets.visitorSecretCurrent)
    .update(cleanVid)
    .digest("hex")
    .toLowerCase();

  const previousHash = secrets.visitorSecretPrevious
    ? crypto
        .createHmac("sha256", secrets.visitorSecretPrevious)
        .update(cleanVid)
        .digest("hex")
        .toLowerCase()
    : null;

  return {
    currentHash,
    previousHash,
    isUntracked: false,
  };
}

/**
 * Creates a cryptographically signed handshake token strictly bound to
 * card_id and page_session_id with a 300-second TTL.
 *
 * Token Format:
 * {cid}.{sid}.{iat}.{exp}.{signature}
 */
export function createHandshakeToken(
  cardId: string,
  pageSessionId: string,
  secretsOverride?: VisitorSecrets
): string {
  if (!isValidUuid(cardId) || !isValidUuid(pageSessionId)) {
    throw new Error("Invalid parameters for handshake token creation");
  }

  const secrets = secretsOverride || getVisitorSecrets();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + HANDSHAKE_TOKEN_TTL_SECONDS;

  const rawData = `${cardId}:${pageSessionId}:${iat}:${exp}`;
  const signature = crypto
    .createHmac("sha256", secrets.handshakeSigningSecret)
    .update(rawData)
    .digest("hex")
    .toLowerCase();

  return `${cardId}.${pageSessionId}.${iat}.${exp}.${signature}`;
}

export interface HandshakeTokenVerification {
  valid: boolean;
  error?:
    | "INVALID_FORMAT"
    | "CARD_MISMATCH"
    | "SESSION_MISMATCH"
    | "EXPIRED"
    | "INVALID_SIGNATURE";
}

/**
 * Verifies a server-issued handshake token.
 * Validates format, card binding, session binding, expiration, and HMAC signature.
 */
export function verifyHandshakeToken(
  token: unknown,
  expectedCardId: string,
  expectedSessionId: string,
  secretsOverride?: VisitorSecrets
): HandshakeTokenVerification {
  if (typeof token !== "string" || !token.trim()) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 5) {
    return { valid: false, error: "INVALID_FORMAT" };
  }

  const [cid, sid, iatStr, expStr, signature] = parts;

  if (cid.toLowerCase() !== expectedCardId.toLowerCase().trim()) {
    return { valid: false, error: "CARD_MISMATCH" };
  }

  if (sid.toLowerCase() !== expectedSessionId.toLowerCase().trim()) {
    return { valid: false, error: "SESSION_MISMATCH" };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = parseInt(expStr, 10);
  const iat = parseInt(iatStr, 10);

  if (isNaN(exp) || isNaN(iat) || now > exp) {
    return { valid: false, error: "EXPIRED" };
  }

  const secrets = secretsOverride || getVisitorSecrets();
  const rawData = `${cid}:${sid}:${iat}:${exp}`;
  const expectedSignature = crypto
    .createHmac("sha256", secrets.handshakeSigningSecret)
    .update(rawData)
    .digest("hex")
    .toLowerCase();

  if (signature.length !== 64 || expectedSignature.length !== 64) {
    return { valid: false, error: "INVALID_SIGNATURE" };
  }

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );

  if (!isMatch) {
    return { valid: false, error: "INVALID_SIGNATURE" };
  }

  return { valid: true };
}

const BOT_USER_AGENT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /duckduckbot/i,
  /slurp/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest\/0\./i,
  /developers\.google\.com\/\+\/web\/snippet/i,
  /slackbot/i,
  /vkshare/i,
  /w3c_validator/i,
  /redditbot/i,
  /applebot/i,
  /whatsapp/i,
  /flipboard/i,
  /tumblr/i,
  /bitlybot/i,
  /skypeuripreview/i,
  /nuzzel/i,
  /discordbot/i,
  /qwantify/i,
  /headlesschrome/i,
  /phantomjs/i,
  /curl\//i,
  /python-requests/i,
  /aiohttp/i,
  /wget\//i,
  /go-http-client/i,
];

/**
 * Checks whether an incoming User-Agent header matches known search bots, crawlers, or previewers.
 */
export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent || typeof userAgent !== "string") return false;
  const ua = userAgent.trim();
  return BOT_USER_AGENT_PATTERNS.some((pattern) => pattern.test(ua));
}

