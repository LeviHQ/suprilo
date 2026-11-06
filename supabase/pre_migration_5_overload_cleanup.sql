-- ============================================================================
-- Suprilo Staging Pre-Migration 5 Overload Cleanup
-- Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
-- Purpose: Safely drops obsolete pre-REV-01 function overloads before
--          applying Migration 5 (20261102000005_badge_system.sql).
--
-- Execution Rule: Execute ONLY against isolated Staging PostgreSQL instance.
-- ============================================================================

-- 1. Safely drop pre-REV-01 4-parameter overload of record_card_view_handshake
-- (REV-01 introduced 5th parameter: p_previous_visitor_id_hash text DEFAULT NULL)
DROP FUNCTION IF EXISTS public.record_card_view_handshake(
  uuid,
  uuid,
  text,
  boolean
);

-- 2. Safely drop pre-REV-01 3-parameter overload of record_card_reveal
-- (REV-01 introduced 4th parameter: p_previous_visitor_id_hash text DEFAULT NULL)
DROP FUNCTION IF EXISTS public.record_card_reveal(
  uuid,
  uuid,
  text
);

-- 3. Confirm clean slate for Migration 5 definitions
COMMENT ON SCHEMA public IS 'Suprilo staging pre-migration 5 overload cleanup executed.';

