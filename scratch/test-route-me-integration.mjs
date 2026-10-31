/**
 * Live HTTP Integration test for GET /api/auth/me
 * Tests real Next.js server handling of sessions, tokens, and error cases.
 */

import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log(`\n🧪 Running Live HTTP GET /api/auth/me Integration Tests against ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;

function check(condition, desc) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    failed++;
  }
}

// 1. Unauthenticated request (no cookies, no headers)
console.log("▶ [Test 1] Testing unauthenticated request (no session)...");
const r1 = await fetch(`${BASE_URL}/api/auth/me`);
const j1 = await r1.json();
check(r1.status === 401, "Status code is 401");
check(j1.success === false, "success is false");
check(j1.error.code === "AUTH_SESSION_MISSING", "error.code is AUTH_SESSION_MISSING");

// 2. Query parameter spoofing attack
console.log("\n▶ [Test 2] Testing query parameter spoofing resistance...");
const r2 = await fetch(`${BASE_URL}/api/auth/me?uid=attacker&email=admin@suprilo.com&admin=true`);
const j2 = await r2.json();
check(r2.status === 401, "Spoofed request is rejected with 401");
check(j2.error.code === "AUTH_SESSION_MISSING", "Identity parameters completely ignored");

// 3. Malformed Authorization scheme
console.log("\n▶ [Test 3] Testing malformed Authorization header (Basic scheme)...");
const r3 = await fetch(`${BASE_URL}/api/auth/me`, {
  headers: { Authorization: "Basic dXNlcjpwYXNz" },
});
const j3 = await r3.json();
check(r3.status === 401, "Status code is 401");
check(j3.error.code === "AUTH_HEADER_MALFORMED", "error.code is AUTH_HEADER_MALFORMED");

// 4. Missing token in Bearer scheme
console.log("\n▶ [Test 4] Testing Bearer header with missing token...");
const r4 = await fetch(`${BASE_URL}/api/auth/me`, {
  headers: { Authorization: "Bearer " },
});
const j4 = await r4.json();
check(r4.status === 401, "Status code is 401");
check(j4.error.code === "AUTH_HEADER_MALFORMED", "error.code is AUTH_HEADER_MALFORMED");

// 5. Short token (< 10 chars)
console.log("\n▶ [Test 5] Testing Bearer header with short token (< 10 chars)...");
const r5 = await fetch(`${BASE_URL}/api/auth/me`, {
  headers: { Authorization: "Bearer short" },
});
const j5 = await r5.json();
check(r5.status === 401, "Status code is 401");
check(j5.error.code === "AUTH_TOKEN_EMPTY", "error.code is AUTH_TOKEN_EMPTY");

// 6. Cryptographically invalid JWT token
console.log("\n▶ [Test 6] Testing cryptographically invalid JWT token...");
const r6 = await fetch(`${BASE_URL}/api/auth/me`, {
  headers: { Authorization: "Bearer invalid_long_jwt_token_for_testing_purposes_12345" },
});
const j6 = await r6.json();
check(r6.status === 401, "Status code is 401");
check(j6.error.code === "AUTH_TOKEN_INVALID", "error.code is AUTH_TOKEN_INVALID");

// 7. Security data leak verification
console.log("\n▶ [Test 7] Verifying zero secrets, keys, or cookies leaked in responses...");
for (const response of [j1, j2, j3, j4, j5, j6]) {
  const serialized = JSON.stringify(response);
  check(!serialized.includes("secret"), "No secret keywords present");
  check(!serialized.includes("password"), "No password keywords present");
  check(!serialized.includes("cookie"), "No cookie data leaked");
}

console.log("\n=========================================");
console.log(`LIVE INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}
