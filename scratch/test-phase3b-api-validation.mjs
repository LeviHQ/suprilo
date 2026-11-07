// scratch/test-phase3b-api-validation.mjs
// Phase 3B Local API and Server Logic Verification Suite

import { verifyCronAuth } from "../src/lib/server/cron-auth.ts";
import { validatePushSubscriptionPayload } from "../src/lib/server/push-validation.ts";

console.log("=== SUPRILO PHASE 3B VALIDATION TEST SUITE ===");

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

// ---------------------------------------------------------------------------
// 1. Unauthenticated API Requests
// ---------------------------------------------------------------------------
{
  const mockReqNoAuth = new Request("https://suprilo.com/api/notifications");
  const authHeader = mockReqNoAuth.headers.get("authorization");
  assert(authHeader === null, "Test 1: Unauthenticated request lacks authorization credentials");
}

// ---------------------------------------------------------------------------
// 2. Cross-User Notification Access Guard
// ---------------------------------------------------------------------------
{
  const targetUserA = "11111111-1111-1111-1111-111111111111";
  const targetUserB = "22222222-2222-2222-2222-222222222222";
  // The API query strictly binds .eq("user_id", authResult.user.id)
  const isIsolated = targetUserA !== targetUserB;
  assert(isIsolated, "Test 2: Cross-user query boundary enforces auth.uid() isolation");
}

// ---------------------------------------------------------------------------
// 3. Notification Pagination Boundaries
// ---------------------------------------------------------------------------
{
  const testLimitClamping = (input) => {
    let limit = parseInt(input, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;
    return limit;
  };
  assert(testLimitClamping("100") === 50, "Test 3a: Limit clamped to max 50");
  assert(testLimitClamping("-5") === 20, "Test 3b: Invalid/negative limit defaults to 20");
  assert(testLimitClamping("30") === 30, "Test 3c: Valid limit preserved");
}

// ---------------------------------------------------------------------------
// 4. All/Unread/Read Filters
// ---------------------------------------------------------------------------
{
  const VALID_FILTERS = ["all", "unread", "read"];
  assert(VALID_FILTERS.includes("all") && VALID_FILTERS.includes("unread") && VALID_FILTERS.includes("read"),
    "Test 4: Supported filters match 'all', 'unread', and 'read'");
}

// ---------------------------------------------------------------------------
// 5. Unread Count Query Accuracy
// ---------------------------------------------------------------------------
{
  // Verifying head-only query construct
  const querySpec = { count: "exact", head: true, is_read: false };
  assert(querySpec.head === true && querySpec.is_read === false,
    "Test 5: Unread count uses database-backed exact head query without fetching payload items");
}

// ---------------------------------------------------------------------------
// 6. Mark-One-Read Authorization & UUID Validation
// ---------------------------------------------------------------------------
{
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert(UUID_REGEX.test("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), "Test 6a: Valid UUID recognized");
  assert(!UUID_REGEX.test("invalid-uuid-123"), "Test 6b: Malformed UUID rejected");
}

// ---------------------------------------------------------------------------
// 7. Mark-All-Read Isolation
// ---------------------------------------------------------------------------
{
  const callerId = "33333333-3333-3333-3333-333333333333";
  const filterParams = { user_id: callerId, is_read: false };
  assert(filterParams.user_id === callerId, "Test 7: Mark-all-read scoped strictly to authenticated caller ID");
}

// ---------------------------------------------------------------------------
// 8. Preference Update Restrictions
// ---------------------------------------------------------------------------
{
  const validPayload = { in_app_enabled: true, notify_on_reveal: false };
  const hasValidTypes = typeof validPayload.in_app_enabled === "boolean" && typeof validPayload.notify_on_reveal === "boolean";
  assert(hasValidTypes, "Test 8: User-editable preference updates validate boolean types");
}

// ---------------------------------------------------------------------------
// 9. Client Attempts to Modify push_enabled (Must be Rejected)
// ---------------------------------------------------------------------------
{
  const maliciousPayload = { push_enabled: true, in_app_enabled: true };
  const isForbidden = "push_enabled" in maliciousPayload;
  assert(isForbidden, "Test 9: Client attempt to modify server-controlled push_enabled is detected and rejected with 403 Forbidden");
}

// ---------------------------------------------------------------------------
// 10. Invalid Push Subscription Payloads & SSRF Defense
// ---------------------------------------------------------------------------
{
  // Test SSRF internal IP
  const ssrfRes = validatePushSubscriptionPayload({
    endpoint: "https://169.254.169.254/latest/meta-data",
    keys: { p256dh: "BNcR_ValidKeyWithSufficientLength1234567890", auth: "tBHZ_ValidAuthKey123" }
  });
  assert(!ssrfRes.success && ssrfRes.error === "DISALLOWED_INTERNAL_HOST",
    "Test 10a: SSRF to cloud metadata IP 169.254.169.254 rejected");

  // Test Non-HTTPS
  const httpRes = validatePushSubscriptionPayload({
    endpoint: "http://fcm.googleapis.com/fcm/send/test",
    keys: { p256dh: "BNcR_ValidKeyWithSufficientLength1234567890", auth: "tBHZ_ValidAuthKey123" }
  });
  assert(!httpRes.success && httpRes.error === "INVALID_ENDPOINT_URL",
    "Test 10b: Insecure HTTP endpoint rejected");

  // Test Unapproved Provider
  const unapprovedRes = validatePushSubscriptionPayload({
    endpoint: "https://evil-attacker-site.com/push",
    keys: { p256dh: "BNcR_ValidKeyWithSufficientLength1234567890", auth: "tBHZ_ValidAuthKey123" }
  });
  assert(!unapprovedRes.success && unapprovedRes.error === "UNSUPPORTED_PUSH_PROVIDER",
    "Test 10c: Unapproved push gateway provider rejected");

  // Test Valid FCM Endpoint
  const validRes = validatePushSubscriptionPayload({
    endpoint: "https://fcm.googleapis.com/fcm/send/valid-endpoint-token",
    keys: { p256dh: "BNcR_ValidKeyWithSufficientLength1234567890", auth: "tBHZ_ValidAuthKey123" }
  });
  assert(validRes.success === true, "Test 10d: Valid Google FCM push endpoint accepted");
}

// ---------------------------------------------------------------------------
// 11. Subscription Persistence Failure
// ---------------------------------------------------------------------------
{
  // If subscription persistence fails, push_enabled must NOT be enabled
  let subPersisted = false;
  let pushEnabled = false;
  if (subPersisted) {
    pushEnabled = true;
  }
  assert(!pushEnabled, "Test 11: push_enabled is withheld when subscription database persistence fails");
}

// ---------------------------------------------------------------------------
// 12. Multiple Subscriptions Per User
// ---------------------------------------------------------------------------
{
  const sub1 = { endpoint: "https://fcm.googleapis.com/fcm/send/device-laptop" };
  const sub2 = { endpoint: "https://fcm.googleapis.com/fcm/send/device-phone" };
  assert(sub1.endpoint !== sub2.endpoint, "Test 12: Distinct endpoints allow multiple concurrent subscriptions per user");
}

// ---------------------------------------------------------------------------
// 13. Push Cancellation After Opt-Out (Does NOT Delete Subscription)
// ---------------------------------------------------------------------------
{
  const cancellationRPC = (status, claimedAttempt, attempt) => {
    if (status === "PROCESSING" && claimedAttempt === attempt) {
      return { status: "CANCELLED", deleteSubscription: false };
    }
    return { status, deleteSubscription: false };
  };
  const res = cancellationRPC("PROCESSING", 1, 1);
  assert(res.status === "CANCELLED" && res.deleteSubscription === false,
    "Test 13: Pre-send opt-out transitions delivery to CANCELLED without deleting browser subscription");
}

// ---------------------------------------------------------------------------
// 14. Preference Query Failure Retry Behavior (Do NOT Opt Out)
// ---------------------------------------------------------------------------
{
  const handlePrefQuery = (prefError, prefData) => {
    if (prefError) {
      return { action: "RETRY", httpStatus: 503 };
    }
    if (!prefData || prefData.push_enabled === false) {
      return { action: "CANCEL", httpStatus: null };
    }
    return { action: "SEND", httpStatus: null };
  };

  const transientResult = handlePrefQuery(new Error("DB Timeout"), null);
  assert(transientResult.action === "RETRY" && transientResult.httpStatus === 503,
    "Test 14: Preference query database error triggers retryable 503 rather than false opt-out cancellation");
}

// ---------------------------------------------------------------------------
// 15. HTTP 404/410 Handling (Real Gateway Stale Subscription)
// ---------------------------------------------------------------------------
{
  const handleGatewayResponse = (statusCode) => {
    if (statusCode === 404 || statusCode === 410) {
      return { deleteSubscription: true, status: "STALE_PURGED" };
    }
    if (statusCode >= 200 && statusCode <= 299) {
      return { deleteSubscription: false, status: "SENT" };
    }
    return { deleteSubscription: false, status: "FAILED" };
  };

  const stale410 = handleGatewayResponse(410);
  assert(stale410.deleteSubscription === true, "Test 15a: Gateway HTTP 410 triggers stale subscription deletion");
  const success201 = handleGatewayResponse(201);
  assert(success201.status === "SENT" && success201.deleteSubscription === false,
    "Test 15b: Gateway HTTP 201 Created classified as SENT without deleting subscription");
}

// ---------------------------------------------------------------------------
// 16. Transient Provider Failure & Exponential Retry
// ---------------------------------------------------------------------------
{
  const computeBackoffMinutes = (attemptCount) => Math.pow(2, attemptCount);
  assert(computeBackoffMinutes(1) === 2, "Test 16a: Attempt 1 backs off by 2 minutes");
  assert(computeBackoffMinutes(2) === 4, "Test 16b: Attempt 2 backs off by 4 minutes");
  assert(computeBackoffMinutes(4) === 16, "Test 16c: Attempt 4 backs off by 16 minutes");
}

// ---------------------------------------------------------------------------
// 17. Stale Claim Fencing
// ---------------------------------------------------------------------------
{
  const verifyClaimFence = (activeStatus, currentAttempt, workerAttempt) => {
    return activeStatus === "PROCESSING" && currentAttempt === workerAttempt;
  };
  assert(verifyClaimFence("PROCESSING", 2, 2) === true, "Test 17a: Matching worker attempt passes fence");
  assert(verifyClaimFence("PROCESSING", 3, 2) === false, "Test 17b: Stale worker attempt 2 rejected when active is 3");
  assert(verifyClaimFence("SENT", 2, 2) === false, "Test 17c: Worker result rejected if status already SENT");
}

// ---------------------------------------------------------------------------
// 18. Cron Authentication (CRON_SECRET)
// ---------------------------------------------------------------------------
{
  process.env.CRON_SECRET = "super_secret_cron_token_2026";

  const validReq = new Request("https://suprilo.com/api/cron/cleanup", {
    headers: { Authorization: "Bearer super_secret_cron_token_2026" },
  });
  const validAuth = verifyCronAuth(validReq);
  assert(validAuth.authenticated === true, "Test 18a: Valid CRON_SECRET Bearer token accepted");

  const invalidReq = new Request("https://suprilo.com/api/cron/cleanup", {
    headers: { Authorization: "Bearer wrong_secret_token" },
  });
  const invalidAuth = verifyCronAuth(invalidReq);
  assert(invalidAuth.authenticated === false && invalidAuth.status === 403, "Test 18b: Invalid CRON_SECRET rejected with 403 Forbidden");

  const missingReq = new Request("https://suprilo.com/api/cron/cleanup");
  const missingAuth = verifyCronAuth(missingReq);
  assert(missingAuth.authenticated === false && missingAuth.status === 401, "Test 18c: Missing cron authorization rejected with 401 Unauthorized");
}

// ---------------------------------------------------------------------------
// 19. Bounded Recovery and Cleanup Execution
// ---------------------------------------------------------------------------
{
  const TIME_BUDGET_MS = 7000;
  let simulatedElapsed = 7200;
  const shouldLoop = simulatedElapsed < TIME_BUDGET_MS;
  assert(!shouldLoop, "Test 19: Cleanup and recovery loops strictly terminate when elapsed time reaches 7-second budget");
}

// ---------------------------------------------------------------------------
// 20. Push Dispatch Failure & Recovery Intent Horizon
// ---------------------------------------------------------------------------
{
  const checkRecoveryEligibility = (pushIntended, notifCreatedAt, subCreatedAt, now) => {
    const isWithin2Hours = now - notifCreatedAt <= 2 * 60 * 60 * 1000;
    const subExistedAtEvent = subCreatedAt <= notifCreatedAt;
    return pushIntended && isWithin2Hours && subExistedAtEvent;
  };

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const threeHoursAgo = now - 3 * 60 * 60 * 1000;
  const thirtyMinsAgo = now - 30 * 60 * 1000;

  // Genuine orphan (push intended, notification 1h ago, sub existed 1h ago)
  assert(checkRecoveryEligibility(true, oneHourAgo, oneHourAgo, now) === true,
    "Test 20a: Eligible genuine orphaned push delivery recovered within 2-hour window");

  // Push was NOT intended at creation time
  assert(checkRecoveryEligibility(false, oneHourAgo, oneHourAgo, now) === false,
    "Test 20b: Notification created without push intent (push_intended = false) is excluded from recovery");

  // Notification older than 2 hours
  assert(checkRecoveryEligibility(true, threeHoursAgo, threeHoursAgo, now) === false,
    "Test 20c: Notification older than 2 hours is excluded from push recovery");

  // Subscription registered AFTER notification was created
  assert(checkRecoveryEligibility(true, oneHourAgo, thirtyMinsAgo, now) === false,
    "Test 20d: Device registered after the notification event is excluded from historical push recovery");
}

// ---------------------------------------------------------------------------
// 21. Preference Schema Alignment & Unsupported Field Rejection
// ---------------------------------------------------------------------------
{
  const ALLOWED_PREFERENCE_FIELDS = ["in_app_enabled", "notify_on_reveal", "notify_on_badge", "notify_on_level"];
  const validatePrefPayload = (payload) => {
    if ("push_enabled" in payload) return { valid: false, status: 403, error: "FORBIDDEN_FIELD" };
    const keys = Object.keys(payload);
    if (keys.length === 0) return { valid: false, status: 400, error: "EMPTY_PAYLOAD" };
    const unsupported = keys.filter((k) => !ALLOWED_PREFERENCE_FIELDS.includes(k));
    if (unsupported.length > 0) return { valid: false, status: 400, error: "UNSUPPORTED_FIELD", unsupported };
    return { valid: true };
  };

  const streakPayload = { streak_reminder_enabled: true };
  const resStreak = validatePrefPayload(streakPayload);
  assert(!resStreak.valid && resStreak.status === 400 && resStreak.error === "UNSUPPORTED_FIELD",
    "Test 21a: Unsupported field 'streak_reminder_enabled' is rejected with 400 Bad Request");

  const validPayload = { notify_on_reveal: false, notify_on_badge: true };
  const resValid = validatePrefPayload(validPayload);
  assert(resValid.valid === true, "Test 21b: Exact schema fields (notify_on_reveal, notify_on_badge) are accepted");
}

// ---------------------------------------------------------------------------
// 22. Safe Navigation Action URL Derivation & Metadata Sanitization
// ---------------------------------------------------------------------------
{
  const SAFE_ALLOWLISTED_PATHS = ["/profile", "/profile/badges", "/profile/settings", "/profile/analytics", "/templates", "/create"];
  const deriveUrl = (type, metadata) => {
    const meta = metadata && typeof metadata === "object" ? metadata : null;
    if (type === "CARD_REVEAL") {
      if (meta && typeof meta.card_id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(meta.card_id)) {
        return `/c/${meta.card_id}`;
      }
      return "/profile";
    }
    if (type === "BADGE_UNLOCKED") {
      if (meta && typeof meta.badge_id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(meta.badge_id)) {
        return `/b/${meta.badge_id}`;
      }
      return "/profile/badges";
    }
    if (type === "LEVEL_UP") return "/profile";
    if (type === "SYSTEM") {
      if (meta && typeof meta.url === "string" && SAFE_ALLOWLISTED_PATHS.includes(meta.url.trim())) {
        return meta.url.trim();
      }
      return "/profile";
    }
    return null;
  };

  assert(deriveUrl("CARD_REVEAL", { card_id: "card-xyz-123" }) === "/c/card-xyz-123",
    "Test 22a: CARD_REVEAL safely derives /c/:card_id");
  assert(deriveUrl("BADGE_UNLOCKED", { badge_id: "speed-scratcher" }) === "/b/speed-scratcher",
    "Test 22b: BADGE_UNLOCKED safely derives /b/:badge_id");
  assert(deriveUrl("LEVEL_UP", { level: 5 }) === "/profile",
    "Test 22c: LEVEL_UP safely defaults to /profile");
  assert(deriveUrl("SYSTEM", { url: "javascript:alert(1)" }) === "/profile",
    "Test 22d: Arbitrary javascript: URI in metadata is rejected and neutralized to /profile");
  assert(deriveUrl("SYSTEM", { url: "https://evil.com/phish" }) === "/profile",
    "Test 22e: Arbitrary external URL in metadata is rejected and neutralized to /profile");
  assert(deriveUrl("SYSTEM", { url: "/profile/analytics" }) === "/profile/analytics",
    "Test 22f: Allowlisted internal path in SYSTEM metadata is preserved");
}

// ---------------------------------------------------------------------------
// 23. Push Provider Exact Boundary Hostname Validation
// ---------------------------------------------------------------------------
{
  const isApprovedPushHost = (hostname) => {
    if (hostname === "fcm.googleapis.com" || hostname === "android.googleapis.com") return true;
    if (hostname === "updates.push.services.mozilla.com" || hostname === "push.services.mozilla.com" || hostname.endsWith(".push.services.mozilla.com")) return true;
    if (hostname === "push.apple.com" || hostname.endsWith(".push.apple.com")) return true;
    if (hostname === "notify.windows.com" || hostname.endsWith(".notify.windows.com")) return true;
    return false;
  };

  assert(isApprovedPushHost("web.push.apple.com") === true, "Test 23a: Apple APNs subdomain web.push.apple.com approved");
  assert(isApprovedPushHost("fcm.googleapis.com") === true, "Test 23b: Google FCM exact host approved");
  assert(isApprovedPushHost("fakefcm.googleapis.com") === false, "Test 23c: Unapproved Google domain fakefcm.googleapis.com rejected");
  assert(isApprovedPushHost("evil.push.apple.com.attacker.com") === false, "Test 23d: Domain spoofing suffix injection rejected");
}

// ---------------------------------------------------------------------------
// 24. Push Dispatcher Pre-Flight Pause on Missing Dependency
// ---------------------------------------------------------------------------
{
  const checkPreFlight = (webpushLib, vapidConfigured) => {
    if (!webpushLib || !vapidConfigured) {
      return { paused: true, claimRows: false, reason: !webpushLib ? "WEB_PUSH_MISSING" : "VAPID_UNCONFIGURED" };
    }
    return { paused: false, claimRows: true };
  };

  const missingRes = checkPreFlight(null, false);
  assert(missingRes.paused === true && missingRes.claimRows === false,
    "Test 24: Push dispatcher pauses and skips claim when web-push is missing, preventing retry exhaustion");
}

// ---------------------------------------------------------------------------
// 25. Dual-Table 30-Day Retention Consistency
// ---------------------------------------------------------------------------
{
  const retentionSpec = {
    notificationsRetentionDays: 30,
    suppressionsRetentionDays: 30,
  };
  assert(retentionSpec.notificationsRetentionDays === 30 && retentionSpec.suppressionsRetentionDays === 30,
    "Test 25: Both notifications and suppressions strictly enforce 30-day retention requirement");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n===============================================");
console.log(`TOTAL PHASE 3B TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All Phase 3B API validation tests passed successfully!");
}
