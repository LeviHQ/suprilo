-- ============================================================================
-- Suprilo Phase 2C — Migration 3: Row Level Security & Access Permissions
-- File: supabase/migrations/20261102000003_rls_security.sql
-- Description: Zero direct authenticated INSERT on cards, owner-only RLS policies,
--              lockdown of slug_registry, metrics, and server-only procedure grants.
-- ============================================================================

-- ============================================================================
-- 1. Enable Row Level Security Across All Application Tables
-- ============================================================================
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slug_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_telemetry_cooldown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Revoke Default Public Table Privileges
-- ============================================================================
REVOKE ALL ON TABLE public.cards FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.slug_registry FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.card_metrics FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.card_telemetry_cooldown FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.storage_cleanup_queue FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. Row Level Security Policies for public.cards
-- ============================================================================
-- Owner-only SELECT
CREATE POLICY "cards_owner_select"
  ON public.cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owner-only UPDATE
CREATE POLICY "cards_owner_update"
  ON public.cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner-only DELETE
CREATE POLICY "cards_owner_delete"
  ON public.cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- CRITICAL PERMISSION MATRIX FOR public.cards:
-- 1. Grant SELECT, UPDATE, DELETE to authenticated users for their owned cards.
-- 2. DO NOT grant INSERT to authenticated (Zero Direct Insert).
-- All card creation MUST route through public.create_card_draft(...).
GRANT SELECT, UPDATE, DELETE ON TABLE public.cards TO authenticated;
GRANT ALL ON TABLE public.cards TO service_role;

-- ============================================================================
-- 4. Access Control for public.slug_registry
-- Clients CANNOT directly select, insert, update, or delete rows in slug_registry.
-- Reservations and retirements are performed exclusively by SECURITY DEFINER procedures.
-- ============================================================================
GRANT ALL ON TABLE public.slug_registry TO service_role;

-- ============================================================================
-- 5. Row Level Security Policies for public.card_metrics
-- Card owners may view metrics for cards they own.
-- Direct client mutations (INSERT, UPDATE, DELETE) are completely revoked.
-- ============================================================================
CREATE POLICY "card_metrics_owner_select"
  ON public.card_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = card_metrics.card_id
        AND c.user_id = auth.uid()
    )
  );

GRANT SELECT ON TABLE public.card_metrics TO authenticated;
GRANT ALL ON TABLE public.card_metrics TO service_role;

-- ============================================================================
-- 6. Access Control for Telemetry Cooldown and Storage Cleanup Queue
-- Reserved exclusively for backend maintenance and service_role.
-- ============================================================================
GRANT ALL ON TABLE public.card_telemetry_cooldown TO service_role;
GRANT ALL ON TABLE public.storage_cleanup_queue TO service_role;

-- ============================================================================
-- 7. Stored Procedure & Function Execution Privileges
-- ============================================================================

-- 7a. create_card_draft (Authenticated Users & Service Role)
REVOKE ALL ON FUNCTION public.create_card_draft(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, numeric, boolean
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_card_draft(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, numeric, boolean
) TO authenticated, service_role;

-- 7b. get_published_card_by_slug (Anonymous Recipients & Authenticated Users)
REVOKE ALL ON FUNCTION public.get_published_card_by_slug(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_published_card_by_slug(text) TO anon, authenticated, service_role;

-- 7c. record_card_telemetry (Trusted Server Backend Only)
REVOKE ALL ON FUNCTION public.record_card_telemetry(text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_card_telemetry(text, text, text) TO service_role;

-- 7d. claim_storage_cleanup_batch (Trusted Cleanup Worker Only)
REVOKE ALL ON FUNCTION public.claim_storage_cleanup_batch(text, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_storage_cleanup_batch(text, integer) TO service_role;

