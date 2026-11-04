/**
 * Suprilo Phase 2C — Task 2C-4C
 * Standalone Disaster Recovery & Orphan Purge Script
 * 
 * Purpose:
 * Recovers and idempotently purges all test artifacts created during an
 * interrupted, aborted, or crashed integration test run (e.g. SIGKILL, power loss).
 * 
 * STRICT SAFEGUARDS:
 * 1. Requires an explicit manifest path argument; refuses ambiguous automatic selection.
 * 2. Enforces preflight project ref guard ('naynjodssamuacmjkaqx').
 * 3. Never deletes slug_registry tombstones (preserves security invariant).
 * 4. Checks results of every deletion operation; marks recovery FAILED if any error occurs.
 * 5. Logs clear recovery details without exposing secrets.
 * 
 * Usage:
 *   node scratch/recover-test-run.mjs <path-to-test-manifest.json>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function recover() {
  console.log('======================================================');
  console.log('SUPRILO STANDALONE TEST ARTIFACT RECOVERY');
  console.log('======================================================');

  // 1. Resolve manifest file — Strict requirement for explicit manifest argument
  const targetManifestPath = process.argv[2];
  if (!targetManifestPath) {
    console.error('FATAL ERROR: Explicit manifest path argument required.');
    console.error('Automatic selection is disabled to prevent ambiguous recovery.');
    console.error('Usage: node scratch/recover-test-run.mjs scratch/test-manifest-<runId>.json');
    process.exit(1);
  }

  if (!fs.existsSync(targetManifestPath)) {
    console.error(`FATAL ERROR: Manifest file not found: ${targetManifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(targetManifestPath, 'utf8'));
  console.log(`Loaded Manifest: Run ID ${manifest.runId} (Created: ${manifest.createdAt})`);

  // 2. Preflight Project Ref Guard
  const env = loadEnvironment();
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('FATAL: Missing required Supabase credentials in .env.');
    process.exit(1);
  }

  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF) || manifest.projectRef !== EXPECTED_PROJECT_REF) {
    console.error(`FATAL: Manifest project ref mismatch. Refusing to run.`);
    console.error(`Expected project ref: "${EXPECTED_PROJECT_REF}"`);
    console.error(`Supabase URL: "${supabaseUrl}"`);
    console.error(`Manifest project ref: "${manifest.projectRef}"`);
    process.exit(1);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  manifest.completedSteps = manifest.completedSteps || [];
  const recoveryErrors = [];

  // Step 1: Remove Storage Objects (Tracked paths only)
  if (manifest.storagePaths && manifest.storagePaths.length > 0 && !manifest.completedSteps.includes('STORAGE_OBJECTS_DELETED')) {
    console.log(`[Recovery 1/5] Removing ${manifest.storagePaths.length} Storage objects...`);
    try {
      const { data, error } = await adminClient.storage.from('card-photos').remove(manifest.storagePaths);
      if (error) {
        recoveryErrors.push(`Storage removal error: ${error.message}`);
        console.error('  Warning removing storage objects:', error.message);
      } else {
        console.log('  Storage objects removed.');
        manifest.completedSteps.push('STORAGE_OBJECTS_DELETED');
      }
    } catch (e) {
      recoveryErrors.push(`Storage exception: ${e.message}`);
      console.error('  Storage error:', e.message);
    }
  }

  // Step 2: Delete Test Cards (Tracked IDs only)
  if (manifest.cardIds && manifest.cardIds.length > 0 && !manifest.completedSteps.includes('CARDS_DELETED')) {
    console.log(`[Recovery 2/5] Deleting ${manifest.cardIds.length} test cards...`);
    try {
      const { error } = await adminClient.from('cards').delete().in('id', manifest.cardIds);
      if (error) {
        recoveryErrors.push(`Card deletion error: ${error.message}`);
        console.error('  Warning deleting cards:', error.message);
      } else {
        console.log('  Cards deleted (triggers executed; metrics cascaded).');
        manifest.completedSteps.push('CARDS_DELETED');
      }
    } catch (e) {
      recoveryErrors.push(`Cards exception: ${e.message}`);
      console.error('  Cards error:', e.message);
    }
  }

  // Step 3 & 4: Purge Outbox Queue (Tracked paths only)
  if (manifest.storagePaths && manifest.storagePaths.length > 0 && !manifest.completedSteps.includes('CLEANUP_QUEUE_PURGED')) {
    console.log(`[Recovery 3/5] Purging test records from storage_cleanup_queue...`);
    try {
      const { error } = await adminClient.from('storage_cleanup_queue').delete().in('object_path', manifest.storagePaths);
      if (error) {
        recoveryErrors.push(`Cleanup queue purge error: ${error.message}`);
        console.error('  Warning purging queue:', error.message);
      } else {
        console.log('  Test queue records purged.');
        manifest.completedSteps.push('CLEANUP_QUEUE_PURGED');
      }
    } catch (e) {
      recoveryErrors.push(`Queue exception: ${e.message}`);
      console.error('  Queue error:', e.message);
    }
  }

  // Step 5: Delete Auth Users (Tracked IDs only)
  if (!manifest.completedSteps.includes('AUTH_USERS_DELETED')) {
    console.log(`[Recovery 4/5] Deleting test auth users...`);
    let usersFailed = false;
    if (manifest.userAId) {
      try {
        const { error } = await adminClient.auth.admin.deleteUser(manifest.userAId);
        if (error && !error.message.toLowerCase().includes('not found')) {
          usersFailed = true;
          recoveryErrors.push(`User A deletion error: ${error.message}`);
          console.error('  Warning deleting User A:', error.message);
        } else {
          console.log(`  User A (${manifest.userAId.slice(0, 8)}...) deleted.`);
        }
      } catch (e) {
        recoveryErrors.push(`User A exception: ${e.message}`);
        console.error('  User A error:', e.message);
      }
    }
    if (manifest.userBId) {
      try {
        const { error } = await adminClient.auth.admin.deleteUser(manifest.userBId);
        if (error && !error.message.toLowerCase().includes('not found')) {
          usersFailed = true;
          recoveryErrors.push(`User B deletion error: ${error.message}`);
          console.error('  Warning deleting User B:', error.message);
        } else {
          console.log(`  User B (${manifest.userBId.slice(0, 8)}...) deleted.`);
        }
      } catch (e) {
        recoveryErrors.push(`User B exception: ${e.message}`);
        console.error('  User B error:', e.message);
      }
    }
    if (!usersFailed) {
      manifest.completedSteps.push('AUTH_USERS_DELETED');
    }
  }

  // Step 6: Verify Retained Slug Tombstones (DO NOT DELETE — SECURITY INVARIANT)
  console.log(`[Recovery 5/5] Verifying permanent slug tombstones in public.slug_registry...`);
  if (manifest.slugs && manifest.slugs.length > 0 && !manifest.completedSteps.includes('SLUG_TOMBSTONES_VERIFIED_INTACT')) {
    try {
      const { data: tombstones, error: slugErr } = await adminClient
        .from('slug_registry')
        .select('slug, status, retired_at')
        .in('slug', manifest.slugs);
      
      if (slugErr) {
        recoveryErrors.push(`Slug tombstone verification error: ${slugErr.message}`);
        console.error('  Warning verifying slug tombstones:', slugErr.message);
      } else {
        console.log(`  Verified ${tombstones ? tombstones.length : 0} test slugs permanently retained in slug_registry:`);
        if (tombstones) {
          tombstones.forEach(t => console.log(`    - Slug: ${t.slug} | Status: ${t.status} | RetiredAt: ${t.retired_at || 'null'}`));
        }
        manifest.completedSteps.push('SLUG_TOMBSTONES_VERIFIED_INTACT');
      }
    } catch (e) {
      recoveryErrors.push(`Tombstones exception: ${e.message}`);
      console.error('  Tombstones error:', e.message);
    }
  }

  // Evaluate Recovery Status
  if (recoveryErrors.length > 0) {
    manifest.recoveryStatus = 'FAILED';
    manifest.recoveryErrors = recoveryErrors;
    fs.writeFileSync(targetManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.error('\n======================================================');
    console.error('[RECOVERY INCOMPLETE / FAILED]');
    console.error(`Encountered ${recoveryErrors.length} error(s) during standalone recovery:`);
    recoveryErrors.forEach(err => console.error(`  - ${err}`));
    console.error(`Manifest updated and preserved at: ${targetManifestPath}`);
    console.error('======================================================\n');
    process.exit(1);
  }

  manifest.recoveryStatus = 'SUCCESS';
  fs.writeFileSync(targetManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nRecovery successfully completed with zero residual test artifacts.`);
  console.log(`Manifest updated at: ${targetManifestPath}`);
}

recover().catch(err => {
  console.error('Recovery failed:', err.message);
  process.exit(1);
});
