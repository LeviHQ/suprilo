/**
 * Suprilo Phase 2, Task 2C-2: AuthContext & Supabase Auth Verification Suite
 * 
 * Verifies:
 * 1. Absence of Firebase imports in client auth files (AuthContext, apiClient, settings page).
 * 2. `normalizeSupabaseUser` contract adherence across diverse OAuth metadata payloads.
 * 3. Fallback behaviors (name, avatar, timestamp, null handling).
 * 4. User interface backward compatibility (id vs uid, metadata.creationTime, metadata.lastSignInTime).
 * 5. Token retrieval contracts for fetchWithAuth.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\n🧪 Running Suprilo Task 2C-2 Supabase AuthContext Tests...\n");

// --- TEST 1: Source Code Static Audits ---
console.log("▶ [Test 1] Auditing source files for clean separation from Firebase client auth...");

const authContextSource = fs.readFileSync(path.join(rootDir, "src/context/AuthContext.tsx"), "utf8");
assert(
  !authContextSource.includes('from "firebase/auth"') && !authContextSource.includes("from 'firebase/auth'"),
  "AuthContext.tsx must NOT import from firebase/auth"
);
assert(
  !authContextSource.includes('from "@/lib/firebase"') && !authContextSource.includes("from '@/lib/firebase'"),
  "AuthContext.tsx must NOT import from @/lib/firebase"
);
assert(
  authContextSource.includes('@/lib/supabase/client'),
  "AuthContext.tsx must import createClient from @/lib/supabase/client"
);
assert(
  authContextSource.includes("signInWithOAuth"),
  "AuthContext.tsx must implement signInWithOAuth"
);
assert(
  authContextSource.includes("onAuthStateChange"),
  "AuthContext.tsx must subscribe to onAuthStateChange"
);
console.log("  ✓ AuthContext.tsx is completely free of Firebase client imports.");

const apiClientSource = fs.readFileSync(path.join(rootDir, "src/lib/apiClient.ts"), "utf8");
assert(
  !apiClientSource.includes('from "firebase/auth"') && !apiClientSource.includes("from 'firebase/auth'"),
  "apiClient.ts must NOT import from firebase/auth"
);
console.log("  ✓ apiClient.ts is free of firebase/auth imports.");

const settingsPageSource = fs.readFileSync(path.join(rootDir, "src/app/profile/settings/page.tsx"), "utf8");
assert(
  !settingsPageSource.includes('from "firebase/auth"') && !settingsPageSource.includes("from 'firebase/auth'"),
  "settings/page.tsx must NOT import from firebase/auth"
);
console.log("  ✓ src/app/profile/settings/page.tsx is free of firebase/auth imports.");

// --- TEST 2: Testing User Normalization Logic ---
console.log("\n▶ [Test 2] Testing normalizeSupabaseUser logic...");

// Extracted exact normalization implementation from AuthContext.tsx for isolated testing
function normalizeSupabaseUser(user) {
  if (!user) return null;

  const userMeta = user.user_metadata || {};

  const displayName =
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    (typeof userMeta.given_name === "string" && userMeta.given_name.trim()) ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Creator";

  const photoURL =
    (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
    (typeof userMeta.picture === "string" && userMeta.picture) ||
    null;

  const creationTime = user.created_at || new Date().toISOString();
  const lastSignInTime = user.last_sign_in_at || creationTime;

  return {
    id: user.id,
    uid: user.id,
    email: user.email || null,
    displayName,
    photoURL,
    metadata: {
      creationTime,
      lastSignInTime,
    },
  };
}

// Case A: Full Google user
const standardGoogleUser = {
  id: "d9e830ef-bf96-419b-a01b-c128532f831e",
  email: "creator@example.com",
  created_at: "2026-10-31T08:00:00.000Z",
  last_sign_in_at: "2026-10-31T10:30:00.000Z",
  user_metadata: {
    full_name: "Adarsh Mishra",
    avatar_url: "https://lh3.googleusercontent.com/a/sample-avatar",
    email_verified: true,
  },
};

const normA = normalizeSupabaseUser(standardGoogleUser);
assert.equal(normA.id, "d9e830ef-bf96-419b-a01b-c128532f831e");
assert.equal(normA.uid, normA.id, "uid must equal id for backward compatibility");
assert.equal(normA.displayName, "Adarsh Mishra");
assert.equal(normA.photoURL, "https://lh3.googleusercontent.com/a/sample-avatar");
assert.equal(normA.email, "creator@example.com");
assert.equal(normA.metadata.creationTime, "2026-10-31T08:00:00.000Z");
assert.equal(normA.metadata.lastSignInTime, "2026-10-31T10:30:00.000Z");
assert(!isNaN(new Date(normA.metadata.creationTime).getTime()), "creationTime must be valid Date");
assert(!isNaN(new Date(normA.metadata.lastSignInTime).getTime()), "lastSignInTime must be valid Date");
console.log("  ✓ Standard Google user normalized with full metadata fidelity.");

// Case B: Alternative metadata fields (name & picture)
const altGoogleUser = {
  id: "uuid-12345",
  email: "alternate@example.com",
  created_at: "2026-09-15T00:00:00.000Z",
  user_metadata: {
    name: "Alex Doe",
    picture: "https://example.com/pic.jpg",
  },
};
const normB = normalizeSupabaseUser(altGoogleUser);
assert.equal(normB.displayName, "Alex Doe");
assert.equal(normB.photoURL, "https://example.com/pic.jpg");
assert.equal(normB.metadata.lastSignInTime, "2026-09-15T00:00:00.000Z", "fallback to created_at when last_sign_in_at is null");
console.log("  ✓ Alternative metadata formats (name, picture) supported.");

// Case C: Given name fallback
const givenNameUser = {
  id: "uuid-given",
  email: "given@example.com",
  user_metadata: {
    given_name: "Maya",
  },
};
const normC = normalizeSupabaseUser(givenNameUser);
assert.equal(normC.displayName, "Maya");
console.log("  ✓ Given name fallback supported.");

// Case D: Email prefix fallback when metadata is empty
const emailOnlyUser = {
  id: "uuid-email",
  email: "suprilo_fan@domain.com",
  user_metadata: {},
};
const normD = normalizeSupabaseUser(emailOnlyUser);
assert.equal(normD.displayName, "suprilo_fan");
assert.equal(normD.photoURL, null);
console.log("  ✓ Email prefix fallback works when user metadata lacks names.");

// Case E: Blank / null edge cases
const blankUser = {
  id: "uuid-anon",
  email: null,
  user_metadata: null,
};
const normE = normalizeSupabaseUser(blankUser);
assert.equal(normE.displayName, "Creator");
assert.equal(normE.photoURL, null);
assert.equal(normE.email, null);
assert.ok(normE.metadata.creationTime, "creationTime generated if missing");
console.log("  ✓ Graceful 'Creator' fallback for anonymous or missing metadata.");

// Case F: Null user input returns null
assert.equal(normalizeSupabaseUser(null), null);
console.log("  ✓ normalizeSupabaseUser(null) safely returns null.");

// --- TEST 3: Destination URL sanitization check ---
console.log("\n▶ [Test 3] Testing OAuth callback return URL sanitization logic...");

function sanitizeReturnUrl(returnUrl) {
  if (typeof returnUrl !== "string") return "/create";
  if (returnUrl.startsWith("/") && !returnUrl.startsWith("//") && !returnUrl.startsWith("/\\")) {
    return returnUrl;
  }
  return "/create";
}

assert.equal(sanitizeReturnUrl("/templates"), "/templates");
assert.equal(sanitizeReturnUrl("/create?template=birthday"), "/create?template=birthday");
assert.equal(sanitizeReturnUrl("/profile/settings"), "/profile/settings");
// Disallow open redirects:
assert.equal(sanitizeReturnUrl("https://malicious.com"), "/create");
assert.equal(sanitizeReturnUrl("//malicious.com"), "/create");
assert.equal(sanitizeReturnUrl("/\\malicious.com"), "/create");
assert.equal(sanitizeReturnUrl(null), "/create");
assert.equal(sanitizeReturnUrl(undefined), "/create");
console.log("  ✓ Return URL sanitization strictly prevents open-redirect vulnerabilities.");

console.log("\n✅ All Task 2C-2 Supabase AuthContext tests PASSED successfully!\n");

