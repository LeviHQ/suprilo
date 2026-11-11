-- ============================================================================
-- Migration: 20261109000001_creator_profiles.sql
-- Specification Reference: SPEC-2C-5.8.0-ACCOUNT-SETTINGS (Phase 1)
-- Description: Creator Profiles table, unique handle reservation system,
--              30-day change throttle timestamp, bio with 100-character ceiling,
--              avatar source tracking (Google / 10 presets / custom 1MB upload),
--              card activity analytics privacy preference, RLS policies,
--              automatic signup initialization trigger, and backfill script.
-- ============================================================================

-- ============================================================================
-- 1. Table: public.profiles
-- Authoritative creator identity and account preferences record.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Handle reservation (3 to 20 chars, alphanumeric + underscores, case-insensitive)
  username text NOT NULL
    CONSTRAINT chk_profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  username_updated_at timestamptz NULL,

  -- Creator Public Display Name (1 to 50 characters)
  display_name text NOT NULL
    CONSTRAINT chk_profiles_display_name CHECK (char_length(trim(display_name)) BETWEEN 1 AND 50),

  -- Creator Bio / Headline (up to 100 characters)
  bio text NULL
    CONSTRAINT chk_profiles_bio CHECK (bio IS NULL OR char_length(bio) <= 100),

  -- Avatar Management
  avatar_type text NOT NULL DEFAULT 'google'
    CONSTRAINT chk_profiles_avatar_type CHECK (avatar_type IN ('google', 'preset', 'custom')),
  avatar_preset_id text NULL
    CONSTRAINT chk_profiles_avatar_preset CHECK (
      avatar_preset_id IS NULL OR avatar_preset_id IN (
        'preset-male-1', 'preset-male-2', 'preset-male-3',
        'preset-female-1', 'preset-female-2', 'preset-female-3',
        'preset-girl-1', 'preset-boy-1',
        'preset-elder-male-1', 'preset-elder-female-1'
      )
    ),
  custom_avatar_url text NULL,
  avatar_source text NOT NULL DEFAULT 'google'
    CONSTRAINT chk_profiles_avatar_source CHECK (avatar_source IN ('google', 'manual')),

  -- Data & Privacy Preferences
  allow_card_analytics boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================
-- Case-insensitive unique handle index (enforces case-insensitive reservation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (LOWER(username));

-- Primary key lookup & joins index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles (user_id);

-- Analytics privacy filter index
CREATE INDEX IF NOT EXISTS idx_profiles_analytics_privacy
  ON public.profiles (user_id)
  WHERE allow_card_analytics = false;

-- ============================================================================
-- 3. Row-Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Owner Read Policy
CREATE POLICY "profiles_owner_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owner Update Policy
CREATE POLICY "profiles_owner_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner Insert Policy
CREATE POLICY "profiles_owner_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service Role Full Access Grant
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- ============================================================================
-- 4. Automatic updated_at Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

-- ============================================================================
-- 5. Helper Function: Check Handle Availability
-- Case-insensitive check excluding the requesting user's own handle.
-- Rejects reserved system handles.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_username_available(
  p_username text,
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cleaned text;
  v_is_reserved boolean;
  v_exists boolean;
BEGIN
  IF p_username IS NULL THEN
    RETURN false;
  END IF;

  v_cleaned := lower(trim(p_username));

  -- Validate length & regex format
  IF NOT (v_cleaned ~ '^[a-z0-9_]{3,20}$') THEN
    RETURN false;
  END IF;

  -- Validate against reserved system handles
  v_is_reserved := v_cleaned IN (
    'admin', 'administrator', 'api', 'app', 'auth', 'billing', 'card', 'cards',
    'create', 'creator', 'dashboard', 'delete', 'dev', 'developer', 'edit',
    'explore', 'export', 'feed', 'feedback', 'help', 'home', 'legal', 'login',
    'logout', 'new', 'notification', 'notifications', 'null', 'privacy',
    'profile', 'root', 'security', 'settings', 'signin', 'signout', 'signup',
    'status', 'studio', 'suprilo', 'support', 'system', 'team', 'terms',
    'undefined', 'user', 'users', 'webhook', 'webhooks'
  );

  IF v_is_reserved THEN
    RETURN false;
  END IF;

  -- Check existence in database (excluding current user if editing)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = v_cleaned
      AND (p_exclude_user_id IS NULL OR user_id <> p_exclude_user_id)
  ) INTO v_exists;

  RETURN NOT v_exists;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text, uuid) TO authenticated, anon, service_role;

-- ============================================================================
-- 6. Helper Function: Safe Default Username Generator
-- Extracts initial 6-7 suitable characters from user email, sanitizes,
-- and appends deterministic collision suffix if already taken.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_default_username(
  p_email text,
  p_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw_prefix text;
  v_sanitized text;
  v_candidate text;
  v_suffix integer := 1;
BEGIN
  -- Extract email prefix before @
  v_raw_prefix := coalesce(split_part(p_email, '@', 1), 'creator');
  
  -- Keep only alphanumeric and underscore characters
  v_sanitized := lower(regexp_replace(v_raw_prefix, '[^a-zA-Z0-9_]', '', 'g'));
  
  -- Ensure minimum length of 3 chars
  IF char_length(v_sanitized) < 3 THEN
    v_sanitized := 'user_' || v_sanitized;
  END IF;

  -- Limit prefix to 7 characters
  v_candidate := substr(v_sanitized, 1, 7);

  -- Check if candidate is available
  WHILE NOT public.is_username_available(v_candidate, p_user_id) AND v_suffix < 1000 LOOP
    v_candidate := substr(v_sanitized, 1, 6) || '_' || v_suffix::text;
    v_suffix := v_suffix + 1;
  END LOOP;

  -- Fallback if still collided
  IF NOT public.is_username_available(v_candidate, p_user_id) THEN
    v_candidate := 'user_' || substr(replace(p_user_id::text, '-', ''), 1, 8);
  END IF;

  RETURN v_candidate;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_default_username(text, uuid) TO authenticated, service_role;

-- ============================================================================
-- 7. Automatic Signup Trigger on auth.users
-- Automatically initializes public.profiles record on new user creation.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_display_name text;
  v_username text;
  v_avatar_url text;
BEGIN
  v_email := NEW.email;

  -- Extract display name from OAuth metadata conventions
  v_display_name := coalesce(
    trim(NEW.raw_user_meta_data->>'full_name'),
    trim(NEW.raw_user_meta_data->>'name'),
    trim(NEW.raw_user_meta_data->>'given_name'),
    split_part(v_email, '@', 1),
    'Suprilo Creator'
  );

  -- Constrain display name between 1 and 50 characters
  IF char_length(v_display_name) > 50 THEN
    v_display_name := substr(v_display_name, 1, 50);
  END IF;

  -- Extract initial Google avatar
  v_avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Generate valid unique username
  v_username := public.generate_default_username(v_email, NEW.id);

  -- Insert profile record safely
  INSERT INTO public.profiles (
    user_id,
    username,
    username_updated_at,
    display_name,
    bio,
    avatar_type,
    avatar_preset_id,
    custom_avatar_url,
    avatar_source,
    allow_card_analytics
  ) VALUES (
    NEW.id,
    v_username,
    NULL,
    v_display_name,
    'Here to celebrate life, share smiles, and make every moment special ✨',
    'google',
    NULL,
    v_avatar_url,
    'google',
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_created_profile ON auth.users;
CREATE TRIGGER trg_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- ============================================================================
-- 8. Existing User Backfill Script (Idempotent)
-- Ensures all existing accounts in auth.users have an initialized profile.
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  v_uname text;
  v_dname text;
  v_pic text;
BEGIN
  FOR r IN (
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.profiles)
  ) LOOP
    v_dname := coalesce(
      trim(r.raw_user_meta_data->>'custom_display_name'),
      trim(r.raw_user_meta_data->>'display_name'),
      trim(r.raw_user_meta_data->>'full_name'),
      trim(r.raw_user_meta_data->>'name'),
      split_part(r.email, '@', 1),
      'Suprilo Creator'
    );
    IF char_length(v_dname) > 50 THEN
      v_dname := substr(v_dname, 1, 50);
    END IF;

    v_pic := coalesce(
      r.raw_user_meta_data->>'custom_avatar_url',
      r.raw_user_meta_data->>'avatar_url',
      r.raw_user_meta_data->>'picture',
      NULL
    );

    v_uname := coalesce(
      r.raw_user_meta_data->>'username',
      public.generate_default_username(r.email, r.id)
    );

    INSERT INTO public.profiles (
      user_id,
      username,
      username_updated_at,
      display_name,
      bio,
      avatar_type,
      avatar_preset_id,
      custom_avatar_url,
      avatar_source,
      allow_card_analytics
    ) VALUES (
      r.id,
      v_uname,
      CASE WHEN r.raw_user_meta_data->>'username_updated_at' IS NOT NULL THEN (r.raw_user_meta_data->>'username_updated_at')::timestamptz ELSE NULL END,
      v_dname,
      coalesce(r.raw_user_meta_data->>'custom_bio', r.raw_user_meta_data->>'bio', 'Here to celebrate life, share smiles, and make every moment special ✨'),
      coalesce(r.raw_user_meta_data->>'custom_avatar_type', r.raw_user_meta_data->>'avatar_type', 'google'),
      coalesce(r.raw_user_meta_data->>'custom_avatar_preset_id', r.raw_user_meta_data->>'avatar_preset_id', NULL),
      v_pic,
      coalesce(r.raw_user_meta_data->>'custom_avatar_source', r.raw_user_meta_data->>'avatar_source', 'google'),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- Enable Supabase Realtime for profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

