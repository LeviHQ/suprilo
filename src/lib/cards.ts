import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateCardSlug, isValidCardSlug, SLUG_ALPHABET } from "@/lib/slug";
import type {
  BgPaletteId,
  CardRecord,
  CardStatus,
  CoverStyle,
  CreateCardDraftInput,
  CreateCardDraftRpcParams,
  DbCard,
  PublishedCard,
  StickerId,
  UpdateCardDraftFields,
} from "@/types/card";
import { toRecipientCardDto } from "@/types/card";
import { evaluateUserAchievements } from "@/lib/badges/service";

/**
 * Sanitized custom error indicating unexpected database or RPC failure
 * during published card retrieval. Distinguishes backend errors from 404 Not Found.
 */
export class CardBackendError extends Error {
  readonly code = "BACKEND_SERVICE_ERROR";
  constructor(
    message = "Unable to retrieve published card due to a temporary service error.",
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "CardBackendError";
  }
}

/**
 * Whitelist of columns permitted for client-initiated draft updates.
 * Strictly aligned with Migration 3 column-level UPDATE grants on public.cards:
 * recipient_name, sender_name, occasion_tag, primary_message, secondary_message,
 * foil_style, cover_text, bg_palette, sticker, font_family, photo_path,
 * reveal_threshold, sound_enabled.
 *
 * System columns (id, user_id, status, draft_slot, slug, created_at, published_at,
 * updated_at, creation_mode, template_id) are strictly stripped to prevent tampering.
 */
export const EDITABLE_CARD_FIELDS: ReadonlyArray<keyof UpdateCardDraftFields> = [
  "recipient_name",
  "sender_name",
  "occasion_tag",
  "primary_message",
  "secondary_message",
  "foil_style",
  "cover_text",
  "bg_palette",
  "sticker",
  "font_family",
  "photo_path",
  "reveal_threshold",
  "sound_enabled",
] as const;

/**
 * Explicit select column list strictly verified against public.cards table definition in Migration 1.
 * Prevents wildcard select (*) queries while ensuring complete field fidelity for DbCard models.
 */
export const CARD_SELECT_COLUMNS =
  "id, user_id, slug, status, creation_mode, draft_slot, template_id, recipient_name, sender_name, occasion_tag, primary_message, secondary_message, foil_style, cover_text, bg_palette, sticker, font_family, photo_path, reveal_threshold, sound_enabled, published_at, created_at, updated_at";

/**
 * Maximum retry attempts for automatic slug regeneration when encountering a unique slug collision.
 */
export const MAX_SLUG_COLLISION_RETRIES = 3;

/**
 * Creates a new card draft via the atomic public.create_card_draft stored procedure.
 *
 * Features:
 * - Generates an unbiased cryptographically secure 12-char slug if not explicitly supplied.
 * - If a custom slug is provided, validates it via canonical isValidCardSlug() before calling RPC.
 * - Adheres strictly to the Migration 2 parameter signature (p_slug, p_creation_mode, etc.).
 * - Automatically retries up to 3 times on unique slug collisions (code 23505) for auto-generated slugs.
 * - Does NOT retry unrelated errors (unauthenticated, draft slot limit, constraint violations).
 * - Executes in the authenticated user's session context; ownership is derived server-side via auth.uid().
 */
export async function createCardDraft(
  input?: CreateCardDraftInput,
  client?: SupabaseClient
): Promise<DbCard> {
  const isCustomSlug = typeof input?.slug === "string" && input.slug.trim().length > 0;

  // Validate custom slug upfront against canonical alphabet and regex constraints
  if (isCustomSlug) {
    const trimmedSlug = (input?.slug as string).trim();
    if (!isValidCardSlug(trimmedSlug)) {
      throw new Error(
        `INVALID_SLUG: Custom slug "${trimmedSlug}" is invalid. Must be exactly 12 characters from the approved alphabet (${SLUG_ALPHABET}).`
      );
    }
  }

  const supabase = client || createClient();
  const maxAttempts = isCustomSlug ? 1 : MAX_SLUG_COLLISION_RETRIES;

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxAttempts) {
    attempt++;
    const slug = isCustomSlug ? (input?.slug as string).trim() : generateCardSlug();

    const rpcParams: CreateCardDraftRpcParams = {
      p_slug: slug,
      p_creation_mode: input?.creation_mode ?? "scratch",
      p_template_id: input?.template_id ?? null,
      p_recipient_name: input?.recipient_name ?? "Friend",
      p_sender_name: input?.sender_name ?? "Someone Special",
      p_occasion_tag: input?.occasion_tag ?? "Just Because",
      p_primary_message: input?.primary_message ?? "A special surprise for you!",
      p_secondary_message: input?.secondary_message ?? null,
      p_foil_style: input?.foil_style ?? "lavender-pink",
      p_cover_text: input?.cover_text ?? "Scratch to reveal your surprise ✨",
      p_bg_palette: input?.bg_palette ?? "pure-ivory",
      p_sticker: input?.sticker ?? "sparkles",
      p_font_family: input?.font_family ?? null,
      p_photo_path: input?.photo_path ?? null,
      p_reveal_threshold: input?.reveal_threshold ?? 0.65,
      p_sound_enabled: input?.sound_enabled ?? true,
    };

    const { data, error } = await supabase.rpc("create_card_draft", rpcParams);

    if (!error && data) {
      return data as DbCard;
    }

    if (error) {
      lastError = error;

      // Check specifically for unique slug collision (PostgreSQL error code 23505)
      const isSlugCollision =
        error.code === "23505" ||
        (typeof error.message === "string" &&
          /slug/i.test(error.message) &&
          /duplicate|unique|already exists/i.test(error.message));

      // Retry only on slug collisions for auto-generated slugs
      if (isSlugCollision && !isCustomSlug && attempt < maxAttempts) {
        continue;
      }

      // Propagate all other errors immediately without swallowing
      throw error;
    }
  }

  throw lastError || new Error("Failed to create card draft after multiple attempts.");
}

/**
 * Updates an existing card draft's content and styling.
 *
 * Security & Integrity:
 * - Requires cardId and validates it is non-empty.
 * - Sanitizes payload against EDITABLE_CARD_FIELDS whitelist. System columns
 *   (user_id, status, draft_slot, slug, created_at, published_at) are stripped.
 * - Protected by Row Level Security (cards_owner_update): users can only update drafts they own.
 * - Explicitly handles zero rows updated (card not found, owned by another user, or not draft).
 */
export async function updateCardDraft(
  cardId: string,
  updates: UpdateCardDraftFields,
  client?: SupabaseClient
): Promise<DbCard> {
  if (!cardId || typeof cardId !== "string" || !cardId.trim()) {
    throw new Error("Card ID is required to update a card draft.");
  }

  // Sanitize payload strictly against allowed editable columns
  const sanitizedUpdates: Partial<UpdateCardDraftFields> = {};
  for (const field of EDITABLE_CARD_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== undefined) {
      sanitizedUpdates[field] = updates[field] as never;
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error("No editable fields provided for draft update.");
  }

  const supabase = client || createClient();

  const { data, error } = await supabase
    .from("cards")
    .update(sanitizedUpdates)
    .eq("id", cardId.trim())
    .select(CARD_SELECT_COLUMNS)
    .single();

  if (error) {
    // PostgREST code PGRST116: The result contains 0 rows
    if (error.code === "PGRST116") {
      const notFoundErr = new Error(
        `Card draft with ID "${cardId}" not found or unauthorized for update.`
      );
      (notFoundErr as unknown as { code: string }).code = "CARD_NOT_FOUND_OR_UNAUTHORIZED";
      throw notFoundErr;
    }
    throw error;
  }

  if (!data) {
    const zeroRowsErr = new Error(`Card draft with ID "${cardId}" was not updated.`);
    (zeroRowsErr as unknown as { code: string }).code = "ZERO_ROWS_AFFECTED";
    throw zeroRowsErr;
  }

  return data as DbCard;
}

/**
 * Publishes a card draft via the atomic public.publish_card_draft stored procedure.
 *
 * Security & Verification:
 * - Enforces server-side ownership (auth.uid() = card.user_id).
 * - Verifies physical storage object existence if photo_path is attached.
 * - Releases the draft slot (1..3) back to the user's active pool.
 * - Returns the updated DbCard record with status = 'published' and published_at timestamp.
 * - Does NOT fabricate recipient URLs inside the database helper.
 */
export async function publishCardDraft(
  cardId: string,
  client?: SupabaseClient
): Promise<DbCard> {
  if (!cardId || typeof cardId !== "string" || !cardId.trim()) {
    throw new Error("Card ID is required to publish a card draft.");
  }

  const supabase = client || createClient();

  const { data, error } = await supabase.rpc("publish_card_draft", {
    p_card_id: cardId.trim(),
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Failed to publish card "${cardId}": No card record returned.`);
  }

  const card = data as DbCard;

  // Non-blocking gamification evaluation on card publication
  if (card?.user_id) {
    evaluateUserAchievements(card.user_id, supabase).catch(() => {});
  }

  return card;
}

/**
 * Constructs the canonical public recipient share URL for a published card slug.
 * In browser environments, prefers window.location.origin (supports localhost, preview, prod).
 * Defaults to https://suprilo.com if origin is omitted outside browser contexts.
 */
export function buildCardShareUrl(slug: string, origin?: string): string {
  if (!slug || typeof slug !== "string") {
    throw new Error("Slug is required to construct card share URL.");
  }
  const cleanSlug = slug.trim();
  const base =
    origin?.trim() ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://suprilo.com");
  return `${base.replace(/\/+$/, "")}/s/${cleanSlug}`;
}

/**
 * Retrieves a published card by its slug using the restricted public.get_published_card_by_slug RPC.
 *
 * Security & Projection:
 * - Validates the slug upfront via isValidCardSlug(). Returns null immediately for invalid slugs.
 * - Invokes public.get_published_card_by_slug(p_slug) stored procedure.
 * - Does NOT query public.cards table directly for public recipient views.
 * - Never returns draft or archived cards (filtered inside the RPC).
 * - Never exposes user_id, email, draft_slot, or internal system columns.
 * - Returns null if the card does not exist, is not published, or is archived.
 */
export const getPublishedCardBySlug = cache(
  async (slug: string, client?: SupabaseClient): Promise<PublishedCard | null> => {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  const cleanSlug = slug.trim();
  if (!isValidCardSlug(cleanSlug)) {
    return null;
  }

  let supabase: SupabaseClient;
  try {
    supabase = client || createClient();
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[getPublishedCardBySlug] Supabase client initialization failed for slug "${cleanSlug}":`,
        err instanceof Error ? err.message : String(err)
      );
    }
    throw new CardBackendError(
      "Unable to retrieve published card due to a temporary service initialization error.",
      { cause: err }
    );
  }

  let data: unknown;
  let error: { message: string } | null = null;

  try {
    const result = await supabase.rpc("get_published_card_by_slug", {
      p_slug: cleanSlug,
    });
    data = result.data;
    error = result.error;
  } catch (err: unknown) {
    if (err instanceof CardBackendError) {
      throw err;
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[getPublishedCardBySlug] RPC network/transport exception for slug "${cleanSlug}":`,
        err instanceof Error ? err.message : String(err)
      );
    }
    throw new CardBackendError(
      "Unable to retrieve published card due to a temporary network or transport error.",
      { cause: err }
    );
  }

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[getPublishedCardBySlug] RPC error for slug "${cleanSlug}":`,
        error.message
      );
    }
    throw new CardBackendError(
      "Unable to retrieve published card due to a temporary database error.",
      { cause: error }
    );
  }

  if (!data) {
    return null;
  }

  // Supabase RPC returning TABLE(...) returns an array of records
  const record = Array.isArray(data) ? data[0] : data;
  if (!record || !record.id) {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    recipient_name: record.recipient_name,
    sender_name: record.sender_name,
    occasion_tag: record.occasion_tag,
    primary_message: record.primary_message,
    secondary_message: record.secondary_message || null,
    foil_style: record.foil_style as CoverStyle,
    cover_text: record.cover_text,
    bg_palette: record.bg_palette as BgPaletteId,
    sticker: record.sticker as StickerId,
    font_family: record.font_family || null,
    photo_path: record.photo_path || null,
    has_photo: Boolean(record.has_photo),
    reveal_threshold:
      typeof record.reveal_threshold === "number"
        ? record.reveal_threshold
        : Number(record.reveal_threshold) || 0.65,
    sound_enabled: Boolean(record.sound_enabled),
    published_at: record.published_at,
  };
});

/**
 * Archives a card via the atomic public.archive_card stored procedure.
 *
 * Behavior:
 * - Enforces server-side ownership.
 * - If archiving an active draft, atomically releases the draft slot.
 * - Freezes card content and sets status = 'archived'.
 * - Operation is idempotent if the card is already archived.
 */
export async function archiveCard(
  cardId: string,
  client?: SupabaseClient
): Promise<DbCard> {
  if (!cardId || typeof cardId !== "string" || !cardId.trim()) {
    throw new Error("Card ID is required to archive a card.");
  }

  const supabase = client || createClient();

  const { data, error } = await supabase.rpc("archive_card", {
    p_card_id: cardId.trim(),
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Failed to archive card "${cardId}": No card record returned.`);
  }

  const card = data as DbCard;

  // Non-blocking gamification evaluation on card status change
  if (card?.user_id) {
    evaluateUserAchievements(card.user_id, supabase).catch(() => {});
  }

  return card;
}

/**
 * Retrieves card records owned by the current authenticated user.
 *
 * Access Control:
 * - Protected by Row Level Security policy cards_owner_select (auth.uid() = user_id).
 * - Explicitly projects verified CARD_SELECT_COLUMNS instead of wildcard *.
 * - Never uses the service-role key; strictly user-scoped.
 * - Orders results by creation date descending.
 */
export async function getUserCards(
  filter?: { status?: CardStatus; limit?: number },
  client?: SupabaseClient
): Promise<DbCard[]> {
  const supabase = client || createClient();

  let query = supabase
    .from("cards")
    .select(CARD_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (filter?.status) {
    query = query.eq("status", filter.status);
  }

  if (filter?.limit && filter.limit > 0) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as DbCard[];
}

/**
 * Metrics map keyed by card UUID.
 */
export type UserCardsMetricsMap = Record<
  string,
  {
    views_count: number;
    reveals_count: number;
    last_viewed_at?: string | null;
    last_revealed_at?: string | null;
  }
>;

/**
 * Retrieves telemetry metrics (views and reveals) for cards owned by the authenticated user.
 * Protected by Row Level Security policy card_metrics_owner_select.
 * Accepts optional cardIds to perform an indexed primary key lookup instead of an unbounded scan.
 */
export async function getUserCardMetrics(
  cardIds?: string[],
  client?: SupabaseClient
): Promise<UserCardsMetricsMap> {
  const supabase = client || createClient();

  let query = supabase
    .from("card_metrics")
    .select("card_id, views_count, reveals_count, last_viewed_at, last_revealed_at");

  if (cardIds && cardIds.length > 0) {
    query = query.in("card_id", cardIds);
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getUserCardMetrics] Failed to fetch card metrics:", error.message);
    }
    return {};
  }

  const map: UserCardsMetricsMap = {};
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && item.card_id) {
        map[item.card_id] = {
          views_count: Number(item.views_count) || 0,
          reveals_count: Number(item.reveals_count) || 0,
          last_viewed_at: item.last_viewed_at || null,
          last_revealed_at: item.last_revealed_at || null,
        };
      }
    }
  }

  return map;
}

/**
 * Retrieves cards owned by the authenticated user along with their telemetry metrics (views and reveals).
 * Optimizations:
 * 1. Leverages PostgREST embedded resource join to fetch cards + metrics in a single database roundtrip.
 * 2. Gracefully falls back to targeted card-id lookups if embedded query is unavailable.
 */
export async function getUserCardsWithMetrics(
  filter?: { status?: CardStatus; limit?: number },
  client?: SupabaseClient
): Promise<CardRecord[]> {
  const supabase = client || createClient();

  try {
    // 1. Single database round-trip via PostgREST embedded resource join
    let query = supabase
      .from("cards")
      .select(`
        ${CARD_SELECT_COLUMNS},
        card_metrics (
          views_count,
          reveals_count,
          last_viewed_at,
          last_revealed_at
        )
      `)
      .order("created_at", { ascending: false });

    if (filter?.status) {
      query = query.eq("status", filter.status);
    }
    if (filter?.limit && filter.limit > 0) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      return data.map((row: Record<string, unknown>) => {
        const rawMetrics = Array.isArray(row.card_metrics)
          ? row.card_metrics[0]
          : (row.card_metrics as Record<string, unknown> | null);

        // Strip embedded relation object to preserve clean CardRecord interface
        const cardFields = { ...row };
        delete cardFields.card_metrics;

        return {
          ...cardFields,
          views_count: Number(rawMetrics?.views_count) || 0,
          reveals_count: Number(rawMetrics?.reveals_count) || 0,
          last_viewed_at: (rawMetrics?.last_viewed_at as string) || null,
          last_revealed_at: (rawMetrics?.last_revealed_at as string) || null,
        } as unknown as CardRecord;
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getUserCardsWithMetrics] Embedded join fallback:", err);
    }
  }

  // 2. Resilient fallback: fetch cards first, then fetch metrics strictly for those card IDs
  const cards = await getUserCards(filter, supabase);
  const cardIds = cards.map((c) => c.id).filter(Boolean);
  const metricsMap = await getUserCardMetrics(cardIds, supabase).catch(() => ({} as UserCardsMetricsMap));

  return cards.map((card) => {
    const metrics = metricsMap[card.id];
    return {
      ...card,
      views_count: metrics?.views_count ?? 0,
      reveals_count: metrics?.reveals_count ?? 0,
      last_viewed_at: metrics?.last_viewed_at ?? null,
      last_revealed_at: metrics?.last_revealed_at ?? null,
    };
  });
}

/**
 * Deletes an active card draft owned by the authenticated user.
 *
 * Safety & Lifecycle:
 * - Strictly restricted to cards with status = 'draft'.
 * - Authenticated user ownership enforced via RLS policy cards_owner_delete (auth.uid() = user_id).
 * - Trigger process_cards_before_delete() automatically acquires advisory lock on draft_slot,
 *   releases the user's draft slot, permanently retires the slug, and cleans up any photo references.
 * - Does NOT allow deleting published or archived cards through this function.
 */
export async function deleteCardDraft(
  cardId: string,
  client?: SupabaseClient
): Promise<boolean> {
  if (!cardId || typeof cardId !== "string" || !cardId.trim()) {
    throw new Error("Card ID is required to delete a draft.");
  }

  const supabase = client || createClient();

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId.trim())
    .eq("status", "draft");

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Retrieves a single card record by its ID if owned by the current authenticated user.
 * Returns null if not found or not owned.
 */
export async function getCardById(
  cardId: string,
  client?: SupabaseClient
): Promise<DbCard | null> {
  if (!cardId || typeof cardId !== "string" || !cardId.trim()) {
    throw new Error("Card ID is required.");
  }

  const supabase = client || createClient();

  const { data, error } = await supabase
    .from("cards")
    .select(CARD_SELECT_COLUMNS)
    .eq("id", cardId.trim())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as DbCard) || null;
}

// Re-export storage and validation operations for unified data access surface
export {
  uploadCardPhoto,
  validatePhotoFile,
  getPhotoExtensionFromMime,
  buildCardPhotoPath,
  generatePhotoFilename,
  isValidUuid,
  CARD_PHOTOS_BUCKET,
} from "./card-storage";
export type {
  PhotoValidationResult,
  UploadCardPhotoResult,
  PhotoUploadStatus,
} from "./card-storage";
export type { PublishedCard, RecipientCardDto, CardRecord } from "@/types/card";
export { toRecipientCardDto };
