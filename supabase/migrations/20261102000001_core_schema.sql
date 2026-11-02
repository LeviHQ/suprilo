-- ============================================================================
-- Suprilo Phase 2C — Migration 1: Core Schema & Constraints
-- File: supabase/migrations/20261102000001_core_schema.sql
-- Description: Core entity tables, lifecycle constraints, template catalog validation,
--              deduplication cooldowns, and asynchronous cleanup queue.
-- ============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Table: public.slug_registry
-- Canonical registry of all active and permanently retired card slugs.
-- Prevents slug hijacking and enforces irreversible retirement on deletion.
-- ============================================================================
CREATE TABLE public.slug_registry (
  slug text PRIMARY KEY
    CONSTRAINT chk_slug_registry_format CHECK (slug ~ '^[2-9a-hj-km-np-z]{12}$'),
  card_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CONSTRAINT chk_slug_registry_status CHECK (status IN ('active', 'retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz NULL
);

CREATE INDEX idx_slug_registry_card_id ON public.slug_registry (card_id);

-- ============================================================================
-- 2. Table: public.cards
-- Core card entity tracking draft state, publication, visual design, and content.
-- Enforces CARD_LIMITS, template catalog validation, and draft-slot constraints.
-- ============================================================================
CREATE TABLE public.cards (
  -- Primary Identifiers & Ownership
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE
    CONSTRAINT chk_cards_slug_format CHECK (slug ~ '^[2-9a-hj-km-np-z]{12}$'),

  -- Lifecycle & Concurrency Draft Slot
  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT chk_cards_status CHECK (status IN ('draft', 'published', 'archived')),
  creation_mode text NOT NULL DEFAULT 'scratch'
    CONSTRAINT chk_cards_creation_mode CHECK (creation_mode IN ('template', 'scratch')),
  draft_slot integer NULL
    CONSTRAINT chk_cards_draft_slot CHECK (draft_slot BETWEEN 1 AND 3),

  -- Template Identifier (Strictly validated against approved 16-item catalog)
  template_id text NULL
    CONSTRAINT chk_cards_template_id CHECK (
      template_id IS NULL OR template_id IN (
        'bday-midnight-celebration',
        'bday-party-confetti',
        'bday-royal-vintage',
        'love-secret-dinner',
        'love-golden-forever',
        'love-cute-doodle',
        'friendship-partner-in-crime',
        'friendship-grateful-heart',
        'anniv-milestone-gold',
        'anniv-storybook-love',
        'thankyou-blooming-gratitude',
        'thankyou-mentor-honor',
        'congrats-new-job-sky',
        'congrats-baby-arrival',
        'just-because-midday-smile',
        'just-because-virtual-hug'
      )
    ),

  -- Card Content (Enforcing CARD_LIMITS)
  recipient_name text NOT NULL
    CONSTRAINT chk_cards_recipient_name CHECK (char_length(trim(recipient_name)) BETWEEN 1 AND 30),
  sender_name text NOT NULL
    CONSTRAINT chk_cards_sender_name CHECK (char_length(trim(sender_name)) BETWEEN 1 AND 30),
  occasion_tag text NOT NULL
    CONSTRAINT chk_cards_occasion_tag CHECK (char_length(trim(occasion_tag)) BETWEEN 1 AND 25),
  primary_message text NOT NULL
    CONSTRAINT chk_cards_primary_message CHECK (char_length(trim(primary_message)) BETWEEN 1 AND 160),
  secondary_message text NULL
    CONSTRAINT chk_cards_secondary_message CHECK (secondary_message IS NULL OR char_length(secondary_message) <= 90),

  -- Visual Design & Canvas Customization
  foil_style text NOT NULL DEFAULT 'lavender-pink'
    CONSTRAINT chk_cards_foil_style CHECK (foil_style IN ('lavender-pink', 'golden-foil', 'cosmic-purple', 'mint-fresh')),
  cover_text text NOT NULL DEFAULT 'Scratch to reveal your surprise ✨'
    CONSTRAINT chk_cards_cover_text CHECK (char_length(trim(cover_text)) BETWEEN 1 AND 60),
  bg_palette text NOT NULL DEFAULT 'pure-ivory'
    CONSTRAINT chk_cards_bg_palette CHECK (bg_palette IN ('soft-pink', 'warm-sunshine', 'royal-amethyst', 'mint-fresh', 'pure-ivory')),
  sticker text NOT NULL DEFAULT 'sparkles'
    CONSTRAINT chk_cards_sticker CHECK (sticker IN ('heart', 'sparkles', 'cake', 'flower', 'gift', 'confetti', 'trophy', 'star')),
  font_family text NULL
    CONSTRAINT chk_cards_font_family CHECK (font_family IS NULL OR char_length(font_family) <= 50),

  -- Private Storage Reference (Path structure: {user_id}/{card_id}/{filename})
  photo_path text NULL,

  -- Scratch Mechanics
  reveal_threshold numeric(3, 2) NOT NULL DEFAULT 0.65
    CONSTRAINT chk_cards_reveal_threshold CHECK (reveal_threshold >= 0.10 AND reveal_threshold <= 0.95),
  sound_enabled boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NULL,

  -- Cross-Field Lifecycle Consistency Constraints
  CONSTRAINT chk_cards_draft_slot_consistency CHECK (
    (status = 'draft' AND draft_slot IS NOT NULL) OR
    (status IN ('published', 'archived') AND draft_slot IS NULL)
  ),
  CONSTRAINT chk_cards_published_at_consistency CHECK (
    (status = 'draft' AND published_at IS NULL) OR
    (status IN ('published', 'archived') AND published_at IS NOT NULL)
  )
);

-- Partial Unique Index enforcing strict maximum of 3 concurrent drafts per user
CREATE UNIQUE INDEX uq_cards_user_draft_slot
  ON public.cards (user_id, draft_slot)
  WHERE status = 'draft';

-- Dashboard & Lookup Performance Indexes
CREATE INDEX idx_cards_user_status_created ON public.cards (user_id, status, created_at DESC);
CREATE INDEX idx_cards_published_slug ON public.cards (slug) WHERE status = 'published';

-- ============================================================================
-- 3. Table: public.card_metrics
-- Protected telemetry counters decoupled from card editing payloads.
-- ============================================================================
CREATE TABLE public.card_metrics (
  card_id uuid PRIMARY KEY REFERENCES public.cards(id) ON DELETE CASCADE,
  views_count integer NOT NULL DEFAULT 0
    CONSTRAINT chk_metrics_views_non_negative CHECK (views_count >= 0),
  reveals_count integer NOT NULL DEFAULT 0
    CONSTRAINT chk_metrics_reveals_non_negative CHECK (reveals_count >= 0),
  last_viewed_at timestamptz NULL,
  last_revealed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_card_metrics_updated_at ON public.card_metrics (updated_at);

-- ============================================================================
-- 4. Table: public.card_telemetry_cooldown
-- High-concurrency deduplication table preventing telemetry inflation.
-- Enforces 15-minute cooldown window per visitor per event type.
-- ============================================================================
CREATE TABLE public.card_telemetry_cooldown (
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CONSTRAINT chk_cooldown_event_type CHECK (event_type IN ('view', 'reveal')),
  visitor_hash text NOT NULL
    CONSTRAINT chk_cooldown_visitor_hash CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, event_type, visitor_hash)
);

CREATE INDEX idx_telemetry_cooldown_expiry ON public.card_telemetry_cooldown (expires_at);

-- ============================================================================
-- 5. Table: public.storage_cleanup_queue
-- Outbox queue ensuring asynchronous, retry-safe deletion of orphaned photo assets.
-- ============================================================================
CREATE TABLE public.storage_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'card-photos',
  object_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT chk_cleanup_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count integer NOT NULL DEFAULT 0
    CONSTRAINT chk_cleanup_retry_count CHECK (retry_count >= 0),
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz NULL,
  locked_by text NULL,
  last_error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_storage_cleanup_dispatch
  ON public.storage_cleanup_queue (status, next_retry_at, retry_count)
  WHERE status IN ('pending', 'processing');

