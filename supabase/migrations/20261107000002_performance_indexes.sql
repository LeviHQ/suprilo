-- ============================================================================
-- Migration: 20261107000002_performance_indexes.sql
-- Module: High-Performance Database Indexes & Query Acceleration
--
-- Purpose:
--   Maximizes database read/fetch speeds across all core platform features:
--   1. Eliminates in-memory sorts on public.cards (user_id, created_at DESC).
--   2. Accelerates public.user_badges queries with pre-sorted index order.
--   3. Adds covering index on public.card_metrics for heap-free index-only scans.
--   4. Accelerates gamification level lookups for notifications and studio hub.
-- ============================================================================

-- 1. Accelerate Studio Hub Card Retrieval (Eliminates sort overhead for cards)
CREATE INDEX IF NOT EXISTS idx_cards_user_created
  ON public.cards (user_id, created_at DESC);

-- 2. Accelerate Filtered Card Queries by User and Status
CREATE INDEX IF NOT EXISTS idx_cards_user_status
  ON public.cards (user_id, status);

-- 3. Accelerate Unlocked Badges Retrieval (Eliminates sort overhead for badges)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_unlocked
  ON public.user_badges (user_id, unlocked_at DESC);

-- 4. Covering Index for Card Metrics (Index-Only Scans without table heap access)
CREATE INDEX IF NOT EXISTS idx_card_metrics_covering
  ON public.card_metrics (card_id)
  INCLUDE (views_count, reveals_count, last_viewed_at, last_revealed_at);

-- 5. Covering Index for Gamification Level & XP Lookups
CREATE INDEX IF NOT EXISTS idx_gamification_stats_level_xp
  ON public.user_gamification_stats (user_id)
  INCLUDE (current_level, total_xp);

-- Analyze tables to refresh query planner statistics immediately
ANALYZE public.cards;
ANALYZE public.card_metrics;
ANALYZE public.user_badges;
ANALYZE public.user_gamification_stats;
