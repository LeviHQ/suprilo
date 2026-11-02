-- ============================================================================
-- Suprilo Phase 2C — Migration 4: Storage Configuration & Bucket Policies
-- File: supabase/migrations/20261102000004_storage_policies.sql
-- Description: Private card-photos bucket initialization, size and MIME type guards,
--              and strict two-tier folder ownership verification on storage.objects.
-- ============================================================================

-- ============================================================================
-- 1. Initialize Private Storage Bucket: card-photos
-- Enforces 2MB file size ceiling and restricts MIME types to JPEG, PNG, WEBP.
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-photos',
  'card-photos',
  false,
  2097152, -- 2MB (CARD_LIMITS.MAX_PHOTO_SIZE_BYTES)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. Storage Object RLS Policies
-- Path Structure: {user_id}/{card_id}/{filename}
-- Strict Two-Tier Verification:
--   Tier 1: Folder 1 must strictly match auth.uid().
--   Tier 2: Folder 2 must be a valid UUID matching an existing card owned by auth.uid().
-- Public direct reads are completely disabled; recipient viewing uses server-signed URLs.
-- ============================================================================

-- Owner Upload (INSERT)
-- Verifies that uploads target an existing card owned by the caller.
CREATE POLICY "card_photos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = (
        CASE
          WHEN (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN ((storage.foldername(name))[2])::uuid
          ELSE NULL
        END
      )
      AND c.user_id = auth.uid()
    )
  );

-- Owner Read (SELECT)
CREATE POLICY "card_photos_owner_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner Update (UPDATE)
-- Validates both source object ownership (USING) and destination object ownership (WITH CHECK).
-- Prevents moving or renaming objects into another user's folder or an unowned card folder.
CREATE POLICY "card_photos_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = (
        CASE
          WHEN (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN ((storage.foldername(name))[2])::uuid
          ELSE NULL
        END
      )
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = (
        CASE
          WHEN (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN ((storage.foldername(name))[2])::uuid
          ELSE NULL
        END
      )
      AND c.user_id = auth.uid()
    )
  );

-- Owner Delete (DELETE)
CREATE POLICY "card_photos_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
