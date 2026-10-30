import { verifyUserAuth } from "../src/lib/server/auth.ts";
import { isFirebaseAdminConfigured } from "../src/lib/server/firebaseAdmin.ts";

console.log("=========================================");
console.log("RUNNING SU_PRILO TASK 2B AUTH TESTS");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// TEST SUITE 1: VERIFY_USER_AUTH UNIT TESTS
// -------------------------------------------------------------
console.log("--- Test Suite 1: verifyUserAuth Unit Tests ---");

// 1. Missing header
const reqMissing = new Request("http://localhost:3000/api/auth/me");
const resMissing = await verifyUserAuth(reqMissing);
assert(!resMissing.success, "Missing header fails");
if (!resMissing.success) {
  assert(resMissing.status === 401, "Missing header status is 401");
  assert(resMissing.error.code === "AUTH_HEADER_MISSING", "Error code is AUTH_HEADER_MISSING");
}

// 2. Malformed scheme (Basic instead of Bearer)
const reqBasic = new Request("http://localhost:3000/api/auth/me", {
  headers: { Authorization: "Basic dXNlcjpwYXNz" },
});
const resBasic = await verifyUserAuth(reqBasic);
assert(!resBasic.success, "Basic auth scheme fails");
if (!resBasic.success) {
  assert(resBasic.status === 401, "Malformed header status is 401");
  assert(resBasic.error.code === "AUTH_HEADER_MALFORMED", "Error code is AUTH_HEADER_MALFORMED");
}

// 3. Empty Bearer token
const reqEmpty = new Request("http://localhost:3000/api/auth/me", {
  headers: { Authorization: "Bearer " },
});
const resEmpty = await verifyUserAuth(reqEmpty);
assert(!resEmpty.success, "Empty token fails");
if (!resEmpty.success) {
  assert(resEmpty.status === 401, "Empty token status is 401");
}

// 4. Short token (< 10 chars)
const reqShort = new Request("http://localhost:3000/api/auth/me", {
  headers: { Authorization: "Bearer short" },
});
const resShort = await verifyUserAuth(reqShort);
assert(!resShort.success, "Short token fails");
if (!resShort.success) {
  assert(resShort.status === 401, "Short token status is 401");
  assert(resShort.error.code === "AUTH_TOKEN_EMPTY", "Error code is AUTH_TOKEN_EMPTY");
}

// 5. Check Firebase Admin environment status
const isConfigured = isFirebaseAdminConfigured();
console.log(`\n[INFO] Firebase Admin Server Credentials Configured: ${isConfigured}`);

if (!isConfigured) {
  const reqUnconfigured = new Request("http://localhost:3000/api/auth/me", {
    headers: { Authorization: "Bearer some_valid_looking_token_1234567890" },
  });
  const resUnconfigured = await verifyUserAuth(reqUnconfigured);
  assert(!resUnconfigured.success, "Fails safely when server credentials are not yet set");
  if (!resUnconfigured.success) {
    assert(resUnconfigured.status === 503, "Returns 503 Service Unavailable when server lacks credentials");
    assert(resUnconfigured.error.code === "AUTH_SERVICE_UNAVAILABLE", "Error code is AUTH_SERVICE_UNAVAILABLE");
  }
}

// -------------------------------------------------------------
// TEST SUITE 2: HTTP ENDPOINT LIVE BEHAVIOR (/api/auth/me)
// -------------------------------------------------------------
console.log("\n--- Test Suite 2: HTTP Endpoint Simulation ---");

// Import the route GET handler directly
const { GET } = await import("../src/app/api/auth/me/route.ts");

const httpReqMissing = new Request("http://localhost:3000/api/auth/me");
const httpResMissing = await GET(httpReqMissing);
assert(httpResMissing.status === 401, "GET /api/auth/me without header returns 401");
const jsonMissing = await httpResMissing.json();
assert(jsonMissing.success === false, "JSON payload has success: false");
assert(jsonMissing.error.code === "AUTH_HEADER_MISSING", "JSON error code matches AUTH_HEADER_MISSING");

const httpReqMalformed = new Request("http://localhost:3000/api/auth/me", {
  headers: { authorization: "Token 12345" },
});
const httpResMalformed = await GET(httpReqMalformed);
assert(httpResMalformed.status === 401, "GET /api/auth/me with bad scheme returns 401");
const jsonMalformed = await httpResMalformed.json();
assert(jsonMalformed.error.code === "AUTH_HEADER_MALFORMED", "JSON error code matches AUTH_HEADER_MALFORMED");

console.log("\n=========================================");
console.log(`TASK 2B TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}

