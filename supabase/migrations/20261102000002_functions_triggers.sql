-- ============================================================================
-- Suprilo Phase 2C — Migration 2: Functions, Lifecycle Triggers & Procedures
-- File: supabase/migrations/20261102000002_functions_triggers.sql
-- Description: Concurrency-safe draft slot allocation, lifecycle enforcement,
--              permanent slug registry synchronization, and telemetry procedures.
-- ============================================================================

-- ============================================================================
-- 1. Function: public.create_card_draft(...)
-- Atomic card draft creation with per-user transaction advisory locking,
-- lowest available draft slot selection (1..3), and slug reservation.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_card_draft(
  p_slug text,
  p_creation_mode text DEFAULT 'scratch',
  p_template_id text DEFAULT NULL,
  p_recipient_name text DEFAULT 'Friend',
  p_sender_name text DEFAULT 'Someone Special',
  p_occasion_tag text DEFAULT 'Just Because',
  p_primary_message text DEFAULT 'A special surprise for you!',
  p_secondary_message text DEFAULT NULL,
  p_foil_style text DEFAULT 'lavender-pink',
  p_cover_text text DEFAULT 'Scratch to reveal your surprise ✨',
  p_bg_palette text DEFAULT 'pure-ivory',
  p_sticker text DEFAULT 'sparkles',
  p_font_family text DEFAULT NULL,
  p_photo_path text DEFAULT NULL,
  p_reveal_threshold numeric DEFAULT 0.65,
  p_sound_enabled boolean DEFAULT true
)
RETURNS public.cards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_allocated_slot integer;
  v_new_card public.cards;
  v_card_id uuid;
BEGIN
  -- Strict identity derivation from Supabase authenticated context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Must be logged in to create a draft'
      USING ERRCODE = '28000';
  END IF;

  -- 1. Acquire exclusive per-user transaction advisory lock to prevent concurrent slot races
  PERFORM pg_advisory_xact_lock(hashtext('draft_slot_' || v_user_id::text));

  -- 2. Allocate the lowest available draft slot (1, 2, or 3)
  SELECT s.slot INTO v_allocated_slot
  FROM generate_series(1, 3) AS s(slot)
  LEFT JOIN public.cards c
    ON c.user_id = v_user_id
   AND c.status = 'draft'
   AND c.draft_slot = s.slot
  WHERE c.id IS NULL
  ORDER BY s.slot ASC
  LIMIT 1;

  -- Controlled rejection when user has reached the 3-draft ceiling
  IF v_allocated_slot IS NULL THEN
    RAISE EXCEPTION 'DRAFT_LIMIT_REACHED: Maximum of 3 active drafts allowed per user. Please publish or delete an existing draft.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Validate slug format (exactly 12 characters from the 31-character alphabet)
  IF p_slug IS NULL OR NOT (p_slug ~ '^[2-9a-hj-km-np-z]{12}$') THEN
    RAISE EXCEPTION 'INVALID_SLUG: Slug must be exactly 12 characters from the approved alphabet.'
      USING ERRCODE = 'check_violation';
  END IF;

  v_card_id := gen_random_uuid();

  -- 4. Reserve slug in the canonical slug registry
  -- Any attempt to reuse an existing active or retired slug will fail via PRIMARY KEY constraint
  INSERT INTO public.slug_registry (slug, card_id, status)
  VALUES (p_slug, v_card_id, 'active');

  -- 5. Insert card record with allocated draft slot
  INSERT INTO public.cards (
    id,
    user_id,
    slug,
    status,
    creation_mode,
    draft_slot,
    template_id,
    recipient_name,
    sender_name,
    occasion_tag,
    primary_message,
    secondary_message,
    foil_style,
    cover_text,
    bg_palette,
    sticker,
    font_family,
    photo_path,
    reveal_threshold,
    sound_enabled,
    published_at
  ) VALUES (
    v_card_id,
    v_user_id,
    p_slug,
    'draft',
    p_creation_mode,
    v_allocated_slot,
    p_template_id,
    p_recipient_name,
    p_sender_name,
    p_occasion_tag,
    p_primary_message,
    p_secondary_message,
    p_foil_style,
    p_cover_text,
    p_bg_palette,
    p_sticker,
    p_font_family,
    p_photo_path,
    p_reveal_threshold,
    p_sound_enabled,
    NULL
  )
  RETURNING * INTO v_new_card;

  -- 6. Initialize telemetry metrics record
  INSERT INTO public.card_metrics (card_id, views_count, reveals_count)
  VALUES (v_card_id, 0, 0);

  RETURN v_new_card;
END;
$$;

-- ============================================================================
-- 2. Trigger Function: public.enforce_card_lifecycle()
-- Guards lifecycle state transitions, protects immutable attributes,
-- and synchronizes draft slot freeing upon publication or archiving.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_card_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 1. Synchronize any status transition that modifies draft slot occupancy
  -- CRITICAL: Always acquire advisory lock on OLD.user_id to prevent lock key spoofing
  IF OLD.status = 'draft' OR NEW.status = 'draft' THEN
    PERFORM pg_advisory_xact_lock(hashtext('draft_slot_' || OLD.user_id::text));
  END IF;

  -- 2. Enforce strictly immutable ownership, creation timestamp, and slug
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'IMMUTABLE_FIELD: Card ownership (user_id) cannot be transferred or changed.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'IMMUTABLE_FIELD: created_at timestamp cannot be modified.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'IMMUTABLE_FIELD: Card slug cannot be changed once created.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 3. Prohibit reverting published or archived cards to draft
  IF OLD.status IN ('published', 'archived') AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cards with status "%" cannot be reverted to "draft".', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- 4. Protect draft_slot from direct client modification while card remains in draft
  IF OLD.status = 'draft' AND NEW.status = 'draft' THEN
    IF NEW.draft_slot IS DISTINCT FROM OLD.draft_slot THEN
      RAISE EXCEPTION 'IMMUTABLE_FIELD: draft_slot cannot be modified or cleared while card remains in draft status.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- 5. Atomically free draft slot upon publication or archiving
  IF OLD.status = 'draft' AND NEW.status = 'published' THEN
    NEW.published_at := coalesce(NEW.published_at, now());
    NEW.draft_slot := NULL;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'archived' THEN
    NEW.published_at := coalesce(NEW.published_at, now());
    NEW.draft_slot := NULL;
  END IF;

  -- 6. Guarantee that published and archived cards never possess a draft_slot
  IF NEW.status IN ('published', 'archived') AND NEW.draft_slot IS NOT NULL THEN
    RAISE EXCEPTION 'INVALID_STATE: Non-draft cards cannot possess a draft_slot.'
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cards_lifecycle
  BEFORE UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_card_lifecycle();

-- ============================================================================
-- 3. Trigger Function: public.process_cards_before_delete()
-- Synchronizes draft slot release on draft deletion, permanently retires the
-- card's slug in slug_registry, and enqueues photo assets for cleanup.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_cards_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 1. Synchronize draft slot release if deleting an active draft
  IF OLD.status = 'draft' THEN
    PERFORM pg_advisory_xact_lock(hashtext('draft_slot_' || OLD.user_id::text));
  END IF;

  -- 2. Permanently mark slug as retired in the canonical slug registry
  UPDATE public.slug_registry
  SET status = 'retired',
      retired_at = now()
  WHERE slug = OLD.slug;

  -- 3. Atomic outbox entry for private photo cleanup
  IF OLD.photo_path IS NOT NULL THEN
    INSERT INTO public.storage_cleanup_queue (bucket_id, object_path)
    VALUES ('card-photos', OLD.photo_path);
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cards_before_delete
  BEFORE DELETE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.process_cards_before_delete();

-- ============================================================================
-- 4. Function: public.get_published_card_by_slug(p_slug text)
-- Read-only, public-facing RPC to retrieve a published card for recipients.
-- Never exposes user_id, draft slots, or unpublished cards.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_published_card_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  slug text,
  recipient_name text,
  sender_name text,
  occasion_tag text,
  primary_message text,
  secondary_message text,
  foil_style text,
  cover_text text,
  bg_palette text,
  sticker text,
  font_family text,
  photo_path text,
  has_photo boolean,
  reveal_threshold numeric,
  sound_enabled boolean,
  published_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Strict format guard prevents malformed slug probes
  IF p_slug IS NULL OR NOT (p_slug ~ '^[2-9a-hj-km-np-z]{12}$') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.slug,
    c.recipient_name,
    c.sender_name,
    c.occasion_tag,
    c.primary_message,
    c.secondary_message,
    c.foil_style,
    c.cover_text,
    c.bg_palette,
    c.sticker,
    c.font_family,
    c.photo_path,
    (c.photo_path IS NOT NULL) AS has_photo,
    c.reveal_threshold,
    c.sound_enabled,
    c.published_at
  FROM public.cards c
  WHERE c.slug = p_slug
    AND c.status = 'published';
END;
$$;

-- ============================================================================
-- 5. Function: public.record_card_telemetry(...)
-- Server-only procedure for incrementing views and reveals.
-- Enforces 15-minute visitor cooldown window with atomic re-claiming.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_card_telemetry(
  p_slug text,
  p_event_type text,
  p_visitor_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_card_id uuid;
  v_claimed boolean := false;
BEGIN
  -- Validate format constraints
  IF p_slug IS NULL OR NOT (p_slug ~ '^[2-9a-hj-km-np-z]{12}$') THEN
    RETURN false;
  END IF;
  IF p_event_type NOT IN ('view', 'reveal') THEN
    RETURN false;
  END IF;
  IF p_visitor_hash IS NULL OR NOT (p_visitor_hash ~ '^[a-f0-9]{64}$') THEN
    RETURN false;
  END IF;

  -- Resolve published card ID
  SELECT id INTO v_card_id
  FROM public.cards
  WHERE slug = p_slug AND status = 'published';

  IF v_card_id IS NULL THEN
    RETURN false;
  END IF;

  -- Atomic claim or expired record re-claim
  INSERT INTO public.card_telemetry_cooldown (card_id, event_type, visitor_hash, expires_at)
  VALUES (v_card_id, p_event_type, p_visitor_hash, now() + interval '15 minutes')
  ON CONFLICT (card_id, event_type, visitor_hash)
  DO UPDATE SET expires_at = EXCLUDED.expires_at
  WHERE public.card_telemetry_cooldown.expires_at <= now()
  RETURNING true INTO v_claimed;

  -- Cooldown active; ignore duplicate event
  IF NOT coalesce(v_claimed, false) THEN
    RETURN false;
  END IF;

  -- Increment metric in protected card_metrics table
  IF p_event_type = 'view' THEN
    UPDATE public.card_metrics
    SET views_count = views_count + 1,
        last_viewed_at = now(),
        updated_at = now()
    WHERE card_id = v_card_id;
  ELSIF p_event_type = 'reveal' THEN
    UPDATE public.card_metrics
    SET reveals_count = reveals_count + 1,
        last_revealed_at = now(),
        updated_at = now()
    WHERE card_id = v_card_id;
  END IF;

  RETURN true;
END;
$$;

-- ============================================================================
-- 6. Function: public.claim_storage_cleanup_batch(...)
-- Server-only worker procedure for claiming pending photo deletion jobs.
-- Utilizes FOR UPDATE SKIP LOCKED for high-concurrency worker safety.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_storage_cleanup_batch(
  p_worker_id text,
  p_batch_size integer DEFAULT 20
)
RETURNS SETOF public.storage_cleanup_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.storage_cleanup_queue
  SET status = 'processing',
      locked_at = now(),
      locked_by = p_worker_id,
      updated_at = now()
  WHERE id IN (
    SELECT id
    FROM public.storage_cleanup_queue
    WHERE (status = 'pending' OR (status = 'processing' AND locked_at < now() - interval '10 minutes'))
      AND next_retry_at <= now()
      AND retry_count < 5
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_batch_size
  )
  RETURNING *;
END;
$$;

