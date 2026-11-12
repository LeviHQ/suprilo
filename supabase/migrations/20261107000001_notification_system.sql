-- ============================================================================
-- Migration: 20261107000001_notification_system.sql
-- Specification Reference: SPEC-2C-5.7.5-REV6
-- Description: Core Notification System, User Preferences, Push Subscriptions,
--              Per-Subscription Delivery Queue, Intentional Suppression Tombstones,
--              RLS Policies, Maintenance Functions, and Business Event Hooks.
-- Execution: Local migration file (UNEXECUTED).
-- ============================================================================

-- ============================================================================
-- 1. Enums
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.notification_type AS ENUM (
      'CARD_REVEAL',
      'BADGE_UNLOCKED',
      'LEVEL_UP',
      'SYSTEM'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'push_delivery_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.push_delivery_status AS ENUM (
      'PENDING',
      'PROCESSING',
      'SENT',
      'FAILED',
      'CANCELLED'
    );
  END IF;
END $$;

-- ============================================================================
-- 2. Table: public.notifications (Authoritative In-App Notification Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  event_dedup_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  push_intended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT chk_notification_read_state CHECK (
    (NOT is_read AND read_at IS NULL) OR 
    (is_read AND read_at IS NOT NULL)
  ),
  CONSTRAINT uq_notifications_user_dedup UNIQUE (user_id, event_dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_fanout_recovery
  ON public.notifications(created_at) 
  WHERE push_intended = true;

-- ============================================================================
-- 3. Table: public.notification_preferences (User & Server Preferences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  notify_on_reveal boolean NOT NULL DEFAULT true,
  notify_on_badge boolean NOT NULL DEFAULT true,
  notify_on_level boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 4. Table: public.push_subscriptions (Registered Browser Endpoints)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user 
  ON public.push_subscriptions(user_id);

-- ============================================================================
-- 5. Table: public.notification_push_deliveries (Per-Subscription Queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  push_subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  status public.push_delivery_status NOT NULL DEFAULT 'PENDING',
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count >= 0 AND attempt_count <= 10),
  next_retry_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_attempt_at timestamptz NULL,
  sent_at timestamptz NULL,
  last_error text NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT uq_push_delivery_notification_subscription UNIQUE (notification_id, push_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_push_deliveries_claim
  ON public.notification_push_deliveries (next_retry_at ASC)
  WHERE status IN ('PENDING', 'PROCESSING');

CREATE INDEX IF NOT EXISTS idx_push_deliveries_subscription 
  ON public.notification_push_deliveries (push_subscription_id);

-- ============================================================================
-- 6. Table: public.notification_suppressions (30-Day Intentional Tombstones)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_suppressions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_dedup_key text NOT NULL,
  suppressed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT pk_notification_suppressions PRIMARY KEY (user_id, event_dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_suppressions_suppressed_at 
  ON public.notification_suppressions(suppressed_at);

-- ============================================================================
-- 7. Row Level Security & Column-Level Privilege Grants
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_push_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_suppressions ENABLE ROW LEVEL SECURITY;

-- Notifications RLS & Column Grants
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE (is_read, read_at) ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
CREATE POLICY notifications_update_policy ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Preferences RLS & Column Grants (push_enabled is server-controlled)
REVOKE ALL ON TABLE public.notification_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.notification_preferences TO authenticated;
GRANT UPDATE (in_app_enabled, notify_on_reveal, notify_on_badge, notify_on_level, updated_at) 
  ON TABLE public.notification_preferences TO authenticated;
GRANT ALL ON TABLE public.notification_preferences TO service_role;

DROP POLICY IF EXISTS preferences_select_policy ON public.notification_preferences;
CREATE POLICY preferences_select_policy ON public.notification_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS preferences_update_policy ON public.notification_preferences;
CREATE POLICY preferences_update_policy ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Server-Managed Tables (Zero direct client access)
REVOKE ALL ON TABLE public.push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;

REVOKE ALL ON TABLE public.notification_push_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.notification_push_deliveries TO service_role;

REVOKE ALL ON TABLE public.notification_suppressions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.notification_suppressions TO service_role;

-- Realtime Publication Integration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY DEFAULT;

-- ============================================================================
-- 8. Core Database Functions
-- ============================================================================

-- 8a. Safe Inline Notification Insertion Helper
CREATE OR REPLACE FUNCTION public.enqueue_notification_safe(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_dedup_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_pref RECORD;
  v_notification_id uuid;
  v_is_suppressed boolean := false;
  v_push_intended boolean := false;
BEGIN
  -- 1. Ensure user preferences exist with documented defaults
  INSERT INTO public.notification_preferences (
    user_id,
    in_app_enabled,
    push_enabled,
    notify_on_reveal,
    notify_on_badge,
    notify_on_level
  ) VALUES (
    p_user_id,
    true,
    false,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT in_app_enabled, push_enabled, notify_on_reveal, notify_on_badge, notify_on_level
  INTO v_pref
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  -- 2. Evaluate intentional suppression
  IF NOT COALESCE(v_pref.in_app_enabled, true) THEN
    v_is_suppressed := true;
  ELSIF p_type = 'CARD_REVEAL' AND NOT COALESCE(v_pref.notify_on_reveal, true) THEN
    v_is_suppressed := true;
  ELSIF p_type = 'BADGE_UNLOCKED' AND NOT COALESCE(v_pref.notify_on_badge, true) THEN
    v_is_suppressed := true;
  ELSIF p_type = 'LEVEL_UP' AND NOT COALESCE(v_pref.notify_on_level, true) THEN
    v_is_suppressed := true;
  END IF;

  -- 3. Record intentional suppression tombstone
  IF v_is_suppressed THEN
    BEGIN
      INSERT INTO public.notification_suppressions (user_id, event_dedup_key)
      VALUES (p_user_id, p_dedup_key)
      ON CONFLICT (user_id, event_dedup_key) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'CRITICAL_NOTIFICATION_AUDIT: Suppression tombstone failed to persist for user % event %: %. Technical failure recovery semantics apply.',
        p_user_id, p_dedup_key, SQLERRM;
    END;
    RETURN false;
  END IF;

  -- 4. Record original push intent state
  v_push_intended := COALESCE(v_pref.push_enabled, false);

  -- 5. Insert in-app notification with durable push_intended marker
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    event_dedup_key,
    metadata,
    push_intended
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_body,
    p_dedup_key,
    p_metadata,
    v_push_intended
  )
  ON CONFLICT (user_id, event_dedup_key) DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NULL THEN
    RETURN false;
  END IF;

  -- 6. Push fan-out in isolated nested block: failure will NOT roll back in-app notification
  IF v_push_intended THEN
    BEGIN
      INSERT INTO public.notification_push_deliveries (
        notification_id,
        push_subscription_id,
        status,
        attempt_count,
        next_retry_at
      )
      SELECT 
        v_notification_id,
        ps.id,
        'PENDING'::public.push_delivery_status,
        0,
        clock_timestamp()
      FROM public.push_subscriptions ps
      WHERE ps.user_id = p_user_id
      ON CONFLICT (notification_id, push_subscription_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Push fan-out failed for notification % (user %): %', v_notification_id, p_user_id, SQLERRM;
    END;
  END IF;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_notification_safe suppressed error for user %: %', p_user_id, SQLERRM;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_notification_safe(uuid, public.notification_type, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification_safe(uuid, public.notification_type, text, text, text, jsonb) TO service_role, postgres;

-- 8b. Dedicated Push Cancellation RPC
CREATE OR REPLACE FUNCTION public.cancel_push_delivery(
  p_delivery_id uuid,
  p_claimed_attempt smallint,
  p_reason text DEFAULT 'Delivery cancelled: User disabled push notifications'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  UPDATE public.notification_push_deliveries
  SET status = 'CANCELLED',
      last_error = p_reason,
      updated_at = clock_timestamp()
  WHERE id = p_delivery_id
    AND status = 'PROCESSING'
    AND attempt_count = p_claimed_attempt
  RETURNING true INTO v_updated;

  RETURN COALESCE(v_updated, false);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_push_delivery(uuid, smallint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_push_delivery(uuid, smallint, text) TO service_role, postgres;

-- 8c. Push Provider Response Recorder with Fencing
CREATE OR REPLACE FUNCTION public.record_push_delivery_result(
  p_delivery_id uuid,
  p_claimed_attempt smallint,
  p_http_status integer DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_delivery RECORD;
  v_user_id uuid;
  v_is_success boolean;
BEGIN
  SELECT npd.id, npd.push_subscription_id, npd.attempt_count, npd.status
  INTO v_delivery
  FROM public.notification_push_deliveries npd
  WHERE npd.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_delivery.status <> 'PROCESSING' OR v_delivery.attempt_count <> p_claimed_attempt THEN
    RETURN false;
  END IF;

  v_is_success := (p_http_status >= 200 AND p_http_status <= 299);

  IF v_is_success THEN
    UPDATE public.notification_push_deliveries
    SET status = 'SENT',
        sent_at = clock_timestamp(),
        last_error = NULL,
        updated_at = clock_timestamp()
    WHERE id = p_delivery_id;
    RETURN true;
  END IF;

  -- Handle actual provider 404/410 stale endpoints
  IF p_http_status IN (404, 410) THEN
    SELECT user_id INTO v_user_id FROM public.push_subscriptions WHERE id = v_delivery.push_subscription_id;
    
    DELETE FROM public.push_subscriptions WHERE id = v_delivery.push_subscription_id;
    
    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.push_subscriptions WHERE user_id = v_user_id
    ) THEN
      UPDATE public.notification_preferences
      SET push_enabled = false, updated_at = clock_timestamp()
      WHERE user_id = v_user_id;
    END IF;
    RETURN true;
  ELSIF v_delivery.attempt_count >= 5 THEN
    UPDATE public.notification_push_deliveries
    SET status = 'FAILED',
        last_error = COALESCE(p_error_message, format('Max retries exceeded (HTTP %s)', p_http_status)),
        updated_at = clock_timestamp()
    WHERE id = p_delivery_id;
    RETURN true;
  ELSE
    UPDATE public.notification_push_deliveries
    SET status = 'PENDING',
        next_retry_at = clock_timestamp() + (interval '1 minute' * power(2, v_delivery.attempt_count)),
        last_error = p_error_message,
        updated_at = clock_timestamp()
    WHERE id = p_delivery_id;
    RETURN true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_push_delivery_result(uuid, smallint, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_push_delivery_result(uuid, smallint, integer, text) TO service_role, postgres;

-- 8d. Push Delivery Claim Worker Function
CREATE OR REPLACE FUNCTION public.claim_pending_push_deliveries(p_batch_size integer DEFAULT 50)
RETURNS TABLE (
  delivery_id uuid,
  notification_id uuid,
  subscription_id uuid,
  target_user_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  title text,
  body text,
  metadata jsonb,
  claimed_attempt smallint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_batch_limit integer;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size <= 0 THEN
    RAISE EXCEPTION 'INVALID_BATCH_SIZE: Batch size must be positive';
  ELSIF p_batch_size > 100 THEN
    v_batch_limit := 100;
  ELSE
    v_batch_limit := p_batch_size;
  END IF;

  -- Cancel deliveries for users who opted out of push after queueing
  UPDATE public.notification_push_deliveries d
  SET status = 'CANCELLED',
      last_error = 'Delivery cancelled: User disabled push notifications',
      updated_at = clock_timestamp()
  FROM public.push_subscriptions ps
  JOIN public.notification_preferences np ON np.user_id = ps.user_id
  WHERE d.push_subscription_id = ps.id
    AND d.status IN ('PENDING', 'PROCESSING')
    AND NOT COALESCE(np.push_enabled, false);

  -- Mark exhausted crashed processing rows as FAILED
  UPDATE public.notification_push_deliveries
  SET status = 'FAILED',
      last_error = 'Max retry attempts exhausted during worker crash recovery',
      updated_at = clock_timestamp()
  WHERE status = 'PROCESSING'
    AND last_attempt_at < clock_timestamp() - interval '5 minutes'
    AND attempt_count >= 5;

  -- Atomic claim for eligible rows
  RETURN QUERY
  WITH claimed AS (
    SELECT npd.id
    FROM public.notification_push_deliveries npd
    JOIN public.push_subscriptions ps ON ps.id = npd.push_subscription_id
    JOIN public.notification_preferences np ON np.user_id = ps.user_id
    WHERE COALESCE(np.push_enabled, false) = true
      AND (
        (npd.status = 'PENDING' AND npd.next_retry_at <= clock_timestamp() AND npd.attempt_count < 5)
        OR
        (npd.status = 'PROCESSING' AND npd.last_attempt_at < clock_timestamp() - interval '5 minutes' AND npd.attempt_count < 5)
      )
    ORDER BY npd.next_retry_at ASC
    LIMIT v_batch_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_push_deliveries d
  SET status = 'PROCESSING'::public.push_delivery_status,
      attempt_count = (d.attempt_count + 1)::smallint,
      last_attempt_at = clock_timestamp(),
      updated_at = clock_timestamp()
  FROM claimed c
  JOIN public.notification_push_deliveries npd_orig ON npd_orig.id = c.id
  JOIN public.notifications n ON n.id = npd_orig.notification_id
  JOIN public.push_subscriptions ps ON ps.id = npd_orig.push_subscription_id
  WHERE d.id = c.id
  RETURNING 
    d.id,
    n.id,
    ps.id,
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    n.title,
    n.body,
    n.metadata,
    d.attempt_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_push_deliveries(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_push_deliveries(integer) TO service_role, postgres;

-- 8e. Intent-Aware Bounded Fan-Out Recovery RPC
CREATE OR REPLACE FUNCTION public.recover_orphaned_push_deliveries(p_batch_size integer DEFAULT 100)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_batch_limit integer;
  v_recovered integer := 0;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size <= 0 THEN
    v_batch_limit := 100;
  ELSIF p_batch_size > 200 THEN
    v_batch_limit := 200;
  ELSE
    v_batch_limit := p_batch_size;
  END IF;

  WITH missing_deliveries AS (
    SELECT 
      n.id AS notification_id,
      ps.id AS push_subscription_id,
      'PENDING'::public.push_delivery_status AS status,
      0::smallint AS attempt_count,
      clock_timestamp() AS next_retry_at
    FROM public.notifications n
    JOIN public.notification_preferences np ON np.user_id = n.user_id
    JOIN public.push_subscriptions ps ON ps.user_id = n.user_id
    WHERE n.push_intended = true
      AND n.created_at >= clock_timestamp() - interval '2 hours'
      AND np.push_enabled = true
      AND ps.created_at <= n.created_at
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_push_deliveries npd
        WHERE npd.notification_id = n.id AND npd.push_subscription_id = ps.id
      )
    LIMIT v_batch_limit
  )
  INSERT INTO public.notification_push_deliveries (
    notification_id,
    push_subscription_id,
    status,
    attempt_count,
    next_retry_at
  )
  SELECT notification_id, push_subscription_id, status, attempt_count, next_retry_at
  FROM missing_deliveries
  ON CONFLICT (notification_id, push_subscription_id) DO NOTHING;

  GET DIAGNOSTICS v_recovered = ROW_COUNT;
  RETURN v_recovered;
END;
$$;

REVOKE ALL ON FUNCTION public.recover_orphaned_push_deliveries(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recover_orphaned_push_deliveries(integer) TO service_role, postgres;

-- 8f. Reconciliation Function (Reveals & Badges Only; Suppression Checked)
CREATE OR REPLACE FUNCTION public.reconcile_missing_notifications()
RETURNS TABLE (
  reveals_reconciled integer,
  badges_reconciled integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_reveals integer := 0;
  v_badges integer := 0;
BEGIN
  -- 1. Reconcile Card Reveals (Past 30 Days Only)
  WITH missing_reveals AS (
    SELECT 
      c.user_id AS user_id,
      'CARD_REVEAL'::public.notification_type AS type,
      'Card Scratched!' AS title,
      format('Someone just revealed your scratch card for %s!', COALESCE(c.recipient_name, 'a friend')) AS body,
      'reveal:' || cve.view_receipt_id AS event_dedup_key,
      jsonb_build_object('card_id', c.id, 'receipt_id', cve.view_receipt_id, 'reconciled', true, 'url', '/profile') AS metadata,
      cve.consumed_at AS created_at
    FROM public.card_view_events cve
    JOIN public.cards c ON c.id = cve.card_id
    LEFT JOIN public.notification_preferences np ON np.user_id = c.user_id
    WHERE cve.consumed_at >= clock_timestamp() - interval '30 days'
      AND cve.consumed_at IS NOT NULL
      AND COALESCE(np.in_app_enabled, true) = true
      AND COALESCE(np.notify_on_reveal, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = c.user_id
          AND n.event_dedup_key = 'reveal:' || cve.view_receipt_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_suppressions ns
        WHERE ns.user_id = c.user_id
          AND ns.event_dedup_key = 'reveal:' || cve.view_receipt_id
      )
    LIMIT 500
  )
  INSERT INTO public.notifications (user_id, type, title, body, event_dedup_key, metadata, created_at, push_intended)
  SELECT user_id, type, title, body, event_dedup_key, metadata, created_at, false FROM missing_reveals
  ON CONFLICT (user_id, event_dedup_key) DO NOTHING;
  GET DIAGNOSTICS v_reveals = ROW_COUNT;

  -- 2. Reconcile Badges (Past 30 Days Only)
  WITH missing_badges AS (
    SELECT 
      ub.user_id,
      'BADGE_UNLOCKED'::public.notification_type AS type,
      'Badge Unlocked!' AS title,
      format('You unlocked the %s badge!', b.name) AS body,
      'badge:' || ub.user_id || ':' || ub.badge_id AS event_dedup_key,
      jsonb_build_object('badge_id', ub.badge_id, 'reconciled', true, 'url', '/profile/badges') AS metadata,
      ub.unlocked_at AS created_at
    FROM public.user_badges ub
    JOIN public.badges b ON b.id = ub.badge_id
    LEFT JOIN public.notification_preferences np ON np.user_id = ub.user_id
    WHERE ub.unlocked_at >= clock_timestamp() - interval '30 days'
      AND COALESCE(np.in_app_enabled, true) = true
      AND COALESCE(np.notify_on_badge, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = ub.user_id
          AND n.event_dedup_key = 'badge:' || ub.user_id || ':' || ub.badge_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_suppressions ns
        WHERE ns.user_id = ub.user_id
          AND ns.event_dedup_key = 'badge:' || ub.user_id || ':' || ub.badge_id
      )
    LIMIT 500
  )
  INSERT INTO public.notifications (user_id, type, title, body, event_dedup_key, metadata, created_at, push_intended)
  SELECT user_id, type, title, body, event_dedup_key, metadata, created_at, false FROM missing_badges
  ON CONFLICT (user_id, event_dedup_key) DO NOTHING;
  GET DIAGNOSTICS v_badges = ROW_COUNT;

  RETURN QUERY SELECT v_reveals, v_badges;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_missing_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_missing_notifications() TO service_role, postgres;

-- 8g. Dual-Table Pruning Function with Split Backlog Metrics
CREATE OR REPLACE FUNCTION public.prune_expired_notifications(p_batch_size integer DEFAULT 5000)
RETURNS TABLE (
  deleted_notifications integer,
  deleted_suppressions integer,
  remaining_notification_backlog bigint,
  remaining_suppression_backlog bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_batch_limit integer;
  v_deleted_notifs integer := 0;
  v_deleted_supp integer := 0;
  v_remaining_notifs bigint := 0;
  v_remaining_supp bigint := 0;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size <= 0 THEN
    RAISE EXCEPTION 'INVALID_BATCH_SIZE: Batch size must be a positive integer';
  ELSIF p_batch_size > 10000 THEN
    RAISE EXCEPTION 'BATCH_SIZE_EXCEEDS_MAX: Maximum batch size is 10000';
  ELSE
    v_batch_limit := p_batch_size;
  END IF;

  WITH doomed_batch AS (
    SELECT id
    FROM public.notifications
    WHERE created_at < clock_timestamp() - interval '30 days'
    ORDER BY created_at ASC
    LIMIT v_batch_limit
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM public.notifications
  WHERE id IN (SELECT id FROM doomed_batch);
  GET DIAGNOSTICS v_deleted_notifs = ROW_COUNT;

  WITH doomed_supp AS (
    SELECT user_id, event_dedup_key
    FROM public.notification_suppressions
    WHERE suppressed_at < clock_timestamp() - interval '30 days'
    LIMIT v_batch_limit
  )
  DELETE FROM public.notification_suppressions s
  USING doomed_supp d
  WHERE s.user_id = d.user_id AND s.event_dedup_key = d.event_dedup_key;
  GET DIAGNOSTICS v_deleted_supp = ROW_COUNT;

  SELECT count(*) INTO v_remaining_notifs
  FROM public.notifications
  WHERE created_at < clock_timestamp() - interval '30 days';

  SELECT count(*) INTO v_remaining_supp
  FROM public.notification_suppressions
  WHERE suppressed_at < clock_timestamp() - interval '30 days';

  RETURN QUERY SELECT v_deleted_notifs, v_deleted_supp, v_remaining_notifs, v_remaining_supp;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_expired_notifications(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_expired_notifications(integer) TO service_role, postgres;

-- ============================================================================
-- 9. Business Event Integration (Hooking Core Engine Functions)
-- ============================================================================

-- 9a. Hook into record_card_reveal (Reveals -> In-App Notification)
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

  SELECT id, slug, user_id, recipient_name INTO v_card
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

  -- Stamp receipt consumption
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

    -- Hook: Enqueue In-App Card Reveal Notification
    PERFORM public.enqueue_notification_safe(
      v_card.user_id,
      'CARD_REVEAL'::public.notification_type,
      'Card Scratched!',
      format('Someone just revealed your scratch card for %s!', COALESCE(v_card.recipient_name, 'a friend')),
      'reveal:' || p_view_receipt_id,
      jsonb_build_object('card_id', v_card.id, 'receipt_id', p_view_receipt_id, 'url', '/profile')
    );
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

-- 9b. Hook into award_badge_internal (Badges -> In-App Notification)
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

  v_token := encode(extensions.gen_random_bytes(12), 'hex');

  INSERT INTO public.user_badges (user_id, badge_id, points_awarded, unlocked_at, share_token)
  VALUES (p_user_id, p_badge_id, v_points, clock_timestamp(), v_token)
  ON CONFLICT (user_id, badge_id) DO NOTHING
  RETURNING true INTO v_inserted;

  -- Hook: Enqueue In-App Badge Unlocked Notification
  IF COALESCE(v_inserted, false) THEN
    PERFORM public.enqueue_notification_safe(
      p_user_id,
      'BADGE_UNLOCKED'::public.notification_type,
      'Badge Unlocked!',
      format('You unlocked the %s badge!', (SELECT name FROM public.badges WHERE id = p_badge_id)),
      'badge:' || p_user_id || ':' || p_badge_id,
      jsonb_build_object('badge_id', p_badge_id, 'url', '/profile/badges')
    );
  END IF;

  RETURN COALESCE(v_inserted, false);
END;
$$;

REVOKE ALL ON FUNCTION public.award_badge_internal(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_badge_internal(uuid, text) TO service_role;

-- 9c. Hook into evaluate_user_achievements (Level-Up -> In-App Notification)
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
  v_old_level smallint := 1;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACHIEVEMENT_EVALUATION';
  END IF;

  -- Read existing level prior to evaluation
  SELECT current_level INTO v_old_level
  FROM public.user_gamification_stats
  WHERE user_id = p_user_id;
  v_old_level := COALESCE(v_old_level, 1::smallint);

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

  -- Hook: Enqueue In-App Level-Up Notification (only when level increases)
  IF v_level > v_old_level THEN
    PERFORM public.enqueue_notification_safe(
      p_user_id,
      'LEVEL_UP'::public.notification_type,
      'Level Up!',
      format('Congratulations! You reached Level %s!', v_level),
      'level:' || p_user_id || ':' || v_level,
      jsonb_build_object('level', v_level, 'url', '/profile')
    );
  END IF;

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

