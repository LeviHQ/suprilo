/**
 * Phase 3 Validation Test Suite
 * Tests Phase 3 UI components, anchor IDs, optimistic hooks, and avatar resolution.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { getResolvedAvatarUrl, PRESET_AVATARS } from "../src/types/profile.ts";

console.log("Starting Phase 3 Validation Tests...\n");

let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`  PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${description}`);
    console.error(err);
  }
}

// -------------------------------------------------------------
// Group 1: Component Files Existence
// -------------------------------------------------------------
const componentFiles = [
  "src/components/settings/AvatarCropModal.tsx",
  "src/components/settings/AvatarStudioCard.tsx",
  "src/components/settings/ProfileIdentityCard.tsx",
  "src/components/settings/CreatorMetaOverviewCard.tsx",
  "src/components/settings/UsernameReservationCard.tsx",
  "src/components/settings/SecuritySessionCard.tsx",
  "src/components/settings/DataPrivacyCard.tsx",
  "src/components/settings/DangerZoneCard.tsx",
  "src/components/settings/DeleteAccountConfirmModal.tsx",
  "src/app/profile/settings/page.tsx",
  "src/app/profile/settings/loading.tsx",
  "src/app/api/user/delete-account/route.ts",
];

for (const file of componentFiles) {
  test(`Component / Route file exists: ${file}`, () => {
    assert.ok(fs.existsSync(file), `Expected file to exist at ${file}`);
  });
}

// -------------------------------------------------------------
// Group 2: Anchor IDs for Notification and Direct Navigation
// -------------------------------------------------------------
const anchorChecks = [
  { file: "src/components/settings/CreatorMetaOverviewCard.tsx", anchor: 'id="creator-meta"' },
  { file: "src/components/settings/ProfileIdentityCard.tsx", anchor: 'id="profile-identity"' },
  { file: "src/components/settings/UsernameReservationCard.tsx", anchor: 'id="creator-handle"' },
  { file: "src/components/settings/AvatarStudioCard.tsx", anchor: 'id="avatar-studio"' },
  { file: "src/components/settings/SecuritySessionCard.tsx", anchor: 'id="security-session"' },
  { file: "src/components/settings/DataPrivacyCard.tsx", anchor: 'id="data-privacy"' },
  { file: "src/components/settings/DangerZoneCard.tsx", anchor: 'id="danger-zone"' },
];

for (const check of anchorChecks) {
  test(`Anchor ID exists: ${check.anchor} in ${check.file}`, () => {
    const content = fs.readFileSync(check.file, "utf-8");
    assert.ok(content.includes(check.anchor), `Expected ${check.file} to contain ${check.anchor}`);
  });
}

// -------------------------------------------------------------
// Group 3: Functional Rule Constraints in UI Components
// -------------------------------------------------------------
test("ProfileIdentityCard enforces max 100 character bio ceiling", () => {
  const content = fs.readFileSync("src/components/settings/ProfileIdentityCard.tsx", "utf-8");
  assert.ok(content.includes("maxLength={100}"), "Must set maxLength={100} on textarea");
  assert.ok(content.includes("cleanBio.length > 100") || content.includes("bio.length > 100"), "Must validate bio length > 100");
  assert.ok(content.includes("setOptimisticProfile"), "Must call setOptimisticProfile for instant app sync");
});

test("UsernameReservationCard checks 30-day throttle and has confirmation modal", () => {
  const content = fs.readFileSync("src/components/settings/UsernameReservationCard.tsx", "utf-8");
  assert.ok(content.includes("getUsernameEligibility"), "Must import and use getUsernameEligibility");
  assert.ok(content.includes("isConfirmModalOpen"), "Must control confirmation modal state");
  assert.ok(content.includes("Confirm Handle Reservation"), "Must have confirmation modal title");
  assert.ok(content.includes("30-Day Lock Commitment"), "Must explain 30-day throttle lock commitment");
});

test("AvatarCropModal enforces 1MB ceiling, image types, and offscreen canvas export", () => {
  const content = fs.readFileSync("src/components/settings/AvatarCropModal.tsx", "utf-8");
  assert.ok(content.includes("1024 * 1024"), "Must check 1MB file limit");
  assert.ok(content.includes("image/webp"), "Must export WebP canvas blob");
  assert.ok(content.includes("MIN_DIMENSION"), "Must enforce minimum dimensions");
});

test("DeleteAccountConfirmModal requires dual-input exact matching", () => {
  const content = fs.readFileSync("src/components/settings/DeleteAccountConfirmModal.tsx", "utf-8");
  assert.ok(content.includes('inputDelete.trim() === "DELETE"'), 'Must check exact "DELETE" match');
  assert.ok(content.includes("isNameMatched"), "Must check display name exact match");
  assert.ok(content.includes("canSubmit = isNameMatched && isDeleteMatched"), "Must require both conditions to enable submission");
});

test("Permanent deletion route purges storage, database records, and auth user", () => {
  const content = fs.readFileSync("src/app/api/user/delete-account/route.ts", "utf-8");
  assert.ok(content.includes("storage.from(\"avatars\")"), "Must purge avatars storage");
  assert.ok(content.includes("storage.from(\"card-photos\")"), "Must purge card-photos storage");
  assert.ok(content.includes(".from(\"cards\").delete()"), "Must cascade delete cards");
  assert.ok(content.includes(".from(\"profiles\").delete()"), "Must delete profile");
  assert.ok(content.includes("auth.admin.deleteUser"), "Must delete auth user record");
});

// -------------------------------------------------------------
// Group 4: Avatar URL Resolution Unit Tests
// -------------------------------------------------------------
test("getResolvedAvatarUrl returns Google photo if avatar_type is google", () => {
  const profile = {
    avatar_type: "google",
    avatar_preset_id: null,
    custom_avatar_url: null,
  };
  const url = getResolvedAvatarUrl(profile, "https://google.com/photo.jpg");
  assert.equal(url, "https://google.com/photo.jpg");
});

test("getResolvedAvatarUrl returns preset SVG path when avatar_type is preset", () => {
  const profile = {
    avatar_type: "preset",
    avatar_preset_id: "preset-female-2",
    custom_avatar_url: null,
  };
  const url = getResolvedAvatarUrl(profile, "https://google.com/photo.jpg");
  assert.equal(url, "/avatars/presets/preset-female-2.svg");
});

test("getResolvedAvatarUrl returns custom storage URL when avatar_type is custom", () => {
  const profile = {
    avatar_type: "custom",
    avatar_preset_id: null,
    custom_avatar_url: "https://supabase.co/storage/v1/object/public/avatars/user/avatar.webp",
  };
  const url = getResolvedAvatarUrl(profile, "https://google.com/photo.jpg");
  assert.equal(url, "https://supabase.co/storage/v1/object/public/avatars/user/avatar.webp");
});

test("getResolvedAvatarUrl returns fallback photo if profile is null", () => {
  const url = getResolvedAvatarUrl(null, "https://google.com/default.jpg");
  assert.equal(url, "https://google.com/default.jpg");
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\nPhase 3 Test Results: ${passed}/${total} Passed.`);
if (passed === total) {
  console.log("All Phase 3 Validation Tests Passed Successfully!\n");
} else {
  process.exit(1);
}
