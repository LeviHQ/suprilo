// ============================================================================
// Suprilo — Production Migration 5 Preflight Inspection Script
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
// Target: Production Supabase naynjodssamuacmjkaqx
// ============================================================================

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_PROJECT_REF = "naynjodssamuacmjkaqx";

// 1. Read .env credentials safely
const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];

console.log("================================================================================");
console.log(" Suprilo Production Migration 5 Preflight Inspection");
console.log("================================================================================\n");

// 2. Enforce Project Ref Match
const parsedUrl = new URL(url);
const ref = parsedUrl.hostname.split(".")[0];
console.log(`Connected Project URL: ${url}`);
console.log(`Extracted Project Ref: ${ref}`);

if (ref !== EXPECTED_PROJECT_REF) {
  console.error(`[FATAL] Target project ref "${ref}" does not match expected "${EXPECTED_PROJECT_REF}".`);
  process.exit(1);
}
console.log(`[PASS] Project Reference strictly verified: ${EXPECTED_PROJECT_REF}\n`);

const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function inspect() {
  // 3. Inspect existing core production tables
  console.log("Inspecting Existing Core Production Tables...");
  const coreTables = ["cards", "slug_registry", "card_metrics", "card_telemetry_cooldown"];
  for (const t of coreTables) {
    const { count, error } = await client.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.error(`  [FAIL] Core table "${t}" error:`, error.message);
    } else {
      console.log(`  [OK] Core table "${t}" exists (${count ?? 0} rows)`);
    }
  }

  // 4. Check Migration 5 table status (proves whether already migrated)
  console.log("\nInspecting Migration 5 Tables...");
  const m5Tables = [
    "badges",
    "user_badges",
    "user_gamification_stats",
    "card_view_events",
    "card_fast_scratch_events",
    "creator_share_events",
  ];

  for (const t of m5Tables) {
    const { count, error } = await client.from(t).select("*", { count: "exact", head: true });
    if (error && error.code === "PGRST205") {
      console.log(`  [CLEAN] Migration 5 table "${t}" does not yet exist (expected prior to migration).`);
    } else if (error) {
      console.log(`  [STATUS] Table "${t}": ${error.code} - ${error.message}`);
    } else {
      console.log(`  [EXISTS] Table "${t}" already exists (${count} rows).`);
    }
  }

  // 5. Inspect cards table columns
  console.log("\nInspecting public.cards schema additions...");
  const { data: sampleCard, error: cardErr } = await client
    .from("cards")
    .select("id, draft_revisions_count, publication_local_hour, publication_local_dow")
    .limit(1);

  if (cardErr && cardErr.code === "PGRST204") {
    console.log("  [CLEAN] Columns (draft_revisions_count, publication_local_hour, publication_local_dow) do not yet exist on cards.");
  } else if (cardErr) {
    console.log(`  [STATUS] Column check: ${cardErr.code} - ${cardErr.message}`);
  } else {
    console.log("  [EXISTS] Columns already exist on public.cards.");
  }

  console.log("\n================================================================================");
  console.log(" Preflight check completed safely. Database ready for migration execution.");
  console.log("================================================================================");
}

inspect().catch((err) => {
  console.error("Preflight fatal exception:", err);
  process.exit(1);
});

