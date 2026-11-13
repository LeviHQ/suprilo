-- Migration: Expand template catalog from 16 → 100 templates + custom-scratch
-- The old chk_cards_template_id constraint only allowed 16 original template IDs.
-- This migration replaces it with a regex-based constraint that accepts any
-- lowercase-alphanumeric-hyphen ID (matching the pattern all template IDs follow).

-- Step 1: Drop the old restrictive constraint
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS chk_cards_template_id;

-- Step 2: Add new flexible constraint
-- Allows NULL (for legacy cards) or any string matching the kebab-case pattern
-- with a reasonable length limit (3-60 chars)
ALTER TABLE public.cards ADD CONSTRAINT chk_cards_template_id CHECK (
  template_id IS NULL 
  OR (
    template_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND char_length(template_id) BETWEEN 3 AND 60
  )
);

