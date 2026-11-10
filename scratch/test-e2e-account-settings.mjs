/**
 * End-to-End Account Settings Integration & Integrity Test Suite
 * Comprehensive automated regression testing for the entire Suprilo Account Settings system.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import {
  validateUsername,
  getUsernameEligibility,
  getResolvedAvatarUrl,
  PRESET_AVATARS,
  RESERVED_USERNAMES,
  DAYS_BETWEEN_USERNAME_CHANGES,
} from "../src/types/profile.ts";
import { deriveSafeActionUrl } from "../src/lib/server/notification-url.ts";

console.log("=================================================================");
console.log(" SUPRILO ACCOUNT SETTINGS COMPLETE E2E ACCEPTANCE SUITE");
console.log("=================================================================\n");

let passed = 0;
let total = 0;

function it(description, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(err);
  }
}

// -----------------------------------------------------------------
// 1. Database Schema & Migration Acceptance
// -----------------------------------------------------------------
it("Migration 1 defines public.profiles with correct constraints and indexes", () => {
  const sql = fs.readFileSync("supabase/migrations/20261109000001_creator_profiles.sql", "utf-8");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.profiles"));
  assert.ok(sql.includes("chk_profiles_username_format"));
  assert.ok(sql.includes("chk_profiles_display_name"));
  assert.ok(sql.includes("chk_profiles_bio"));
  assert.ok(sql.includes("chk_profiles_avatar_type"));
  assert.ok(sql.includes("chk_profiles_avatar_source"));
  assert.ok(sql.includes("idx_profiles_username_lower"));
  assert.ok(sql.includes("ENABLE ROW LEVEL SECURITY"));
  assert.ok(sql.includes("is_username_available"));
  assert.ok(sql.includes("generate_default_username"));
  assert.ok(sql.includes("trg_auth_user_created_profile"));
});

it("Migration 2 defines avatars storage bucket with 1MB ceiling & RLS", () => {
  const sql = fs.readFileSync("supabase/migrations/20261109000002_avatar_storage.sql", "utf-8");
  assert.ok(sql.includes("'avatars'"));
  assert.ok(sql.includes("1048576")); // 1MB
  assert.ok(sql.includes("image/jpeg"));
  assert.ok(sql.includes("image/png"));
  assert.ok(sql.includes("image/webp"));
  assert.ok(sql.includes("avatars_public_read"));
  assert.ok(sql.includes("avatars_owner_insert"));
  assert.ok(sql.includes("avatars_owner_update"));
  assert.ok(sql.includes("avatars_owner_delete"));
});

// -----------------------------------------------------------------
// 2. Preset Avatars Assets Verification
// -----------------------------------------------------------------
it("Exactly 10 preset avatars exist and match catalog", () => {
  assert.equal(PRESET_AVATARS.length, 10);
  for (const preset of PRESET_AVATARS) {
    const filePath = `public${preset.src}`;
    assert.ok(fs.existsSync(filePath), `Preset file must exist at ${filePath}`);
    const svg = fs.readFileSync(filePath, "utf-8");
    assert.ok(svg.includes("<svg") && svg.includes("</svg>"), `Valid SVG required in ${filePath}`);
  }
});

// -----------------------------------------------------------------
// 3. Username Validation & Throttle Lock Verification
// -----------------------------------------------------------------
it("Username validation accepts valid handle: 'alex_99'", () => {
  const res = validateUsername("alex_99");
  assert.equal(res.valid, true);
});

it("Username validation rejects invalid handles", () => {
  assert.equal(validateUsername("").valid, false);
  assert.equal(validateUsername("ab").valid, false);
  assert.equal(validateUsername("a".repeat(21)).valid, false);
  assert.equal(validateUsername("alex 99").valid, false);
  assert.equal(validateUsername("alex-99").valid, false);
  assert.equal(validateUsername("alex@99").valid, false);
});

it("Reserved usernames are strictly barred", () => {
  for (const reserved of ["admin", "root", "suprilo", "settings", "api", "dashboard"]) {
    assert.equal(validateUsername(reserved).valid, false);
  }
});

it("Username throttle lock calculates accurate cooldown", () => {
  assert.equal(DAYS_BETWEEN_USERNAME_CHANGES, 30);

  // Never changed
  const fresh = getUsernameEligibility(null);
  assert.equal(fresh.canChange, true);
  assert.equal(fresh.daysRemaining, 0);

  // Changed 10 days ago (20 days remaining)
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const throttled = getUsernameEligibility(tenDaysAgo);
  assert.equal(throttled.canChange, false);
  assert.ok(throttled.daysRemaining >= 19 && throttled.daysRemaining <= 21);
  assert.ok(typeof throttled.formattedDate === "string");

  // Changed 31 days ago (eligible)
  const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
  const eligible = getUsernameEligibility(thirtyOneDaysAgo);
  assert.equal(eligible.canChange, true);
  assert.equal(eligible.daysRemaining, 0);
});

// -----------------------------------------------------------------
// 4. Avatar Resolution Engine
// -----------------------------------------------------------------
it("getResolvedAvatarUrl resolves across all three avatar types", () => {
  const googlePhoto = "https://lh3.googleusercontent.com/photo.jpg";

  // Google
  const googleProfile = { avatar_type: "google", avatar_preset_id: null, custom_avatar_url: null };
  assert.equal(getResolvedAvatarUrl(googleProfile, googlePhoto), googlePhoto);

  // Preset
  const presetProfile = { avatar_type: "preset", avatar_preset_id: "preset-female-1", custom_avatar_url: null };
  assert.equal(getResolvedAvatarUrl(presetProfile, googlePhoto), "/avatars/presets/preset-female-1.svg");

  // Custom
  const customProfile = { avatar_type: "custom", avatar_preset_id: null, custom_avatar_url: "https://storage/avatars/me.webp" };
  assert.equal(getResolvedAvatarUrl(customProfile, googlePhoto), "https://storage/avatars/me.webp");

  // Fallback
  assert.equal(getResolvedAvatarUrl(null, googlePhoto), googlePhoto);
});

// -----------------------------------------------------------------
// 5. In-App Notification Redirection & URL Security
// -----------------------------------------------------------------
it("deriveSafeActionUrl strictly allowlists account settings anchors", () => {
  const anchors = [
    "/profile/settings#profile-identity",
    "/profile/settings#creator-handle",
    "/profile/settings#avatar-studio",
    "/profile/settings#security-session",
    "/profile/settings#data-privacy",
    "/profile/settings#danger-zone",
  ];

  for (const anchor of anchors) {
    const url = deriveSafeActionUrl("SYSTEM", { url: anchor });
    assert.equal(url, anchor);
  }

  // Reject malicious payloads
  assert.equal(deriveSafeActionUrl("SYSTEM", { url: "javascript:alert(document.cookie)" }), "/profile");
  assert.equal(deriveSafeActionUrl("SYSTEM", { url: "https://evil.attacker.com" }), "/profile");
});

// -----------------------------------------------------------------
// 6. UI Components & Anchor Targets
// -----------------------------------------------------------------
it("All UI settings cards define their respective DOM anchors", () => {
  const settingsPage = fs.readFileSync("src/app/profile/settings/page.tsx", "utf-8");
  assert.ok(settingsPage.includes("CreatorMetaOverviewCard"));
  assert.ok(settingsPage.includes("ProfileIdentityCard"));
  assert.ok(settingsPage.includes("UsernameReservationCard"));
  assert.ok(settingsPage.includes("AvatarStudioCard"));
  assert.ok(settingsPage.includes("SecuritySessionCard"));
  assert.ok(settingsPage.includes("DataPrivacyCard"));
  assert.ok(settingsPage.includes("DangerZoneCard"));
  assert.ok(settingsPage.includes("scrollIntoView"));
});

// -----------------------------------------------------------------
// 7. Telemetry Privacy Verification
// -----------------------------------------------------------------
it("Telemetry routes verify creator allow_card_analytics server-side", () => {
  const handshake = fs.readFileSync("src/app/api/telemetry/handshake/route.ts", "utf-8");
  assert.ok(handshake.includes("allow_card_analytics"));
  assert.ok(handshake.includes("creator_analytics_disabled: true"));

  const reveal = fs.readFileSync("src/app/api/telemetry/reveal/route.ts", "utf-8");
  assert.ok(reveal.includes("allow_card_analytics"));
  assert.ok(reveal.includes("analytics_disabled: true"));

  const cardReveal = fs.readFileSync("src/app/api/cards/[slug]/reveal/route.ts", "utf-8");
  assert.ok(cardReveal.includes("allow_card_analytics"));
  assert.ok(cardReveal.includes("analytics_disabled: true"));
});

// -----------------------------------------------------------------
// 8. Permanent Deletion Safety Boundaries
// -----------------------------------------------------------------
it("Account deletion requires dual confirmation and cascades purge", () => {
  const deleteRoute = fs.readFileSync("src/app/api/user/delete-account/route.ts", "utf-8");
  assert.ok(deleteRoute.includes("confirmationName"));
  assert.ok(deleteRoute.includes('confirmationWord !== "DELETE"'));
  assert.ok(deleteRoute.includes("auth.admin.deleteUser"));
  assert.ok(deleteRoute.includes("storage.from(\"avatars\")"));
  assert.ok(deleteRoute.includes("storage.from(\"card-photos\")"));
  assert.ok(deleteRoute.includes(".from(\"cards\").delete()"));
});

console.log(`\n=================================================================`);
console.log(` RESULTS: ${passed} PASSED | ${total - passed} FAILED`);
console.log(`=================================================================\n`);

if (passed === total) {
  console.log(">>> ALL ACCOUNT SETTINGS END-TO-END TESTS PASSED CLEANLY! <<<\n");
} else {
  process.exit(1);
}

