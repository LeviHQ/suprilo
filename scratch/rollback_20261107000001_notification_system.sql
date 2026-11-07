-- ============================================================================
-- CANONICAL ROLLBACK SCRIPT: 20261107000001_notification_system.sql
-- Restores EXACT Migration 5 (20261102000005_badge_system.sql) definitions,
-- grants, and drops all notification tables, publication, and enums.
-- ============================================================================

BEGIN;

-- 1. Remove Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;

-- 2. Drop notification system functions
DROP FUNCTION IF EXISTS public.enqueue_notification_safe(uuid, public.notification_type, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.cancel_push_delivery(uuid, integer, text);
DROP FUNCTION IF EXISTS public.claim_pending_push_deliveries(integer);
DROP FUNCTION IF EXISTS public.record_push_delivery_result(uuid, integer, public.push_delivery_status, integer, text);
DROP FUNCTION IF EXISTS public.recover_stale_processing_push_claims(integer);
DROP FUNCTION IF EXISTS public.recover_orphaned_push_deliveries(integer);
DROP FUNCTION IF EXISTS public.reconcile_missing_notifications(integer);
DROP FUNCTION IF EXISTS public.prune_expired_notifications(integer);
DROP FUNCTION IF EXISTS public.delete_push_subscription(uuid, text);

-- 3. Restore EXACT Migration 5 definition of public.award_badge_internal
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

REVOKE ALL ON FUNCTION public.award_badge_internal(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge_internal(uuid, text) TO service_role;

-- 4. Restore EXACT Migration 5 definition of public.evaluate_user_achievements
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

REVOKE ALL ON FUNCTION public.evaluate_user_achievements(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.evaluate_user_achievements(uuid) TO authenticated, service_role;

-- 5. Restore EXACT Migration 5 definition of public.record_card_reveal
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

REVOKE ALL ON FUNCTION public.record_card_reveal(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_card_reveal(uuid, uuid, text, text) TO service_role;

-- 6. Drop notification tables and enums in dependency order
DROP TABLE IF EXISTS public.notification_push_deliveries CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.notification_suppressions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;

DROP TYPE IF EXISTS public.push_delivery_status;
DROP TYPE IF EXISTS public.notification_type;

COMMIT;
