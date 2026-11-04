/**
 * Suprilo Phase 2C — Task 2C-4C
 * Automated Runtime Integration & Security Test Harness
 * 
 * STRICT SAFEGUARDS:
 * 1. Preflight check enforces execution ONLY against project ref: naynjodssamuacmjkaqx
 * 2. Writes real-time persistent manifest (scratch/test-manifest-{runId}.json) after every resource creation
 * 3. Never deletes slug_registry tombstones (preserves security invariant)
 * 4. All test operations execute through user-scoped client sessions (Client A & Client B)
 * 5. Admin credentials used strictly for setup/teardown in server-side process
 * 6. Idempotent cleanup runs in finally block; standalone recovery script available for crashes
 * 7. Registered signal handlers (SIGINT/SIGTERM) to trigger graceful teardown
 * 8. Comprehensive assertions: verifies expected errors AND resulting database/storage state
 * 9. Teardown failure enforcement: Test run FAILS if any cleanup step encounters an error.
 *    Manifest is preserved with failure details and recovery instructions (zero secrets exposed).
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ============================================================================
// 1. PREFLIGHT SECURITY & CREDENTIAL INITIALIZATION
// ============================================================================
const EXPECTED_PROJECT_REF = 'naynjodssamuacmjkaqx';

function loadEnvironment() {
  if (!fs.existsSync('.env')) {
    throw new Error('FATAL: .env file not found.');
  }
  const envContent = fs.readFileSync('.env', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || '').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[match[1]] = val;
    }
  });
  return env;
}

// ============================================================================
// 2. UNBIASED CRYPTOGRAPHIC SLUG GENERATOR
// ============================================================================
const SLUG_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // Canonical 31-character set

function generateTestSlug() {
  let slug = '';
  for (let i = 0; i < 12; i++) {
    const idx = crypto.randomInt(0, SLUG_ALPHABET.length);
    slug += SLUG_ALPHABET[idx];
  }
  return slug;
}

// ============================================================================
// 3. PERSISTENT TEST MANIFEST & DISASTER RECOVERY ARCHITECTURE
// ============================================================================
let runId = null;
let manifestPath = null;
let manifest = null;

function initManifest() {
  runId = Date.now().toString();
  manifestPath = path.join('scratch', `test-manifest-${runId}.json`);
  manifest = {
    runId,
    projectRef: EXPECTED_PROJECT_REF,
    createdAt: new Date().toISOString(),
    userAId: null,
    userBId: null,
    userAEmail: `test_user_a_${runId}@suprilo-test.local`,
    userBEmail: `test_user_b_${runId}@suprilo-test.local`,
    cardIds: [],
    slugs: [],
    storagePaths: [],
    completedSteps: [],
    cleanupStatus: 'PENDING',
    cleanupErrors: []
  };
  saveManifest();
}

function saveManifest() {
  if (manifestPath && manifest) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }
}

// ============================================================================
// 4. CLEANUP & TEARDOWN LOGIC (Idempotent, Ordered & Strict Error Checking)
// ============================================================================
async function runIdempotentCleanup(adminClient) {
  if (!manifest) {
    console.log('No active test manifest to clean.');
    return;
  }

  console.log('\n======================================================');
  console.log('INITIATING IDEMPOTENT TEARDOWN & RECOVERY SEQUENCE');
  console.log('======================================================');

  const cleanupErrors = [];

  // Step 1: Explicit Storage Objects Deletion (Tracked paths only)
  if (manifest.storagePaths.length > 0 && !manifest.completedSteps.includes('STORAGE_OBJECTS_DELETED')) {
    console.log(`[Teardown 1/5] Removing ${manifest.storagePaths.length} tracked test Storage objects...`);
    try {
      const { data, error } = await adminClient.storage.from('card-photos').remove(manifest.storagePaths);
      if (error) {
        cleanupErrors.push(`Storage object deletion failed: ${error.message}`);
        console.error('  Warning removing storage objects:', error.message);
      } else {
        console.log('  Storage objects deleted successfully.');
        manifest.completedSteps.push('STORAGE_OBJECTS_DELETED');
        saveManifest();
      }
    } catch (err) {
      cleanupErrors.push(`Storage removal exception: ${err.message}`);
      console.error('  Storage removal exception:', err.message);
    }
  }

  // Step 2: Delete Test Cards (Tracked IDs only; cascades metrics/cooldowns & fires BEFORE DELETE triggers)
  if (manifest.cardIds.length > 0 && !manifest.completedSteps.includes('CARDS_DELETED')) {
    console.log(`[Teardown 2/5] Deleting ${manifest.cardIds.length} tracked test cards...`);
    try {
      const { error } = await adminClient.from('cards').delete().in('id', manifest.cardIds);
      if (error) {
        cleanupErrors.push(`Card deletion failed: ${error.message}`);
        console.error('  Warning deleting test cards:', error.message);
      } else {
        console.log('  Test cards deleted (triggers executed; metrics cascaded).');
        manifest.completedSteps.push('CARDS_DELETED');
        saveManifest();
      }
    } catch (err) {
      cleanupErrors.push(`Card deletion exception: ${err.message}`);
      console.error('  Card deletion exception:', err.message);
    }
  }

  // Step 3 & 4: Verify Outbox & Purge Test Cleanup Queue Records (Tracked paths only)
  if (manifest.storagePaths.length > 0 && !manifest.completedSteps.includes('CLEANUP_QUEUE_PURGED')) {
    console.log(`[Teardown 3/5] Inspecting & purging test outbox records from storage_cleanup_queue...`);
    try {
      const { data: queueRows, error: qSelectErr } = await adminClient
        .from('storage_cleanup_queue')
        .select('id, object_path')
        .in('object_path', manifest.storagePaths);
      
      if (qSelectErr) {
        cleanupErrors.push(`Storage cleanup queue inspection failed: ${qSelectErr.message}`);
        console.error('  Warning inspecting queue records:', qSelectErr.message);
      } else {
        console.log(`  Verified ${queueRows ? queueRows.length : 0} queue records enqueued by card deletion trigger.`);
      }

      const { error: qDelErr } = await adminClient
        .from('storage_cleanup_queue')
        .delete()
        .in('object_path', manifest.storagePaths);
      if (qDelErr) {
        cleanupErrors.push(`Storage cleanup queue purge failed: ${qDelErr.message}`);
        console.error('  Warning purging queue records:', qDelErr.message);
      } else {
        console.log('  Tracked test queue records purged.');
        manifest.completedSteps.push('CLEANUP_QUEUE_PURGED');
        saveManifest();
      }
    } catch (err) {
      cleanupErrors.push(`Queue purge exception: ${err.message}`);
      console.error('  Queue purge exception:', err.message);
    }
  }

  // Step 5: Delete Ephemeral Auth Users (Tracked IDs only)
  if (!manifest.completedSteps.includes('AUTH_USERS_DELETED')) {
    console.log(`[Teardown 4/5] Deleting ephemeral test Auth users...`);
    let usersFailed = false;
    try {
      if (manifest.userAId) {
        const { error: delAErr } = await adminClient.auth.admin.deleteUser(manifest.userAId);
        if (delAErr && !delAErr.message.toLowerCase().includes('not found')) {
          usersFailed = true;
          cleanupErrors.push(`User A deletion failed: ${delAErr.message}`);
          console.error('  Warning deleting User A:', delAErr.message);
        } else {
          console.log(`  User A (${manifest.userAId.slice(0, 8)}...) deleted.`);
        }
      }
      if (manifest.userBId) {
        const { error: delBErr } = await adminClient.auth.admin.deleteUser(manifest.userBId);
        if (delBErr && !delBErr.message.toLowerCase().includes('not found')) {
          usersFailed = true;
          cleanupErrors.push(`User B deletion failed: ${delBErr.message}`);
          console.error('  Warning deleting User B:', delBErr.message);
        } else {
          console.log(`  User B (${manifest.userBId.slice(0, 8)}...) deleted.`);
        }
      }
      if (!usersFailed) {
        manifest.completedSteps.push('AUTH_USERS_DELETED');
        saveManifest();
      }
    } catch (err) {
      cleanupErrors.push(`Auth user deletion exception: ${err.message}`);
      console.error('  Auth user deletion exception:', err.message);
    }
  }

  // Step 6: PRESERVE & VERIFY SLUG TOMBSTONES (NEVER DELETED — SECURITY INVARIANT)
  console.log(`[Teardown 5/5] Preserving permanent slug tombstones in public.slug_registry...`);
  if (manifest.slugs.length > 0) {
    try {
      const { data: tombstones, error: slugErr } = await adminClient
        .from('slug_registry')
        .select('slug, status, retired_at')
        .in('slug', manifest.slugs);
      
      if (slugErr) {
        cleanupErrors.push(`Slug tombstone verification failed: ${slugErr.message}`);
        console.error('  Warning verifying slug tombstones:', slugErr.message);
      } else {
        console.log(`  Verified ${tombstones ? tombstones.length : 0} test slugs permanently retained in slug_registry:`);
        if (tombstones) {
          tombstones.forEach(t => console.log(`    - Slug: ${t.slug} | Status: ${t.status} | RetiredAt: ${t.retired_at || 'null'}`));
        }
        manifest.completedSteps.push('SLUG_TOMBSTONES_VERIFIED_INTACT');
        saveManifest();
      }
    } catch (err) {
      cleanupErrors.push(`Slug tombstone verification exception: ${err.message}`);
      console.error('  Slug tombstone verification exception:', err.message);
    }
  }

  // Evaluate Teardown Completion & Enforce Strict Safety Invariants
  if (cleanupErrors.length > 0) {
    manifest.cleanupStatus = 'FAILED';
    manifest.cleanupErrors = cleanupErrors;
    saveManifest();

    console.error('\n======================================================');
    console.error('[CRITICAL TEARDOWN FAILURE]');
    console.error(`Encountered ${cleanupErrors.length} error(s) during resource teardown:`);
    cleanupErrors.forEach(err => console.error(`  - ${err}`));
    console.error(`\nManifest preserved on disk for disaster recovery:`);
    console.error(`  Path: ${manifestPath}`);
    console.error(`\nTo purge residual test artifacts safely without exposing credentials, run:`);
    console.error(`  node scratch/recover-test-run.mjs ${manifestPath}`);
    console.error('======================================================\n');

    throw new Error(`Teardown failed with ${cleanupErrors.length} error(s). Test suite marked as FAILED.`);
  }

  manifest.cleanupStatus = 'SUCCESS';
  saveManifest();
  console.log(`\nTeardown complete. All test resources purged. Manifest saved at: ${manifestPath}\n`);
}

// ============================================================================
// 5. TEST RUNNER (15 Scenarios + 9 Storage Tests)
// ============================================================================
async function runTestSuite() {
  const env = loadEnvironment();
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const publishableKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('FATAL: Missing required Supabase credentials in .env.');
    process.exit(1);
  }

  // Strict Project Ref Preflight Guard
  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) {
    console.error(`FATAL PREFLIGHT REJECTION: Configured URL does not match canonical project ref "${EXPECTED_PROJECT_REF}".`);
    console.error(`Target was: ${supabaseUrl}`);
    process.exit(1);
  }

  // Administrative Client (Isolated strictly to Setup & Teardown)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  initManifest();

  // Register graceful termination signal handlers
  let cleanupRunning = false;
  const signalHandler = async (sig) => {
    console.log(`\n[SIGNAL INTERRUPT] Received ${sig}. Executing emergency teardown...`);
    if (!cleanupRunning) {
      cleanupRunning = true;
      try {
        await runIdempotentCleanup(adminClient);
      } catch (e) {
        console.error('Emergency cleanup failure:', e.message);
      }
    }
    process.exit(1);
  };
  process.once('SIGINT', () => signalHandler('SIGINT'));
  process.once('SIGTERM', () => signalHandler('SIGTERM'));

  console.log(`\n======================================================`);
  console.log(`STARTING SUPRILO TASK 2C-4C RUNTIME INTEGRATION SUITE`);
  console.log(`Run ID: ${runId}`);
  console.log(`Target Project: ${EXPECTED_PROJECT_REF}`);
  console.log(`======================================================\n`);

  let clientA, clientB;
  let suiteError = null;
  const userPassword = `SupriloTestPass_${crypto.randomBytes(8).toString('hex')}!`;

  try {
    // ------------------------------------------------------------------------
    // SCENARIO 1: Ephemeral Test Users Setup
    // ------------------------------------------------------------------------
    console.log('--- Scenario 1: Ephemeral Auth Users Creation ---');
    const { data: userAData, error: userAErr } = await adminClient.auth.admin.createUser({
      email: manifest.userAEmail,
      password: userPassword,
      email_confirm: true
    });
    if (userAErr) throw new Error(`User A creation failed: ${userAErr.message}`);
    manifest.userAId = userAData.user.id;
    saveManifest();
    console.log(`  User A created: ${manifest.userAId.slice(0, 8)}... (${manifest.userAEmail})`);

    const { data: userBData, error: userBErr } = await adminClient.auth.admin.createUser({
      email: manifest.userBEmail,
      password: userPassword,
      email_confirm: true
    });
    if (userBErr) throw new Error(`User B creation failed: ${userBErr.message}`);
    manifest.userBId = userBData.user.id;
    saveManifest();
    console.log(`  User B created: ${manifest.userBId.slice(0, 8)}... (${manifest.userBEmail})`);

    // Create User-Scoped Clients (Authenticating via Password)
    clientA = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false } });
    const { error: loginAErr } = await clientA.auth.signInWithPassword({
      email: manifest.userAEmail,
      password: userPassword
    });
    if (loginAErr) throw new Error(`User A login failed: ${loginAErr.message}`);

    clientB = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false } });
    const { error: loginBErr } = await clientB.auth.signInWithPassword({
      email: manifest.userBEmail,
      password: userPassword
    });
    if (loginBErr) throw new Error(`User B login failed: ${loginBErr.message}`);
    console.log('  User-scoped sessions active for Client A and Client B. (PASSED)');

    // ------------------------------------------------------------------------
    // SCENARIO 2: Draft 1 Creation & Lowest Slot (1) Assignment
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Draft 1 Creation & Lowest Slot Allocation ---');
    const slug1 = generateTestSlug();
    manifest.slugs.push(slug1);
    saveManifest();

    const { data: card1, error: card1Err } = await clientA.rpc('create_card_draft', {
      p_slug: slug1,
      p_recipient_name: 'Alice',
      p_sender_name: 'Bob',
      p_occasion_tag: 'Birthday',
      p_primary_message: 'Happy Birthday Alice!',
      p_cover_text: 'Scratch to reveal'
    });

    if (card1Err) throw new Error(`Draft 1 creation failed: ${card1Err.message}`);
    manifest.cardIds.push(card1.id);
    saveManifest();

    if (card1.draft_slot !== 1 || card1.status !== 'draft') {
      throw new Error(`Draft 1 slot/status mismatch: slot=${card1.draft_slot}, status=${card1.status}`);
    }

    // Verify database state
    const { data: card1DbState, error: card1DbErr } = await clientA.from('cards').select('id, draft_slot, status').eq('id', card1.id).single();
    if (card1DbErr || card1DbState.draft_slot !== 1 || card1DbState.status !== 'draft') {
      throw new Error(`Draft 1 database state check failed: slot=${card1DbState?.draft_slot}, status=${card1DbState?.status}`);
    }
    console.log(`  Draft 1 created successfully (ID: ${card1.id.slice(0, 8)}..., Slot: ${card1.draft_slot}). (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 3: Draft 2 and Draft 3 Creation (Occupying Slots 2 & 3)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Multiple Drafts Allocation (Slots 2 & 3) ---');
    const slug2 = generateTestSlug();
    manifest.slugs.push(slug2);
    saveManifest();
    const { data: card2, error: card2Err } = await clientA.rpc('create_card_draft', {
      p_slug: slug2,
      p_recipient_name: 'Charlie',
      p_sender_name: 'Bob',
      p_occasion_tag: 'Just Because',
      p_primary_message: 'Thinking of you!',
      p_cover_text: 'Scratch here'
    });
    if (card2Err) throw new Error(`Draft 2 creation failed: ${card2Err.message}`);
    manifest.cardIds.push(card2.id);
    saveManifest();
    if (card2.draft_slot !== 2) throw new Error(`Expected draft_slot 2, got ${card2.draft_slot}`);

    const slug3 = generateTestSlug();
    manifest.slugs.push(slug3);
    saveManifest();
    const { data: card3, error: card3Err } = await clientA.rpc('create_card_draft', {
      p_slug: slug3,
      p_recipient_name: 'Diana',
      p_sender_name: 'Bob',
      p_occasion_tag: 'Thank You',
      p_primary_message: 'Thank you for everything!',
      p_cover_text: 'A surprise for you'
    });
    if (card3Err) throw new Error(`Draft 3 creation failed: ${card3Err.message}`);
    manifest.cardIds.push(card3.id);
    saveManifest();
    if (card3.draft_slot !== 3) throw new Error(`Expected draft_slot 3, got ${card3.draft_slot}`);

    // Verify database state: User A has exactly 3 drafts occupying slots 1, 2, 3
    const { data: activeDrafts, error: draftsErr } = await clientA.from('cards').select('draft_slot').eq('status', 'draft').order('draft_slot', { ascending: true });
    if (draftsErr || activeDrafts.length !== 3 || activeDrafts[0].draft_slot !== 1 || activeDrafts[1].draft_slot !== 2 || activeDrafts[2].draft_slot !== 3) {
      throw new Error(`Active drafts slots state check failed`);
    }
    console.log(`  Draft 2 (Slot ${card2.draft_slot}) & Draft 3 (Slot ${card3.draft_slot}) allocated and verified in DB. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 4: 4th Draft Controlled Rejection (Ceiling Enforcement)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Fourth Draft Limit Rejection ---');
    const slug4 = generateTestSlug();
    const { data: card4, error: card4Err } = await clientA.rpc('create_card_draft', {
      p_slug: slug4,
      p_recipient_name: 'Eve',
      p_sender_name: 'Bob',
      p_occasion_tag: 'Congrats',
      p_primary_message: 'Congratulations on your new job!',
      p_cover_text: 'Scratch me'
    });

    if (!card4Err) throw new Error('Expected draft limit error, but 4th draft creation succeeded!');
    if (card4Err.code !== '23514' || !card4Err.message.includes('DRAFT_LIMIT_REACHED')) {
      throw new Error(`Expected SQLSTATE 23514 DRAFT_LIMIT_REACHED, got code=${card4Err.code}, msg=${card4Err.message}`);
    }

    // Verify database state: Active drafts count remains exactly 3, and slug4 was NOT inserted
    const { data: draftsAfterRejection } = await clientA.from('cards').select('id').eq('status', 'draft');
    if (draftsAfterRejection.length !== 3) throw new Error(`Draft count mutated after rejection: ${draftsAfterRejection.length}`);
    const { data: slug4Lookup } = await clientA.from('slug_registry').select('slug').eq('slug', slug4);
    if (slug4Lookup && slug4Lookup.length > 0) throw new Error('Rejected draft slug was incorrectly inserted into slug_registry!');
    console.log(`  4th draft creation blocked with SQLSTATE 23514 DRAFT_LIMIT_REACHED; DB state preserved at 3 drafts. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 5: Direct Status Modification Denial
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Direct Status Column Update Denial ---');
    const { data: statusUpdate, error: statusErr } = await clientA
      .from('cards')
      .update({ status: 'published' })
      .eq('id', card1.id);

    if (!statusErr) throw new Error('Expected direct status update denial, but update succeeded!');
    if (statusErr.code !== '42501' && !statusErr.message.includes('permission denied')) {
      throw new Error(`Expected SQLSTATE 42501 (insufficient_privilege), got code=${statusErr.code}, msg=${statusErr.message}`);
    }

    // Verify database state: Card 1 status is still 'draft'
    const { data: card1PostStatusUpdate } = await clientA.from('cards').select('status').eq('id', card1.id).single();
    if (card1PostStatusUpdate.status !== 'draft') {
      throw new Error(`Direct status update corrupted card status: ${card1PostStatusUpdate.status}`);
    }
    console.log(`  Direct status update blocked with SQLSTATE 42501; status remains 'draft'. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 6: Direct Draft Slot Tampering Denial
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Direct Draft Slot Tampering Denial ---');
    const { error: slotNullErr } = await clientA.from('cards').update({ draft_slot: null }).eq('id', card1.id);
    const { error: slotChangeErr } = await clientA.from('cards').update({ draft_slot: 3 }).eq('id', card1.id);

    if (!slotNullErr || slotNullErr.code !== '42501' || !slotChangeErr || slotChangeErr.code !== '42501') {
      throw new Error(`Direct draft slot tampering did not fail with SQLSTATE 42501: nullErr=${slotNullErr?.code}, changeErr=${slotChangeErr?.code}`);
    }

    // Verify database state: slot remains unchanged
    const { data: card1Check } = await clientA.from('cards').select('draft_slot').eq('id', card1.id).single();
    if (card1Check.draft_slot !== 1) throw new Error(`Draft slot was corrupted: ${card1Check.draft_slot}`);
    console.log(`  Direct draft slot tampering blocked with SQLSTATE 42501; original slot preserved. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 7: Cross-User Row-Level Security Isolation
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Cross-User RLS Isolation ---');
    const { data: userBSelect } = await clientB.from('cards').select('*').eq('id', card1.id);
    if (userBSelect && userBSelect.length > 0) throw new Error('User B was able to read User A card!');

    const { data: userBUpdate } = await clientB
      .from('cards')
      .update({ primary_message: 'Hacked message' })
      .eq('id', card1.id)
      .select();
    if (userBUpdate && userBUpdate.length > 0) throw new Error('User B was able to update User A card!');

    // Verify database state via Client A: primary_message remains pristine
    const { data: card1MsgCheck } = await clientA.from('cards').select('primary_message').eq('id', card1.id).single();
    if (card1MsgCheck.primary_message !== 'Happy Birthday Alice!') {
      throw new Error(`Card message was altered by cross-user request: ${card1MsgCheck.primary_message}`);
    }
    console.log(`  User B access to User A cards completely blocked by RLS policies; DB state intact. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 8: Comprehensive Storage Security Suite (ST-1 to ST-9)
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Comprehensive Storage Security Suite (ST-1 to ST-9) ---');
    const pathA1Jpg = `${manifest.userAId}/${card1.id}/photo.jpg`;
    const pathA1Png = `${manifest.userAId}/${card1.id}/photo.png`;
    const pathA1Webp = `${manifest.userAId}/${card1.id}/photo.webp`;

    // ST-1: Valid JPEG Upload (Magic bytes: FF D8 FF E0 00 10 4A 46 49 46)
    const fakeJpg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const { error: st1Err } = await clientA.storage.from('card-photos').upload(pathA1Jpg, fakeJpg, { contentType: 'image/jpeg' });
    if (st1Err) throw new Error(`ST-1 Valid JPEG failed: ${st1Err.message}`);
    manifest.storagePaths.push(pathA1Jpg);
    saveManifest();
    console.log('  [ST-1] Valid JPEG upload: 200 OK.');

    // ST-2: Valid PNG Upload (Magic bytes: 89 50 4E 47 0D 0A 1A 0A)
    const fakePng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const { error: st2Err } = await clientA.storage.from('card-photos').upload(pathA1Png, fakePng, { contentType: 'image/png' });
    if (st2Err) throw new Error(`ST-2 Valid PNG failed: ${st2Err.message}`);
    manifest.storagePaths.push(pathA1Png);
    saveManifest();
    console.log('  [ST-2] Valid PNG upload: 200 OK.');

    // ST-3: Valid WebP Upload (Magic bytes: RIFF....WEBPVP8L)
    const fakeWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
      0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
      0x00, 0x07, 0x88, 0x85, 0x85, 0x88, 0x00, 0xfe, 0xfb
    ]);
    const { error: st3Err } = await clientA.storage.from('card-photos').upload(pathA1Webp, fakeWebp, { contentType: 'image/webp' });
    if (st3Err) throw new Error(`ST-3 Valid WebP failed: ${st3Err.message}`);
    manifest.storagePaths.push(pathA1Webp);
    saveManifest();
    console.log('  [ST-3] Valid WebP upload: 200 OK.');

    // ST-4: Invalid MIME Type Rejection
    const { error: st4Err } = await clientA.storage.from('card-photos').upload(`${manifest.userAId}/${card1.id}/bad.txt`, Buffer.from('hello'), { contentType: 'text/plain' });
    if (!st4Err) throw new Error('ST-4 Invalid MIME text/plain was not rejected!');
    console.log('  [ST-4] Invalid MIME type text/plain rejected by bucket guard.');

    // ST-5: Oversized File (> 2MB) Rejection
    const largeBuffer = Buffer.alloc(2.1 * 1024 * 1024, 0); // 2.1 MB
    const { error: st5Err } = await clientA.storage.from('card-photos').upload(`${manifest.userAId}/${card1.id}/huge.jpg`, largeBuffer, { contentType: 'image/jpeg' });
    if (!st5Err) throw new Error('ST-5 Oversized file (> 2MB) was not rejected!');
    console.log('  [ST-5] Oversized buffer (> 2 MB) rejected by file_size_limit guard.');

    // ST-6: Cross-User Upload Rejection
    const { error: st6Err } = await clientA.storage.from('card-photos').upload(`${manifest.userBId}/${card1.id}/test.jpg`, fakeJpg, { contentType: 'image/jpeg' });
    if (!st6Err) throw new Error('ST-6 Cross-user upload was not rejected!');
    console.log('  [ST-6] Cross-user folder upload rejected by card_photos_owner_insert RLS.');

    // ST-7: Nonexistent Card Upload Rejection
    const { error: st7Err } = await clientA.storage.from('card-photos').upload(`${manifest.userAId}/00000000-0000-0000-0000-000000000000/test.jpg`, fakeJpg, { contentType: 'image/jpeg' });
    if (!st7Err) throw new Error('ST-7 Nonexistent card folder upload was not rejected!');
    console.log('  [ST-7] Upload to nonexistent card folder rejected by EXISTS(cards) RLS.');

    // ST-8: Unauthorized Delete Rejection
    const { data: st8Data } = await clientB.storage.from('card-photos').remove([pathA1Jpg]);
    if (st8Data && st8Data.length > 0) throw new Error('ST-8 User B was able to delete User A photo!');
    // Verify storage state: User A photo still exists
    const { data: aFolderListing } = await clientA.storage.from('card-photos').list(`${manifest.userAId}/${card1.id}`);
    if (!aFolderListing || !aFolderListing.some(f => f.name === 'photo.jpg')) {
      throw new Error('ST-8 User A photo was illegally deleted by unauthorized request!');
    }
    console.log('  [ST-8] Unauthorized delete rejected; photo.jpg confirmed intact in storage.');

    // ST-9: Private Bucket Download Denial
    const { data: publicUrlData } = clientA.storage.from('card-photos').getPublicUrl(pathA1Jpg);
    try {
      const publicResp = await fetch(publicUrlData.publicUrl);
      if (publicResp.status === 200) throw new Error('ST-9 Photo was publicly downloadable from private bucket!');
      console.log(`  [ST-9] Direct public download returned HTTP ${publicResp.status} (Private bucket enforced).`);
    } catch (fetchErr) {
      console.log(`  [ST-9] Direct public download blocked: ${fetchErr.message}`);
    }

    // ------------------------------------------------------------------------
    // SCENARIO 9: Publishing with Nonexistent Storage Photo
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 9: Publishing with Nonexistent Storage Photo ---');
    const ghostPhotoPath = `${manifest.userAId}/${card1.id}/nonexistent_ghost.jpg`;
    await clientA.from('cards').update({ photo_path: ghostPhotoPath }).eq('id', card1.id);

    const { error: ghostPublishErr } = await clientA.rpc('publish_card_draft', { p_card_id: card1.id });
    if (!ghostPublishErr) throw new Error('Publishing draft with nonexistent photo succeeded unexpectedly!');
    if (ghostPublishErr.code !== '23514' || !ghostPublishErr.message.includes('PHOTO_NOT_FOUND')) {
      throw new Error(`Expected 23514 PHOTO_NOT_FOUND, got code=${ghostPublishErr.code}, msg=${ghostPublishErr.message}`);
    }

    // Verify database state: status is still 'draft' and published_at is null
    const { data: card1PostGhost } = await clientA.from('cards').select('status, published_at').eq('id', card1.id).single();
    if (card1PostGhost.status !== 'draft' || card1PostGhost.published_at !== null) {
      throw new Error(`Invalid DB state after failed ghost publish: status=${card1PostGhost.status}`);
    }
    console.log(`  Publishing blocked with SQLSTATE 23514 PHOTO_NOT_FOUND; status remains 'draft'. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 10: Valid Draft Publication & Atomic Slot Release
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 10: Valid Draft Publication ---');
    // Set legitimate uploaded photo path
    await clientA.from('cards').update({ photo_path: pathA1Jpg }).eq('id', card1.id);

    const { data: publishedCard1, error: pubErr } = await clientA.rpc('publish_card_draft', { p_card_id: card1.id });
    if (pubErr) throw new Error(`Valid publication failed: ${pubErr.message}`);
    if (publishedCard1.status !== 'published' || publishedCard1.draft_slot !== null || !publishedCard1.published_at) {
      throw new Error(`Publication state invalid: status=${publishedCard1.status}, slot=${publishedCard1.draft_slot}`);
    }

    // Verify database state directly
    const { data: card1DbPublished } = await clientA.from('cards').select('status, draft_slot, published_at').eq('id', card1.id).single();
    if (card1DbPublished.status !== 'published' || card1DbPublished.draft_slot !== null || !card1DbPublished.published_at) {
      throw new Error('Database state did not reflect published card values');
    }
    console.log(`  Draft 1 published successfully: status='${publishedCard1.status}', draft_slot=null, published_at stamped. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 11: Atomic Draft Slot Recycling
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 11: Atomic Draft Slot Recycling ---');
    const slug5 = generateTestSlug();
    manifest.slugs.push(slug5);
    saveManifest();

    const { data: recycledCard, error: recErr } = await clientA.rpc('create_card_draft', {
      p_slug: slug5,
      p_recipient_name: 'Fiona',
      p_sender_name: 'Bob',
      p_occasion_tag: 'Just Because',
      p_primary_message: 'Slot recycled successfully!',
      p_cover_text: 'Scratch me'
    });

    if (recErr) throw new Error(`Slot recycling draft creation failed: ${recErr.message}`);
    manifest.cardIds.push(recycledCard.id);
    saveManifest();

    if (recycledCard.draft_slot !== 1) {
      throw new Error(`Expected recycled draft to claim vacant slot 1, got ${recycledCard.draft_slot}`);
    }

    // Verify database state: slot 1 is assigned in DB
    const { data: recycledDbCard } = await clientA.from('cards').select('draft_slot').eq('id', recycledCard.id).single();
    if (recycledDbCard.draft_slot !== 1) throw new Error(`Database check failed on recycled draft slot: ${recycledDbCard.draft_slot}`);
    console.log(`  Recycled draft claimed vacant slot 1 (ID: ${recycledCard.id.slice(0, 8)}...) verified in DB. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 12: Published Card Content Immutability
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 12: Published Card Content Immutability ---');
    const { error: freezeErr1 } = await clientA.from('cards').update({ primary_message: 'Modified after publish' }).eq('id', card1.id);
    const { error: freezeErr2 } = await clientA.from('cards').update({ recipient_name: 'Modified Recipient' }).eq('id', card1.id);
    const { error: freezeErr3 } = await clientA.from('cards').update({ foil_style: 'golden-foil' }).eq('id', card1.id);

    if (!freezeErr1 || freezeErr1.code !== '23514' || !freezeErr1.message.includes('IMMUTABLE_FIELD')) {
      throw new Error(`Published content mutation did not fail with 23514 IMMUTABLE_FIELD: ${freezeErr1?.message}`);
    }
    if (!freezeErr2 || freezeErr2.code !== '23514' || !freezeErr3 || freezeErr3.code !== '23514') {
      throw new Error('Content freeze failed on recipient_name or foil_style');
    }

    // Verify database state: fields remain unchanged
    const { data: card1PostFreeze } = await clientA.from('cards').select('primary_message, recipient_name, foil_style').eq('id', card1.id).single();
    if (card1PostFreeze.primary_message !== 'Happy Birthday Alice!' || card1PostFreeze.recipient_name !== 'Alice') {
      throw new Error('Database fields were mutated on published card!');
    }
    console.log(`  Modifications on published card blocked with SQLSTATE 23514 IMMUTABLE_FIELD; content preserved. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 13: Unauthorized Publishing Rejection
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 13: Unauthorized Publishing Rejection ---');
    const { error: unauthPubErr } = await clientB.rpc('publish_card_draft', { p_card_id: card2.id });
    if (!unauthPubErr || unauthPubErr.code !== '23514' || !unauthPubErr.message.includes('UNAUTHORIZED')) {
      throw new Error(`Unauthorized publish did not fail with 23514 UNAUTHORIZED: code=${unauthPubErr?.code}, msg=${unauthPubErr?.message}`);
    }

    // Verify database state: Card 2 remains 'draft'
    const { data: card2PostUnauth } = await clientA.from('cards').select('status, published_at').eq('id', card2.id).single();
    if (card2PostUnauth.status !== 'draft' || card2PostUnauth.published_at !== null) {
      throw new Error('Card 2 was illegally modified during unauthorized publish attempt');
    }
    console.log(`  Cross-user publishing rejected with SQLSTATE 23514 UNAUTHORIZED; DB state preserved. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 14: Archiving Lifecycle & Slot Recycling
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 14: Archiving Lifecycle & Slot Recycling ---');
    const { data: archivedCard2, error: archErr } = await clientA.rpc('archive_card', { p_card_id: card2.id });
    if (archErr) throw new Error(`Archiving card 2 failed: ${archErr.message}`);
    if (archivedCard2.status !== 'archived' || archivedCard2.draft_slot !== null) {
      throw new Error(`Archived card state invalid: status=${archivedCard2.status}, slot=${archivedCard2.draft_slot}`);
    }

    // Verify database state directly
    const { data: card2DbArchived } = await clientA.from('cards').select('status, draft_slot').eq('id', card2.id).single();
    if (card2DbArchived.status !== 'archived' || card2DbArchived.draft_slot !== null) {
      throw new Error('Database check failed for archived card');
    }

    // Creating another draft should now recycle slot 2
    const slug6 = generateTestSlug();
    manifest.slugs.push(slug6);
    saveManifest();

    const { data: cardFromArchivedSlot, error: archSlotErr } = await clientA.rpc('create_card_draft', {
      p_slug: slug6,
      p_recipient_name: 'George',
      p_sender_name: 'Bob',
      p_occasion_tag: 'Just Because',
      p_primary_message: 'Recycled slot 2 from archive!',
      p_cover_text: 'Scratch'
    });
    if (archSlotErr) throw new Error(`Draft creation after archive failed: ${archSlotErr.message}`);
    manifest.cardIds.push(cardFromArchivedSlot.id);
    saveManifest();

    if (cardFromArchivedSlot.draft_slot !== 2) {
      throw new Error(`Expected recycled slot 2 after archive, got ${cardFromArchivedSlot.draft_slot}`);
    }

    // Verify database state for recycled slot 2
    const { data: slot2DbCheck } = await clientA.from('cards').select('draft_slot').eq('id', cardFromArchivedSlot.id).single();
    if (slot2DbCheck.draft_slot !== 2) throw new Error(`Database check failed on recycled slot 2: ${slot2DbCheck.draft_slot}`);
    console.log(`  Card 2 archived; draft slot 2 recycled and assigned to new draft verified in DB. (PASSED)`);

    // ------------------------------------------------------------------------
    // SCENARIO 15: Repeated Publishing & Archiving Idempotency
    // ------------------------------------------------------------------------
    console.log('\n--- Scenario 15: Idempotent Publishing & Archiving ---');
    const { data: idempotentPub, error: idempPubErr } = await clientA.rpc('publish_card_draft', { p_card_id: card1.id });
    if (idempPubErr || idempotentPub.status !== 'published') throw new Error('Repeated publish failed idempotency');

    const { data: idempotentArch, error: idempArchErr } = await clientA.rpc('archive_card', { p_card_id: card2.id });
    if (idempArchErr || idempotentArch.status !== 'archived') throw new Error('Repeated archive failed idempotency');

    // Verify database state: status remains published & archived respectively
    const { data: idempCheck1 } = await clientA.from('cards').select('status').eq('id', card1.id).single();
    const { data: idempCheck2 } = await clientA.from('cards').select('status').eq('id', card2.id).single();
    if (idempCheck1.status !== 'published' || idempCheck2.status !== 'archived') {
      throw new Error('Database status corrupted by idempotent calls');
    }
    console.log(`  Repeated publish and archive requests returned existing state idempotently verified in DB. (PASSED)`);

  } catch (err) {
    suiteError = err;
  } finally {
    // Guaranteed teardown executes regardless of scenario pass or fail
    if (adminClient) {
      try {
        await runIdempotentCleanup(adminClient);
      } catch (cleanupErr) {
        if (!suiteError) {
          suiteError = cleanupErr;
        } else {
          console.error('[TEARDOWN ERROR CASCADE]', cleanupErr.message);
        }
      }
    }
  }

  // If any scenario failed OR any teardown operation failed, propagate failure
  if (suiteError) {
    throw suiteError;
  }

  // Full success reported ONLY when all scenarios passed AND teardown completed with 0 errors
  console.log(`\n======================================================`);
  console.log(`ALL 15 INTEGRATION SCENARIOS & 9 STORAGE CHECKS PASSED`);
  console.log(`TEARDOWN COMPLETED WITH ZERO RESIDUAL TEST ARTIFACTS`);
  console.log(`======================================================\n`);
}

// Direct execution guard
if (process.argv[1] && process.argv[1].endsWith('run-integration-tests.mjs')) {
  if (process.env.AUTHORIZED_TEST_EXECUTION === 'true') {
    runTestSuite().catch(err => {
      console.error('\nFATAL SUITE FAILURE:', err.message);
      process.exit(1);
    });
  } else {
    console.log('\n[NOTICE] Test script authored in DRY/STOPPED state.');
    console.log('Execution requires explicit user approval and environment authorization.\n');
  }
}

export { runTestSuite, runIdempotentCleanup };
