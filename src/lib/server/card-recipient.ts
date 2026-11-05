// Server-Side Recipient Helpers & Telemetry
// Provides secure temporary photo signing and telemetry logging via service-role key.
// Server-only boundary: never import into client components.

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidCardSlug } from "@/lib/slug";
import { CARD_PHOTOS_BUCKET, isValidUuid } from "@/lib/card-storage";
import { getPublishedCardBySlug, CardBackendError } from "@/lib/cards";
import type { CardTelemetryEventType } from "@/types/card";

try {
  // Use framework server-only boundary if available in the runtime environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("server-only");
} catch {
  // Fallback when server-only package is not installed in the workspace
}

if (typeof window !== "undefined" || typeof document !== "undefined") {
  throw new Error("Security Violation: card-recipient server helper cannot be executed on the client.");
}

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Strictly used on the server for:
 * 1. Generating temporary signed read URLs for private card photos.
 * 2. Invoking public.record_card_telemetry() which requires service_role execution rights.
 *
 * Never passes service-role credentials to the browser.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[getSupabaseAdminClient] SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing. Telemetry and photo signing will be disabled."
      );
    }
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Validates a storage path against the canonical pattern:
 * {user_id}/{card_id}/{filename}
 */
export function isValidCardPhotoPath(photoPath: unknown): photoPath is string {
  if (typeof photoPath !== "string") return false;
  const cleanPath = photoPath.trim();
  if (!cleanPath || cleanPath.includes("..") || cleanPath.includes("\\")) {
    return false;
  }

  const segments = cleanPath.split("/");
  if (segments.length !== 3) return false;

  const [userId, cardId, filename] = segments;
  if (!isValidUuid(userId) || !isValidUuid(cardId)) return false;
  if (!filename || filename.length < 3 || filename.length > 255) return false;

  return true;
}

/**
 * Verifies that a storage path matches canonical pattern and that its card UUID segment
 * strictly matches the expected card ID of the published card being viewed.
 */
export function verifyCardPhotoOwnership(
  photoPath: unknown,
  expectedCardId: string
): boolean {
  if (!isValidCardPhotoPath(photoPath)) {
    return false;
  }
  if (!isValidUuid(expectedCardId)) {
    return false;
  }
  const cleanPath = (photoPath as string).trim();
  const segments = cleanPath.split("/");
  const pathCardId = segments[1];
  return pathCardId.toLowerCase() === expectedCardId.trim().toLowerCase();
}

export interface DownloadedPhotoResult {
  data: Blob;
  contentType: string;
}

export const ALLOWED_PHOTO_RESPONSE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Downloads a published card's photo from the private card-photos bucket on the server.
 *
 * Security & Integrity:
 * - Enforces card UUID ownership check (path must belong to expectedCardId).
 * - Uses the service-role client on the server only.
 * - Strictly verifies content type is one of image/jpeg, image/png, image/webp.
 * - Never exposes Storage path or credentials to the client.
 */
export async function downloadRecipientCardPhoto(
  photoPath: string,
  expectedCardId: string,
  adminClient?: SupabaseClient
): Promise<DownloadedPhotoResult | null> {
  if (!verifyCardPhotoOwnership(photoPath, expectedCardId)) {
    return null;
  }

  const client = adminClient || getSupabaseAdminClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client.storage
      .from(CARD_PHOTOS_BUCKET)
      .download(photoPath.trim());

    if (error || !data) {
      if (process.env.NODE_ENV !== "production" && error) {
        console.warn(
          `[downloadRecipientCardPhoto] Failed to download photo "${photoPath}":`,
          error.message
        );
      }
      return null;
    }

    // Determine and validate MIME type
    let contentType = data.type?.toLowerCase();
    if (!contentType || contentType === "application/octet-stream") {
      const clean = photoPath.trim().toLowerCase();
      if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) {
        contentType = "image/jpeg";
      } else if (clean.endsWith(".png")) {
        contentType = "image/png";
      } else if (clean.endsWith(".webp")) {
        contentType = "image/webp";
      }
    }

    if (!contentType || !ALLOWED_PHOTO_RESPONSE_CONTENT_TYPES.has(contentType)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[downloadRecipientCardPhoto] Rejected unsupported photo content-type "${contentType}" for "${photoPath}"`
        );
      }
      return null;
    }

    return {
      data,
      contentType,
    };
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[downloadRecipientCardPhoto] Exception downloading photo "${photoPath}":`,
        err instanceof Error ? err.message : String(err)
      );
    }
    return null;
  }
}

/**
 * Handles the recipient photo proxy request.
 * Can accept optional injected clients for 100% isolated unit testing.
 */
export async function handleCardPhotoProxy(
  _request: Request,
  slug: string,
  client?: SupabaseClient,
  adminClient?: SupabaseClient
): Promise<NextResponse> {
  // 1. Slug validation
  if (!slug || !isValidCardSlug(slug)) {
    return new NextResponse(null, { status: 404 });
  }

  // 2. Retrieve published card using restricted public RPC
  let card;
  try {
    card = await getPublishedCardBySlug(slug, client);
  } catch (err: unknown) {
    if (err instanceof CardBackendError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[handleCardPhotoProxy] CardBackendError for slug "${slug}":`, err.message);
      }
      return new NextResponse(null, { status: 503 });
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[handleCardPhotoProxy] Backend failure for slug "${slug}":`,
        err instanceof Error ? err.message : String(err)
      );
    }
    return new NextResponse(null, { status: 503 });
  }

  // 3. Card must exist, be published, and have a confirmed photo
  if (!card || !card.has_photo || !card.photo_path) {
    return new NextResponse(null, { status: 404 });
  }

  // 4. Download photo server-side with card UUID ownership verification
  const downloadResult = await downloadRecipientCardPhoto(
    card.photo_path,
    card.id,
    adminClient
  );

  if (!downloadResult) {
    return new NextResponse(null, { status: 404 });
  }

  // 5. Stream image bytes to recipient without leaking Storage paths
  return new NextResponse(downloadResult.data, {
    status: 200,
    headers: {
      "Content-Type": downloadResult.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
    },
  });
}

/**
 * Computes an anonymized, collision-resistant 64-character SHA-256 visitor hash
 * from incoming HTTP request headers (IP + User-Agent).
 *
 * Adheres strictly to the PostgreSQL telemetry constraint:
 * p_visitor_hash ~ '^[a-f0-9]{64}$'
 */
export function computeVisitorHash(
  headersList?: Headers | Record<string, string | string[] | undefined> | null
): string {
  let ip = "127.0.0.1";
  let userAgent = "unknown-client";

  if (headersList) {
    if (typeof (headersList as Headers).get === "function") {
      const h = headersList as Headers;
      const fwd = h.get("x-forwarded-for");
      const realIp = h.get("x-real-ip");
      const cfIp = h.get("cf-connecting-ip");
      const ua = h.get("user-agent");

      if (fwd) {
        ip = fwd.split(",")[0].trim();
      } else if (realIp) {
        ip = realIp.trim();
      } else if (cfIp) {
        ip = cfIp.trim();
      }

      if (ua) {
        userAgent = ua.trim();
      }
    } else {
      const obj = headersList as Record<string, string | string[] | undefined>;
      const fwd = obj["x-forwarded-for"];
      const realIp = obj["x-real-ip"];
      const cfIp = obj["cf-connecting-ip"];
      const ua = obj["user-agent"];

      if (typeof fwd === "string") {
        ip = fwd.split(",")[0].trim();
      } else if (Array.isArray(fwd) && fwd.length > 0) {
        ip = fwd[0].split(",")[0].trim();
      } else if (typeof realIp === "string") {
        ip = realIp.trim();
      } else if (typeof cfIp === "string") {
        ip = cfIp.trim();
      }

      if (typeof ua === "string") {
        userAgent = ua.trim();
      }
    }
  }

  // Consistent application salt prevents rainbow-table exposure
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 16)
    : "suprilo_telemetry_salt";

  const rawInput = `${ip}:${userAgent}:${salt}`;
  return crypto.createHash("sha256").update(rawInput).digest("hex").toLowerCase();
}

/**
 * Records card telemetry (view or reveal event) using the admin service-role client.
 * Calls public.record_card_telemetry(p_slug, p_event_type, p_visitor_hash).
 *
 * Security & Reliability:
 * - Validates input parameters strictly before invoking RPC.
 * - Enforces 15-minute visitor cooldown in the database.
 * - Never throws an error: returns boolean indicating whether the event was claimed and logged.
 * - Failures never disrupt recipient viewing or scratching experience.
 */
export async function recordCardTelemetry(
  slug: string,
  eventType: CardTelemetryEventType,
  visitorHash: string,
  adminClient?: SupabaseClient
): Promise<boolean> {
  if (!slug || !isValidCardSlug(slug)) {
    return false;
  }

  if (eventType !== "view" && eventType !== "reveal") {
    return false;
  }

  if (!visitorHash || !/^[a-f0-9]{64}$/.test(visitorHash)) {
    return false;
  }

  const client = adminClient || getSupabaseAdminClient();
  if (!client) {
    return false;
  }

  try {
    const { data, error } = await client.rpc("record_card_telemetry", {
      p_slug: slug.trim(),
      p_event_type: eventType,
      p_visitor_hash: visitorHash.trim().toLowerCase(),
    });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[recordCardTelemetry] RPC error logging ${eventType} on "${slug}":`,
          error.message
        );
      }
      return false;
    }

    return Boolean(data);
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[recordCardTelemetry] Exception logging ${eventType} on "${slug}":`,
        err instanceof Error ? err.message : String(err)
      );
    }
    return false;
  }
}

