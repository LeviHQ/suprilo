/**
 * Phase 2 Validation Test Suite
 * Tests Phase 2 endpoints, notification anchors, telemetry privacy bypass, and export schema.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { deriveSafeActionUrl, SAFE_ALLOWLISTED_PATHS } from "../src/lib/server/notification-url.ts";

console.log("Starting Phase 2 Validation Tests...\n");

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
// Group 1: Notification URL Allowlisting & Anchors
// -------------------------------------------------------------
test("deriveSafeActionUrl allows /profile/settings#profile-identity anchor", () => {
  const url = deriveSafeActionUrl("SYSTEM", { url: "/profile/settings#profile-identity" });
  assert.equal(url, "/profile/settings#profile-identity");
});

test("deriveSafeActionUrl allows /profile/settings#creator-handle anchor", () => {
  const url = deriveSafeActionUrl("SYSTEM", { url: "/profile/settings#creator-handle" });
  assert.equal(url, "/profile/settings#creator-handle");
});

test("deriveSafeActionUrl allows /profile/settings#avatar-studio anchor", () => {
  const url = deriveSafeActionUrl("SYSTEM", { url: "/profile/settings#avatar-studio" });
  assert.equal(url, "/profile/settings#avatar-studio");
});

test("deriveSafeActionUrl allows /profile/settings#data-privacy anchor", () => {
  const url = deriveSafeActionUrl("SYSTEM", { url: "/profile/settings#data-privacy" });
  assert.equal(url, "/profile/settings#data-privacy");
});

test("deriveSafeActionUrl rejects arbitrary external URLs for SYSTEM type", () => {
  const url = deriveSafeActionUrl("SYSTEM", { url: "https://malicious.com/steal" });
  assert.equal(url, "/profile");
});

test("deriveSafeActionUrl rejects javascript: URI schemes", () => {
  const url = deriveSafeActionUrl("SYSTEM", { url: "javascript:alert(1)" });
  assert.equal(url, "/profile");
});

test("deriveSafeActionUrl preserves gamification card reveal path", () => {
  const url = deriveSafeActionUrl("CARD_REVEAL", { card_id: "test-card-uuid" });
  assert.equal(url, "/c/test-card-uuid");
});

test("deriveSafeActionUrl preserves gamification badge path", () => {
  const url = deriveSafeActionUrl("BADGE_UNLOCKED", { badge_id: "first_scratch" });
  assert.equal(url, "/b/first_scratch");
});

// -------------------------------------------------------------
// Group 2: Route Files Existence & Exports
// -------------------------------------------------------------
const requiredRoutes = [
  { path: "src/app/api/user/profile/route.ts", methods: ["GET", "PATCH"] },
  { path: "src/app/api/user/check-username/route.ts", methods: ["GET"] },
  { path: "src/app/api/user/update-username/route.ts", methods: ["POST"] },
  { path: "src/app/api/user/privacy/route.ts", methods: ["PATCH"] },
  { path: "src/app/api/user/export-data/route.ts", methods: ["GET"] },
];

for (const route of requiredRoutes) {
  test(`API Route exists: ${route.path}`, () => {
    assert.ok(fs.existsSync(route.path), `File should exist at ${route.path}`);
    const content = fs.readFileSync(route.path, "utf-8");
    for (const method of route.methods) {
      assert.ok(
        content.includes(`export async function ${method}`),
        `${route.path} should export async function ${method}`
      );
    }
  });
}

// -------------------------------------------------------------
// Group 3: Telemetry Privacy Checks in Handshake and Reveal
// -------------------------------------------------------------
test("Telemetry Handshake checks creator allow_card_analytics", () => {
  const handshakeContent = fs.readFileSync("src/app/api/telemetry/handshake/route.ts", "utf-8");
  assert.ok(
    handshakeContent.includes("allow_card_analytics"),
    "Handshake route must query allow_card_analytics"
  );
  assert.ok(
    handshakeContent.includes("creator_analytics_disabled"),
    "Handshake route must include creator_analytics_disabled response property"
  );
});

test("Telemetry Reveal checks creator allow_card_analytics in verified and fallback paths", () => {
  const revealContent = fs.readFileSync("src/app/api/telemetry/reveal/route.ts", "utf-8");
  assert.ok(
    revealContent.includes("allow_card_analytics"),
    "Reveal route must query allow_card_analytics"
  );
  assert.ok(
    revealContent.includes("analytics_disabled: true"),
    "Reveal route must return analytics_disabled when opted out"
  );
});

test("Legacy Reveal checks creator allow_card_analytics", () => {
  const legacyContent = fs.readFileSync("src/app/api/cards/[slug]/reveal/route.ts", "utf-8");
  assert.ok(
    legacyContent.includes("allow_card_analytics"),
    "Legacy reveal route must query allow_card_analytics"
  );
  assert.ok(
    legacyContent.includes("analytics_disabled: true"),
    "Legacy reveal route must return analytics_disabled when opted out"
  );
});

// -------------------------------------------------------------
// Group 4: Client Notification Redirection Verification
// -------------------------------------------------------------
test("NotificationBell intercepts settings anchor URLs for immediate redirection", () => {
  const bellContent = fs.readFileSync("src/components/notifications/NotificationBell.tsx", "utf-8");
  assert.ok(
    bellContent.includes('item.action_url.startsWith("/profile/settings#")'),
    "NotificationBell must check for settings anchors"
  );
  assert.ok(
    bellContent.includes("router.push(item.action_url)"),
    "NotificationBell must invoke router.push on settings notifications"
  );
});

test("NotificationsPage intercepts settings anchor URLs for immediate redirection", () => {
  const pageContent = fs.readFileSync("src/app/profile/notifications/page.tsx", "utf-8");
  assert.ok(
    pageContent.includes('item.action_url.startsWith("/profile/settings#")'),
    "NotificationsPage must check for settings anchors"
  );
  assert.ok(
    pageContent.includes("router.push(item.action_url)"),
    "NotificationsPage must invoke router.push on settings notifications"
  );
});

// -------------------------------------------------------------
// Group 5: Settings Notification Helper Functions
// -------------------------------------------------------------
test("Settings notification dispatcher exports all required triggers", () => {
  const content = fs.readFileSync("src/lib/server/settings-notifications.ts", "utf-8");
  const expectedHelpers = [
    "notifyDisplayNameUpdated",
    "notifyHandleReserved",
    "notifyBioUpdated",
    "notifyAvatarUpdated",
    "notifyPrivacyUpdated",
    "notifyDataExported",
  ];
  for (const helper of expectedHelpers) {
    assert.ok(
      content.includes(`export async function ${helper}`),
      `Helper ${helper} must be exported`
    );
  }
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\nPhase 2 Test Results: ${passed}/${total} Passed.`);
if (passed === total) {
  console.log("All Phase 2 Validation Tests Passed Successfully!\n");
} else {
  process.exit(1);
}
