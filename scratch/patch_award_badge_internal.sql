-- ============================================================================
-- Suprilo Production Patch: Qualify extensions.gen_random_bytes in award_badge_internal
-- Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
-- Target: Production Supabase (naynjodssamuacmjkaqx)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.award_badge_internal(p_user_id uuid, p_badge_id text)
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

  v_token := encode(extensions.gen_random_bytes(12), 'hex');

  INSERT INTO public.user_badges (user_id, badge_id, points_awarded, unlocked_at, share_token)
  VALUES (p_user_id, p_badge_id, v_points, clock_timestamp(), v_token)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING true INTO v_inserted;

  RETURN COALESCE(v_inserted, false);
END;
$$;

REVOKE ALL ON FUNCTION public.award_badge_internal(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge_internal(uuid, text) TO service_role;

