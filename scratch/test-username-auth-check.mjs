import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

async function checkUsername(candidate, excludeUserId) {
  const clean = candidate.trim().toLowerCase();
  
  // 1. Check profiles table
  const { data: profileData, error: profileErr } = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("username", clean)
    .maybeSingle();

  if (profileData && profileData.user_id !== excludeUserId) {
    return { available: false, isTaken: true, reason: "Username is already taken." };
  }

  // 2. Authoritative check in auth.users metadata across all accounts in Supabase
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authData && authData.users) {
    const existing = authData.users.find((u) => {
      if (u.id === excludeUserId) return false;
      const uMeta = u.user_metadata || {};
      const uName = typeof uMeta.username === "string" ? uMeta.username.trim().toLowerCase() : "";
      return uName === clean;
    });

    if (existing) {
      return { available: false, isTaken: true, reason: "Username is already taken." };
    }
  }

  return { available: true, isTaken: false };
}

async function run() {
  console.log("Checking 'adarsh' for user2 (bc37ba78-b4ec-4a99-b4e9-917cc41dc62d):");
  const res1 = await checkUsername("adarsh", "bc37ba78-b4ec-4a99-b4e9-917cc41dc62d");
  console.log("Result for adarsh (should be TAKEN):", res1);

  console.log("Checking 'adarsh' for the owner user (2ff093e0-c9dc-4c12-9018-4511ea67d052):");
  const res2 = await checkUsername("adarsh", "2ff093e0-c9dc-4c12-9018-4511ea67d052");
  console.log("Result for owner (should be AVAILABLE):", res2);

  console.log("Checking 'brand_new_user_123' (should be AVAILABLE):");
  const res3 = await checkUsername("brand_new_user_123", "bc37ba78-b4ec-4a99-b4e9-917cc41dc62d");
  console.log("Result:", res3);
}

run();

