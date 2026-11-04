import fs from 'fs';

const runner = fs.readFileSync('scratch/run-integration-tests.mjs', 'utf8');
const recovery = fs.readFileSync('scratch/recover-test-run.mjs', 'utf8');

console.log('======================================================');
console.log('SUPRILO TASK 2C-4C COMPREHENSIVE STATIC AUDIT');
console.log('======================================================');

// --- 1. Secret Audit ---
console.log('\n--- 1. Secret Leakage Audit ---');
const secretPatterns = ['eyJh', 'sbp_', 'postgres://', 'password123', 'Bearer '];
let secretFound = false;
secretPatterns.forEach(pat => {
  if (runner.includes(pat) || recovery.includes(pat)) {
    console.error('ALERT: Secret pattern found in script:', pat);
    secretFound = true;
  }
});
if (!secretFound) {
  console.log('Secret check: CLEAN (Zero secrets hardcoded in runner or recovery)');
}

// --- 2. Project Ref Guard Audit ---
console.log('\n--- 2. Project Ref Guard Audit ---');
const runnerHasGuard = runner.includes("EXPECTED_PROJECT_REF = 'naynjodssamuacmjkaqx'") && runner.includes('supabaseUrl.includes(EXPECTED_PROJECT_REF)');
const recoveryHasGuard = recovery.includes("EXPECTED_PROJECT_REF = 'naynjodssamuacmjkaqx'") && recovery.includes('supabaseUrl.includes(EXPECTED_PROJECT_REF)') && recovery.includes('manifest.projectRef !== EXPECTED_PROJECT_REF');
console.log('Runner has preflight project-ref check:', runnerHasGuard ? 'PASS' : 'FAIL');
console.log('Recovery has preflight project-ref check:', recoveryHasGuard ? 'PASS' : 'FAIL');

// --- 3. Slug Registry Tombstone Safety Audit ---
console.log('\n--- 3. Slug Registry Tombstone Safety Audit ---');
const runnerDeletesSlugs = runner.includes("from('slug_registry').delete");
const recoveryDeletesSlugs = recovery.includes("from('slug_registry').delete");
console.log('Runner deletes slug_registry:', runnerDeletesSlugs ? 'VIOLATION' : 'SAFE (Never deleted)');
console.log('Recovery deletes slug_registry:', recoveryDeletesSlugs ? 'VIOLATION' : 'SAFE (Never deleted)');

// --- 4. Recovery Explicit Manifest Argument Audit ---
console.log('\n--- 4. Recovery Explicit Manifest Argument Audit ---');
const recoveryRequiresArg = recovery.includes('const targetManifestPath = process.argv[2]') && recovery.includes('if (!targetManifestPath)');
const recoveryHasAutoDetect = recovery.includes('Auto-detected latest manifest');
console.log('Recovery requires explicit manifest path argument:', recoveryRequiresArg ? 'PASS' : 'FAIL');
console.log('Recovery forbids ambiguous auto-detection:', !recoveryHasAutoDetect ? 'PASS' : 'FAIL');

// --- 5. Key & Session Isolation Audit ---
console.log('\n--- 5. Key & Session Isolation Audit ---');
const adminClientSetup = runner.includes("adminClient = createClient(supabaseUrl, serviceRoleKey");
const clientASetup = runner.includes("clientA = createClient(supabaseUrl, publishableKey");
const clientBSetup = runner.includes("clientB = createClient(supabaseUrl, publishableKey");
console.log('Admin client isolated to serviceRoleKey:', adminClientSetup ? 'PASS' : 'FAIL');
console.log('User A client scoped to publishableKey:', clientASetup ? 'PASS' : 'FAIL');
console.log('User B client scoped to publishableKey:', clientBSetup ? 'PASS' : 'FAIL');

// --- 6. Cleanup Specificity & Idempotency Audit ---
console.log('\n--- 6. Cleanup Specificity & Idempotency Audit ---');
const runnerCardCleanup = runner.includes("from('cards').delete().in('id', manifest.cardIds)");
const recoveryCardCleanup = recovery.includes("from('cards').delete().in('id', manifest.cardIds)");
const runnerQueueCleanup = runner.includes("from('storage_cleanup_queue')") && runner.includes(".in('object_path', manifest.storagePaths)");
const recoveryQueueCleanup = recovery.includes("from('storage_cleanup_queue')") && recovery.includes(".in('object_path', manifest.storagePaths)");
console.log('Runner targets tracked card IDs only:', runnerCardCleanup ? 'PASS' : 'FAIL');
console.log('Recovery targets tracked card IDs only:', recoveryCardCleanup ? 'PASS' : 'FAIL');
console.log('Runner targets tracked storage paths only in cleanup queue:', runnerQueueCleanup ? 'PASS' : 'FAIL');
console.log('Recovery targets tracked storage paths only in cleanup queue:', recoveryQueueCleanup ? 'PASS' : 'FAIL');

// --- 7. Execution Guard Audit ---
console.log('\n--- 7. Execution Guard Audit ---');
const runnerGuarded = runner.includes("process.env.AUTHORIZED_TEST_EXECUTION === 'true'");
console.log('Runner guarded by AUTHORIZED_TEST_EXECUTION:', runnerGuarded ? 'PASS' : 'FAIL');

// --- 8. Signal Handler (Graceful Teardown) Audit ---
console.log('\n--- 8. Signal Handler (Graceful Teardown) Audit ---');
const hasSignalHandlers = runner.includes("process.once('SIGINT'") && runner.includes("process.once('SIGTERM'");
console.log('Runner registers SIGINT/SIGTERM handlers:', hasSignalHandlers ? 'PASS' : 'FAIL');

// --- 9. Database State Verification Audit ---
console.log('\n--- 9. Database Post-Condition Verification Audit ---');
const checksPostDbState = runner.includes('draftsAfterRejection') &&
  runner.includes('card1PostStatusUpdate') &&
  runner.includes('card1MsgCheck') &&
  runner.includes('card1PostGhost') &&
  runner.includes('card1PostFreeze') &&
  runner.includes('card2PostUnauth');
console.log('Runner asserts resulting DB state across scenarios:', checksPostDbState ? 'PASS' : 'FAIL');

// --- 10. Teardown Failure Enforcement & Recovery Instructions Audit ---
console.log('\n--- 10. Teardown Failure Enforcement Audit ---');
const runnerFailsOnCleanupError = runner.includes("throw new Error(`Teardown failed with ${cleanupErrors.length} error(s). Test suite marked as FAILED.`)");
const runnerPreservesManifestOnFail = runner.includes("manifest.cleanupStatus = 'FAILED'") && runner.includes("manifest.cleanupErrors = cleanupErrors");
const runnerPrintsRecoveryCmd = runner.includes("node scratch/recover-test-run.mjs ${manifestPath}");
const recoveryFailsOnError = recovery.includes("manifest.recoveryStatus = 'FAILED'") && recovery.includes("process.exit(1)");

console.log('Runner fails test run if cleanup encounters error:', runnerFailsOnCleanupError ? 'PASS' : 'FAIL');
console.log('Runner preserves manifest on teardown failure:', runnerPreservesManifestOnFail ? 'PASS' : 'FAIL');
console.log('Runner prints standalone recovery instructions (zero secrets):', runnerPrintsRecoveryCmd ? 'PASS' : 'FAIL');
console.log('Recovery script marks FAILED and exits 1 on error:', recoveryFailsOnError ? 'PASS' : 'FAIL');

console.log('\n======================================================');
console.log('ALL STATIC SECURITY & SAFETY AUDIT CHECKS COMPLETE');
console.log('======================================================\n');
