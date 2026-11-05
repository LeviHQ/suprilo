import {
  ALLOWED_PHOTO_MIME_TYPES,
  CARD_LIMITS,
} from "@/types/card";
import type { AllowedPhotoMimeType } from "@/types/card";

/**
 * Result payload returned by photo validation functions.
 */
export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Upload operation lifecycle states for user interfaces.
 */
export type PhotoUploadStatus = "idle" | "uploading" | "uploaded" | "error";

/**
 * Validates an image file before upload or preview according to shared CARD_LIMITS.
 *
 * Rules:
 * - File must be present and non-empty (> 0 bytes).
 * - File size must not exceed CARD_LIMITS.MAX_PHOTO_SIZE_BYTES (2 MB = 2,097,152 bytes).
 * - MIME type must strictly match ALLOWED_PHOTO_MIME_TYPES ("image/jpeg", "image/png", "image/webp").
 *
 * Pure validation utility: Never imports Supabase client, SDK, or server modules.
 */
export function validatePhotoFile(
  file: File | Blob | null | undefined
): PhotoValidationResult {
  if (!file) {
    return { valid: false, error: "Please select an image file." };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Selected file is empty." };
  }

  if (file.size > CARD_LIMITS.MAX_PHOTO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 2 MB limit. Please choose a smaller photo.`,
    };
  }

  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as AllowedPhotoMimeType)) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || "unknown"}). Allowed formats: JPG, PNG, and WebP.`,
    };
  }

  return { valid: true };
}

/**
 * Resolves safe file extension from an allowed image MIME type.
 *
 * Throws an explicit error for unsupported MIME types to prevent silent misattribution.
 */
export function getPhotoExtensionFromMime(mimeType: string): string {
  if (!mimeType || typeof mimeType !== "string") {
    throw new Error("INVALID_MIME_TYPE: MIME type must be a non-empty string.");
  }

  const normalized = mimeType.toLowerCase().trim();

  switch (normalized) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      throw new Error(
        `UNSUPPORTED_MIME_TYPE: Unsupported photo MIME type "${mimeType}". Allowed types: image/jpeg, image/png, image/webp.`
      );
  }
}
