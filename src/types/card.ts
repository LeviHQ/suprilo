/**
 * Cover foil style identifiers supported by the card cover canvas.
 */
export type CoverStyle =
  | "lavender-pink"
  | "golden-foil"
  | "cosmic-purple"
  | "mint-fresh"
  | (string & {});

/**
 * Character limit and file constraints for card editor and media.
 * - Text limits preserve visual balance inside the 4:3 card canvas viewport
 *   on both mobile and desktop screens while ensuring zero truncation of templates.
 * - Photo limits strictly match the deployed Supabase Storage bucket `card-photos`
 *   (2 MB ceiling, JPEG, PNG, WebP).
 */
export const CARD_LIMITS = {
  RECIPIENT_MAX: 30,
  SENDER_MAX: 30,
  TAG_MAX: 25,
  PRIMARY_MESSAGE_MAX: 160,
  SECONDARY_MESSAGE_MAX: 90, // Set to 90 to comfortably accommodate the longest template (84 chars)
  COVER_TEXT_MAX: 30, // Standardized 30 character ceiling for tactile scratch overlay instructions
  MAX_PHOTO_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB (2,097,152 bytes) matching card-photos bucket limit
} as const;

/**
 * Allowed MIME types for uploaded card photos, strictly matching the
 * `card-photos` private storage bucket configuration.
 */
export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedPhotoMimeType = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

export type CreationMode = "template" | "scratch";

export type CardStatus = "draft" | "published" | "archived";

/**
 * Event types supported by the server-side card telemetry logging system.
 * Strictly aligned with Migration 2 public.record_card_telemetry(p_slug, p_event_type, p_visitor_hash).
 */
export type CardTelemetryEventType = "view" | "reveal";

/**
 * Supported interior card background palette identifiers.
 */
export type BgPaletteId =
  | "soft-pink"
  | "warm-sunshine"
  | "royal-amethyst"
  | "mint-fresh"
  | "pure-ivory";

/**
 * Supported decorative sticker identifiers.
 */
export type StickerId =
  | "heart"
  | "sparkles"
  | "cake"
  | "flower"
  | "gift"
  | "confetti"
  | "trophy"
  | "star";

/**
 * Client-side card editor state.
 * Strictly decoupled from server-assigned identifiers and analytics.
 */
export interface CardEditorState {
  templateId: string | null;
  creationMode: CreationMode;
  recipientName: string;
  senderName: string;
  occasionTag: string;
  primaryMessage: string;
  secondaryMessage: string;
  foilStyle: CoverStyle;
  coverText: string;
  bgPalette: BgPaletteId;
  sticker: StickerId;
  fontFamily?: string;
  photoUrl: string | null; // In-memory Data URL for client-side preview; not saved to sessionStorage
  photoPath?: string | null; // Private storage reference: {user_id}/{card_id}/{filename}
  soundEnabled: boolean;
}

/**
 * Sanitized snapshot of editor state stored in browser sessionStorage for draft recovery.
 * Intentionally excludes heavy in-memory image data URLs to prevent storage quota exhaustion.
 */
export interface StoredCardDraft {
  version: 1;
  savedAt: number;
  templateId: string | null;
  creationMode: CreationMode;
  recipientName: string;
  senderName: string;
  occasionTag: string;
  primaryMessage: string;
  secondaryMessage: string;
  foilStyle: CoverStyle;
  coverText: string;
  bgPalette: BgPaletteId;
  sticker: StickerId;
  fontFamily?: string;
  soundEnabled: boolean;
}

/**
 * Validated card content payload suitable for database storage and recipient delivery.
 */
export interface CardContentPayload {
  recipientName: string;
  senderName: string;
  occasionTag: string;
  primaryMessage: string;
  secondaryMessage?: string | null;
  photoUrl?: string | null;
  photoPath?: string | null;
  foilStyle: CoverStyle;
  coverText: string;
  bgPalette: BgPaletteId;
  sticker: StickerId;
  fontFamily?: string;
}

/**
 * Direct row interface matching the public.cards table in Supabase PostgreSQL.
 * Reflects exact schema columns, constraints, and types from Migration 1.
 */
export interface DbCard {
  id: string; // uuid PRIMARY KEY
  user_id: string; // uuid REFERENCES auth.users(id)
  slug: string; // text UNIQUE, format ^[2-9a-hj-km-np-z]{12}$
  status: CardStatus; // 'draft' | 'published' | 'archived'
  creation_mode: CreationMode; // 'scratch' | 'template'
  draft_slot: number | null; // integer 1..3 when draft, null when published/archived
  template_id: string | null; // Approved catalog ID or null
  recipient_name: string; // 1..30 chars
  sender_name: string; // 1..30 chars
  occasion_tag: string; // 1..25 chars
  primary_message: string; // 1..160 chars
  secondary_message: string | null; // null or <= 90 chars
  foil_style: CoverStyle; // 'lavender-pink' | 'golden-foil' | 'cosmic-purple' | 'mint-fresh'
  cover_text: string; // 1..60 chars
  bg_palette: BgPaletteId; // 'soft-pink' | 'warm-sunshine' | 'royal-amethyst' | 'mint-fresh' | 'pure-ivory'
  sticker: StickerId; // 'heart' | 'sparkles' | 'cake' | 'flower' | 'gift' | 'confetti' | 'trophy' | 'star'
  font_family: string | null; // null or <= 50 chars
  photo_path: string | null; // {user_id}/{card_id}/{filename} or null
  reveal_threshold: number; // numeric(3, 2), 0.10..0.95
  sound_enabled: boolean; // boolean
  published_at: string | null; // timestamptz
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

/**
 * Application-level card record model.
 * Direct alias to DbCard with optional telemetry metrics fields from public.card_metrics.
 */
export interface CardRecord extends DbCard {
  views_count?: number;
  reveals_count?: number;
  last_viewed_at?: string | null;
  last_revealed_at?: string | null;
}

/**
 * Public recipient-facing card projection returned by public.get_published_card_by_slug RPC.
 * Strictly excludes owner identification (user_id), draft slots, creation mode,
 * and unpublished/internal system columns.
 */
export interface PublishedCard {
  id: string; // uuid
  slug: string; // 12-char slug
  recipient_name: string;
  sender_name: string;
  occasion_tag: string;
  primary_message: string;
  secondary_message: string | null;
  foil_style: CoverStyle;
  cover_text: string;
  bg_palette: BgPaletteId;
  sticker: StickerId;
  font_family: string | null;
  photo_path: string | null;
  has_photo: boolean;
  reveal_threshold: number;
  sound_enabled: boolean;
  published_at: string; // timestamptz
}

/**
 * Sanitized client-facing DTO for recipient scratch card viewing.
 * Strictly excludes owner identification (user_id), internal card UUID (id),
 * Storage photo path (photo_path), internal status, draft slots, and timestamps.
 */
export interface RecipientCardDto {
  slug: string;
  recipient_name: string;
  sender_name: string;
  occasion_tag: string;
  primary_message: string;
  secondary_message: string | null;
  foil_style: CoverStyle;
  cover_text: string;
  bg_palette: BgPaletteId;
  sticker: StickerId;
  font_family: string | null;
  reveal_threshold: number;
  sound_enabled: boolean;
}

/**
 * Projects a server-side PublishedCard into a sanitized recipient client DTO.
 * Explicitly strips card UUID, photo_path, has_photo, published_at, and internal fields.
 */
export function toRecipientCardDto(card: PublishedCard): RecipientCardDto {
  return {
    slug: card.slug,
    recipient_name: card.recipient_name,
    sender_name: card.sender_name,
    occasion_tag: card.occasion_tag,
    primary_message: card.primary_message,
    secondary_message: card.secondary_message || null,
    foil_style: card.foil_style,
    cover_text: card.cover_text,
    bg_palette: card.bg_palette,
    sticker: card.sticker,
    font_family: card.font_family || null,
    reveal_threshold: card.reveal_threshold,
    sound_enabled: card.sound_enabled,
  };
}

/**
 * Exact parameter signature for public.create_card_draft stored procedure.
 * Matches Migration 2: supabase/migrations/20261102000002_functions_triggers.sql
 */
export interface CreateCardDraftRpcParams {
  p_slug: string;
  p_creation_mode?: string;
  p_template_id?: string | null;
  p_recipient_name?: string;
  p_sender_name?: string;
  p_occasion_tag?: string;
  p_primary_message?: string;
  p_secondary_message?: string | null;
  p_foil_style?: string;
  p_cover_text?: string;
  p_bg_palette?: string;
  p_sticker?: string;
  p_font_family?: string | null;
  p_photo_path?: string | null;
  p_reveal_threshold?: number;
  p_sound_enabled?: boolean;
}

/**
 * Input arguments for creating a new card draft via the createCardDraft helper.
 */
export interface CreateCardDraftInput {
  slug?: string; // Optional: auto-generated via generateCardSlug() if omitted
  creation_mode?: CreationMode;
  template_id?: string | null;
  recipient_name?: string;
  sender_name?: string;
  occasion_tag?: string;
  primary_message?: string;
  secondary_message?: string | null;
  foil_style?: CoverStyle;
  cover_text?: string;
  bg_palette?: BgPaletteId;
  sticker?: StickerId;
  font_family?: string | null;
  photo_path?: string | null;
  reveal_threshold?: number;
  sound_enabled?: boolean;
}

/**
 * Editable columns permitted for UPDATE operations by authenticated owners.
 * Strictly matches the column-level GRANT UPDATE list in Migration 3:
 * recipient_name, sender_name, occasion_tag, primary_message, secondary_message,
 * foil_style, cover_text, bg_palette, sticker, font_family, photo_path,
 * reveal_threshold, sound_enabled.
 *
 * System columns (id, user_id, status, draft_slot, slug, created_at, published_at,
 * updated_at, creation_mode, template_id) are intentionally excluded.
 */
export interface UpdateCardDraftFields {
  recipient_name?: string;
  sender_name?: string;
  occasion_tag?: string;
  primary_message?: string;
  secondary_message?: string | null;
  foil_style?: CoverStyle;
  cover_text?: string;
  bg_palette?: BgPaletteId;
  sticker?: StickerId;
  font_family?: string | null;
  photo_path?: string | null;
  reveal_threshold?: number;
  sound_enabled?: boolean;
}

/**
 * Deterministic mapping table linking each static template ID to its matching background palette.
 * Fixes the issue where template selection did not hydrate card background theme.
 */
export const TEMPLATE_PALETTE_MAP: Record<string, BgPaletteId> = {
  // 5 Dedicated Birthday Templates
  "bday-champagne-gold": "warm-sunshine",
  "bday-holo-party-prism": "soft-pink",
  "bday-balloon-pop": "warm-sunshine",
  "bday-mint-shimmer": "mint-fresh",
  "bday-roast-revelry": "warm-sunshine",

  // Legacy Catalog
  "bday-midnight-celebration": "warm-sunshine",
  "bday-party-confetti": "soft-pink",
  "bday-royal-vintage": "royal-amethyst",
  "love-secret-dinner": "soft-pink",
  "love-golden-forever": "warm-sunshine",
  "love-cute-doodle": "mint-fresh",
  "friendship-partner-in-crime": "royal-amethyst",
  "friendship-grateful-heart": "mint-fresh",
  "anniv-milestone-gold": "warm-sunshine",
  "anniv-storybook-love": "soft-pink",
  "thankyou-blooming-gratitude": "soft-pink",
  "thankyou-mentor-honor": "royal-amethyst",
  "congrats-new-job-sky": "warm-sunshine",
  "congrats-baby-arrival": "mint-fresh",
  "just-because-midday-smile": "warm-sunshine",
  "just-because-virtual-hug": "soft-pink",

  // 100 Studio Catalog Templates
  "bday-sweet-pastels": "soft-pink",
  "bday-royal-amethyst": "royal-amethyst",
  "bday-milestone-18": "royal-amethyst",
  "bday-flirty-thirty": "soft-pink",
  "bday-fabulous-fifty": "warm-sunshine",
  "bday-neon-arcade": "soft-pink",
  "bday-polaroid-memories": "mint-fresh",
  "bday-minimal-chic": "royal-amethyst",
  "bday-champagne-toast": "warm-sunshine",
  "love-secret-candlelight": "soft-pink",
  "love-golden-hour": "soft-pink",
  "love-coffee-cuddles": "soft-pink",
  "love-proposal-behind-you": "soft-pink",
  "love-silver-anniversary": "royal-amethyst",
  "love-flirty-coupons": "soft-pink",
  "love-long-distance-stars": "royal-amethyst",
  "love-first-anniversary": "warm-sunshine",
  "love-vintage-paris": "soft-pink",
  "love-midnight-drive": "mint-fresh",
  "friend-partner-in-crime": "mint-fresh",
  "friend-coffee-on-me": "warm-sunshine",
  "friend-2am-club": "royal-amethyst",
  "friend-road-trip-vibes": "royal-amethyst",
  "friend-miss-your-face": "soft-pink",
  "friend-therapy-session": "soft-pink",
  "friend-soul-sister": "warm-sunshine",
  "friend-gym-beast-mode": "royal-amethyst",
  "friend-board-game-rival": "soft-pink",
  "friend-unbreakable-bond": "warm-sunshine",
  "funny-vintage-antique": "warm-sunshine",
  "funny-emotional-damage": "soft-pink",
  "funny-favorite-sibling": "warm-sunshine",
  "funny-calendar-discovery": "mint-fresh",
  "funny-plot-twist": "soft-pink",
  "funny-surviving-meeting": "royal-amethyst",
  "funny-sarcastic-apology": "soft-pink",
  "funny-adulting-scam": "warm-sunshine",
  "funny-you-owe-me-drink": "warm-sunshine",
  "funny-dramatic-burn": "soft-pink",
  "win-corner-office": "warm-sunshine",
  "win-cap-toss-grad": "mint-fresh",
  "win-new-home-keys": "warm-sunshine",
  "win-dream-job-signed": "royal-amethyst",
  "win-license-exam-aced": "mint-fresh",
  "win-marathon-finish": "warm-sunshine",
  "win-founder-launch": "royal-amethyst",
  "win-golden-retirement": "warm-sunshine",
  "win-new-citizenship": "royal-amethyst",
  "win-creative-masterpiece": "soft-pink",
  "work-farewell-goodbye": "warm-sunshine",
  "work-slack-bestie": "soft-pink",
  "work-mentor-tribute": "royal-amethyst",
  "work-shipped-to-prod": "mint-fresh",
  "work-anniversary-5yr": "warm-sunshine",
  "work-employee-month": "warm-sunshine",
  "work-espresso-savior": "warm-sunshine",
  "work-new-hire-welcome": "soft-pink",
  "work-client-appreciation": "royal-amethyst",
  "work-friday-release": "mint-fresh",
  "reveal-paris-flight": "royal-amethyst",
  "reveal-concert-vip": "soft-pink",
  "reveal-baby-gender": "soft-pink",
  "reveal-mystery-trip": "mint-fresh",
  "reveal-secret-santa": "soft-pink",
  "reveal-puppy-adoption": "soft-pink",
  "reveal-spa-day-pamper": "soft-pink",
  "reveal-disney-pass": "soft-pink",
  "reveal-chef-tasting": "warm-sunshine",
  "reveal-new-car-keys": "warm-sunshine",
  "heart-pocket-hug": "soft-pink",
  "heart-blooming-thanks": "soft-pink",
  "heart-sunshine-healing": "warm-sunshine",
  "heart-thinking-of-you": "soft-pink",
  "heart-gentle-truce": "royal-amethyst",
  "heart-brave-resilient": "royal-amethyst",
  "heart-quiet-sanctuary": "mint-fresh",
  "heart-teacher-tribute": "warm-sunshine",
  "heart-new-mom-comfort": "soft-pink",
  "heart-exploring-path": "mint-fresh",
  "holiday-new-year-2027": "warm-sunshine",
  "holiday-valentines-sweet": "soft-pink",
  "holiday-mothers-day-queen": "soft-pink",
  "holiday-fathers-day-grill": "warm-sunshine",
  "holiday-spooky-halloween": "warm-sunshine",
  "holiday-thanksgiving-feast": "warm-sunshine",
  "holiday-christmas-gingerbread": "soft-pink",
  "holiday-diwali-lights": "warm-sunshine",
  "holiday-easter-spring": "warm-sunshine",
  "holiday-galentines-celebration": "soft-pink",
  "game-treasure-hunt-clue1": "warm-sunshine",
  "game-escape-room-pass": "royal-amethyst",
  "game-sphinx-riddle": "warm-sunshine",
  "game-truth-or-dare": "soft-pink",
  "game-crossword-clue": "royal-amethyst",
  "game-arcade-coin-insert": "soft-pink",
  "game-lucky-777-jackpot": "warm-sunshine",
  "game-mystery-word-search": "mint-fresh",
  "game-two-truths-one-lie": "soft-pink",
  "game-final-boss-quest": "warm-sunshine",
  "custom-scratch": "pure-ivory",
};
