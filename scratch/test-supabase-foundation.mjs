import { GET as handleCallback } from "../src/app/auth/callback/route.ts";
import { updateSession } from "../src/lib/supabase/middleware.ts";

console.log("=========================================");
console.log("RUNNING SU_PRILO TASK 2C-1 SUPABASE FOUNDATION TESTS");
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
// TEST SUITE 1: OAUTH CALLBACK & OPEN REDIRECT SANITIZATION
// -------------------------------------------------------------
console.log("--- Test Suite 1: OAuth Callback Route & Open Redirect Defenses ---");

// 1. Missing code parameter
const reqMissingCode = new Request("http://localhost:3000/auth/callback");
const resMissingCode = await handleCallback(reqMissingCode);
assert(resMissingCode.status === 307 || resMissingCode.status === 302, "Missing code returns redirect response");
const locMissing = resMissingCode.headers.get("location");
assert(locMissing.includes("auth_error=missing_code"), `Redirected with auth_error=missing_code (location: ${locMissing})`);

// 2. Open Redirect attack attempts (external domains, protocol-relative)
const attackVectors = [
  "https://evil.com",
  "http://attacker.org/steal",
  "//evil.com",
  "//evil.com/phish",
  "/\\evil.com",
  "javascript:alert(1)",
  "ftp://evil.com",
];

for (const maliciousNext of attackVectors) {
  const reqAttack = new Request(
    `http://localhost:3000/auth/callback?code=test_code&next=${encodeURIComponent(maliciousNext)}`
  );
  const resAttack = await handleCallback(reqAttack);
  const locAttack = resAttack.headers.get("location");
  
  // Either safely handles service_unavailable / exchange_failed or redirects to safe origin root
  assert(
    !locAttack.includes("evil.com") && !locAttack.includes("attacker.org"),
    `Blocked open redirect for "${maliciousNext}" -> redirected to safe location: ${locAttack}`
  );
}

// 3. Valid internal relative path
const validNextPaths = ["/create", "/templates", "/profile", "/create?template=bday-midnight-celebration"];
for (const validPath of validNextPaths) {
  const reqValid = new Request(
    `http://localhost:3000/auth/callback?code=mock_code&next=${encodeURIComponent(validPath)}`
  );
  const resValid = await handleCallback(reqValid);
  const locValid = resValid.headers.get("location");
  assert(locValid.startsWith("http://localhost:3000/"), `Valid path safely stays on origin: ${locValid}`);
}

// -------------------------------------------------------------
// TEST SUITE 2: MIDDLEWARE SESSION REFRESH HANDLING
// -------------------------------------------------------------
console.log("\n--- Test Suite 2: Middleware Session Handling ---");

const reqMiddleware = {
  url: "http://localhost:3000/create",
  cookies: {
    getAll: () => [],
    set: () => {},
  },
  headers: new Headers(),
};

const resMiddleware = await updateSession(reqMiddleware);
assert(resMiddleware !== null, "Middleware returns valid NextResponse");
assert(resMiddleware.status === 200, "Middleware passes request cleanly");

console.log("\n=========================================");
console.log(`TASK 2C-1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}

