-- ============================================================================
-- Suprilo Phase 2C — Migration 5: Creator Badges & Gamification Architecture
-- File: supabase/migrations/20261102000005_badge_system.sql
-- Canonical Specification: SPEC-2C-5.6.1-FINAL, Version 3.0.0
-- Description: Core gamification tables, 50 badge catalog seed records,
--              telemetry receipts, fast scratch verification, share auditing,
--              atomic badge evaluation, and hardened security boundaries.
-- ============================================================================

-- ============================================================================
-- 1. Schema Extensions to Existing Table: public.cards
-- ============================================================================
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS draft_revisions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS publication_local_hour smallint NULL
    CHECK (publication_local_hour >= 0 AND publication_local_hour <= 23),
  ADD COLUMN IF NOT EXISTS publication_local_dow smallint NULL
    CHECK (publication_local_dow >= 0 AND publication_local_dow <= 6);

-- ============================================================================
-- 2. Table: public.badges (Catalogue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL
    CHECK (category IN ('getting-started', 'creator-journey', 'sharing-impact', 'milestones', 'creative-mastery')),
  rarity text NOT NULL
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points integer NOT NULL
    CHECK (points > 0),
  description text NOT NULL,
  artwork_path text NOT NULL,
  display_order smallint UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  retired_at timestamptz NULL
);

-- ============================================================================
-- 3. Table: public.user_badges (Earned Achievements Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE RESTRICT,
  points_awarded integer NOT NULL CHECK (points_awarded > 0),
  unlocked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  share_token text UNIQUE NOT NULL CHECK (share_token ~ '^[a-f0-9]{24}$'),
  CONSTRAINT uq_user_badges_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges (badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_share_token ON public.user_badges (share_token);

-- ============================================================================
-- 4. Table: public.user_gamification_stats (Creator State & Queue Tracker)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_level smallint NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
  timezone text NOT NULL DEFAULT 'UTC',
  badges_shared_count integer NOT NULL DEFAULT 0 CHECK (badges_shared_count >= 0),
  cards_shared_count integer NOT NULL DEFAULT 0 CHECK (cards_shared_count >= 0),
  studio_visited_at timestamptz NULL,
  pending_generation bigint NOT NULL DEFAULT 0,
  processed_generation bigint NOT NULL DEFAULT 0,
  needs_evaluation boolean NOT NULL DEFAULT false,
  last_evaluated_at timestamptz NULL,
  evaluation_errors_count smallint NOT NULL DEFAULT 0 CHECK (evaluation_errors_count >= 0),
  last_evaluation_error text NULL,
  show_profile_publicly boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_gamification_stats_evaluation
  ON public.user_gamification_stats (pending_generation, processed_generation, evaluation_errors_count);

-- ============================================================================
-- 5. Table: public.card_view_events (Ephemeral & Pseudonymous Receipts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.card_view_events (
  page_session_id uuid UNIQUE NOT NULL,
  view_receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  visitor_id_hash text NULL CHECK (visitor_id_hash IS NULL OR visitor_id_hash ~ '^[a-f0-9]{64}$'),
  is_untracked boolean NOT NULL DEFAULT false,
  viewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  consumed_at timestamptz NULL,
  CONSTRAINT chk_card_view_untracked
    CHECK ((NOT is_untracked AND visitor_id_hash IS NOT NULL) OR (is_untracked AND visitor_id_hash IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_card_view_events_card_id ON public.card_view_events (card_id);
CREATE INDEX IF NOT EXISTS idx_card_view_events_visitor_hash
  ON public.card_view_events (card_id, visitor_id_hash)
  WHERE is_untracked = false;
CREATE INDEX IF NOT EXISTS idx_card_view_events_viewed_at ON public.card_view_events (viewed_at);

-- ============================================================================
-- 6. Table: public.card_fast_scratch_events (Permanent Fast Scratch Evidence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.card_fast_scratch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  card_id uuid NULL REFERENCES public.cards(id) ON DELETE SET NULL,
  card_id_snapshot uuid NOT NULL,
  card_slug_snapshot text NOT NULL,
  view_receipt_id uuid UNIQUE NOT NULL,
  elapsed_ms integer NOT NULL CHECK (elapsed_ms >= 0 AND elapsed_ms <= 600000),
  revealed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_card_fast_scratch_creator ON public.card_fast_scratch_events (creator_user_id);
CREATE INDEX IF NOT EXISTS idx_card_fast_scratch_receipt ON public.card_fast_scratch_events (view_receipt_id);

-- ============================================================================
-- 7. Table: public.creator_share_events (Share Audit Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.creator_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('card', 'badge')),
  target_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('link_copied', 'native_share_opened', 'story_card_downloaded')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_creator_share_events_dedup
  ON public.creator_share_events (user_id, target_type, target_id, action_type, created_at DESC);

-- ============================================================================
-- 8. Seed: Canonical 50-Badge Catalog (17,875 Total XP, 40 Class A / 10 Class B)
-- ============================================================================
INSERT INTO public.badges (
  id, name, category, rarity, points, description, artwork_path, display_order
) VALUES
  -- Category 1: Getting Started (10 Badges, 750 XP)
  ('first-step', 'Welcome Creator', 'getting-started', 'common', 50, 'Mount Creator Studio Hub (/profile or /create).', '/images/badges/first-step.webp', 1),
  ('first-draft', 'First Draft', 'getting-started', 'common', 50, 'Customize any of 9 draft fields, or publish first card.', '/images/badges/first-draft.webp', 2),
  ('first-card', 'First Spark', 'getting-started', 'common', 100, 'Successfully publish first live scratch card.', '/images/badges/first-card.webp', 3),
  ('named-recipient', 'Name in Lights', 'getting-started', 'common', 75, 'Personalize card for named recipient (recipient_name <> ''Friend'').', '/images/badges/named-recipient.webp', 4),
  ('secret-note', 'Secret Message', 'getting-started', 'common', 75, 'Total reveal message length >= 50 characters.', '/images/badges/secret-note.webp', 5),
  ('custom-cover', 'Curtain Raiser', 'getting-started', 'common', 75, 'Select non-default cover foil (foil_style <> ''classic_gold'').', '/images/badges/custom-cover.webp', 6),
  ('music-lover', 'Sonic Touch', 'getting-started', 'common', 100, 'Enable interactive scratch audio on a published card.', '/images/badges/music-lover.webp', 7),
  ('photo-memory', 'Visual Surprise', 'getting-started', 'common', 100, 'Attach hidden photo memory (photo_path IS NOT NULL).', '/images/badges/photo-memory.webp', 8),
  ('first-archive', 'Curator in Training', 'getting-started', 'common', 75, 'Move at least 1 card to archived status.', '/images/badges/first-archive.webp', 9),
  ('palette-pioneer', 'Palette Pioneer', 'getting-started', 'common', 75, 'Select non-default palette (bg_palette <> ''warm_sunset'').', '/images/badges/palette-pioneer.webp', 10),

  -- Category 2: Creator Journey (12 Badges, 5,400 XP)
  ('trio-creator', 'Creative Habit', 'creator-journey', 'common', 150, 'Publish 3 distinct scratch cards.', '/images/badges/trio-creator.webp', 11),
  ('five-cards', 'High Five', 'creator-journey', 'rare', 200, 'Publish 5 distinct scratch cards.', '/images/badges/five-cards.webp', 12),
  ('ten-cards', 'Prolific Crafter', 'creator-journey', 'rare', 350, 'Publish 10 distinct scratch cards.', '/images/badges/ten-cards.webp', 13),
  ('twenty-five-cards', 'Card Studio Master', 'creator-journey', 'epic', 600, 'Publish 25 distinct scratch cards.', '/images/badges/twenty-five-cards.webp', 14),
  ('fifty-cards', 'Grand Creator', 'creator-journey', 'legendary', 1000, 'Publish 50 distinct scratch cards.', '/images/badges/fifty-cards.webp', 15),
  ('hundred-cards', 'Century Club', 'creator-journey', 'legendary', 2000, 'Publish 100 distinct scratch cards.', '/images/badges/hundred-cards.webp', 16),
  ('weekend-publish', 'Weekend Crafter', 'creator-journey', 'common', 100, 'Publish card on Saturday or Sunday (local DOW 0 or 6).', '/images/badges/weekend-publish.webp', 17),
  ('night-owl', 'Night Owl Crafter', 'creator-journey', 'common', 100, 'Publish between 10 PM and 4 AM (local hour >= 22 or < 4).', '/images/badges/night-owl.webp', 18),
  ('card-refinement', 'Meticulous Polish', 'creator-journey', 'common', 100, 'Refine a draft card >= 3 times (draft_revisions_count >= 3).', '/images/badges/card-refinement.webp', 19),
  ('multi-style', 'Diverse Canvas', 'creator-journey', 'rare', 200, 'Publish cards using >= 3 distinct foil cover styles.', '/images/badges/multi-style.webp', 20),
  ('five-recipients', 'Celebration Suite', 'creator-journey', 'rare', 250, 'Personalize cards for 5 uniquely named recipients.', '/images/badges/five-recipients.webp', 21),
  ('tidy-studio', 'Clean Workshop', 'creator-journey', 'common', 150, 'Move at least 3 cards to archived status.', '/images/badges/tidy-studio.webp', 22),

  -- Category 3: Sharing & Impact (10 Badges, 4,150 XP)
  ('first-view', 'First Glance', 'sharing-impact', 'common', 100, 'Reach >= 1 verified recipient view on any card.', '/images/badges/first-view.webp', 23),
  ('first-reveal', 'The Big Reveal', 'sharing-impact', 'common', 150, 'Reach >= 1 verified recipient reveal on any card.', '/images/badges/first-reveal.webp', 24),
  ('ten-views', 'Crowd Pleaser', 'sharing-impact', 'rare', 200, 'Reach aggregate 10 verified recipient views across cards.', '/images/badges/ten-views.webp', 25),
  ('fifty-views', 'Fifty Impressions', 'sharing-impact', 'rare', 350, 'Reach aggregate 50 verified recipient views across cards.', '/images/badges/fifty-views.webp', 26),
  ('hundred-views', 'Century Views', 'sharing-impact', 'epic', 500, 'Reach aggregate 100 verified recipient views across cards.', '/images/badges/hundred-views.webp', 27),
  ('five-hundred-views', 'Five Hundred Strong', 'sharing-impact', 'legendary', 1000, 'Reach aggregate 500 verified recipient views across cards.', '/images/badges/five-hundred-views.webp', 28),
  ('ten-reveals', 'Ten Joyous Moments', 'sharing-impact', 'rare', 250, 'Reach aggregate 10 verified recipient reveals across cards.', '/images/badges/ten-reveals.webp', 29),
  ('fifty-reveals', 'Fifty Big Reveals', 'sharing-impact', 'epic', 500, 'Reach aggregate 50 verified recipient reveals across cards.', '/images/badges/fifty-reveals.webp', 30),
  ('hundred-reveals', 'Master of Suspense', 'sharing-impact', 'legendary', 1000, 'Reach aggregate 100 verified recipient reveals across cards.', '/images/badges/hundred-reveals.webp', 31),
  ('viral-card', 'Viral Spark', 'sharing-impact', 'epic', 500, 'Achieve >= 25 views and >= 20 reveals on a single card.', '/images/badges/viral-card.webp', 32),

  -- Category 4: Milestones (10 Badges, 3,700 XP)
  ('seven-day-veteran', 'Seven-Day Veteran', 'milestones', 'common', 100, 'Account age >= 7 days and >= 1 published card.', '/images/badges/seven-day-veteran.webp', 33),
  ('month-veteran', 'Month One Milestone', 'milestones', 'rare', 250, 'Account age >= 30 days and >= 3 published cards.', '/images/badges/month-veteran.webp', 34),
  ('ninety-day-veteran', 'Quarter Century Day', 'milestones', 'epic', 500, 'Account age >= 90 days and >= 5 published cards.', '/images/badges/ninety-day-veteran.webp', 35),
  ('one-year-veteran', 'Suprilo Yearling', 'milestones', 'legendary', 1000, 'Account age >= 365 days and >= 1 published card.', '/images/badges/one-year-veteran.webp', 36),
  ('speedy-scratch', 'Fast Scratch', 'milestones', 'rare', 300, 'Verified reveal within <= 600,000 ms of view receipt.', '/images/badges/speedy-scratch.webp', 37),
  ('perfect-reveal-trio', 'Consistent Delight', 'milestones', 'rare', 250, 'Own 3 distinct cards that each have >= 1 verified reveal.', '/images/badges/perfect-reveal-trio.webp', 38),
  ('ten-card-reveals', 'Decade of Joy', 'milestones', 'epic', 500, 'Own 10 distinct cards that each have >= 1 verified reveal.', '/images/badges/ten-card-reveals.webp', 39),
  ('high-affinity', 'High Affinity', 'milestones', 'epic', 400, 'Unique visitor reveal ratio > 80% with >= 20 unique views.', '/images/badges/high-affinity.webp', 40),
  ('badge-shared', 'Social Ambassador', 'milestones', 'common', 100, 'Initiate verified share or export of an earned badge.', '/images/badges/badge-shared.webp', 41),
  ('card-shared', 'Card Ambassador', 'milestones', 'common', 100, 'Initiate verified share of card link from Studio Hub.', '/images/badges/card-shared.webp', 42),

  -- Category 5: Creative Mastery (8 Badges, 3,875 XP)
  ('sticker-fanatic', 'Sticker Stylist', 'creative-mastery', 'common', 150, 'Publish cards featuring >= 4 unique sticker motifs.', '/images/badges/sticker-fanatic.webp', 43),
  ('sensory-delight', 'Full Sensory Card', 'creative-mastery', 'rare', 350, 'Publish card combining photo, audio, and >= 50 char message.', '/images/badges/sensory-delight.webp', 44),
  ('epic-surprise', 'Epic Surprise', 'creative-mastery', 'rare', 250, 'Craft card with >= 140 primary and >= 70 secondary message chars.', '/images/badges/epic-surprise.webp', 45),
  ('photo-album-card', 'Memory Gallery', 'creative-mastery', 'rare', 300, 'Publish 3 distinct cards each featuring a hidden photo memory.', '/images/badges/photo-album-card.webp', 46),
  ('scratch-explorer', 'Palette Connoisseur', 'creative-mastery', 'rare', 300, 'Publish cards across all 5 interior background palettes.', '/images/badges/scratch-explorer.webp', 47),
  ('double-polish', 'Double Draft Polish', 'creative-mastery', 'rare', 250, 'Refine 2 different card drafts >= 3 times before publishing.', '/images/badges/double-polish.webp', 48),
  ('legendary-creator', 'Gold Standard', 'creative-mastery', 'epic', 750, 'Earn >= 2,500 XP from other achievements (pre-award rule).', '/images/badges/legendary-creator.webp', 49),
  ('suprilo-hall-of-fame', 'Suprilo Legend', 'creative-mastery', 'legendary', 1500, 'Earn >= 40 other distinct achievements (pre-award rule).', '/images/badges/suprilo-hall-of-fame.webp', 50)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  points = EXCLUDED.points,
  description = EXCLUDED.description,
  artwork_path = EXCLUDED.artwork_path,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 9. Trigger Functions & Lifecycle Automation
-- ============================================================================

-- 9a. Draft Revision Tracking Trigger Function
CREATE OR REPLACE FUNCTION public.track_card_draft_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'draft' THEN
    IF (OLD.recipient_name IS DISTINCT FROM NEW.recipient_name)
       OR (OLD.sender_name IS DISTINCT FROM NEW.sender_name)
       OR (OLD.occasion_tag IS DISTINCT FROM NEW.occasion_tag)
       OR (OLD.primary_message IS DISTINCT FROM NEW.primary_message)
       OR (OLD.secondary_message IS DISTINCT FROM NEW.secondary_message)
       OR (OLD.foil_style IS DISTINCT FROM NEW.foil_style)
       OR (OLD.cover_text IS DISTINCT FROM NEW.cover_text)
       OR (OLD.bg_palette IS DISTINCT FROM NEW.bg_palette)
       OR (OLD.sticker IS DISTINCT FROM NEW.sticker)
       OR (OLD.font_family IS DISTINCT FROM NEW.font_family)
       OR (OLD.photo_path IS DISTINCT FROM NEW.photo_path)
       OR (OLD.reveal_threshold IS DISTINCT FROM NEW.reveal_threshold)
       OR (OLD.sound_enabled IS DISTINCT FROM NEW.sound_enabled) THEN
      NEW.draft_revisions_count := OLD.draft_revisions_count + 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_draft_revision ON public.cards;
CREATE TRIGGER trg_track_draft_revision
  BEFORE UPDATE
  ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.track_card_draft_revision();

-- 9b. Publication Local Hour and Day-of-Week Snapshot Function
CREATE OR REPLACE FUNCTION public.snapshot_card_publication_local_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_tz text := 'UTC';
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status <> 'published') THEN
    SELECT timezone INTO v_tz
    FROM public.user_gamification_stats
    WHERE user_id = NEW.user_id;

    v_tz := COALESCE(NULLIF(TRIM(v_tz), ''), 'UTC');

    NEW.publication_local_hour := EXTRACT(HOUR FROM (COALESCE(NEW.published_at, clock_timestamp()) AT TIME ZONE v_tz))::smallint;
    NEW.publication_local_dow := EXTRACT(DOW FROM (COALESCE(NEW.published_at, clock_timestamp()) AT TIME ZONE v_tz))::smallint;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_publication_local_time ON public.cards;
CREATE TRIGGER trg_snapshot_publication_local_time
  BEFORE INSERT OR UPDATE OF status, published_at
  ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_card_publication_local_time();

-- ============================================================================
-- 10. Core Stored Procedures & Gamification Functions
-- ============================================================================

-- 10a. Monotonic Level Derivation Function
CREATE OR REPLACE FUNCTION public.derive_level_from_xp(p_xp integer)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_xp >= 17000 THEN RETURN 10;
  ELSIF p_xp >= 13500 THEN RETURN 9;
  ELSIF p_xp >= 10000 THEN RETURN 8;
  ELSIF p_xp >= 7000 THEN RETURN 7;
  ELSIF p_xp >= 4500 THEN RETURN 6;
  ELSIF p_xp >= 2750 THEN RETURN 5;
  ELSIF p_xp >= 1500 THEN RETURN 4;
  ELSIF p_xp >= 750 THEN RETURN 3;
  ELSIF p_xp >= 250 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;

-- 10b. Internal Atomic Award Helper
CREATE OR REPLACE FUNCTION public.award_badge_internal(
  p_user_id uuid,
  p_badge_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_points integer;
  v_token text;
  v_inserted boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN false;
  END IF;

  SELECT points INTO v_points
  FROM public.badges
  WHERE id = p_badge_id AND is_active = true;

  IF v_points IS NULL THEN
    RETURN false;
  END IF;

  v_token := encode(gen_random_bytes(12), 'hex');

  INSERT INTO public.user_badges (user_id, badge_id, points_awarded, unlocked_at, share_token)
  VALUES (p_user_id, p_badge_id, v_points, clock_timestamp(), v_token)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING true INTO v_inserted;

  RETURN COALESCE(v_inserted, false);
END;
$$;

-- 10c. Base Badges Evaluation Engine (Badges 1 - 48)
CREATE OR REPLACE FUNCTION public.evaluate_base_badges_internal(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_stats RECORD;
  v_user_created_at timestamptz;
  v_published_count integer := 0;
  v_archived_count integer := 0;
  v_total_cards_count integer := 0;
  v_total_views bigint := 0;
  v_total_reveals bigint := 0;
  v_awarded_count integer := 0;

  v_unique_views_ha bigint := 0;
  v_unique_reveals_ha bigint := 0;
BEGIN
  SELECT * INTO v_stats
  FROM public.user_gamification_stats
  WHERE user_id = p_user_id;

  SELECT created_at INTO v_user_created_at
  FROM auth.users
  WHERE id = p_user_id;

  SELECT
    COUNT(*) FILTER (WHERE status = 'published'),
    COUNT(*) FILTER (WHERE status = 'archived'),
    COUNT(*) FILTER (WHERE status IN ('published', 'archived'))
  INTO v_published_count, v_archived_count, v_total_cards_count
  FROM public.cards
  WHERE user_id = p_user_id;

  SELECT
    COALESCE(SUM(cm.views_count), 0),
    COALESCE(SUM(cm.reveals_count), 0)
  INTO v_total_views, v_total_reveals
  FROM public.cards c
  JOIN public.card_metrics cm ON cm.card_id = c.id
  WHERE c.user_id = p_user_id AND c.status IN ('published', 'archived');

  -- Badge 1: first-step
  IF v_stats.studio_visited_at IS NOT NULL THEN
    IF public.award_badge_internal(p_user_id, 'first-step') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 2: first-draft
  IF v_total_cards_count >= 1 OR EXISTS (
    SELECT 1 FROM public.cards
    WHERE user_id = p_user_id
      AND status = 'draft'
      AND (
        recipient_name <> 'Friend' OR sender_name <> 'Someone Special' OR
        primary_message <> 'A special surprise for you!' OR secondary_message IS NOT NULL OR
        foil_style <> 'classic_gold' OR bg_palette <> 'warm_sunset' OR
        sticker <> 'sparkles' OR photo_path IS NOT NULL OR sound_enabled = true OR
        draft_revisions_count >= 1
      )
  ) THEN
    IF public.award_badge_internal(p_user_id, 'first-draft') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 3: first-card
  IF v_total_cards_count >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'first-card') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 4: named-recipient
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND recipient_name <> 'Friend') THEN
    IF public.award_badge_internal(p_user_id, 'named-recipient') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 5: secret-note
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND length(coalesce(primary_message, '') || coalesce(secondary_message, '')) >= 50) THEN
    IF public.award_badge_internal(p_user_id, 'secret-note') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 6: custom-cover
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND foil_style <> 'classic_gold') THEN
    IF public.award_badge_internal(p_user_id, 'custom-cover') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 7: music-lover
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND sound_enabled = true) THEN
    IF public.award_badge_internal(p_user_id, 'music-lover') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 8: photo-memory
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND photo_path IS NOT NULL) THEN
    IF public.award_badge_internal(p_user_id, 'photo-memory') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 9: first-archive
  IF v_archived_count >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'first-archive') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 10: palette-pioneer
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND bg_palette <> 'warm_sunset') THEN
    IF public.award_badge_internal(p_user_id, 'palette-pioneer') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 11-16: Card Volume
  IF v_total_cards_count >= 3 THEN
    IF public.award_badge_internal(p_user_id, 'trio-creator') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_cards_count >= 5 THEN
    IF public.award_badge_internal(p_user_id, 'five-cards') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_cards_count >= 10 THEN
    IF public.award_badge_internal(p_user_id, 'ten-cards') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_cards_count >= 25 THEN
    IF public.award_badge_internal(p_user_id, 'twenty-five-cards') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_cards_count >= 50 THEN
    IF public.award_badge_internal(p_user_id, 'fifty-cards') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_cards_count >= 100 THEN
    IF public.award_badge_internal(p_user_id, 'hundred-cards') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 17: weekend-publish
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND publication_local_dow IN (0, 6)) THEN
    IF public.award_badge_internal(p_user_id, 'weekend-publish') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 18: night-owl
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND (publication_local_hour >= 22 OR publication_local_hour < 4)) THEN
    IF public.award_badge_internal(p_user_id, 'night-owl') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 19: card-refinement
  IF EXISTS (SELECT 1 FROM public.cards WHERE user_id = p_user_id AND draft_revisions_count >= 3) THEN
    IF public.award_badge_internal(p_user_id, 'card-refinement') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 20: multi-style
  IF (SELECT count(DISTINCT foil_style) FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived')) >= 3 THEN
    IF public.award_badge_internal(p_user_id, 'multi-style') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 21: five-recipients
  IF (SELECT count(DISTINCT recipient_name) FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived') AND recipient_name <> 'Friend') >= 5 THEN
    IF public.award_badge_internal(p_user_id, 'five-recipients') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 22: tidy-studio
  IF v_archived_count >= 3 THEN
    IF public.award_badge_internal(p_user_id, 'tidy-studio') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 23-28: Views Milestone
  IF v_total_views >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'first-view') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_views >= 10 THEN
    IF public.award_badge_internal(p_user_id, 'ten-views') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_views >= 50 THEN
    IF public.award_badge_internal(p_user_id, 'fifty-views') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_views >= 100 THEN
    IF public.award_badge_internal(p_user_id, 'hundred-views') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_views >= 500 THEN
    IF public.award_badge_internal(p_user_id, 'five-hundred-views') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 24, 29-31: Reveals Milestone
  IF v_total_reveals >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'first-reveal') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_reveals >= 10 THEN
    IF public.award_badge_internal(p_user_id, 'ten-reveals') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_reveals >= 50 THEN
    IF public.award_badge_internal(p_user_id, 'fifty-reveals') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_total_reveals >= 100 THEN
    IF public.award_badge_internal(p_user_id, 'hundred-reveals') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 32: viral-card
  IF EXISTS (
    SELECT 1 FROM public.cards c
    JOIN public.card_metrics cm ON cm.card_id = c.id
    WHERE c.user_id = p_user_id AND c.status IN ('published', 'archived') AND cm.views_count >= 25 AND cm.reveals_count >= 20
  ) THEN
    IF public.award_badge_internal(p_user_id, 'viral-card') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 33-36: Account Age
  IF v_user_created_at <= clock_timestamp() - interval '7 days' AND v_total_cards_count >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'seven-day-veteran') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_user_created_at <= clock_timestamp() - interval '30 days' AND v_total_cards_count >= 3 THEN
    IF public.award_badge_internal(p_user_id, 'month-veteran') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_user_created_at <= clock_timestamp() - interval '90 days' AND v_total_cards_count >= 5 THEN
    IF public.award_badge_internal(p_user_id, 'ninety-day-veteran') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;
  IF v_user_created_at <= clock_timestamp() - interval '365 days' AND v_total_cards_count >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'one-year-veteran') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 37: speedy-scratch
  IF EXISTS (SELECT 1 FROM public.card_fast_scratch_events WHERE creator_user_id = p_user_id AND elapsed_ms <= 600000) THEN
    IF public.award_badge_internal(p_user_id, 'speedy-scratch') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 38: perfect-reveal-trio
  IF (
    SELECT count(*) FROM public.cards c
    JOIN public.card_metrics cm ON cm.card_id = c.id
    WHERE c.user_id = p_user_id AND c.status IN ('published', 'archived') AND cm.reveals_count >= 1
  ) >= 3 THEN
    IF public.award_badge_internal(p_user_id, 'perfect-reveal-trio') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 39: ten-card-reveals
  IF (
    SELECT count(*) FROM public.cards c
    JOIN public.card_metrics cm ON cm.card_id = c.id
    WHERE c.user_id = p_user_id AND c.status IN ('published', 'archived') AND cm.reveals_count >= 1
  ) >= 10 THEN
    IF public.award_badge_internal(p_user_id, 'ten-card-reveals') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 40: high-affinity
  SELECT
    COUNT(DISTINCT (c.id, cve.visitor_id_hash)) FILTER (WHERE cve.is_untracked = false AND cve.viewed_at >= clock_timestamp() - interval '90 days'),
    COUNT(DISTINCT (c.id, cve.visitor_id_hash)) FILTER (WHERE cve.is_untracked = false AND cve.consumed_at IS NOT NULL AND cve.viewed_at >= clock_timestamp() - interval '90 days')
  INTO v_unique_views_ha, v_unique_reveals_ha
  FROM public.cards c
  JOIN public.card_view_events cve ON cve.card_id = c.id
  WHERE c.user_id = p_user_id AND c.status IN ('published', 'archived');

  IF v_unique_views_ha >= 20 AND ((v_unique_reveals_ha::numeric / v_unique_views_ha::numeric) > 0.80) THEN
    IF public.award_badge_internal(p_user_id, 'high-affinity') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 41: badge-shared
  IF v_stats.badges_shared_count >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'badge-shared') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 42: card-shared
  IF v_stats.cards_shared_count >= 1 THEN
    IF public.award_badge_internal(p_user_id, 'card-shared') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 43: sticker-fanatic
  IF (SELECT count(DISTINCT sticker) FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived')) >= 4 THEN
    IF public.award_badge_internal(p_user_id, 'sticker-fanatic') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 44: sensory-delight
  IF EXISTS (
    SELECT 1 FROM public.cards
    WHERE user_id = p_user_id
      AND status IN ('published', 'archived')
      AND photo_path IS NOT NULL
      AND sound_enabled = true
      AND length(coalesce(primary_message, '') || coalesce(secondary_message, '')) >= 50
  ) THEN
    IF public.award_badge_internal(p_user_id, 'sensory-delight') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 45: epic-surprise
  IF EXISTS (
    SELECT 1 FROM public.cards
    WHERE user_id = p_user_id
      AND status IN ('published', 'archived')
      AND length(coalesce(primary_message, '')) >= 140
      AND length(coalesce(secondary_message, '')) >= 70
  ) THEN
    IF public.award_badge_internal(p_user_id, 'epic-surprise') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 46: photo-album-card
  IF (
    SELECT count(*) FROM public.cards
    WHERE user_id = p_user_id AND status IN ('published', 'archived') AND photo_path IS NOT NULL
  ) >= 3 THEN
    IF public.award_badge_internal(p_user_id, 'photo-album-card') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 47: scratch-explorer
  IF (SELECT count(DISTINCT bg_palette) FROM public.cards WHERE user_id = p_user_id AND status IN ('published', 'archived')) >= 5 THEN
    IF public.award_badge_internal(p_user_id, 'scratch-explorer') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  -- Badge 48: double-polish
  IF (SELECT count(*) FROM public.cards WHERE user_id = p_user_id AND draft_revisions_count >= 3) >= 2 THEN
    IF public.award_badge_internal(p_user_id, 'double-polish') THEN v_awarded_count := v_awarded_count + 1; END IF;
  END IF;

  RETURN v_awarded_count;
END;
$$;

-- 10d. Composite Badges Pre-Award Evaluation Engine (Badges 49 - 50)
CREATE OR REPLACE FUNCTION public.evaluate_composite_badges_internal(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_other_xp integer := 0;
  v_other_badges_count integer := 0;
  v_awarded_count integer := 0;
BEGIN
  -- Badge 49: legendary-creator (pre-award rule: >= 2,500 XP from OTHER achievements)
  SELECT COALESCE(SUM(points_awarded), 0) INTO v_other_xp
  FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id <> 'legendary-creator';

  IF v_other_xp >= 2500 THEN
    IF public.award_badge_internal(p_user_id, 'legendary-creator') THEN
      v_awarded_count := v_awarded_count + 1;
    END IF;
  END IF;

  -- Badge 50: suprilo-hall-of-fame (pre-award rule: >= 40 OTHER distinct achievements)
  SELECT COUNT(DISTINCT badge_id) INTO v_other_badges_count
  FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id <> 'suprilo-hall-of-fame';

  IF v_other_badges_count >= 40 THEN
    IF public.award_badge_internal(p_user_id, 'suprilo-hall-of-fame') THEN
      v_awarded_count := v_awarded_count + 1;
    END IF;
  END IF;

  RETURN v_awarded_count;
END;
$$;

-- 10e. Synchronous User Achievements Evaluation RPC
CREATE OR REPLACE FUNCTION public.evaluate_user_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_new_base integer := 0;
  v_new_composite integer := 0;
  v_total_xp integer := 0;
  v_level smallint := 1;
BEGIN
  -- Authenticated caller must own account, or call must come from service_role
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACHIEVEMENT_EVALUATION';
  END IF;

  -- Initialize gamification stats record if missing
  INSERT INTO public.user_gamification_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Pass 1: Base achievements (1 - 48)
  v_new_base := public.evaluate_base_badges_internal(p_user_id);

  -- Pass 2: Composite achievements (49 - 50)
  v_new_composite := public.evaluate_composite_badges_internal(p_user_id);

  -- Pass 3: Recompute total XP and current level
  SELECT COALESCE(SUM(points_awarded), 0) INTO v_total_xp
  FROM public.user_badges
  WHERE user_id = p_user_id;

  v_level := public.derive_level_from_xp(v_total_xp);

  UPDATE public.user_gamification_stats
  SET total_xp = v_total_xp,
      current_level = v_level,
      processed_generation = pending_generation,
      needs_evaluation = false,
      last_evaluated_at = clock_timestamp(),
      evaluation_errors_count = 0,
      last_evaluation_error = NULL
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'new_badges_awarded', v_new_base + v_new_composite,
    'total_xp', v_total_xp,
    'current_level', v_level
  );
END;
$$;

-- 10f. Batch Evaluation Worker (FOR UPDATE SKIP LOCKED with subtransaction savepoints)
CREATE OR REPLACE FUNCTION public.process_gamification_evaluations_batch(p_batch_size integer DEFAULT 50)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  r RECORD;
  v_claimed_gen bigint;
  v_processed_count integer := 0;
  v_xp integer;
BEGIN
  FOR r IN
    SELECT user_id, pending_generation
    FROM public.user_gamification_stats
    WHERE pending_generation > processed_generation
      AND evaluation_errors_count < 5
    ORDER BY last_evaluated_at ASC NULLS FIRST
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      v_claimed_gen := r.pending_generation;

      PERFORM public.evaluate_base_badges_internal(r.user_id);
      PERFORM public.evaluate_composite_badges_internal(r.user_id);

      SELECT COALESCE(SUM(points_awarded), 0) INTO v_xp
      FROM public.user_badges
      WHERE user_id = r.user_id;

      UPDATE public.user_gamification_stats
      SET total_xp = v_xp,
          current_level = public.derive_level_from_xp(v_xp),
          processed_generation = v_claimed_gen,
          needs_evaluation = (pending_generation > v_claimed_gen),
          last_evaluated_at = clock_timestamp(),
          evaluation_errors_count = 0,
          last_evaluation_error = NULL
      WHERE user_id = r.user_id;

      v_processed_count := v_processed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.user_gamification_stats
      SET evaluation_errors_count = evaluation_errors_count + 1,
          last_evaluation_error = SQLERRM,
          last_evaluated_at = clock_timestamp()
      WHERE user_id = r.user_id;
    END;
  END LOOP;

  RETURN v_processed_count;
END;
$$;

-- 10g. Telemetry Handshake Procedure (Server-Only)
CREATE OR REPLACE FUNCTION public.record_card_view_handshake(
  p_card_id uuid,
  p_page_session_id uuid,
  p_visitor_id_hash text,
  p_is_untracked boolean,
  p_previous_visitor_id_hash text DEFAULT NULL
)
RETURNS TABLE (
  view_receipt_id uuid,
  is_untracked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_receipt_id uuid;
  v_is_untracked boolean;
BEGIN
  -- 1. Validate identity parameter states
  IF (p_is_untracked AND p_visitor_id_hash IS NOT NULL)
     OR (NOT p_is_untracked AND p_visitor_id_hash IS NULL) THEN
    RAISE EXCEPTION 'INVALID_TELEMETRY_IDENTITY_STATE';
  END IF;

  IF NOT p_is_untracked AND NOT (p_visitor_id_hash ~ '^[a-f0-9]{64}$') THEN
    RAISE EXCEPTION 'INVALID_VISITOR_HASH_FORMAT';
  END IF;

  IF p_previous_visitor_id_hash IS NOT NULL THEN
    IF p_is_untracked OR NOT (p_previous_visitor_id_hash ~ '^[a-f0-9]{64}$') THEN
      RAISE EXCEPTION 'INVALID_PREVIOUS_VISITOR_HASH_FORMAT';
    END IF;
  END IF;

  -- 2. Validate card is active and published
  IF NOT EXISTS (SELECT 1 FROM public.cards WHERE id = p_card_id AND status = 'published') THEN
    RAISE EXCEPTION 'CARD_NOT_PUBLISHED';
  END IF;

  -- 3. Historical Identity Reconciliation Across HMAC Rotations
  -- Re-keys older records for this exact visitor from previous hash to current hash
  IF p_previous_visitor_id_hash IS NOT NULL
     AND NOT p_is_untracked
     AND p_previous_visitor_id_hash <> p_visitor_id_hash THEN
    UPDATE public.card_view_events
    SET visitor_id_hash = p_visitor_id_hash
    WHERE visitor_id_hash = p_previous_visitor_id_hash;
  END IF;

  -- 4. Atomic claim or get existing receipt
  INSERT INTO public.card_view_events (
    page_session_id,
    card_id,
    visitor_id_hash,
    is_untracked,
    viewed_at
  )
  VALUES (
    p_page_session_id,
    p_card_id,
    p_visitor_id_hash,
    p_is_untracked,
    clock_timestamp()
  )
  ON CONFLICT (page_session_id) DO NOTHING
  RETURNING public.card_view_events.view_receipt_id, public.card_view_events.is_untracked
  INTO v_receipt_id, v_is_untracked;

  IF v_receipt_id IS NOT NULL THEN
    UPDATE public.card_metrics
    SET views_count = views_count + 1,
        last_viewed_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE card_id = p_card_id;
  ELSE
    SELECT cve.view_receipt_id, cve.is_untracked
    INTO v_receipt_id, v_is_untracked
    FROM public.card_view_events cve
    WHERE cve.page_session_id = p_page_session_id;
  END IF;

  RETURN QUERY SELECT v_receipt_id, v_is_untracked;
END;
$$;

-- 10h. Reveal Verification & Fast Scratch Recording (Server-Only)
CREATE OR REPLACE FUNCTION public.record_card_reveal(
  p_card_id uuid,
  p_view_receipt_id uuid,
  p_visitor_id_hash text,
  p_previous_visitor_id_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_receipt RECORD;
  v_card RECORD;
  v_elapsed_ms integer;
  v_is_fast boolean := false;
BEGIN
  SELECT * INTO v_receipt
  FROM public.card_view_events
  WHERE view_receipt_id = p_view_receipt_id;

  IF v_receipt IS NULL THEN
    RAISE EXCEPTION 'RECEIPT_NOT_FOUND';
  END IF;

  IF v_receipt.card_id <> p_card_id THEN
    RAISE EXCEPTION 'RECEIPT_CARD_MISMATCH';
  END IF;

  -- NULL-Safe visitor identity verification across key rotation
  IF v_receipt.is_untracked THEN
    IF p_visitor_id_hash IS NOT NULL OR p_previous_visitor_id_hash IS NOT NULL THEN
      RAISE EXCEPTION 'RECEIPT_IDENTITY_MISMATCH';
    END IF;
  ELSE
    IF p_visitor_id_hash IS NULL THEN
      RAISE EXCEPTION 'UNAUTHORIZED_RECEIPT_HOLDER';
    END IF;

    -- Receipt hash must match either current hash or previous hash
    IF v_receipt.visitor_id_hash IS DISTINCT FROM p_visitor_id_hash
       AND (p_previous_visitor_id_hash IS NULL OR v_receipt.visitor_id_hash IS DISTINCT FROM p_previous_visitor_id_hash) THEN
      RAISE EXCEPTION 'UNAUTHORIZED_RECEIPT_HOLDER';
    END IF;
  END IF;

  IF v_receipt.consumed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_consumed',
      'fast_scratch', false,
      'elapsed_ms', NULL
    );
  END IF;

  v_elapsed_ms := round(EXTRACT(EPOCH FROM (clock_timestamp() - v_receipt.viewed_at)) * 1000)::integer;
  IF v_elapsed_ms < 0 THEN
    v_elapsed_ms := 0;
  END IF;

  SELECT id, slug, user_id INTO v_card
  FROM public.cards
  WHERE id = p_card_id;

  IF v_elapsed_ms <= 600000 THEN
    v_is_fast := true;
    INSERT INTO public.card_fast_scratch_events (
      creator_user_id,
      card_id,
      card_id_snapshot,
      card_slug_snapshot,
      view_receipt_id,
      elapsed_ms,
      revealed_at
    )
    VALUES (
      v_card.user_id,
      v_card.id,
      v_card.id,
      v_card.slug,
      p_view_receipt_id,
      v_elapsed_ms,
      clock_timestamp()
    );
  END IF;

  -- Stamp receipt consumption and unify visitor hash to current active key if needed
  UPDATE public.card_view_events
  SET consumed_at = clock_timestamp(),
      visitor_id_hash = CASE
        WHEN NOT v_receipt.is_untracked AND p_visitor_id_hash IS NOT NULL THEN p_visitor_id_hash
        ELSE v_receipt.visitor_id_hash
      END
  WHERE view_receipt_id = p_view_receipt_id;

  UPDATE public.card_metrics
  SET reveals_count = reveals_count + 1,
      last_revealed_at = clock_timestamp(),
      updated_at = clock_timestamp()
  WHERE card_id = p_card_id;

  IF v_card.user_id IS NOT NULL THEN
    INSERT INTO public.user_gamification_stats (user_id, pending_generation, needs_evaluation)
    VALUES (v_card.user_id, 1, true)
    ON CONFLICT (user_id)
    DO UPDATE SET pending_generation = public.user_gamification_stats.pending_generation + 1,
                  needs_evaluation = true;
  END IF;

  RETURN jsonb_build_object(
    'status', 'verified',
    'fast_scratch', v_is_fast,
    'elapsed_ms', v_elapsed_ms
  );
END;
$$;

-- 10i. Creator Share Event Recording RPC
CREATE OR REPLACE FUNCTION public.record_creator_share_event(
  p_target_type text,
  p_target_id text,
  p_action_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_lock_key bigint;
  v_recent_exists boolean := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED';
  END IF;

  IF p_target_type NOT IN ('card', 'badge') THEN
    RAISE EXCEPTION 'INVALID_TARGET_TYPE';
  END IF;

  IF p_target_type = 'card' THEN
    IF p_action_type NOT IN ('link_copied', 'native_share_opened') THEN
      RAISE EXCEPTION 'INVALID_TARGET_ACTION_COMBINATION';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.cards WHERE id::text = p_target_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'TARGET_NOT_OWNED';
    END IF;
  ELSIF p_target_type = 'badge' THEN
    IF p_action_type NOT IN ('link_copied', 'native_share_opened', 'story_card_downloaded') THEN
      RAISE EXCEPTION 'INVALID_TARGET_ACTION_COMBINATION';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE badge_id = p_target_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'TARGET_NOT_UNLOCKED';
    END IF;
  END IF;

  v_lock_key := hashtext(v_user_id::text || ':' || p_target_type || ':' || p_target_id || ':' || p_action_type);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT EXISTS (
    SELECT 1 FROM public.creator_share_events
    WHERE user_id = v_user_id
      AND target_type = p_target_type
      AND target_id = p_target_id
      AND action_type = p_action_type
      AND created_at > clock_timestamp() - interval '5 minutes'
  ) INTO v_recent_exists;

  IF v_recent_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'deduplicated', true
    );
  END IF;

  INSERT INTO public.creator_share_events (user_id, target_type, target_id, action_type, created_at)
  VALUES (v_user_id, p_target_type, p_target_id, p_action_type, clock_timestamp());

  INSERT INTO public.user_gamification_stats (
    user_id,
    cards_shared_count,
    badges_shared_count,
    pending_generation,
    needs_evaluation
  )
  VALUES (
    v_user_id,
    CASE WHEN p_target_type = 'card' THEN 1 ELSE 0 END,
    CASE WHEN p_target_type = 'badge' THEN 1 ELSE 0 END,
    1,
    true
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    cards_shared_count = public.user_gamification_stats.cards_shared_count + CASE WHEN p_target_type = 'card' THEN 1 ELSE 0 END,
    badges_shared_count = public.user_gamification_stats.badges_shared_count + CASE WHEN p_target_type = 'badge' THEN 1 ELSE 0 END,
    pending_generation = public.user_gamification_stats.pending_generation + 1,
    needs_evaluation = true;

  PERFORM public.evaluate_user_achievements(v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'deduplicated', false
  );
END;
$$;

-- 10j. Public Badge Verification RPC
CREATE OR REPLACE FUNCTION public.get_public_badge_by_token(p_share_token text)
RETURNS TABLE (
  badge_id text,
  badge_name text,
  category text,
  rarity text,
  points_awarded integer,
  description text,
  artwork_path text,
  unlocked_at timestamptz,
  creator_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_share_token IS NULL OR NOT (p_share_token ~ '^[a-f0-9]{24}$') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.id AS badge_id,
    b.name AS badge_name,
    b.category,
    b.rarity,
    ub.points_awarded,
    b.description,
    b.artwork_path,
    ub.unlocked_at,
    CASE
      WHEN ugs.show_profile_publicly = true THEN
        COALESCE(
          (u.raw_user_meta_data->>'full_name'),
          (u.raw_user_meta_data->>'name'),
          'A Suprilo Creator'
        )
      ELSE 'A Suprilo Creator'
    END AS creator_display_name
  FROM public.user_badges ub
  JOIN public.badges b ON b.id = ub.badge_id
  LEFT JOIN public.user_gamification_stats ugs ON ugs.user_id = ub.user_id
  LEFT JOIN auth.users u ON u.id = ub.user_id
  WHERE ub.share_token = p_share_token;
END;
$$;

-- 10k. Studio Hub Badges Summary RPC
CREATE OR REPLACE FUNCTION public.get_user_badges_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_stats RECORD;
  v_unlocked_count integer := 0;
  v_total_badges integer := 50;
  v_recent_badges jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED_SUMMARY_REQUEST';
  END IF;

  SELECT * INTO v_stats
  FROM public.user_gamification_stats
  WHERE user_id = p_user_id;

  SELECT count(*)::integer INTO v_unlocked_count
  FROM public.user_badges
  WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_recent_badges
  FROM (
    SELECT ub.badge_id, b.name, b.category, b.rarity, ub.points_awarded, ub.unlocked_at, ub.share_token, b.artwork_path
    FROM public.user_badges ub
    JOIN public.badges b ON b.id = ub.badge_id
    WHERE ub.user_id = p_user_id
    ORDER BY ub.unlocked_at DESC
    LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'total_xp', COALESCE(v_stats.total_xp, 0),
    'current_level', COALESCE(v_stats.current_level, 1),
    'unlocked_count', v_unlocked_count,
    'total_badges', v_total_badges,
    'badges_shared_count', COALESCE(v_stats.badges_shared_count, 0),
    'cards_shared_count', COALESCE(v_stats.cards_shared_count, 0),
    'recent_badges', v_recent_badges
  );
END;
$$;

-- 10l. Telemetry Pruning Helper (90-Day Retention)
CREATE OR REPLACE FUNCTION public.prune_expired_telemetry()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  DELETE FROM public.card_view_events
  WHERE viewed_at < clock_timestamp() - interval '90 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- 11. Row Level Security & Explicit Access Control
-- ============================================================================

-- Enable RLS on all 6 tables
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_fast_scratch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_share_events ENABLE ROW LEVEL SECURITY;

-- Revoke default public privileges
REVOKE ALL ON TABLE public.badges FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.user_badges FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.user_gamification_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.card_view_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.card_fast_scratch_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.creator_share_events FROM PUBLIC, anon, authenticated;

-- Policies & Grants: public.badges
GRANT SELECT ON TABLE public.badges TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.badges TO service_role;
CREATE POLICY "badges_read_all"
  ON public.badges FOR SELECT
  USING (true);

-- Policies & Grants: public.user_badges
GRANT SELECT ON TABLE public.user_badges TO authenticated, service_role;
GRANT ALL ON TABLE public.user_badges TO service_role;
CREATE POLICY "user_badges_owner_select"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies & Grants: public.user_gamification_stats
GRANT SELECT ON TABLE public.user_gamification_stats TO authenticated, service_role;
GRANT ALL ON TABLE public.user_gamification_stats TO service_role;
CREATE POLICY "user_gamification_stats_owner_select"
  ON public.user_gamification_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies & Grants: public.card_view_events (Server Ingestion Only)
GRANT ALL ON TABLE public.card_view_events TO service_role;

-- Policies & Grants: public.card_fast_scratch_events (Server Ingestion Only)
GRANT ALL ON TABLE public.card_fast_scratch_events TO service_role;

-- Policies & Grants: public.creator_share_events
GRANT SELECT ON TABLE public.creator_share_events TO authenticated, service_role;
GRANT ALL ON TABLE public.creator_share_events TO service_role;
CREATE POLICY "creator_share_events_owner_select"
  ON public.creator_share_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Stored Procedure Execution Grants
REVOKE ALL ON FUNCTION public.derive_level_from_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.derive_level_from_xp(integer) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.award_badge_internal(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge_internal(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.evaluate_base_badges_internal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_base_badges_internal(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.evaluate_composite_badges_internal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_composite_badges_internal(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.evaluate_user_achievements(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluate_user_achievements(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.process_gamification_evaluations_batch(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_gamification_evaluations_batch(integer) TO service_role;

REVOKE ALL ON FUNCTION public.record_card_view_handshake(uuid, uuid, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_card_view_handshake(uuid, uuid, text, boolean, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_card_reveal(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_card_reveal(uuid, uuid, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.record_creator_share_event(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_creator_share_event(text, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_badge_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_badge_by_token(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_badges_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_badges_summary(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.prune_expired_telemetry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_expired_telemetry() TO service_role;

