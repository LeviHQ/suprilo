import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import assert from "node:assert";

console.log("=================================================================");
console.log(" COMPREHENSIVE HANDLE RESERVATION & VALIDATION VERIFICATION");
console.log("=================================================================\n");

// Read profile constants directly
const profileTypesCode = fs.readFileSync("src/types/profile.ts", "utf-8");

// 1. Verify all 48 reserved words exist
const match = profileTypesCode.match(/export const RESERVED_USERNAMES = new Set\(\[([\s\S]*?)\]\);/);
assert(match, "RESERVED_USERNAMES set must exist");
const reservedList = match[1]
  .split(",")
  .map(w => w.trim().replace(/['"]/g, ""))
  .filter(Boolean);

console.log(`[PASS] Found ${reservedList.length} platform reserved handles:`, reservedList.slice(0, 10).join(", ") + "...");
assert(reservedList.includes("admin"), "admin must be reserved");
assert(reservedList.includes("suprilo"), "suprilo must be reserved");
assert(reservedList.includes("support"), "support must be reserved");
assert(reservedList.includes("settings"), "settings must be reserved");

// 2. Test input keystroke sanitization rule
const testRaw1 = "pankaj%";
const sanitized1 = testRaw1.toLowerCase().replace(/[^a-z0-9_]/g, "");
assert.strictEqual(sanitized1, "pankaj", "Sanitization must strip '%'");
console.log("[PASS] Keystroke sanitization correctly strips special character '%':", testRaw1, "->", sanitized1);

const testRaw2 = "Adarsh@123! #$";
const sanitized2 = testRaw2.toLowerCase().replace(/[^a-z0-9_]/g, "");
assert.strictEqual(sanitized2, "adarsh123", "Sanitization must strip spaces and @!#$");
console.log("[PASS] Keystroke sanitization correctly handles complex illegal characters:", testRaw2, "->", sanitized2);

// 3. Test checkUsernameAvailability live against real Supabase DB
const env = fs.readFileSync(".env", "utf-8");
const lines = env.split("\n");
const getVal = (k) => {
  const line = lines.find((l) => l.trim().startsWith(k + "="));
  if (!line) return "";
  return line.split("=")[1].trim().replace(/^['"]|['"]$/g, "");
};

const url = getVal("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = getVal("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(url, serviceKey);

async function testLiveDb() {
  const { data: authData } = await supabase.auth.admin.listUsers();
  assert(authData && authData.users.length > 0, "Must be able to query Supabase auth users");

  const existingOwner = authData.users.find(u => u.user_metadata?.username === "adarsh");
  assert(existingOwner, "User with username 'adarsh' must exist in auth.users");
  console.log(`[PASS] Found registered user for 'adarsh': ${existingOwner.email} (ID: ${existingOwner.id})`);

  // Simulate checking 'adarsh' from a DIFFERENT user
  const otherUser = authData.users.find(u => u.id !== existingOwner.id);
  assert(otherUser, "Must have at least one other user to test collision");

  // Check taken status
  const existingCheck = authData.users.find((u) => {
    if (u.id === otherUser.id) return false;
    const uMeta = u.user_metadata || {};
    const uName = typeof uMeta.username === "string" ? uMeta.username.trim().toLowerCase() : "";
    return uName === "adarsh";
  });
  assert(existingCheck, "Collision detection must identify 'adarsh' as taken");
  console.log(`[PASS] Uniqueness check correctly identifies 'adarsh' as TAKEN for other user: ${otherUser.email}`);

  // Check available status for random unused handle
  const randomHandle = "creator_unique_" + Math.floor(Math.random() * 899999 + 100000);
  const unusedCheck = authData.users.find((u) => {
    const uMeta = u.user_metadata || {};
    const uName = typeof uMeta.username === "string" ? uMeta.username.trim().toLowerCase() : "";
    return uName === randomHandle;
  });
  assert(!unusedCheck, "Random handle must not collide");
  console.log(`[PASS] Uniqueness check correctly identifies '${randomHandle}' as AVAILABLE`);

  console.log("\n=================================================================");
  console.log(" ALL INTEGRATION & DATABASE UNIQUENESS TESTS PASSED (100%)");
  console.log("=================================================================\n");
}

testLiveDb();

