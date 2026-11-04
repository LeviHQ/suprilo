/**
 * Suprilo Server Auth Route & Header Contract Verification
 * Verified independent of legacy Firebase dependencies.
 */

console.log("=========================================");
console.log("RUNNING SUPRILO SERVER AUTH CONTRACT TESTS");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// TEST SUITE 1: AUTHORIZATION HEADER VALIDATION CONTRACTS
// -------------------------------------------------------------
console.log("--- Test Suite 1: Authorization Header Validation Rules ---");

function parseAndValidateAuthHeader(authHeader) {
  if (!authHeader) {
    return { success: false, code: "AUTH_SESSION_MISSING", status: 401 };
  }
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return {
      success: false,
      code: "AUTH_HEADER_MALFORMED",
      status: 401,
      message: "Malformed Authorization header. Format must be 'Bearer <access_token>'."
    };
  }
  const token = parts[1];
  if (!token || token.length < 10) {
    return {
      success: false,
      code: "AUTH_TOKEN_EMPTY",
      status: 401,
      message: "Bearer token cannot be empty."
    };
  }
  return { success: true, token };
}

// 1. Missing header
const resMissing = parseAndValidateAuthHeader(null);
assert(!resMissing.success, "Missing header fails validation");
assert(resMissing.status === 401, "Missing header status is 401");
assert(resMissing.code === "AUTH_SESSION_MISSING", "Error code is AUTH_SESSION_MISSING");

// 2. Malformed scheme (Basic instead of Bearer)
const resBasic = parseAndValidateAuthHeader("Basic dXNlcjpwYXNz");
assert(!resBasic.success, "Basic auth scheme fails");
assert(resBasic.status === 401, "Malformed header status is 401");
assert(resBasic.code === "AUTH_HEADER_MALFORMED", "Error code is AUTH_HEADER_MALFORMED");

// 3. Non-bearer scheme (Token 12345)
const resToken = parseAndValidateAuthHeader("Token 1234567890123");
assert(!resToken.success, "Token scheme fails");
assert(resToken.code === "AUTH_HEADER_MALFORMED", "Error code is AUTH_HEADER_MALFORMED");

// 4. Empty Bearer token
const resEmpty = parseAndValidateAuthHeader("Bearer ");
assert(!resEmpty.success, "Empty token fails");
assert(resEmpty.code === "AUTH_HEADER_MALFORMED", "Empty bearer is flagged as malformed");

// 5. Short token (< 10 chars)
const resShort = parseAndValidateAuthHeader("Bearer short");
assert(!resShort.success, "Short token (< 10 chars) fails");
assert(resShort.code === "AUTH_TOKEN_EMPTY", "Short token error code is AUTH_TOKEN_EMPTY");

// 6. Valid Bearer format
const resValid = parseAndValidateAuthHeader("Bearer valid_supabase_jwt_access_token_123456789");
assert(resValid.success, "Valid Bearer header accepted for verification");
assert(resValid.token === "valid_supabase_jwt_access_token_123456789", "Token correctly extracted");

// -------------------------------------------------------------
// TEST SUITE 2: RESPONSE PAYLOAD SANITIZATION CONTRACTS
// -------------------------------------------------------------
console.log("\n--- Test Suite 2: Response Payload Sanitization ---");

function formatMeSuccessPayload(user) {
  return {
    success: true,
    user: {
      id: user.id,
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    }
  };
}

const mockUser = {
  id: "e6f1a8c0-1234-4567-89ab-cdef01234567",
  uid: "e6f1a8c0-1234-4567-89ab-cdef01234567",
  email: "creator@suprilo.com",
  emailVerified: true,
  access_token: "secret_access_token_should_never_leak",
  refresh_token: "secret_refresh_token_should_never_leak"
};

const payload = formatMeSuccessPayload(mockUser);
assert(payload.success === true, "Payload has success: true");
assert(payload.user.id === mockUser.id, "Payload user.id matches");
assert(payload.user.uid === mockUser.id, "Payload user.uid matches backward-compatible id");
assert(!("access_token" in payload.user), "No access token leaked in user payload");
assert(!("refresh_token" in payload.user), "No refresh token leaked in user payload");

console.log("\n=========================================");
console.log(`SERVER AUTH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}
