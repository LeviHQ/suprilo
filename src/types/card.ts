import { CoverStyle } from "@/components/scratch/ScratchCard";

/**
 * Character limit constraints for card editor input fields.
 * Chosen carefully to preserve visual balance inside the 4:3 card canvas viewport
 * on both mobile and desktop screens while ensuring zero truncation of existing templates.
 */
export const CARD_LIMITS = {
  RECIPIENT_MAX: 30,
  SENDER_MAX: 30,
  TAG_MAX: 25,
  PRIMARY_MESSAGE_MAX: 160,
  SECONDARY_MESSAGE_MAX: 90, // Set to 90 to comfortably accommodate the longest template (84 chars)
  COVER_TEXT_MAX: 60,
} as const;

export type CreationMode = "template" | "scratch";

export type CardStatus = "draft" | "published" | "archived";

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
  foilStyle: CoverStyle;
  coverText: string;
  bgPalette: BgPaletteId;
  sticker: StickerId;
  fontFamily?: string;
}

/**
 * Backend-oriented data model representing a persisted card record in the database.
 * Client editor state does not determine ID, slug, userId, or analytics.
 */
export interface CardRecord {
  id: string; // Server-generated UUID
  slug: string; // Unique public short identifier (e.g. suprilo.com/s/{slug})
  userId: string; // Authenticated owner user ID
  templateId: string | null;
  status: CardStatus;
  content: CardContentPayload;
  revealThreshold: number; // e.g. 0.65
  soundEnabled: boolean;
  viewsCount?: number;
  revealsCount?: number;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  publishedAt?: string | null;
}

/**
 * Deterministic mapping table linking each static template ID to its matching background palette.
 * Fixes the issue where template selection did not hydrate card background theme.
 */
export const TEMPLATE_PALETTE_MAP: Record<string, BgPaletteId> = {
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
  "custom-scratch": "pure-ivory",
};

