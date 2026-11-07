// scratch/test-notification-system-validation.mjs
// Phase 3A Static and Structural Validation Test Suite for Suprilo Notification System

import fs from "fs";
import path from "path";

const migrationPath = path.resolve("supabase/migrations/20261107000001_notification_system.sql");
const sql = fs.readFileSync(migrationPath, "utf-8");

console.log("=== SUPRILO PHASE 3A VALIDATION TEST SUITE ===");
console.log(`Inspecting migration file: ${migrationPath} (${sql.length} bytes)`);

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}: ${details}`);
    failed++;
  }
}

// 1. Notification Deduplication
assert(
  sql.includes("CONSTRAINT uq_notifications_user_dedup UNIQUE (user_id, event_dedup_key)"),
  "Test 1: Notification deduplication constraint exists on (user_id, event_dedup_key)",
  "Missing uq_notifications_user_dedup constraint"
);

// 2. Recipient-only RLS
assert(
  sql.includes("ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;") &&
  sql.includes("CREATE POLICY notifications_select_policy ON public.notifications") &&
  sql.includes("FOR SELECT TO authenticated USING (auth.uid() = user_id);"),
  "Test 2: Recipient-only RLS select policy enforced on public.notifications",
  "Missing notifications RLS or recipient select policy"
);

// 3. Restricted notification updates
assert(
  sql.includes("GRANT UPDATE (is_read, read_at) ON TABLE public.notifications TO authenticated;") &&
  sql.includes("CREATE POLICY notifications_update_policy ON public.notifications") &&
  sql.includes("WITH CHECK (auth.uid() = user_id);"),
  "Test 3: Restricted notification updates enforced (only is_read, read_at granted to authenticated)",
  "Column-level grant or update policy missing"
);

// 4. Preference defaults
assert(
  sql.includes("in_app_enabled boolean NOT NULL DEFAULT true") &&
  sql.includes("push_enabled boolean NOT NULL DEFAULT false") &&
  sql.includes("notify_on_reveal boolean NOT NULL DEFAULT true") &&
  sql.includes("notify_on_badge boolean NOT NULL DEFAULT true") &&
  sql.includes("notify_on_level boolean NOT NULL DEFAULT true"),
  "Test 4: Preference defaults strictly match specification",
  "Preference defaults mismatch"
);

// 5. Category suppression
assert(
  sql.includes("IF p_type = 'CARD_REVEAL' AND NOT COALESCE(v_pref.notify_on_reveal, true) THEN") &&
  sql.includes("ELSIF p_type = 'BADGE_UNLOCKED' AND NOT COALESCE(v_pref.notify_on_badge, true) THEN") &&
  sql.includes("ELSIF p_type = 'LEVEL_UP' AND NOT COALESCE(v_pref.notify_on_level, true) THEN"),
  "Test 5: Category suppression branches enforced in enqueue_notification_safe",
  "Category suppression conditions missing"
);

// 6. Suppression tombstones
assert(
  sql.includes("CREATE TABLE IF NOT EXISTS public.notification_suppressions") &&
  sql.includes("INSERT INTO public.notification_suppressions (user_id, event_dedup_key)") &&
  sql.includes("CRITICAL_NOTIFICATION_AUDIT: Suppression tombstone failed to persist"),
  "Test 6: Suppression tombstones recorded with audit logging on write failure",
  "Suppression tombstone table or insertion logic missing"
);

// 7. Push fan-out failure isolation
assert(
  sql.includes("IF v_push_intended THEN") &&
  sql.includes("BEGIN") &&
  sql.includes("INSERT INTO public.notification_push_deliveries") &&
  sql.includes("EXCEPTION WHEN OTHERS THEN") &&
  sql.includes("RAISE WARNING 'Push fan-out failed for notification %"),
  "Test 7: Push fan-out failure isolated within nested subtransaction",
  "Nested exception block missing for push fan-out"
);

// 8. Multi-device delivery creation
assert(
  sql.includes("FROM public.push_subscriptions ps") &&
  sql.includes("WHERE ps.user_id = p_user_id") &&
  sql.includes("ON CONFLICT (notification_id, push_subscription_id) DO NOTHING;"),
  "Test 8: Multi-device push delivery fan-out maps 1:N with push_subscriptions",
  "Push delivery subscription mapping missing"
);

// 9. Cancellation versus provider HTTP 410
assert(
  sql.includes("CREATE OR REPLACE FUNCTION public.cancel_push_delivery") &&
  sql.includes("SET status = 'CANCELLED'") &&
  sql.includes("IF p_http_status IN (404, 410) THEN") &&
  sql.includes("DELETE FROM public.push_subscriptions WHERE id = v_delivery.push_subscription_id;"),
  "Test 9: Distinct cancellation RPC separated from real provider 404/410 stale endpoint purge",
  "cancel_push_delivery or provider 404/410 handling missing"
);

// 10. Claim fencing
assert(
  sql.includes("WHERE npd.id = p_delivery_id") &&
  sql.includes("FOR UPDATE;") &&
  sql.includes("IF v_delivery.status <> 'PROCESSING' OR v_delivery.attempt_count <> p_claimed_attempt THEN"),
  "Test 10: Worker claim fencing requires PROCESSING status and matching attempt_count",
  "Claim fencing logic missing in record_push_delivery_result"
);

// 11. Retry exhaustion
assert(
  sql.includes("ELSIF v_delivery.attempt_count >= 5 THEN") &&
  sql.includes("SET status = 'FAILED'") &&
  sql.includes("format('Max retries exceeded (HTTP %s)', p_http_status)"),
  "Test 11: Retry exhaustion strictly marks status = 'FAILED' after 5 attempts",
  "Retry exhaustion logic missing"
);

// 12. Stale worker recovery
assert(
  sql.includes("UPDATE public.notification_push_deliveries") &&
  sql.includes("SET status = 'FAILED'") &&
  sql.includes("WHERE status = 'PROCESSING'") &&
  sql.includes("AND last_attempt_at < clock_timestamp() - interval '5 minutes'") &&
  sql.includes("AND attempt_count >= 5;"),
  "Test 12: Stale worker crash recovery fails exhausted rows and reclaims eligible ones",
  "Stale worker recovery logic missing"
);

// 13. Push-intent-aware recovery
assert(
  sql.includes("WHERE n.push_intended = true") &&
  sql.includes("push_intended boolean NOT NULL DEFAULT false,"),
  "Test 13: Push-intent-aware recovery evaluates durable push_intended marker",
  "push_intended marker missing in schema or recovery"
);

// 14. Newly registered subscription exclusion
assert(
  sql.includes("AND ps.created_at <= n.created_at"),
  "Test 14: Recovery strictly excludes subscriptions created after the notification (ps.created_at <= n.created_at)",
  "Subscription creation horizon check missing"
);

// 15. Two-hour recovery cutoff
assert(
  sql.includes("AND n.created_at >= clock_timestamp() - interval '2 hours'"),
  "Test 15: Recovery strictly bounded to a 2-hour window",
  "2-hour recovery window filter missing"
);

// 16. Reconciliation without push fan-out
assert(
  sql.includes("SELECT user_id, type, title, body, event_dedup_key, metadata, created_at, false FROM missing_reveals") &&
  sql.includes("SELECT user_id, type, title, body, event_dedup_key, metadata, created_at, false FROM missing_badges") &&
  sql.includes("AND NOT EXISTS (\n        SELECT 1 FROM public.notification_suppressions ns"),
  "Test 16: Reconciliation stamps push_intended = false and respects suppression tombstones",
  "Reconciliation push_intended or suppression check missing"
);

// 17. 30-day cleanup and separate backlog reporting
assert(
  sql.includes("deleted_notifications integer,") &&
  sql.includes("deleted_suppressions integer,") &&
  sql.includes("remaining_notification_backlog bigint,") &&
  sql.includes("remaining_suppression_backlog bigint") &&
  sql.includes("WHERE created_at < clock_timestamp() - interval '30 days'") &&
  sql.includes("WHERE suppressed_at < clock_timestamp() - interval '30 days'"),
  "Test 17: 30-day cleanup prunes notifications and suppressions with split backlog reporting",
  "Pruning function split backlog or dual pruning missing"
);

console.log("\n===============================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Phase 3A static and structural validation tests passed!");
}

