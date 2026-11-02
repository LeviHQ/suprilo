-- ============================================================================
-- Suprilo Phase 2C — Migration 4: Storage Configuration & Bucket Policies
-- File: supabase/migrations/20261102000004_storage_policies.sql
-- Description: Private card-photos bucket initialization, size and MIME type guards,
--              and owner-only folder isolation policies on storage.objects.
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
-- Strict folder isolation: users may only manipulate objects within their user_id folder.
-- Public direct reads are completely disabled; recipient viewing uses signed URLs.
-- ============================================================================

-- Owner Upload (INSERT)
CREATE POLICY "card_photos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
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
CREATE POLICY "card_photos_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner Delete (DELETE)
CREATE POLICY "card_photos_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'card-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

