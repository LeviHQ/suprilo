-- ============================================================================
-- Migration: 20261109000002_avatar_storage.sql
-- Specification Reference: SPEC-2C-5.8.0-ACCOUNT-SETTINGS (Phase 1)
-- Description: Dedicated public-read avatar bucket with 1MB size ceiling,
--              JPEG/PNG/WEBP MIME type validation, and owner-only RLS policies.
-- ============================================================================

-- ============================================================================
-- 1. Initialize Public Storage Bucket: avatars
-- Enforces 1MB file size ceiling (1048576 bytes) and restricts MIME types.
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. Storage Object RLS Policies
-- Path Structure: {user_id}/{filename}
-- Enforces strict owner boundaries: authenticated users can only write/update/delete
-- within their own user_id directory. Public users can read avatars directly.
-- ============================================================================

-- Public Read (SELECT)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Owner Insert (INSERT)
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner Update (UPDATE)
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner Delete (DELETE)
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

