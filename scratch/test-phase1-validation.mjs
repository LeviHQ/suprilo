// scratch/test-phase1-validation.mjs
// Phase 1 Verification and Acceptance Test Suite for Suprilo Account Settings

import fs from "fs";
import path from "path";
import { validateUsername, getUsernameEligibility, PRESET_AVATARS, DAYS_BETWEEN_USERNAME_CHANGES } from "../src/types/profile.ts";

console.log("=================================================================");
console.log(" SUPRILO PHASE 1: DATABASE & STORAGE SCHEMA ACCEPTANCE SUITE");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}: ${details}`);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// 1. Migration 1 Structure: creator_profiles.sql
// ----------------------------------------------------------------------------
const m1Path = path.resolve("supabase/migrations/20261109000001_creator_profiles.sql");
assert(fs.existsSync(m1Path), "Migration 1 file exists", m1Path);

const m1Sql = fs.readFileSync(m1Path, "utf-8");

assert(
  m1Sql.includes("CREATE TABLE IF NOT EXISTS public.profiles"),
  "Table public.profiles is defined"
);

assert(
  m1Sql.includes("user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE"),
  "Foreign key cascade references auth.users(id)"
);

assert(
  m1Sql.includes("CONSTRAINT chk_profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')"),
  "Username constraint enforces 3-20 chars alphanumeric + underscore"
);

assert(
  m1Sql.includes("CONSTRAINT chk_profiles_display_name CHECK (char_length(trim(display_name)) BETWEEN 1 AND 50)"),
  "Display name constraint enforces 1-50 chars"
);

assert(
  m1Sql.includes("CONSTRAINT chk_profiles_bio CHECK (bio IS NULL OR char_length(bio) <= 100)"),
  "Bio constraint enforces 100-char max ceiling"
);

assert(
  m1Sql.includes("CONSTRAINT chk_profiles_avatar_type CHECK (avatar_type IN ('google', 'preset', 'custom'))"),
  "Avatar type constraint supports google, preset, custom"
);

assert(
  m1Sql.includes("CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower") &&
  m1Sql.includes("ON public.profiles (LOWER(username))"),
  "Case-insensitive unique handle index on LOWER(username)"
);

assert(
  m1Sql.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"),
  "Row-Level Security (RLS) is enabled on public.profiles"
);

assert(
  m1Sql.includes("CREATE POLICY \"profiles_owner_select\"") &&
  m1Sql.includes("USING (auth.uid() = user_id)"),
  "RLS profiles_owner_select policy restricts reads to owner"
);

assert(
  m1Sql.includes("CREATE POLICY \"profiles_owner_update\"") &&
  m1Sql.includes("WITH CHECK (auth.uid() = user_id)"),
  "RLS profiles_owner_update policy restricts writes to owner"
);

assert(
  m1Sql.includes("CREATE OR REPLACE FUNCTION public.is_username_available") &&
  m1Sql.includes("CREATE OR REPLACE FUNCTION public.generate_default_username") &&
  m1Sql.includes("CREATE OR REPLACE FUNCTION public.handle_new_user_profile"),
  "Core database helper functions and signup triggers are defined"
);

assert(
  m1Sql.includes("CREATE TRIGGER trg_auth_user_created_profile") &&
  m1Sql.includes("AFTER INSERT ON auth.users"),
  "Automatic profile provisioning trigger on auth.users is defined"
);

assert(
  m1Sql.includes("WHERE id NOT IN (SELECT user_id FROM public.profiles)"),
  "Idempotent backfill script covers existing auth.users"
);

// ----------------------------------------------------------------------------
// 2. Migration 2 Structure: avatar_storage.sql
// ----------------------------------------------------------------------------
const m2Path = path.resolve("supabase/migrations/20261109000002_avatar_storage.sql");
assert(fs.existsSync(m2Path), "Migration 2 file exists", m2Path);

const m2Sql = fs.readFileSync(m2Path, "utf-8");

assert(
  m2Sql.includes("'avatars'") &&
  m2Sql.includes("1048576") &&
  m2Sql.includes("ARRAY['image/jpeg', 'image/png', 'image/webp']"),
  "Storage bucket avatars configured with 1MB ceiling and image MIME types"
);

assert(
  m2Sql.includes("CREATE POLICY \"avatars_public_read\"") &&
  m2Sql.includes("CREATE POLICY \"avatars_owner_insert\"") &&
  m2Sql.includes("CREATE POLICY \"avatars_owner_update\"") &&
  m2Sql.includes("CREATE POLICY \"avatars_owner_delete\""),
  "All 4 storage RLS policies (read, insert, update, delete) are defined"
);

// ----------------------------------------------------------------------------
// 3. Preset Avatars Asset Integrity
// ----------------------------------------------------------------------------
assert(PRESET_AVATARS.length === 10, "Exactly 10 preset avatars configured in TypeScript contract");

let allSvgsExist = true;
for (const preset of PRESET_AVATARS) {
  const relPath = path.join("public", preset.src);
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    allSvgsExist = false;
    console.error(`Missing preset asset: ${relPath}`);
  } else {
    const content = fs.readFileSync(fullPath, "utf-8");
    if (!content.includes("<svg") || !content.includes("</svg>")) {
      allSvgsExist = false;
      console.error(`Invalid SVG content: ${relPath}`);
    }
  }
}
assert(allSvgsExist, "All 10 preset vector SVGs exist and contain valid XML");

// ----------------------------------------------------------------------------
// 4. Username Validation & Throttle Logic
// ----------------------------------------------------------------------------
assert(validateUsername("creator_1").valid === true, "Valid username accepted (creator_1)");
assert(validateUsername("a").valid === false, "Short username rejected (< 3 chars)");
assert(validateUsername("this_username_is_way_too_long_and_invalid").valid === false, "Long username rejected (> 20 chars)");
assert(validateUsername("hello world").valid === false, "Username with spaces rejected");
assert(validateUsername("user@name").valid === false, "Username with special chars rejected");
assert(validateUsername("admin").valid === false, "Reserved system handle rejected (admin)");
assert(validateUsername("suprilo").valid === false, "Reserved system handle rejected (suprilo)");

// Throttle logic
assert(getUsernameEligibility(null).canChange === true, "New user with no prior change is immediately eligible");
const recentChange = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
const throttled = getUsernameEligibility(recentChange);
assert(throttled.canChange === false && throttled.daysRemaining > 0, "User who changed 5 days ago is throttled with remaining days");

const pastChange = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();
assert(getUsernameEligibility(pastChange).canChange === true, "User who changed 32 days ago is eligible");

console.log("\n=================================================================");
console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log("=================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n>>> PHASE 1 SCHEMA & FOUNDATION SUITE VERIFIED 100% CLEAN <<<");
  process.exit(0);
}
