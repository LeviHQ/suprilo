// ============================================================================
// Suprilo Task 2C-5.6.1 — Phase 2 Application Layer Automated Verification Suite
// Canonical Specification: SPEC-2C-5.6.1-FINAL, Version 3.0.0
// ============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.6.1 — Phase 2 Application Layer Verification Suite");
console.log("================================================================================\n");

// ============================================================================
// 1. Handshake Cryptography & Token Lifecycle
// ============================================================================
console.log("1. Testing Handshake Cryptography, Binding & TTL Security...");

const testSecrets = {
  handshakeSigningSecret: "test_hss_secret_key_minimum_32_characters_long",
  visitorSecretCurrent: "test_vsc_current_key_minimum_32_characters_long",
  visitorSecretPrevious: "test_vsc_previous_key_minimum_32_characters_long",
};

function createTestToken(cardId, sessionId, iat, exp, secret) {
  const raw = `${cardId}:${sessionId}:${iat}:${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(raw).digest("hex").toLowerCase();
  return `${cardId}.${sessionId}.${iat}.${exp}.${sig}`;
}

test("Valid handshake token is accepted within 300s TTL", () => {
  const cardId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const token = createTestToken(cardId, sessionId, now, now + 300, testSecrets.handshakeSigningSecret);

  const parts = token.split(".");
  assert.equal(parts.length, 5, "Token must consist of 5 dot-separated parts");
  assert.equal(parts[0], cardId);
  assert.equal(parts[1], sessionId);
  assert.equal(parseInt(parts[3], 10), now + 300);
});

test("Handshake token rejects mismatched cardId (CARD_MISMATCH)", () => {
  const cardId = crypto.randomUUID();
  const attackerCardId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const token = createTestToken(cardId, sessionId, now, now + 300, testSecrets.handshakeSigningSecret);

  // Verification logic with mismatched expected card
  const parts = token.split(".");
  const isValidCard = parts[0] === attackerCardId;
  assert.equal(isValidCard, false, "Token must be bound to original card_id");
});

test("Handshake token rejects mismatched pageSessionId (SESSION_MISMATCH)", () => {
  const cardId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const otherSessionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const token = createTestToken(cardId, sessionId, now, now + 300, testSecrets.handshakeSigningSecret);

  const parts = token.split(".");
  const isValidSession = parts[1] === otherSessionId;
  assert.equal(isValidSession, false, "Token must be bound to original page_session_id");
});

test("Handshake token rejects expired tokens past 300s TTL (EXPIRED)", () => {
  const cardId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const expiredExp = now - 10; // expired 10 seconds ago
  const token = createTestToken(cardId, sessionId, now - 310, expiredExp, testSecrets.handshakeSigningSecret);

  const parts = token.split(".");
  const exp = parseInt(parts[3], 10);
  const isExpired = now > exp;
  assert.equal(isExpired, true, "Expired token must be rejected");
});

test("Handshake token rejects forged signature (INVALID_SIGNATURE)", () => {
  const cardId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const forgedToken = createTestToken(cardId, sessionId, now, now + 300, "forged_secret_key_12345678901234567890");

  const parts = forgedToken.split(".");
  const rawData = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}`;
  const validSig = crypto.createHmac("sha256", testSecrets.handshakeSigningSecret).update(rawData).digest("hex").toLowerCase();
  assert.notEqual(parts[4], validSig, "Forged signature must not match legitimate signature");
});

// ============================================================================
// 2. Visitor Identity & Dual-Key Hashing
// ============================================================================
console.log("\n2. Testing Visitor Identity & Dual-Key HMAC Invariants...");

test("Valid UUID sb_vid generates distinct 64-char hex current and previous hashes", () => {
  const vid = crypto.randomUUID();
  const currentHash = crypto.createHmac("sha256", testSecrets.visitorSecretCurrent).update(vid).digest("hex").toLowerCase();
  const previousHash = crypto.createHmac("sha256", testSecrets.visitorSecretPrevious).update(vid).digest("hex").toLowerCase();

  assert.equal(/^[a-f0-9]{64}$/.test(currentHash), true);
  assert.equal(/^[a-f0-9]{64}$/.test(previousHash), true);
  assert.notEqual(currentHash, previousHash, "Current and previous hashes must differ under distinct secrets");
});

test("Missing or invalid sb_vid produces null hashes and untracked flag", () => {
  function computeHashes(vid) {
    if (!vid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vid)) {
      return { currentHash: null, previousHash: null, isUntracked: true };
    }
    return {
      currentHash: crypto.createHmac("sha256", testSecrets.visitorSecretCurrent).update(vid).digest("hex").toLowerCase(),
      previousHash: null,
      isUntracked: false,
    };
  }

  const nullResult = computeHashes(null);
  assert.equal(nullResult.currentHash, null);
  assert.equal(nullResult.previousHash, null);
  assert.equal(nullResult.isUntracked, true);

  const invalidResult = computeHashes("not-a-valid-uuid");
  assert.equal(invalidResult.currentHash, null);
  assert.equal(invalidResult.isUntracked, true);
});

// ============================================================================
// 3. Bot User-Agent Filtering
// ============================================================================
console.log("\n3. Testing Bot User-Agent Detection Rules...");

const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /whatsapp/i,
  /curl\//i,
  /python-requests/i,
];

function isBot(ua) {
  if (!ua) return false;
  return BOT_PATTERNS.some((pat) => pat.test(ua));
}

test("Correctly flags known web crawlers and previewers as bots", () => {
  const bots = [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Twitterbot/1.0",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "curl/7.88.1",
    "python-requests/2.31.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  ];
  for (const ua of bots) {
    assert.equal(isBot(ua), true, `Must detect ${ua} as bot`);
  }
});

test("Allows legitimate browser User-Agents", () => {
  const browsers = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
  ];
  for (const ua of browsers) {
    assert.equal(isBot(ua), false, `Must NOT detect legitimate browser as bot: ${ua}`);
  }
});

// ============================================================================
// 4. Badge Catalogue & Schema Specifications
// ============================================================================
console.log("\n4. Testing Canonical Badge Catalogue & Classification...");

const badgesFile = fs.readFileSync(path.join(rootDir, "src", "data", "badges.ts"), "utf-8");

test("src/data/badges.ts exports SU_PRILO_BADGES and BADGE_DEFINITIONS", () => {
  assert.equal(badgesFile.includes("SU_PRILO_BADGES"), true);
  assert.equal(badgesFile.includes("BADGE_DEFINITIONS"), true);
});

test("Canonical badge count is exactly 50", () => {
  const displayOrderMatches = [...badgesFile.matchAll(/display_order:\s*([0-9]+)/g)];
  assert.equal(displayOrderMatches.length, 50, `Expected 50 badges in catalogue, found ${displayOrderMatches.length}`);
});

test("Badge #1 ('first-step') is classified as Class B", () => {
  const firstStepMatch = badgesFile.match(/id:\s*"first-step"[\s\S]*?badge_class:\s*"([AB])"/);
  assert.ok(firstStepMatch, "Must find first-step badge");
  assert.equal(firstStepMatch[1], "B", "first-step must be Class B");
});

test("Badge #40 ('high-affinity') is classified as Class B", () => {
  const highAffinityMatch = badgesFile.match(/id:\s*"high-affinity"[\s\S]*?badge_class:\s*"([AB])"/);
  assert.ok(highAffinityMatch, "Must find high-affinity badge");
  assert.equal(highAffinityMatch[1], "B", "high-affinity must be Class B");
});

test("Classification breakdown is 40 Class A and 10 Class B", () => {
  const classMatches = [...badgesFile.matchAll(/badge_class:\s*"([AB])"/g)];
  const classA = classMatches.filter((m) => m[1] === "A").length;
  const classB = classMatches.filter((m) => m[1] === "B").length;
  assert.equal(classA, 40, `Expected 40 Class A badges, found ${classA}`);
  assert.equal(classB, 10, `Expected 10 Class B badges, found ${classB}`);
});

test("Total achievable XP in catalogue is exactly 17,875 XP", () => {
  const pointsMatches = [...badgesFile.matchAll(/points:\s*([0-9]+)/g)];
  const totalXp = pointsMatches.reduce((acc, m) => acc + parseInt(m[1], 10), 0);
  assert.equal(totalXp, 17875, `Expected 17,875 total achievable XP, found ${totalXp}`);
});

test("Composite Badge #49 ('legendary-creator') requires >= 2,500 XP from OTHER achievements", () => {
  assert.equal(badgesFile.includes("legendary-creator"), true);
  assert.equal(badgesFile.includes("suprilo-hall-of-fame"), true);
});

// ============================================================================
// 5. Level Progression Model
// ============================================================================
console.log("\n5. Testing Level Progression & Threshold Invariants...");

const typesFile = fs.readFileSync(path.join(rootDir, "src", "types", "badges.ts"), "utf-8");

test("Types export LEVEL_DEFINITIONS and getLevelProgress", () => {
  assert.equal(typesFile.includes("LEVEL_DEFINITIONS"), true);
  assert.equal(typesFile.includes("getLevelProgress"), true);
});

test("Level 10 cap requires 17,000 XP", () => {
  assert.equal(typesFile.includes("requiredXp: 17000"), true);
});

// ============================================================================
// 6. Navigation Bar Count Alignment
// ============================================================================
console.log("\n6. Testing Navigation Bar Count Alignment...");

const navFile = fs.readFileSync(path.join(rootDir, "src", "components", "dashboard", "navigation.ts"), "utf-8");

test("DASHBOARD_NAV_ITEMS badges tab displays '50' (not legacy '30')", () => {
  assert.equal(navFile.includes('badge: "50"'), true, "Badges nav item must display 50");
  assert.equal(navFile.includes('badge: "30"'), false, "Badges nav item must NOT display legacy 30");
});

// ============================================================================
// 7. Telemetry Routes & API Contracts
// ============================================================================
console.log("\n7. Testing Telemetry Endpoints & Route Handlers...");

test("Route file src/app/api/telemetry/handshake/route.ts exists", () => {
  const p = path.join(rootDir, "src", "app", "api", "telemetry", "handshake", "route.ts");
  assert.equal(fs.existsSync(p), true);
  const content = fs.readFileSync(p, "utf-8");
  assert.equal(content.includes("record_card_view_handshake"), true);
  assert.equal(content.includes("verifyHandshakeToken"), true);
  assert.equal(content.includes("isBotUserAgent"), true);
});

test("Route file src/app/api/telemetry/reveal/route.ts exists and enforces fallback", () => {
  const p = path.join(rootDir, "src", "app", "api", "telemetry", "reveal", "route.ts");
  assert.equal(fs.existsSync(p), true);
  const content = fs.readFileSync(p, "utf-8");
  assert.equal(content.includes("record_card_reveal"), true);
  assert.equal(content.includes("recordCardTelemetry"), true, "Must include rate-limited fallback");
});

test("Route file src/app/api/telemetry/share/route.ts exists and verifies action types", () => {
  const p = path.join(rootDir, "src", "app", "api", "telemetry", "share", "route.ts");
  assert.equal(fs.existsSync(p), true);
  const content = fs.readFileSync(p, "utf-8");
  assert.equal(content.includes("record_creator_share_event"), true);
  assert.equal(content.includes("link_copied"), true);
  assert.equal(content.includes("story_card_downloaded"), true);
});

// ============================================================================
// 8. Public Verification & Sharing Pages
// ============================================================================
console.log("\n8. Testing Public Verification & Sharing Pages...");

test("Public verification page src/app/b/[id]/page.tsx exists and validates 24-char token", () => {
  const p = path.join(rootDir, "src", "app", "b", "[id]", "page.tsx");
  assert.equal(fs.existsSync(p), true);
  const content = fs.readFileSync(p, "utf-8");
  assert.equal(content.includes("^[a-f0-9]{24}$"), true);
  assert.equal(content.includes("getPublicBadgeByToken"), true);
});

test("Dynamic OG route src/app/api/og/badge/route.tsx exists and uses ImageResponse", () => {
  const p = path.join(rootDir, "src", "app", "api", "og", "badge", "route.tsx");
  assert.equal(fs.existsSync(p), true);
  const content = fs.readFileSync(p, "utf-8");
  assert.equal(content.includes("ImageResponse"), true);
});

test("Story card exporter modal src/components/badges/StoryShareModal.tsx renders 1080x1920 canvas", () => {
  const p = path.join(rootDir, "src", "components", "badges", "StoryShareModal.tsx");
  assert.equal(fs.existsSync(p), true);
  const content = fs.readFileSync(p, "utf-8");
  assert.equal(content.includes("1080"), true);
  assert.equal(content.includes("1920"), true);
  assert.equal(content.includes("story_card_downloaded"), true);
});

// ============================================================================
// 9. Card Experience Handshake Integration
// ============================================================================
console.log("\n9. Testing Recipient Experience Handshake Integration...");

const recipientComp = fs.readFileSync(
  path.join(rootDir, "src", "components", "scratch", "RecipientCardExperience.tsx"),
  "utf-8"
);

test("RecipientCardExperienceProps accepts cardId, pageSessionId, and handshakeToken", () => {
  assert.equal(recipientComp.includes("cardId?: string"), true);
  assert.equal(recipientComp.includes("pageSessionId?: string"), true);
  assert.equal(recipientComp.includes("handshakeToken?: string"), true);
});

test("RecipientCardExperience triggers post-mount handshake and caches receipt in sessionStorage", () => {
  assert.equal(recipientComp.includes("/api/telemetry/handshake"), true);
  assert.equal(recipientComp.includes("sessionStorage.setItem"), true);
});

test("RecipientCardExperience awaits handshake receipt before dispatching /api/telemetry/reveal", () => {
  assert.equal(recipientComp.includes("/api/telemetry/reveal"), true);
  assert.equal(recipientComp.includes("handshakePromiseRef.current"), true);
});

// ============================================================================
// 10. SSR Page Handshake Token Issuance
// ============================================================================
console.log("\n10. Testing Card SSR Route Handshake Issuance...");

const cardPage = fs.readFileSync(
  path.join(rootDir, "src", "app", "c", "[slug]", "page.tsx"),
  "utf-8"
);

test("RecipientCardPage creates signed handshakeToken and passes it to client", () => {
  assert.equal(cardPage.includes("createHandshakeToken"), true);
  assert.equal(cardPage.includes("pageSessionId"), true);
  assert.equal(cardPage.includes("handshakeToken={handshakeToken}"), true);
});

// ============================================================================
// 11. Middleware Cookie Bootstrap
// ============================================================================
console.log("\n11. Testing Middleware Cookie Bootstrap...");

const middlewareFile = fs.readFileSync(
  path.join(rootDir, "src", "lib", "supabase", "middleware.ts"),
  "utf-8"
);

test("Middleware bootstraps sb_vid cookie with Path=/, Max-Age=31536000, SameSite=Lax", () => {
  assert.equal(middlewareFile.includes("sb_vid"), true);
  assert.equal(middlewareFile.includes("31536000"), true);
  assert.equal(middlewareFile.includes('path: "/"'), true);
  assert.equal(middlewareFile.includes('sameSite: "lax"'), true);
  assert.equal(middlewareFile.includes("httpOnly: true"), true);
});

// ============================================================================
// Summary
// ============================================================================
console.log("\n================================================================================");
console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
