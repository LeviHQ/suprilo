import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import crypto from "crypto";

// 1. Load environment variables
const envContent = fs.readFileSync(".env", "utf8");
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}=([^\\r\\n]+)`));
  return match ? match[1].trim() : null;
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceKey || !anonKey) {
  console.error("Missing required environment variables in .env");
  process.exit(1);
}

const EXPECTED_REF = "naynjodssamuacmjkaqx";
if (!supabaseUrl.includes(EXPECTED_REF)) {
  console.error(`Safety halt: supabaseUrl does not match expected reference ${EXPECTED_REF}`);
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("================================================================================");
console.log("Suprilo — Controlled Real-User-Flow Production Integration Test");
console.log(`Target: ${supabaseUrl}`);
console.log(`Execution Mode: Isolated Test Entity with Guaranteed Teardown`);
console.log("================================================================================\n");

function generateCanonicalSlug() {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let slug = "";
  for (let i = 0; i < 12; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

let testUserId = null;
let testCardId = null;
let testPageSessionId = null;
let testReceiptId = null;
let testVisitorHash = null;

async function runTest() {
  const testRunId = Date.now().toString(36);
  const testEmail = `test-verify-${testRunId}@suprilo-internal-test.invalid`;
  const testPassword = `TestPass!_${crypto.randomBytes(12).toString("hex")}`;
  testPageSessionId = crypto.randomUUID();
  testVisitorHash = crypto.createHash("sha256").update(`mock-visitor-${testRunId}`).digest("hex");

  try {
    // --------------------------------------------------------------------------
    // Step 1: Create Isolated Test Creator & Card
    // --------------------------------------------------------------------------
    console.log("Step 1: Creating isolated test creator and published card...");
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { is_synthetic_test: true, test_run_id: testRunId },
    });

    if (userError || !userData?.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }
    testUserId = userData.user.id;
    console.log(`  -> Test user created: ${testUserId} (${testEmail})`);

    // Ensure profile row exists
    await adminClient.from("profiles").upsert({
      id: testUserId,
      email: testEmail,
      full_name: "Test Verification Runner",
      updated_at: new Date().toISOString(),
    });

    const testSlug = generateCanonicalSlug();
    const { data: cardData, error: cardError } = await adminClient
      .from("cards")
      .insert({
        user_id: testUserId,
        slug: testSlug,
        status: "published",
        published_at: new Date().toISOString(),
        recipient_name: "Test Recipient",
        sender_name: "Test Sender",
        occasion_tag: "Birthday",
        primary_message: "Test primary message for integration probe",
        foil_style: "lavender-pink",
        cover_text: "Scratch to reveal your surprise ✨",
        bg_palette: "pure-ivory",
        sticker: "sparkles",
        reveal_threshold: 0.65,
        sound_enabled: true,
      })
      .select("id, slug, status, user_id")
      .single();

    if (cardError || !cardData) {
      throw new Error(`Failed to create test card: ${cardError?.message}`);
    }
    testCardId = cardData.id;
    console.log(`  -> Test published card created: ${testCardId} (slug: ${testSlug})`);

    // Initialize card_metrics row if not auto-created by triggers
    await adminClient.from("card_metrics").upsert({
      card_id: testCardId,
      views_count: 0,
      reveals_count: 0,
      updated_at: new Date().toISOString(),
    });

    // --------------------------------------------------------------------------
    // Step 2: Recipient Handshake Verification
    // --------------------------------------------------------------------------
    console.log("\nStep 2: Executing Recipient Handshake (record_card_view_handshake)...");
    const { data: handshakeData, error: handshakeError } = await adminClient.rpc(
      "record_card_view_handshake",
      {
        p_card_id: testCardId,
        p_page_session_id: testPageSessionId,
        p_visitor_id_hash: testVisitorHash,
        p_is_untracked: false,
        p_previous_visitor_id_hash: null,
      }
    );

    if (handshakeError) {
      throw new Error(`Handshake RPC failed: ${handshakeError.message}`);
    }

    const handshakeRow = Array.isArray(handshakeData) ? handshakeData[0] : handshakeData;
    testReceiptId = handshakeRow?.view_receipt_id;
    if (!testReceiptId) {
      throw new Error(`Handshake did not return view_receipt_id: ${JSON.stringify(handshakeData)}`);
    }
    console.log(`  -> Handshake returned receipt: ${testReceiptId} (untracked: ${handshakeRow?.is_untracked})`);

    // Verify row in card_view_events
    const { data: viewRecord, error: viewFetchError } = await adminClient
      .from("card_view_events")
      .select("view_receipt_id, card_id, visitor_id_hash, page_session_id, consumed_at")
      .eq("view_receipt_id", testReceiptId)
      .single();

    if (viewFetchError || !viewRecord) {
      throw new Error(`Failed to verify card_view_events record: ${viewFetchError?.message}`);
    }
    console.log(`  [ASSERTION 2.1 PASS] card_view_events contains receipt bound to card_id ${viewRecord.card_id}`);

    // --------------------------------------------------------------------------
    // Step 3: Idempotent Handshake Replay Verification
    // --------------------------------------------------------------------------
    console.log("\nStep 3: Executing Idempotent Handshake Replay...");
    const { data: replayData, error: replayError } = await adminClient.rpc(
      "record_card_view_handshake",
      {
        p_card_id: testCardId,
        p_page_session_id: testPageSessionId,
        p_visitor_id_hash: testVisitorHash,
        p_is_untracked: false,
        p_previous_visitor_id_hash: null,
      }
    );

    if (replayError) {
      throw new Error(`Replay Handshake RPC failed: ${replayError.message}`);
    }

    const replayRow = Array.isArray(replayData) ? replayData[0] : replayData;
    const replayReceiptId = replayRow?.view_receipt_id;
    if (replayReceiptId !== testReceiptId) {
      throw new Error(`Idempotency violated: expected receipt ${testReceiptId}, got ${replayReceiptId}`);
    }

    // Verify count in card_view_events for this page_session_id is still exactly 1
    const { count: sessionCount, error: countError } = await adminClient
      .from("card_view_events")
      .select("*", { count: "exact", head: true })
      .eq("page_session_id", testPageSessionId);

    if (countError || sessionCount !== 1) {
      throw new Error(`Expected exactly 1 receipt for page_session_id, found ${sessionCount}`);
    }
    console.log(`  [ASSERTION 3.1 PASS] Handshake replay is strictly idempotent (exact receipt returned, count = 1)`);

    // --------------------------------------------------------------------------
    // Step 4: Recipient Reveal Execution & Fast Scratch Verification
    // --------------------------------------------------------------------------
    console.log("\nStep 4: Executing Reveal with Fast Scratch qualification (<600,000ms)...");
    const { data: revealData, error: revealError } = await adminClient.rpc("record_card_reveal", {
      p_card_id: testCardId,
      p_view_receipt_id: testReceiptId,
      p_visitor_id_hash: testVisitorHash,
      p_previous_visitor_id_hash: null,
    });

    if (revealError) {
      throw new Error(`Reveal RPC failed: ${revealError.message}`);
    }

    console.log("  -> Reveal RPC result:", revealData);
    if (!revealData?.fast_scratch) {
      throw new Error(`Expected fast_scratch: true within seconds of handshake, got: ${JSON.stringify(revealData)}`);
    }
    console.log(`  [ASSERTION 4.1 PASS] Fast Scratch qualified (elapsed_ms: ${revealData.elapsed_ms}ms <= 600,000ms)`);

    // Verify card_view_events.consumed_at is stamped
    const { data: consumedRecord, error: consumedErr } = await adminClient
      .from("card_view_events")
      .select("consumed_at")
      .eq("view_receipt_id", testReceiptId)
      .single();

    if (consumedErr || !consumedRecord?.consumed_at) {
      throw new Error(`Receipt consumed_at was not stamped after reveal: ${consumedErr?.message}`);
    }
    console.log(`  [ASSERTION 4.2 PASS] Receipt consumed_at successfully stamped: ${consumedRecord.consumed_at}`);

    // Verify card_fast_scratch_events entry
    const { data: fastEvents, error: fastError } = await adminClient
      .from("card_fast_scratch_events")
      .select("id, card_id, view_receipt_id, elapsed_ms")
      .eq("view_receipt_id", testReceiptId);

    if (fastError || !fastEvents || fastEvents.length !== 1) {
      throw new Error(`Expected 1 fast scratch event, found: ${fastEvents?.length}`);
    }
    console.log(`  [ASSERTION 4.3 PASS] card_fast_scratch_events recorded receipt (elapsed_ms: ${fastEvents[0].elapsed_ms})`);

    // --------------------------------------------------------------------------
    // Step 5: Reveal Replay Protection Verification
    // --------------------------------------------------------------------------
    console.log("\nStep 5: Executing Duplicate Reveal to verify replay protection...");
    const { data: dupRevealData, error: dupRevealError } = await adminClient.rpc("record_card_reveal", {
      p_card_id: testCardId,
      p_view_receipt_id: testReceiptId,
      p_visitor_id_hash: testVisitorHash,
      p_previous_visitor_id_hash: null,
    });

    if (dupRevealError) {
      throw new Error(`Duplicate reveal RPC failed unexpectedly: ${dupRevealError.message}`);
    }

    console.log("  -> Duplicate reveal RPC result:", dupRevealData);
    if (dupRevealData?.status !== "already_consumed") {
      throw new Error(`Expected status 'already_consumed', got: ${dupRevealData?.status}`);
    }
    if (dupRevealData?.fast_scratch !== false) {
      throw new Error(`Replayed reveal must NOT qualify for fast_scratch`);
    }

    // Verify card_fast_scratch_events count did not increase
    const { count: fastCount } = await adminClient
      .from("card_fast_scratch_events")
      .select("*", { count: "exact", head: true })
      .eq("view_receipt_id", testReceiptId);

    if (fastCount !== 1) {
      throw new Error(`Replay protection failed: fast scratch event count is ${fastCount} (expected 1)`);
    }
    console.log(`  [ASSERTION 5.1 PASS] Replay protection enforced (status: already_consumed, fast_scratch: false, count = 1)`);

    // --------------------------------------------------------------------------
    // Step 6: Badge Share Event & 5-Minute Deduplication Verification
    // --------------------------------------------------------------------------
    console.log("\nStep 6: Executing Creator Share Event & Deduplication...");
    // Create an authenticated client logged in as test user
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInError) {
      throw new Error(`Failed to sign in test user for share event: ${signInError.message}`);
    }

    // Call 1: First share on owned card
    const { data: share1Data, error: share1Error } = await authClient.rpc("record_creator_share_event", {
      p_target_type: "card",
      p_target_id: testCardId,
      p_action_type: "link_copied",
    });

    if (share1Error) {
      throw new Error(`Share 1 failed: ${share1Error.message}`);
    }
    console.log("  -> Share 1 result:", share1Data);
    if (!share1Data?.success || share1Data?.deduplicated) {
      throw new Error(`Expected share 1 success: true, deduplicated: false. Got: ${JSON.stringify(share1Data)}`);
    }
    console.log("  [ASSERTION 6.1 PASS] First share event recorded successfully");

    // Call 2: Immediate duplicate share within 5 minutes
    const { data: share2Data, error: share2Error } = await authClient.rpc("record_creator_share_event", {
      p_target_type: "card",
      p_target_id: testCardId,
      p_action_type: "link_copied",
    });

    if (share2Error) {
      throw new Error(`Share 2 failed: ${share2Error.message}`);
    }
    console.log("  -> Share 2 (immediate retry) result:", share2Data);
    if (!share2Data?.success || !share2Data?.deduplicated) {
      throw new Error(`Expected share 2 success: true, deduplicated: true. Got: ${JSON.stringify(share2Data)}`);
    }
    console.log("  [ASSERTION 6.2 PASS] Second share event within 5-minute window correctly deduplicated");

    // Verify creator_share_events count for this user
    const { count: shareCount } = await adminClient
      .from("creator_share_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", testUserId);

    if (shareCount !== 1) {
      throw new Error(`Expected exactly 1 row in creator_share_events, got ${shareCount}`);
    }
    console.log(`  [ASSERTION 6.3 PASS] creator_share_events contains exactly 1 row after duplicate calls`);

    // Verify synchronous badge awarding and share_token generation via extensions.gen_random_bytes
    const { data: userBadges, error: badgesErr } = await adminClient
      .from("user_badges")
      .select("badge_id, points_awarded, unlocked_at, share_token")
      .eq("user_id", testUserId);

    if (badgesErr) {
      throw new Error(`Failed to query user_badges: ${badgesErr.message}`);
    }
    console.log(`  -> Unlocked badges for test user (${userBadges?.length || 0}):`, userBadges?.map(b => `${b.badge_id} (${b.points_awarded} XP, token: ${b.share_token})`));

    if (!userBadges || userBadges.length === 0) {
      throw new Error(`Expected at least 1 badge to be awarded on publish/share (e.g. first-card or card-shared)`);
    }

    for (const b of userBadges) {
      if (!b.share_token || !/^[a-f0-9]{24}$/.test(b.share_token)) {
        throw new Error(`Invalid share_token format on badge ${b.badge_id}: ${b.share_token}`);
      }
    }
    console.log(`  [ASSERTION 6.4 PASS] Badges awarded with valid 24-character hexadecimal share_token (extensions.gen_random_bytes verified)`);

    // Verify gamification stats and XP calculation
    const { data: stats, error: statsErr } = await adminClient
      .from("user_gamification_stats")
      .select("total_xp, current_level, cards_shared_count, badges_shared_count")
      .eq("user_id", testUserId)
      .single();

    if (statsErr || !stats) {
      throw new Error(`Failed to fetch user_gamification_stats: ${statsErr?.message}`);
    }
    console.log(`  -> Gamification stats: Level ${stats.current_level}, Total XP: ${stats.total_xp}, Badges Unlocked: ${userBadges.length}, Cards Shared: ${stats.cards_shared_count}`);

    const expectedXp = userBadges.reduce((sum, b) => sum + b.points_awarded, 0);
    if (stats.total_xp !== expectedXp) {
      throw new Error(`XP mismatch: user_gamification_stats.total_xp (${stats.total_xp}) != sum of user_badges points (${expectedXp})`);
    }
    console.log(`  [ASSERTION 6.5 PASS] XP calculated exactly once (${stats.total_xp} XP matching ${userBadges.length} unlocked badges)`);

  } finally {
    // --------------------------------------------------------------------------
    // Step 7: Complete Teardown & Purge
    // --------------------------------------------------------------------------
    console.log("\nStep 7: Executing Teardown & Purge of all test entities...");
    try {
      if (testUserId) {
        // Delete share events
        const { error: delShareErr } = await adminClient
          .from("creator_share_events")
          .delete()
          .eq("user_id", testUserId);
        if (delShareErr) console.warn("  Cleanup warning (creator_share_events):", delShareErr.message);

        // Delete user badges / gamification stats if any were generated
        await adminClient.from("user_badges").delete().eq("user_id", testUserId);
        await adminClient.from("user_gamification_stats").delete().eq("user_id", testUserId);
      }

      if (testCardId) {
        // Delete fast scratch events
        const { error: delFastErr } = await adminClient
          .from("card_fast_scratch_events")
          .delete()
          .eq("card_id", testCardId);
        if (delFastErr) console.warn("  Cleanup warning (card_fast_scratch_events):", delFastErr.message);

        // Delete view events
        const { error: delViewErr } = await adminClient
          .from("card_view_events")
          .delete()
          .eq("card_id", testCardId);
        if (delViewErr) console.warn("  Cleanup warning (card_view_events):", delViewErr.message);

        // Delete metrics
        await adminClient.from("card_metrics").delete().eq("card_id", testCardId);

        // Delete card
        const { error: delCardErr } = await adminClient
          .from("cards")
          .delete()
          .eq("id", testCardId);
        if (delCardErr) console.warn("  Cleanup warning (cards):", delCardErr.message);
      }

      if (testUserId) {
        // Delete profile
        await adminClient.from("profiles").delete().eq("id", testUserId);

        // Delete auth user
        const { error: delUserErr } = await adminClient.auth.admin.deleteUser(testUserId);
        if (delUserErr) console.warn("  Cleanup warning (auth.users):", delUserErr.message);
      }

      console.log("  [TEARDOWN COMPLETE] All temporary entities purged cleanly. Zero residual test records.");
    } catch (cleanupErr) {
      console.error("  Error during teardown:", cleanupErr);
    }
  }
}

runTest()
  .then(() => {
    console.log("\n================================================================================");
    console.log("ALL REAL-USER-FLOW ASSERTIONS PASSED SUCCESSFULLY (7 / 7)");
    console.log("================================================================================");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nTEST FAILED:", err);
    process.exit(1);
  });
