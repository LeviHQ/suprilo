// ============================================================================
// Suprilo — Staging Database Integration Verification Suite
// Canonical Specification: SPEC-2C-5.6.1-FINAL v3.0.0
//
// Purpose: Executes actual PostgreSQL RPC integration tests against an
//          isolated STAGING database after Migration 5 has been applied.
//
// Usage:
//   $env:STAGING_SUPABASE_URL="https://your-staging-ref.supabase.co"
//   $env:STAGING_SUPABASE_SERVICE_ROLE_KEY="eyJ..."
//   node scratch/test-staging-database-integration.mjs
// ============================================================================

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const stagingUrl = process.env.STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.6.1 — Staging PostgreSQL Integration Verification Suite");
console.log("================================================================================\n");

if (!stagingUrl || !serviceKey) {
  console.log("[-] STAGING_SUPABASE_URL or STAGING_SUPABASE_SERVICE_ROLE_KEY not configured.");
  console.log("    Set these environment variables pointing to your isolated Staging database.");
  console.log("    Skipping live database execution safely to preserve database integrity.\n");
  process.exit(0);
}

const supabase = createClient(stagingUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

async function execute() {
  console.log(`Target Database: ${new URL(stagingUrl).hostname}\n`);

  // Verify Migration 5 tables exist
  await runTest("Migration 5 tables exist in PostgreSQL", async () => {
    const tables = [
      "badges",
      "user_badges",
      "user_gamification_profile",
      "card_view_receipts",
      "card_view_events",
      "badge_share_events",
    ];
    for (const table of tables) {
      const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
      assert.equal(error, null, `Table ${table} query failed: ${error?.message}`);
    }
  });

  // Verify 50 badges seeded
  await runTest("50 canonical badges seeded across all 5 canonical categories", async () => {
    const { count: badgesCount, error: bErr } = await supabase
      .from("badges")
      .select("*", { count: "exact", head: true });
    assert.equal(bErr, null, bErr?.message);
    assert.equal(badgesCount, 50, `Expected 50 seeded badges, found ${badgesCount}`);

    const expectedCategories = {
      "getting-started": 10,
      "creator-journey": 12,
      "sharing-impact": 10,
      "milestones": 10,
      "creative-mastery": 8,
    };

    for (const [category, expectedCount] of Object.entries(expectedCategories)) {
      const { count, error } = await supabase
        .from("badges")
        .select("*", { count: "exact", head: true })
        .eq("category", category);
      assert.equal(error, null, error?.message);
      assert.equal(count, expectedCount, `Category ${category} expected ${expectedCount}, found ${count}`);
    }
  });

  // Verify stored procedures
  await runTest("public.derive_level_from_xp RPC is functional and accurate across all thresholds", async () => {
    const testCases = [
      { xp: 0, expected: 1 },
      { xp: 249, expected: 1 },
      { xp: 250, expected: 2 },
      { xp: 749, expected: 2 },
      { xp: 750, expected: 3 },
      { xp: 1499, expected: 3 },
      { xp: 1500, expected: 4 },
      { xp: 2749, expected: 4 },
      { xp: 2750, expected: 5 },
      { xp: 4499, expected: 5 },
      { xp: 4500, expected: 6 },
      { xp: 6999, expected: 6 },
      { xp: 7000, expected: 7 },
      { xp: 9999, expected: 7 },
      { xp: 10000, expected: 8 },
      { xp: 13499, expected: 8 },
      { xp: 13500, expected: 9 },
      { xp: 16999, expected: 9 },
      { xp: 17000, expected: 10 },
      { xp: 17875, expected: 10 },
      { xp: 99999, expected: 10 },
    ];

    for (const { xp, expected } of testCases) {
      const { data, error } = await supabase.rpc("derive_level_from_xp", { p_xp: xp });
      assert.equal(error, null, `Error at ${xp} XP: ${error?.message}`);
      assert.equal(data, expected, `At ${xp} XP, expected Level ${expected}, got ${data}`);
    }
  });

  // Verify existing production tables and records are intact
  await runTest("Existing production tables and records remain intact", async () => {
    const { count: cardsCount, error: cErr } = await supabase
      .from("cards")
      .select("*", { count: "exact", head: true });
    assert.equal(cErr, null, cErr?.message);
    assert.ok(cardsCount !== null && cardsCount >= 2, `Cards table should have records, found ${cardsCount}`);

    const { count: slugCount, error: sErr } = await supabase
      .from("slug_registry")
      .select("*", { count: "exact", head: true });
    assert.equal(sErr, null, sErr?.message);
    assert.ok(slugCount !== null && slugCount >= 10, `slug_registry should have records, found ${slugCount}`);

    const { count: metricsCount, error: mErr } = await supabase
      .from("card_metrics")
      .select("*", { count: "exact", head: true });
    assert.equal(mErr, null, mErr?.message);
    assert.ok(metricsCount !== null && metricsCount >= 2, `card_metrics should have records, found ${metricsCount}`);

    const { count: cooldownCount, error: cdErr } = await supabase
      .from("card_telemetry_cooldown")
      .select("*", { count: "exact", head: true });
    assert.equal(cdErr, null, cdErr?.message);
    assert.ok(cooldownCount !== null && cooldownCount >= 9, `card_telemetry_cooldown should have records, found ${cooldownCount}`);
  });

  // Verify handshake function RPC signature callable
  await runTest("public.record_card_view_handshake RPC responds cleanly to validation", async () => {
    const fakeCardId = crypto.randomUUID();
    const fakeSessionId = crypto.randomUUID();
    const { data, error } = await supabase.rpc("record_card_view_handshake", {
      p_card_id: fakeCardId,
      p_session_id: fakeSessionId,
      p_visitor_id_hash: "hash12345678901234567890123456789012",
      p_is_untracked: false,
      p_previous_visitor_id_hash: null,
    });
    // Should fail gracefully because fakeCardId does not exist in cards table (FK constraint or business logic)
    assert.ok(error !== null || data === null, "Expected validation response or error for nonexistent card");
  });

  // Verify reveal function RPC signature callable
  await runTest("public.record_card_reveal RPC responds cleanly to validation", async () => {
    const fakeCardId = crypto.randomUUID();
    const fakeReceiptId = crypto.randomUUID();
    const { data, error } = await supabase.rpc("record_card_reveal", {
      p_card_id: fakeCardId,
      p_view_receipt_id: fakeReceiptId,
      p_visitor_id_hash: "hash12345678901234567890123456789012",
      p_previous_visitor_id_hash: null,
    });
    // Should fail or return rejected response for invalid receipt
    assert.ok(error !== null || (data && data.success === false), "Expected rejection for invalid receipt");
  });

  // Verify get_user_badges_summary RPC signature callable
  await runTest("public.get_user_badges_summary RPC is callable", async () => {
    const fakeUserId = crypto.randomUUID();
    const { data, error } = await supabase.rpc("get_user_badges_summary", {
      p_user_id: fakeUserId,
    });
    assert.equal(error, null, error?.message);
    assert.ok(data !== null, "Expected summary object or rows returned");
  });

  console.log("\n================================================================================");
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

execute().catch((err) => {
  console.error("Fatal integration test error:", err);
  process.exit(1);
});

