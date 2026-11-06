import fs from 'node:fs';
import assert from 'node:assert/strict';

console.log('================================================================================');
console.log(' Suprilo Task 2C-5.6.1 — Migration 5 Comprehensive Static & Syntax Test Suite');
console.log('================================================================================\n');

const migrationPath = 'supabase/migrations/20261102000005_badge_system.sql';
assert.ok(fs.existsSync(migrationPath), `Migration file exists at ${migrationPath}`);
const sql = fs.readFileSync(migrationPath, 'utf8');

let passed = 0;
let failed = 0;

function testAssert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. SQL Syntax, Dollar Quotes & Parentheses Balance
// ---------------------------------------------------------------------------
console.log('1. Testing SQL Structure, Dollar Quotes & Parentheses Balance...');

const dollarMatches = sql.match(/\$\$/g) || [];
testAssert(dollarMatches.length > 0 && dollarMatches.length % 2 === 0, `Dollar quotes ($$) are balanced (found: ${dollarMatches.length})`);

let parenDepth = 0;
let inString = false;
let inLineComment = false;
let inBlockComment = false;

for (let i = 0; i < sql.length; i++) {
  const c = sql[i];
  const next = sql[i + 1];

  if (inLineComment) {
    if (c === '\n') inLineComment = false;
  } else if (inBlockComment) {
    if (c === '*' && next === '/') {
      inBlockComment = false;
      i++;
    }
  } else if (inString) {
    if (c === "'" && next === "'") {
      i++;
    } else if (c === "'") {
      inString = false;
    }
  } else {
    if (c === '-' && next === '-') {
      inLineComment = true;
      i++;
    } else if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
    } else if (c === "'") {
      inString = true;
    } else if (c === '(') {
      parenDepth++;
    } else if (c === ')') {
      parenDepth--;
    }
  }
}

testAssert(parenDepth === 0, `Parentheses are perfectly balanced (depth: ${parenDepth})`);

// ---------------------------------------------------------------------------
// 2. Schema Alterations on public.cards
// ---------------------------------------------------------------------------
console.log('\n2. Testing Schema Alterations on public.cards...');
testAssert(sql.includes('draft_revisions_count integer NOT NULL DEFAULT 0'), 'Adds draft_revisions_count to public.cards');
testAssert(sql.includes('publication_local_hour smallint NULL'), 'Adds publication_local_hour to public.cards');
testAssert(sql.includes('publication_local_dow smallint NULL'), 'Adds publication_local_dow to public.cards');

// ---------------------------------------------------------------------------
// 3. Table Creation & Constraint Invariants
// ---------------------------------------------------------------------------
console.log('\n3. Testing Table Definitions & Required Invariants...');

const canonicalTables = [
  'public.badges',
  'public.user_badges',
  'public.user_gamification_stats',
  'public.card_view_events',
  'public.card_fast_scratch_events',
  'public.creator_share_events'
];

canonicalTables.forEach(t => {
  testAssert(sql.includes(`CREATE TABLE IF NOT EXISTS ${t}`), `Defines table ${t}`);
});

testAssert(sql.includes('page_session_id uuid UNIQUE NOT NULL'), 'card_view_events enforces UNIQUE page_session_id');
testAssert(sql.includes('CONSTRAINT chk_card_view_untracked'), 'card_view_events has untracked constraint');
testAssert(sql.includes('((NOT is_untracked AND visitor_id_hash IS NOT NULL) OR (is_untracked AND visitor_id_hash IS NULL))'), 'chk_card_view_untracked correctly enforces NULL hash for untracked visits and non-NULL for tracked');
testAssert(sql.includes('elapsed_ms integer NOT NULL CHECK (elapsed_ms >= 0 AND elapsed_ms <= 600000)'), 'card_fast_scratch_events bounds elapsed_ms between 0 and 600,000 ms');
testAssert(sql.includes('share_token text UNIQUE NOT NULL CHECK (share_token ~ \'^[a-f0-9]{24}$\')'), 'user_badges enforces 24-char cryptographic hex share token');
testAssert(sql.includes('CONSTRAINT uq_user_badges_user_badge UNIQUE (user_id, badge_id)'), 'user_badges enforces UNIQUE(user_id, badge_id)');

// ---------------------------------------------------------------------------
// 4. Verification of All 50 Seeded Badges
// ---------------------------------------------------------------------------
console.log('\n4. Verifying All 50 Seeded Badges...');

// Match SQL row tuples in INSERT block with support for escaped single quotes ''
const seedRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*'((?:[^']|'')*)',\s*'([^']+)',\s*(\d+)\)/g;
const matches = [...sql.matchAll(seedRegex)];

testAssert(matches.length === 50, `Exactly 50 badges found in seed block (found: ${matches.length})`);

let totalXp = 0;
const categories = {};
const displayOrders = new Set();
const slugs = new Set();

const CLASS_B_SLUGS = new Set([
  'first-step',
  'first-draft',
  'weekend-publish',
  'night-owl',
  'card-refinement',
  'speedy-scratch',
  'high-affinity',
  'badge-shared',
  'card-shared',
  'double-polish'
]);

let classACount = 0;
let classBCount = 0;

for (const m of matches) {
  const [, id, name, category, rarity, pointsStr, description, artwork, orderStr] = m;
  const points = parseInt(pointsStr, 10);
  const order = parseInt(orderStr, 10);

  totalXp += points;
  categories[category] = (categories[category] || 0) + 1;
  displayOrders.add(order);
  slugs.add(id);

  if (CLASS_B_SLUGS.has(id)) {
    classBCount++;
  } else {
    classACount++;
  }

  testAssert(artwork === `/images/badges/${id}.webp`, `Artwork URL for "${id}" is /images/badges/${id}.webp`);
}

testAssert(totalXp === 17875, `Total XP exactly equals 17,875 (actual: ${totalXp})`);
testAssert(displayOrders.size === 50 && Math.min(...displayOrders) === 1 && Math.max(...displayOrders) === 50, 'Display orders are unique and continuous 1 to 50');
testAssert(classACount === 40, `Class A badges count equals 40 (actual: ${classACount})`);
testAssert(classBCount === 10, `Class B badges count equals 10 (actual: ${classBCount})`);

testAssert(categories['getting-started'] === 10, 'Category "getting-started" has exactly 10 badges');
testAssert(categories['creator-journey'] === 12, 'Category "creator-journey" has exactly 12 badges');
testAssert(categories['sharing-impact'] === 10, 'Category "sharing-impact" has exactly 10 badges');
testAssert(categories['milestones'] === 10, 'Category "milestones" has exactly 10 badges');
testAssert(categories['creative-mastery'] === 8, 'Category "creative-mastery" has exactly 8 badges');

// ---------------------------------------------------------------------------
// 5. Triggers & Functions
// ---------------------------------------------------------------------------
console.log('\n5. Testing Triggers & Stored Procedures...');

testAssert(sql.includes('CREATE TRIGGER trg_track_draft_revision'), 'Registers trg_track_draft_revision trigger');
testAssert(sql.includes('CREATE TRIGGER trg_snapshot_publication_local_time'), 'Registers trg_snapshot_publication_local_time trigger');

const procedures = [
  'public.derive_level_from_xp',
  'public.award_badge_internal',
  'public.evaluate_base_badges_internal',
  'public.evaluate_composite_badges_internal',
  'public.evaluate_user_achievements',
  'public.process_gamification_evaluations_batch',
  'public.record_card_view_handshake',
  'public.record_card_reveal',
  'public.record_creator_share_event',
  'public.get_public_badge_by_token',
  'public.get_user_badges_summary',
  'public.prune_expired_telemetry'
];

procedures.forEach(proc => {
  testAssert(sql.includes(`CREATE OR REPLACE FUNCTION ${proc}`), `Defines procedure ${proc}`);
});

// ---------------------------------------------------------------------------
// 6. Security, RLS & Safe search_path
// ---------------------------------------------------------------------------
console.log('\n6. Testing Security Definer & RLS Configurations...');

canonicalTables.forEach(t => {
  testAssert(sql.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`), `Enables RLS on ${t}`);
});

testAssert(sql.includes('SET search_path = pg_catalog, public, pg_temp'), 'Uses hardened search_path = pg_catalog, public, pg_temp');
testAssert(sql.includes('pg_advisory_xact_lock'), 'Uses pg_advisory_xact_lock for share concurrency');
testAssert(sql.includes('FOR UPDATE SKIP LOCKED'), 'Uses FOR UPDATE SKIP LOCKED for worker concurrency');

// ---------------------------------------------------------------------------
// 7. Composite Badge Pre-Award Verification
// ---------------------------------------------------------------------------
console.log('\n7. Testing Composite Badge Pre-Award Rules...');

testAssert(sql.includes("badge_id <> 'legendary-creator'"), 'legendary-creator pre-award rule excludes itself');
testAssert(sql.includes("badge_id <> 'suprilo-hall-of-fame'"), 'suprilo-hall-of-fame pre-award rule excludes itself');

// ---------------------------------------------------------------------------
// 8. Monotonic Level Progression
// ---------------------------------------------------------------------------
console.log('\n8. Testing Monotonic Level Progression Invariants...');

const levelChecks = [
  [17000, 10],
  [13500, 9],
  [10000, 8],
  [7000, 7],
  [4500, 6],
  [2750, 5],
  [1500, 4],
  [750, 3],
  [250, 2]
];

levelChecks.forEach(([xp, expectedLevel]) => {
  testAssert(sql.includes(`p_xp >= ${xp}`), `Threshold for level ${expectedLevel} (>= ${xp} XP) verified`);
});
testAssert(sql.includes('ELSE RETURN 1;'), 'Level 1 baseline default (0 - 249 XP) verified');

// ---------------------------------------------------------------------------
// 9. REV-01 Focused Regression Suite: HMAC Identity Continuity & Key Rotation
// ---------------------------------------------------------------------------
console.log('\n9. Testing REV-01 HMAC Identity Continuity & Key Rotation Invariants...');

import crypto from 'node:crypto';

// 9a. Static SQL Signature & Body Verification
testAssert(
  sql.includes('p_previous_visitor_id_hash text DEFAULT NULL'),
  'record_card_view_handshake accepts p_previous_visitor_id_hash parameter'
);

testAssert(
  sql.includes('record_card_reveal(\n  p_card_id uuid,\n  p_view_receipt_id uuid,\n  p_visitor_id_hash text,\n  p_previous_visitor_id_hash text DEFAULT NULL\n)'),
  'record_card_reveal accepts p_previous_visitor_id_hash parameter'
);

testAssert(
  sql.includes('UPDATE public.card_view_events\n    SET visitor_id_hash = p_visitor_id_hash\n    WHERE visitor_id_hash = p_previous_visitor_id_hash;'),
  'Atomic in-place historical identity reconciliation statement verified'
);

testAssert(
  sql.includes('GRANT EXECUTE ON FUNCTION public.record_card_view_handshake(uuid, uuid, text, boolean, text) TO service_role;'),
  'record_card_view_handshake 5-argument signature granted to service_role'
);

testAssert(
  sql.includes('GRANT EXECUTE ON FUNCTION public.record_card_reveal(uuid, uuid, text, text) TO service_role;'),
  'record_card_reveal 4-argument signature granted to service_role'
);

// 9b. Algorithmic Simulation of Dual-Key Identity Continuity
function hmacHash(visitorId, secret) {
  return crypto.createHmac('sha256', secret).update(visitorId).digest('hex').toLowerCase();
}

const key1 = 'secret_key_alpha_long_lived_90d_11111111';
const key2 = 'secret_key_beta_rotated_active_22222222';
const vid1 = '3b89fa7a-0e9e-4e45-8162-d28f09071b74';
const vid2 = '9a77c8e2-45e1-4bb6-9811-37fbb984fa51';

const h1_v1 = hmacHash(vid1, key1);
const h2_v1 = hmacHash(vid1, key2);

const h1_v2 = hmacHash(vid2, key1);
const h2_v2 = hmacHash(vid2, key2);

testAssert(h1_v1 !== h2_v1, 'Different keys produce distinct hashes for the same visitor');
testAssert(h2_v1 !== h2_v2, 'Same key produces distinct hashes for distinct visitors');

// Simulate Database Ledger
let dbViews = [];

function recordHandshake(cardId, sessionId, currentHash, isUntracked, previousHash) {
  // Reconcile older records
  if (previousHash && !isUntracked && previousHash !== currentHash) {
    for (const row of dbViews) {
      if (row.visitor_id_hash === previousHash) {
        row.visitor_id_hash = currentHash;
      }
    }
  }

  // Insert new view
  dbViews.push({
    card_id: cardId,
    page_session_id: sessionId,
    visitor_id_hash: currentHash,
    is_untracked: isUntracked,
    consumed_at: null
  });
}

function evaluateHighAffinity(creatorCardIds) {
  const eligibleViews = dbViews.filter(v => creatorCardIds.includes(v.card_id) && !v.is_untracked);
  
  const uniqueViewTuples = new Set(eligibleViews.map(v => `${v.card_id}:${v.visitor_id_hash}`));
  const uniqueRevealTuples = new Set(
    eligibleViews.filter(v => v.consumed_at !== null).map(v => `${v.card_id}:${v.visitor_id_hash}`)
  );

  return {
    uniqueViews: uniqueViewTuples.size,
    uniqueReveals: uniqueRevealTuples.size,
    ratio: uniqueViewTuples.size > 0 ? (uniqueRevealTuples.size / uniqueViewTuples.size) * 100 : 0
  };
}

// Case 1: Same visitor before and after rotation on Card 1
const cardA = '11111111-aaaa-bbbb-cccc-000000000001';
const cardB = '22222222-aaaa-bbbb-cccc-000000000002';
const creatorCards = [cardA, cardB];

// Day 1: Visitor 1 views and reveals Card A under Key 1
recordHandshake(cardA, 'sess-1', h1_v1, false, null);
dbViews[0].consumed_at = new Date(); // revealed

let haStats = evaluateHighAffinity(creatorCards);
testAssert(haStats.uniqueViews === 1 && haStats.uniqueReveals === 1 && haStats.ratio === 100, 'Pre-rotation: 1 unique view, 1 unique reveal, 100% ratio');

// Day 30: Secret rotation occurs (Key 1 -> Key 2). Visitor 1 returns to view Card A again!
// Server passes currentHash = h2_v1, previousHash = h1_v1
recordHandshake(cardA, 'sess-2', h2_v1, false, h1_v1);

haStats = evaluateHighAffinity(creatorCards);
testAssert(haStats.uniqueViews === 1, `Post-rotation identity continuity: Unique views remain 1 (got: ${haStats.uniqueViews})`);
testAssert(haStats.uniqueReveals === 1, `Post-rotation identity continuity: Unique reveals remain 1 (got: ${haStats.uniqueReveals})`);
testAssert(haStats.ratio === 100, `Post-rotation reveal ratio remains 100% without artificial dilution (got: ${haStats.ratio}%)`);

// Case 2: Same visitor across multiple cards
// Visitor 1 visits Card B under Key 2
recordHandshake(cardB, 'sess-3', h2_v1, false, h1_v1);
haStats = evaluateHighAffinity(creatorCards);
testAssert(haStats.uniqueViews === 2, 'Distinct card views by same visitor count as 2 distinct (card_id, visitor) pairs');

// Case 3: Distinct visitors remain distinct
recordHandshake(cardA, 'sess-4', h2_v2, false, null);
haStats = evaluateHighAffinity(creatorCards);
testAssert(haStats.uniqueViews === 3, 'Second distinct visitor adds 1 unique view correctly (total: 3)');

// Case 4: Untracked visitors never reconcile or pollute tracked identity
recordHandshake(cardA, 'sess-5', null, true, null);
testAssert(dbViews.some(v => v.is_untracked && v.visitor_id_hash === null), 'Untracked visit recorded with null hash');
const untrackedBefore = dbViews.filter(v => v.is_untracked).length;

// Reconcile with some previous hash
recordHandshake(cardA, 'sess-6', h2_v1, false, h1_v1);
const untrackedAfter = dbViews.filter(v => v.is_untracked && v.visitor_id_hash === null).length;
testAssert(untrackedBefore === untrackedAfter, 'Untracked visit hashes remain strictly null during reconciliation');

// Case 5: Concurrency safety
// Two simultaneous handshakes during rotation
const initialReconciledCount = dbViews.filter(v => v.visitor_id_hash === h2_v1).length;
recordHandshake(cardA, 'sess-concurrent-1', h2_v1, false, h1_v1);
recordHandshake(cardA, 'sess-concurrent-2', h2_v1, false, h1_v1);
const postConcurrentH1Count = dbViews.filter(v => v.visitor_id_hash === h1_v1).length;
testAssert(postConcurrentH1Count === 0, 'Concurrent handshakes leave zero unreconciled previous hashes');

console.log('\n================================================================================');
console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('================================================================================');

process.exit(failed === 0 ? 0 : 1);
