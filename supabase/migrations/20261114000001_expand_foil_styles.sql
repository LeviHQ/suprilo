-- Migration: Expand foil styles constraint to support exciting category-specific foils
-- The old chk_cards_foil_style constraint only allowed 4 legacy foil styles.
-- This migration updates it to accept any valid kebab-case foil identifier.

ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS chk_cards_foil_style;

ALTER TABLE public.cards ADD CONSTRAINT chk_cards_foil_style CHECK (
  foil_style ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  AND char_length(foil_style) BETWEEN 2 AND 50
);
