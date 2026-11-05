import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { generateCardSlug, isValidCardSlug, SLUG_ALPHABET } from "@/lib/slug";
import type {
  CardStatus,
  CreateCardDraftInput,
  CreateCardDraftRpcParams,
  DbCard,
  UpdateCardDraftFields,
} from "@/types/card";

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

  return data as DbCard;
}

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

  return data as DbCard;
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
  filter?: { status?: CardStatus },
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

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as DbCard[];
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
