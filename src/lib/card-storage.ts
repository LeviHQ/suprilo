import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  validatePhotoFile,
  getPhotoExtensionFromMime,
} from "./photo-validation";
import type {
  PhotoValidationResult,
  PhotoUploadStatus,
} from "./photo-validation";

// Re-export pure validation helpers and types
export { validatePhotoFile, getPhotoExtensionFromMime };
export type { PhotoValidationResult, PhotoUploadStatus };

/**
 * Canonical Supabase Storage bucket for card photos.
 * Private bucket with two-tier RLS folder verification ({user_id}/{card_id}/{filename}).
 */
export const CARD_PHOTOS_BUCKET = "card-photos" as const;

/**
 * Regex matching standard canonical 36-character UUID strings (case-insensitive).
 * Strictly aligned with Migration 4 storage policy regex:
 * ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether an unknown value is a valid 36-character UUID string.
 */
export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Generates a collision-resistant filename using Web Crypto / Node crypto.
 * Never uses Math.random() or predictable timestamp fallbacks.
 * Throws an explicit error if a cryptographically secure random source is unavailable.
 */
export function generatePhotoFilename(mimeType: string): string {
  const ext = getPhotoExtensionFromMime(mimeType);
  const timestamp = Date.now();

  let randomHex = "";
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    if (typeof globalThis.crypto.randomUUID === "function") {
      randomHex = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    } else if (typeof globalThis.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(8);
      globalThis.crypto.getRandomValues(bytes);
      randomHex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  }

  // Node.js crypto fallback
  if (!randomHex) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodeCrypto = require("crypto");
      if (typeof nodeCrypto.randomBytes === "function") {
        randomHex = nodeCrypto.randomBytes(8).toString("hex");
      }
    } catch {
      // Fall through to error
    }
  }

  // Strictly throw if no cryptographically secure source is available
  if (!randomHex) {
    throw new Error(
      "CRYPTO_UNAVAILABLE: Cryptographically secure random number generator is unavailable to generate photo filename."
    );
  }

  return `photo-${timestamp}-${randomHex}${ext}`;
}

/**
 * Constructs the canonical storage path adhering strictly to Migration 4 policy:
 * Path pattern: {user_id}/{card_id}/{filename}
 */
export function buildCardPhotoPath(
  userId: string,
  cardId: string,
  filename: string
): string {
  if (!isValidUuid(userId)) {
    throw new Error(`INVALID_USER_ID: "${userId}" is not a valid UUID.`);
  }

  if (!isValidUuid(cardId)) {
    throw new Error(`INVALID_CARD_ID: "${cardId}" is not a valid UUID.`);
  }

  if (
    typeof filename !== "string" ||
    !filename.trim() ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("..")
  ) {
    throw new Error(
      "INVALID_FILENAME: Filename cannot contain path separators, traversal characters, or be empty."
    );
  }

  return `${userId.toLowerCase().trim()}/${cardId.toLowerCase().trim()}/${filename.trim()}`;
}

export interface UploadCardPhotoResult {
  photoPath: string; // Canonical storage path: {user_id}/{card_id}/{filename}
  bucket: string;
}

/**
 * Uploads a validated photo to the private `card-photos` Supabase Storage bucket.
 *
 * Security & Integrity:
 * - Obtains authenticated user directly from auth.getUser() — never accepts client-provided userId.
 * - Enforces CARD_LIMITS (2 MB maximum size, JPEG/PNG/WebP).
 * - Enforces valid UUID cardId matching Tier-2 folder requirement.
 * - Configured with `upsert: false` to avoid accidental or unauthorized overwriting.
 * - Confirms that the server responded with an exact Storage object path before returning.
 * - Never returns or generates a public URL (bucket is private).
 */
export async function uploadCardPhoto(
  cardId: string,
  file: File | Blob,
  client?: SupabaseClient
): Promise<UploadCardPhotoResult> {
  // 1. Validate Card ID
  if (!isValidUuid(cardId)) {
    throw new Error(
      `INVALID_CARD_ID: "${cardId}" is not a valid card UUID. A valid card must be created before uploading photos.`
    );
  }

  // 2. Validate File constraints
  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid photo file.");
  }

  const supabase = client || createClient();

  // 3. Resolve authenticated owner strictly from session context
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("UNAUTHENTICATED: Must be logged in to upload a card photo.");
  }

  // 4. Construct path adhering to Migration 4 RLS folder convention
  const filename = generatePhotoFilename(file.type);
  const photoPath = buildCardPhotoPath(user.id, cardId, filename);

  // 5. Upload to private bucket with upsert: false
  const { data, error: uploadError } = await supabase.storage
    .from(CARD_PHOTOS_BUCKET)
    .upload(photoPath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // 6. Verify that upload returned a valid server object path
  if (!data?.path) {
    throw new Error(
      `STORAGE_UPLOAD_ERROR: Storage upload succeeded but server returned no object path for card "${cardId}".`
    );
  }

  return {
    photoPath: data.path,
    bucket: CARD_PHOTOS_BUCKET,
  };
}
