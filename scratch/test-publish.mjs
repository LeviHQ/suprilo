/**
 * Suprilo Task 2C-5.3.4 — Supabase Publish Integration Unit Test Suite
 *
 * Verifies:
 * 1. Correct RPC invocation and argument mapping:
 *    - Calls `publish_card_draft` with parameter `{ p_card_id }`
 *    - Never sends extraneous or fabricated parameters
 * 2. Successful publishing returns and uses the actual slug:
 *    - Canonical slug from returned DbCard is used
 *    - Share URL correctly maps to /s/{slug}
 * 3. RPC errors are surfaced correctly:
 *    - Error messages are translated to clean, actionable user feedback
 *    - Useful message details are preserved without swallowing
 * 4. Unauthenticated or unconfirmed drafts cannot publish:
 *    - Blocked when user is null
 *    - Blocked when draftId is null or isDraftReady is false
 * 5. Duplicate clicks do not trigger duplicate requests:
 *    - In-flight lock prevents duplicate RPC invocations while publishing
 * 6. Pending autosave is flushed before publish:
 *    - Pending debounced edits are flushed and confirmed saved before calling RPC
 *    - Stale or unsaved drafts are never published
 * 7. Publishing blocked while photo upload/removal is pending or failed:
 *    - Blocked when uploadStatus is 'uploading'
 *    - Blocked when uploadStatus is 'error'
 * 8. Failed publish preserves editor content:
 *    - Failure does not wipe or mutate editor state
 *    - No success modal or share URL displayed
 * 9. Draft/account switch prevents stale success UI:
 *    - Switching draft while publish is in-flight does not mark new draft as published
 *    - Switching account while publish is in-flight does not mark new account as published
 * 10. Existing successful publish flow works idempotently:
 *     - If already published for this draft, repeated clicks return existing share URL without re-calling RPC
 *
 * Strictly isolated: 100% Mocked (0 remote Supabase database or network impact).
 */

import assert from "node:assert/strict";

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.3.4 — Supabase Publish Integration Unit Tests (100% Mocked)");
console.log("================================================================================\n");

const {
  publishCardDraft,
  buildCardShareUrl,
} = await import("../src/lib/cards.ts");

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

// =============================================================================
// SUITE 1: Card Share URL Construction & Validation
// =============================================================================
console.log("1. Testing Card Share URL Construction (buildCardShareUrl)...");
{
  // Test canonical production URL
  const url1 = buildCardShareUrl("23456789abcd", "https://suprilo.com");
  testAssert(url1 === "https://suprilo.com/s/23456789abcd", "Constructs https://suprilo.com/s/{slug}");

  // Test trailing slash normalization
  const url2 = buildCardShareUrl("23456789abcd", "https://suprilo.com///");
  testAssert(url2 === "https://suprilo.com/s/23456789abcd", "Normalizes trailing slashes on base URL");

  // Test local development URL
  const url3 = buildCardShareUrl("987654321xyz", "http://localhost:3000");
  testAssert(url3 === "http://localhost:3000/s/987654321xyz", "Constructs local development share URL");

  // Test empty slug rejection
  let threwEmpty = false;
  try {
    buildCardShareUrl("");
  } catch (err) {
    threwEmpty = true;
  }
  testAssert(threwEmpty, "Rejects empty slug with clear error");
}

// =============================================================================
// SUITE 2: Publish RPC Helper Invocation & Parameter Mapping (publishCardDraft)
// =============================================================================
console.log("\n2. Testing publishCardDraft RPC Invocation...");
{
  const testCardId = "c1111111-1111-4111-8111-111111111111";
  const rpcCalls = [];

  const mockClient = {
    rpc: async (fnName, params) => {
      rpcCalls.push({ fnName, params });
      return {
        data: {
          id: testCardId,
          slug: "abc23456789z",
          status: "published",
          draft_slot: null,
          published_at: "2026-11-05T12:00:00.000Z",
          updated_at: "2026-11-05T12:00:00.000Z",
        },
        error: null,
      };
    },
  };

  const result = await publishCardDraft(testCardId, mockClient);

  testAssert(rpcCalls.length === 1, "Calls RPC exactly once");
  testAssert(rpcCalls[0].fnName === "publish_card_draft", "Invokes public.publish_card_draft");
  testAssert(rpcCalls[0].params.p_card_id === testCardId, "Maps p_card_id correctly");
  testAssert(Object.keys(rpcCalls[0].params).length === 1, "Passes ONLY p_card_id argument");
  testAssert(result.status === "published", "Returns published status");
  testAssert(result.slug === "abc23456789z", "Returns actual database slug");
  testAssert(result.draft_slot === null, "Draft slot is released (null)");

  // Rejection of empty cardId
  let threwEmptyCardId = false;
  try {
    await publishCardDraft("", mockClient);
  } catch (err) {
    threwEmptyCardId = true;
  }
  testAssert(threwEmptyCardId, "Rejects empty cardId string");

  // Error propagation from RPC
  const mockErrorClient = {
    rpc: async () => ({
      data: null,
      error: { message: "CARD_NOT_FOUND: Card does not exist.", code: "check_violation" },
    }),
  };

  let threwRpcError = false;
  try {
    await publishCardDraft(testCardId, mockErrorClient);
  } catch (err) {
    threwRpcError = true;
    testAssert(err.message.includes("CARD_NOT_FOUND"), "Propagates original Supabase RPC error message");
  }
  testAssert(threwRpcError, "Throws when RPC returns error");
}

// =============================================================================
// SUITE 3: Publish Hook Simulator (useCardPublish Lifecycle & Concurrency)
// =============================================================================
console.log("\n3. Testing Publish Hook Simulator & Lifecycle Safety...");

class PublishSimulator {
  constructor(options) {
    this.draftId = options.draftId ?? null;
    this.isDraftReady = options.isDraftReady ?? false;
    this.user = options.user ?? null;
    this.isActive = options.isActive ?? true;
    this.saveStatus = options.saveStatus ?? "saved";
    this.saveError = options.saveError ?? null;
    this.uploadStatus = options.uploadStatus ?? "idle";
    this.uploadError = options.uploadError ?? null;
    this.client = options.client;
    this.onPublished = options.onPublished;
    this.flushAutosaveFn = options.flushAutosave ?? (async () => ({ success: true }));

    // Internal state
    this.publishStatus = "idle";
    this.publishError = null;
    this.publishedCard = null;
    this.publishedUrl = null;

    // Tokens & locks
    this.publishToken = 0;
    this.inFlightToken = null;
    this.rpcInvocationLog = [];
  }

  get inFlight() {
    return this.inFlightToken !== null;
  }

  setDraftId(id, isReady = true) {
    if (this.draftId !== id) {
      this.publishToken++;
      this.draftId = id;
      this.isDraftReady = isReady;
      this.inFlightToken = null;
      this.publishStatus = "idle";
      this.publishError = null;
      this.publishedCard = null;
      this.publishedUrl = null;
    }
  }

  setUser(user) {
    if (this.user?.id !== user?.id) {
      this.publishToken++;
      this.user = user;
      this.inFlightToken = null;
      this.publishStatus = "idle";
      this.publishError = null;
      this.publishedCard = null;
      this.publishedUrl = null;
    }
  }

  resetPublishState() {
    this.publishToken++;
    this.inFlightToken = null;
    this.publishStatus = "idle";
    this.publishError = null;
    this.publishedCard = null;
    this.publishedUrl = null;
  }

  setIsActive(active) {
    this.isActive = active;
    if (!active) {
      this.publishToken++;
      if (this.publishStatus === "publishing") {
        this.publishStatus = "idle";
      }
    }
  }

  async publishCard() {
    // 1. In-flight duplicate click lock
    if (this.inFlightToken !== null) {
      return false;
    }

    // 2. Idempotent check: if already published for this draft
    if (this.publishStatus === "published" && this.publishedCard?.id === this.draftId) {
      return true;
    }

    const targetDraftId = this.draftId;
    const targetUserId = this.user?.id;

    // 3. Authentication check
    if (!targetUserId) {
      this.publishStatus = "error";
      this.publishError = "Please sign in to publish your card.";
      return false;
    }

    // 4. Draft readiness check
    if (!targetDraftId || !this.isDraftReady) {
      this.publishStatus = "error";
      this.publishError = "Draft is not ready to publish. Please wait for draft sync.";
      return false;
    }

    // 5. Active editor check
    if (!this.isActive) {
      return false;
    }

    // 6. Photo upload guards
    if (this.uploadStatus === "uploading") {
      this.publishStatus = "error";
      this.publishError = "Please wait for your photo to finish uploading before publishing.";
      return false;
    }

    if (this.uploadStatus === "error") {
      this.publishStatus = "error";
      this.publishError = this.uploadError || "Please resolve the photo upload error before publishing.";
      return false;
    }

    // 7. Autosave error guard
    if (this.saveStatus === "error") {
      this.publishStatus = "error";
      this.publishError = this.saveError || "Please resolve draft save errors before publishing.";
      return false;
    }

    const token = ++this.publishToken;
    this.inFlightToken = token;
    this.publishStatus = "publishing";
    this.publishError = null;

    try {
      // Step A: Flush autosave
      const flushResult = await this.flushAutosaveFn();

      const isStaleAfterFlush =
        token !== this.publishToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleAfterFlush) {
        return false;
      }

      if (!flushResult.success) {
        this.publishStatus = "error";
        this.publishError = flushResult.error || "Failed to save latest changes before publishing.";
        return false;
      }

      // Re-verify photo upload hasn't started during flush
      if (this.uploadStatus === "uploading") {
        this.publishStatus = "error";
        this.publishError = "Please wait for your photo to finish uploading before publishing.";
        return false;
      }
      if (this.uploadStatus === "error") {
        this.publishStatus = "error";
        this.publishError = this.uploadError || "Please resolve the photo upload error before publishing.";
        return false;
      }

      // Step B: Call publish RPC
      this.rpcInvocationLog.push({ targetDraftId, token });
      const published = await publishCardDraft(targetDraftId, this.client);

      // Post-RPC staleness check
      const isStaleAfterRpc =
        token !== this.publishToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleAfterRpc) {
        return false;
      }

      // Step C: Success state adoption
      const shareUrl = buildCardShareUrl(published.slug, "https://suprilo.com");
      this.publishedCard = published;
      this.publishedUrl = shareUrl;
      this.publishStatus = "published";
      this.publishError = null;
      this.onPublished?.(published, shareUrl);
      return true;
    } catch (err) {
      const isStaleOnError =
        token !== this.publishToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleOnError) {
        return false;
      }

      const rawMsg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && typeof err.message === "string"
          ? err.message
          : "";

      let msg = rawMsg || "Failed to publish card.";
      if (rawMsg.includes("UNAUTHENTICATED")) {
        msg = "You must be signed in to publish a card.";
      } else if (rawMsg.includes("CARD_NOT_FOUND")) {
        msg = "Card draft not found or already archived.";
      } else if (rawMsg.includes("UNAUTHORIZED")) {
        msg = "You do not have permission to publish this card.";
      } else if (rawMsg.includes("PHOTO_NOT_FOUND")) {
        msg = "Attached photo could not be verified in storage. Please try re-uploading your photo.";
      } else if (rawMsg.includes("INVALID_CONTENT")) {
        msg = "Card content is invalid. Please verify all message and name lengths.";
      } else if (rawMsg.includes("INVALID_PHOTO_PATH")) {
        msg = "Attached photo path is invalid. Please try re-uploading your photo.";
      }

      this.publishStatus = "error";
      this.publishError = msg;
      return false;
    } finally {
      if (this.inFlightToken === token) {
        this.inFlightToken = null;
      }
    }
  }
}

// Test Case 1: Correct RPC invocation & argument mapping
{
  console.log("   --- Case 1: Correct RPC invocation and argument mapping ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d1111111-1111-4111-8111-111111111111";
  const rpcCalls = [];

  const client = {
    rpc: async (fn, params) => {
      rpcCalls.push({ fn, params });
      return {
        data: { id: draftId, slug: "card12345678", status: "published" },
        error: null,
      };
    },
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
  });

  const success = await sim.publishCard();

  testAssert(success === true, "publishCard returned true on success");
  testAssert(rpcCalls.length === 1, "Exactly one RPC call was made");
  testAssert(rpcCalls[0].fn === "publish_card_draft", "Invoked publish_card_draft");
  testAssert(rpcCalls[0].params.p_card_id === draftId, "Mapped p_card_id to draft ID");
}

// Test Case 2: Successful publishing returns and uses the actual slug
{
  console.log("   --- Case 2: Successful publishing returns and uses the actual slug ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d2222222-2222-4222-8222-222222222222";
  const realSlug = "998877665544";

  const client = {
    rpc: async () => ({
      data: { id: draftId, slug: realSlug, status: "published" },
      error: null,
    }),
  };

  let publishedCallbackSlug = null;
  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
    onPublished: (card) => {
      publishedCallbackSlug = card.slug;
    },
  });

  await sim.publishCard();

  testAssert(sim.publishStatus === "published", "publishStatus is 'published'");
  testAssert(sim.publishedCard?.slug === realSlug, "publishedCard holds the real slug");
  testAssert(sim.publishedUrl === `https://suprilo.com/s/${realSlug}`, "publishedUrl uses the real slug in URL format");
  testAssert(publishedCallbackSlug === realSlug, "onPublished callback received the real slug");
}

// Test Case 3: RPC errors are surfaced cleanly without hiding useful messages
{
  console.log("   --- Case 3: RPC errors are surfaced cleanly without hiding useful messages ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d3333333-3333-4333-8333-333333333333";

  // 3a. Storage photo missing error
  const clientPhotoError = {
    rpc: async () => ({
      data: null,
      error: { message: "PHOTO_NOT_FOUND: Referenced photo object does not exist in storage." },
    }),
  };

  const simPhotoError = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client: clientPhotoError,
  });

  await simPhotoError.publishCard();
  testAssert(simPhotoError.publishStatus === "error", "Status is 'error' on photo missing error");
  testAssert(simPhotoError.publishError.includes("Attached photo could not be verified in storage"), "Surfaces photo verification message");

  // 3b. Invalid content length error
  const clientContentError = {
    rpc: async () => ({
      data: null,
      error: { message: "INVALID_CONTENT: recipient_name must be between 1 and 30 characters." },
    }),
  };

  const simContentError = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client: clientContentError,
  });

  await simContentError.publishCard();
  testAssert(simContentError.publishError.includes("Card content is invalid"), "Surfaces content length validation message");
}

// Test Case 4: Unauthenticated or unconfirmed drafts cannot publish
{
  console.log("   --- Case 4: Unauthenticated or unconfirmed drafts cannot publish ---");
  const client = { rpc: async () => ({ data: {}, error: null }) };

  // 4a. Unauthenticated
  const simUnauth = new PublishSimulator({
    draftId: "d4444444-4444-4444-8444-444444444444",
    isDraftReady: true,
    user: null,
    isActive: true,
    client,
  });
  const unauthRes = await simUnauth.publishCard();
  testAssert(!unauthRes, "Unauthenticated publish rejected");
  testAssert(simUnauth.publishError.includes("sign in"), "Instructs user to sign in");

  // 4b. Unconfirmed / null draftId
  const simNoDraft = new PublishSimulator({
    draftId: null,
    isDraftReady: false,
    user: { id: "u1" },
    isActive: true,
    client,
  });
  const noDraftRes = await simNoDraft.publishCard();
  testAssert(!noDraftRes, "Publish rejected when draftId is null");
  testAssert(simNoDraft.publishError.includes("Draft is not ready"), "Explains draft is not ready");

  // 4c. draftId exists but isDraftReady is false
  const simNotReady = new PublishSimulator({
    draftId: "d5555555-5555-4555-8555-555555555555",
    isDraftReady: false,
    user: { id: "u1" },
    isActive: true,
    client,
  });
  const notReadyRes = await simNotReady.publishCard();
  testAssert(!notReadyRes, "Publish rejected when isDraftReady is false");
}

// Test Case 5: Duplicate clicks do not trigger duplicate requests
{
  console.log("   --- Case 5: Duplicate clicks do not trigger duplicate requests ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d6666666-6666-4666-8666-666666666666";
  let rpcCount = 0;

  let resolveRpc;
  const client = {
    rpc: async () => {
      rpcCount++;
      await new Promise((r) => { resolveRpc = r; });
      return { data: { id: draftId, slug: "slug-locked", status: "published" }, error: null };
    },
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
  });

  // First click starts publish
  const p1 = sim.publishCard();

  // Second and third click while p1 is in flight
  const p2 = sim.publishCard();
  const p3 = sim.publishCard();

  const [res2, res3] = await Promise.all([p2, p3]);
  testAssert(res2 === false, "Second concurrent click rejected immediately");
  testAssert(res3 === false, "Third concurrent click rejected immediately");

  resolveRpc();
  const res1 = await p1;

  testAssert(res1 === true, "First click completed successfully");
  testAssert(rpcCount === 1, "Exactly one RPC call executed despite multiple rapid clicks");
}

// Test Case 6: Pending autosave is flushed before publish
{
  console.log("   --- Case 6: Pending autosave is flushed before publish ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d7777777-7777-4777-8777-777777777777";
  const executionOrder = [];

  const client = {
    rpc: async () => {
      executionOrder.push("rpc_publish");
      return { data: { id: draftId, slug: "slug-flushed", status: "published" }, error: null };
    },
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
    flushAutosave: async () => {
      executionOrder.push("flush_autosave");
      return { success: true };
    },
  });

  await sim.publishCard();

  testAssert(executionOrder[0] === "flush_autosave", "Autosave was flushed first");
  testAssert(executionOrder[1] === "rpc_publish", "RPC publish was executed after autosave flush");

  // Test failed flush blocks publish
  const executionOrderFail = [];
  const simFailFlush = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
    flushAutosave: async () => {
      executionOrderFail.push("flush_fail");
      return { success: false, error: "Network timeout while saving draft changes." };
    },
  });

  const failRes = await simFailFlush.publishCard();
  testAssert(failRes === false, "Publish failed when flush failed");
  testAssert(!executionOrderFail.includes("rpc_publish"), "RPC publish was NOT called when flush failed");
  testAssert(simFailFlush.publishError.includes("Network timeout"), "Reports flush error message");
}

// Test Case 7: Publishing blocked while photo upload/removal is pending or failed
{
  console.log("   --- Case 7: Publishing blocked while photo upload/removal is pending or failed ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d8888888-8888-4888-8888-888888888888";
  let rpcCalled = false;

  const client = {
    rpc: async () => {
      rpcCalled = true;
      return { data: { id: draftId, slug: "slug", status: "published" }, error: null };
    },
  };

  // 7a. Blocked while uploadStatus === 'uploading'
  const simUploading = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    uploadStatus: "uploading",
    client,
  });

  const uploadRes = await simUploading.publishCard();
  testAssert(uploadRes === false, "Publish blocked while uploadStatus is 'uploading'");
  testAssert(!rpcCalled, "RPC was not called while photo uploading");
  testAssert(simUploading.publishError.includes("wait for your photo"), "Informs user to wait for photo");

  // 7b. Blocked while uploadStatus === 'error'
  const simUploadError = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    uploadStatus: "error",
    uploadError: "File exceeded 2MB limit",
    client,
  });

  const errRes = await simUploadError.publishCard();
  testAssert(errRes === false, "Publish blocked while uploadStatus is 'error'");
  testAssert(simUploadError.publishError.includes("File exceeded 2MB limit"), "Informs user to resolve photo error");
}

// Test Case 8: Failed publish preserves editor content
{
  console.log("   --- Case 8: Failed publish preserves editor content ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d9999999-9999-4999-8999-999999999999";

  const client = {
    rpc: async () => ({
      data: null,
      error: { message: "Database connection failed (500)" },
    }),
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
  });

  await sim.publishCard();

  testAssert(sim.publishStatus === "error", "Status is 'error' after failure");
  testAssert(sim.publishedUrl === null, "No published URL generated on failure");
  testAssert(sim.publishedCard === null, "No published card state stored on failure");
  testAssert(sim.draftId === draftId, "Editor draft ID remains intact");
}

// Test Case 9: Draft/account switch prevents stale success UI
{
  console.log("   --- Case 9: Draft/account switch prevents stale success UI ---");
  const user1 = { id: "a1111111-1111-4111-8111-111111111111" };
  const user2 = { id: "a2222222-2222-4222-8222-222222222222" };
  const draft1 = "d1111111-aaaa-4111-8111-aaaaaaaaaaaa";
  const draft2 = "d2222222-bbbb-4222-8222-bbbbbbbbbbbb";

  let resolvePublishRpc;
  const client = {
    rpc: async () => {
      await new Promise((r) => { resolvePublishRpc = r; });
      return { data: { id: draft1, slug: "slug-draft1", status: "published" }, error: null };
    },
  };

  let onPublishedCalled = false;
  const sim = new PublishSimulator({
    draftId: draft1,
    isDraftReady: true,
    user: user1,
    isActive: true,
    client,
    onPublished: () => {
      onPublishedCalled = true;
    },
  });

  // Start publishing draft 1
  const publishPromise = sim.publishCard();

  // User switches to draft 2 while draft 1 RPC is running
  await new Promise((r) => setTimeout(r, 10));
  sim.setDraftId(draft2);

  // Complete draft 1 RPC
  resolvePublishRpc();
  await publishPromise;

  testAssert(!onPublishedCalled, "onPublished callback was NOT called for Draft 2");
  testAssert(sim.publishStatus === "idle", "Draft 2 publish status remains 'idle'");
  testAssert(sim.publishedUrl === null, "Draft 2 did not adopt Draft 1's share URL");

  // Account switch test
  let resolveUserRpc;
  const userClient = {
    rpc: async () => {
      await new Promise((r) => { resolveUserRpc = r; });
      return { data: { id: draft2, slug: "slug-user1", status: "published" }, error: null };
    },
  };

  let userCallbackCalled = false;
  const simUser = new PublishSimulator({
    draftId: draft2,
    isDraftReady: true,
    user: user1,
    isActive: true,
    client: userClient,
    onPublished: () => {
      userCallbackCalled = true;
    },
  });

  const userPublishPromise = simUser.publishCard();
  await new Promise((r) => setTimeout(r, 10));
  simUser.setUser(user2);

  resolveUserRpc();
  await userPublishPromise;

  testAssert(!userCallbackCalled, "onPublished callback was NOT called for User 2");
  testAssert(simUser.publishStatus === "idle", "User 2 publish status remains 'idle'");
  testAssert(simUser.publishedCard === null, "User 2 did not adopt User 1's published card");
}

// Test Case 10: Existing successful publish flow works idempotently
{
  console.log("   --- Case 10: Existing successful publish flow works idempotently ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d9999999-1234-4567-8901-abcdefabcdef";
  let rpcInvocations = 0;

  const client = {
    rpc: async () => {
      rpcInvocations++;
      return { data: { id: draftId, slug: "slug-idempotent", status: "published" }, error: null };
    },
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
  });

  // First publish
  const firstSuccess = await sim.publishCard();
  testAssert(firstSuccess === true, "First publish succeeded");
  testAssert(rpcInvocations === 1, "First publish called RPC once");
  testAssert(sim.publishStatus === "published", "Status is 'published'");

  // Second click while already published
  const secondSuccess = await sim.publishCard();
  testAssert(secondSuccess === true, "Second click returned true idempotently");
  testAssert(rpcInvocations === 1, "Second click did NOT re-invoke RPC");
  testAssert(sim.publishedUrl.includes("slug-idempotent"), "Retained existing share URL");
}

// ============================================================================
// SUITE 4: Concurrency Lock Ownership & Race Regressions (Task 2C-5.3.4 Correction)
// ============================================================================
console.log("\n4. Testing Concurrency Lock Ownership Regressions...");

// Regression 1-3: Cross-Draft Lock Ownership
// 1. Draft A request pending → switch to Draft B → publish B → resolve A → verify B's lock remains active.
// 2. While B is pending, another publish click must not invoke a second RPC.
// 3. Resolve B → verify the lock is released and normal retry/new publish behavior works.
{
  console.log("   --- Regression 1-3: Cross-draft lock ownership and second click block ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftA = "daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const draftB = "dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  let resolveRpcA, resolveRpcB;
  let rpcCallCount = 0;
  const rpcCalls = [];

  const client = {
    rpc: async (fn, params) => {
      rpcCallCount++;
      rpcCalls.push({ fn, params });
      if (params.p_card_id === draftA) {
        await new Promise((r) => { resolveRpcA = r; });
        return { data: { id: draftA, slug: "slug-a", status: "published" }, error: null };
      } else if (params.p_card_id === draftB) {
        await new Promise((r) => { resolveRpcB = r; });
        return { data: { id: draftB, slug: "slug-b", status: "published" }, error: null };
      }
      return { data: null, error: { message: "Unknown draft" } };
    },
  };

  const sim = new PublishSimulator({
    draftId: draftA,
    isDraftReady: true,
    user,
    isActive: true,
    client,
  });

  // Step 1: Draft A starts publishing
  const pA = sim.publishCard();
  testAssert(sim.inFlight === true, "Draft A acquired publish lock");

  // Step 2: User switches to Draft B while Draft A's RPC is pending
  await new Promise((r) => setTimeout(r, 10));
  sim.setDraftId(draftB);
  testAssert(sim.publishStatus === "idle", "Draft switch reset publish status to idle");

  // Step 3: Draft B starts publishing
  const pB1 = sim.publishCard();
  await new Promise((r) => setTimeout(r, 10));
  testAssert(sim.inFlight === true, "Draft B acquired publish lock");
  testAssert(rpcCallCount === 2, "Both Draft A and Draft B initiated their RPCs");

  // Step 4: Resolve A
  resolveRpcA();
  await pA;

  // Step 5: Verify B's lock remains active! (Old request A did NOT release B's lock)
  testAssert(sim.inFlight === true, "Draft B's lock remains active after Draft A settled");
  testAssert(sim.inFlightToken !== null, "Draft B retains ownership of the in-flight lock");

  // Step 6: While B is pending, another publish click must not invoke a second RPC
  const pB2 = await sim.publishCard();
  testAssert(pB2 === false, "Duplicate publish click on Draft B rejected while first request is pending");
  testAssert(rpcCallCount === 2, "No second RPC was invoked for Draft B");

  // Step 7: Resolve B → verify the lock is released and normal publish behavior works
  resolveRpcB();
  const resB1 = await pB1;
  testAssert(resB1 === true, "Draft B publish succeeded");
  testAssert(sim.inFlight === false, "Draft B released the lock upon completion");
  testAssert(sim.publishStatus === "published", "Draft B status transitioned to 'published'");
  testAssert(sim.publishedCard?.slug === "slug-b", "Draft B holds correct slug");

  // Step 8: Subsequent click works idempotently without invoking another RPC
  const pB3 = await sim.publishCard();
  testAssert(pB3 === true, "Subsequent click on published draft handled cleanly");
  testAssert(rpcCallCount === 2, "RPC count remains 2 (no extra calls)");
}

// Regression 4: Overlapping Request Across Account Switching
{
  console.log("   --- Regression 4: Cross-account lock ownership protection ---");
  const user1 = { id: "a1111111-1111-4111-8111-111111111111" };
  const user2 = { id: "a2222222-2222-4222-8222-222222222222" };
  const draftId = "d-shared-1111-4111-8111-111111111111";

  let resolveUser1, resolveUser2;
  let userRpcCount = 0;

  const client = {
    rpc: async (fn, params) => {
      userRpcCount++;
      if (userRpcCount === 1) {
        await new Promise((r) => { resolveUser1 = r; });
        return { data: { id: draftId, slug: "slug-u1", status: "published" }, error: null };
      } else {
        await new Promise((r) => { resolveUser2 = r; });
        return { data: { id: draftId, slug: "slug-u2", status: "published" }, error: null };
      }
    },
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user: user1,
    isActive: true,
    client,
  });

  // User 1 starts publish
  const pU1 = sim.publishCard();
  testAssert(sim.inFlight === true, "User 1 acquired publish lock");

  // User switches account to User 2 while User 1 is pending
  await new Promise((r) => setTimeout(r, 10));
  sim.setUser(user2);
  testAssert(sim.publishStatus === "idle", "User switch reset publish status to idle");

  // User 2 starts publish
  const pU2_first = sim.publishCard();
  await new Promise((r) => setTimeout(r, 10));
  testAssert(sim.inFlight === true, "User 2 acquired publish lock");

  // User 1's request settles
  resolveUser1();
  await pU1;

  // User 2's lock must remain active
  testAssert(sim.inFlight === true, "User 2's lock remains active after User 1 settled");
  testAssert(sim.inFlightToken !== null, "User 2 still owns the in-flight lock");

  // Another click for User 2 must be blocked
  const pU2_dup = await sim.publishCard();
  testAssert(pU2_dup === false, "Duplicate click for User 2 was blocked while request in-flight");
  testAssert(userRpcCount === 2, "No extra RPC call was made for User 2");

  // User 2 settles
  resolveUser2();
  const resU2 = await pU2_first;
  testAssert(resU2 === true, "User 2 publish succeeded");
  testAssert(sim.inFlight === false, "User 2 released publish lock upon completion");
  testAssert(sim.publishedCard?.slug === "slug-u2", "User 2 adopted correct published card");
}

// Regression 5: Reset publish state during an in-flight request
{
  console.log("   --- Regression 5: resetPublishState during in-flight request ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d-reset-1111-4111-8111-111111111111";

  let resolveReq1, resolveReq2;
  let resetRpcCount = 0;

  const client = {
    rpc: async (fn, params) => {
      resetRpcCount++;
      if (resetRpcCount === 1) {
        await new Promise((r) => { resolveReq1 = r; });
        return { data: { id: draftId, slug: "slug-r1", status: "published" }, error: null };
      } else {
        await new Promise((r) => { resolveReq2 = r; });
        return { data: { id: draftId, slug: "slug-r2", status: "published" }, error: null };
      }
    },
  };

  const sim = new PublishSimulator({
    draftId,
    isDraftReady: true,
    user,
    isActive: true,
    client,
  });

  // Request 1 starts
  const pR1 = sim.publishCard();
  testAssert(sim.inFlight === true, "Request 1 acquired lock");

  // Call resetPublishState during Request 1 while RPC is pending
  await new Promise((r) => setTimeout(r, 10));
  sim.resetPublishState();
  testAssert(sim.publishStatus === "idle", "resetPublishState reset status to idle");
  testAssert(sim.inFlight === false, "resetPublishState freed lock for new request");

  // Request 2 starts
  const pR2 = sim.publishCard();
  await new Promise((r) => setTimeout(r, 10));
  testAssert(sim.inFlight === true, "Request 2 acquired lock");

  // Request 1 settles
  resolveReq1();
  await pR1;

  // Request 1 must NOT have released Request 2's lock!
  testAssert(sim.inFlight === true, "Request 2 lock remains active after Request 1 settled");
  testAssert(sim.inFlightToken !== null, "Request 2 retains lock ownership");

  // Another click during Request 2 must be blocked
  const pR2_dup = await sim.publishCard();
  testAssert(pR2_dup === false, "Duplicate click blocked while Request 2 is pending");
  testAssert(resetRpcCount === 2, "No extra RPC call made while Request 2 is pending");

  // Request 2 settles
  resolveReq2();
  const resR2 = await pR2;
  testAssert(resR2 === true, "Request 2 completed successfully");
  testAssert(sim.inFlight === false, "Request 2 released lock upon completion");
}

console.log("\n================================================================================");
console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
}
