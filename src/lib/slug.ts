/**
 * Cryptographically secure slug generation and validation utility for Suprilo.
 *
 * Requirements:
 * - Approved alphabet: "23456789abcdefghjkmnpqrstuvwxyz" (31 chars, excluding 0, 1, l, o).
 * - Exact length: 12 characters.
 * - Uniform distribution: Rejection sampling to prevent modulo bias (248 <= byte < 256 rejected).
 * - Zero Math.random() usage: Relies strictly on Web Crypto / Node crypto getRandomValues.
 * - Validation pattern: ^[2-9a-hj-km-np-z]{12}$ matching public.cards slug constraint.
 */

export const SLUG_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz" as const;
export const SLUG_LENGTH = 12 as const;
export const SLUG_REGEX = /^[2-9a-hj-km-np-z]{12}$/;

/**
 * Largest multiple of 31 that fits within a single unsigned 8-bit integer (0..255).
 * 31 * 8 = 248. Bytes >= 248 are discarded to guarantee unbiased uniform sampling.
 */
const REJECTION_LIMIT = 248;

/**
 * Resolves the cryptographically secure getRandomValues function across
 * browser, Edge runtime, and Node.js environments.
 * Throws a descriptive error if no secure random source is available.
 */
function getSecureRandomValues(buffer: Uint8Array): Uint8Array {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(buffer);
  }

  // Node.js fallback if globalThis.crypto is unavailable
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    if (typeof nodeCrypto.webcrypto?.getRandomValues === "function") {
      return nodeCrypto.webcrypto.getRandomValues(buffer);
    }
    if (typeof nodeCrypto.randomFillSync === "function") {
      nodeCrypto.randomFillSync(buffer);
      return buffer;
    }
  } catch {
    // Fall through to error
  }

  throw new Error(
    "Cryptographically secure random number generator is unavailable in this environment."
  );
}

/**
 * Generates an unbiased, cryptographically secure 12-character card slug.
 *
 * Uses rejection sampling:
 * - Discards random bytes in range [248, 255] (8 values).
 * - Accepts bytes in range [0, 247] (248 values, exactly 8 * 31).
 * - byte % 31 yields a perfectly uniform distribution across all 31 characters.
 */
export function generateCardSlug(): string {
  let slug = "";
  // Draw small chunks to minimize crypto syscalls while avoiding excessive memory allocation
  const buffer = new Uint8Array(24);

  while (slug.length < SLUG_LENGTH) {
    getSecureRandomValues(buffer);
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte < REJECTION_LIMIT) {
        slug += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
        if (slug.length === SLUG_LENGTH) {
          break;
        }
      }
    }
  }

  // Sanity check against canonical regex
  if (!SLUG_REGEX.test(slug)) {
    throw new Error(`Generated slug failed validation against constraint: ${slug}`);
  }

  return slug;
}

/**
 * Validates whether an unknown value conforms to the Suprilo card slug constraint:
 * Exactly 12 characters from the approved 31-character alphabet ^[2-9a-hj-km-np-z]{12}$.
 */
export function isValidCardSlug(slug: unknown): slug is string {
  return typeof slug === "string" && SLUG_REGEX.test(slug);
}

