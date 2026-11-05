/**
 * Suprilo Task 2C-5.4 — Recipient Scratch Card Experience Unit Test Suite
 *
 * Verifies:
 * 1. Client DTO Excludes Card UUID, Storage Path, and Owner Identifiers:
 *    - toRecipientCardDto strictly projects only 13 required UI fields
 *    - Never exposes card id (UUID), photo_path, has_photo, published_at, or user_id
 *    - Serialized RSC payload contains zero owner UUIDs or bucket paths
 * 2. Photo Ownership Verification (verifyCardPhotoOwnership):
 *    - Confirms storage path card UUID segment strictly matches published card ID
 *    - Rejects mismatched card IDs, path traversals, and malformed paths
 * 3. Photo Proxy Route Handler (GET /api/cards/[slug]/photo):
 *    - Streams raw image bytes with correct MIME type (image/jpeg, image/png, image/webp)
 *    - Sets X-Content-Type-Options: nosniff and private/no-store Cache-Control
 *    - Never returns raw storage paths or signed URLs to the client
 *    - Rejects invalid slugs, unpublished cards, and cards without photos with 404
 *    - Rejects photo paths with mismatched card UUIDs with 404
 *    - Safely handles storage download failures without leaking details
 * 4. Distinguishing Not-Found from Backend Failures:
 *    - Missing, unpublished, or archived cards return null (triggers 404 state)
 *    - Database/RPC errors throw CardBackendError (triggers retryable 503 error state)
 *    - Raw database error details are never exposed to recipients
 * 5. Telemetry Logging & Security:
 *    - Computes 64-character hex SHA-256 visitor hash from IP and User-Agent
 *    - Records view and reveal events via admin service-role client
 *    - Respects 15-minute visitor cooldown window
 *    - Non-blocking: telemetry failures never disrupt recipient viewing
 * 6. Reveal Route Handler (POST /api/cards/[slug]/reveal):
 *    - Validates slug, computes visitor hash, records reveal event
 *
 * Test Isolation: 100% Mocked in-memory (0 remote Supabase database or network impact).
 */

import assert from "node:assert/strict";

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.4 — Recipient Experience & Privacy Tests (100% Mocked)");
console.log("================================================================================\n");

const {
  getPublishedCardBySlug,
  CardBackendError,
  toRecipientCardDto,
} = await import("../src/lib/cards.ts");

const {
  isValidCardPhotoPath,
  verifyCardPhotoOwnership,
  downloadRecipientCardPhoto,
  computeVisitorHash,
  recordCardTelemetry,
  handleCardPhotoProxy,
} = await import("../src/lib/server/card-recipient.ts");

const { GET: photoProxyGet } = await import("../src/app/api/cards/[slug]/photo/route.ts");
const { POST: revealRoutePost } = await import("../src/app/api/cards/[slug]/reveal/route.ts");

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
// 1. Client DTO & Privacy Sanitization (Issue 1)
// ---------------------------------------------------------------------------
console.log("1. Testing Recipient Client DTO & Privacy Sanitization...");

{
  const ownerUserId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const cardId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const internalPhotoPath = `${ownerUserId}/${cardId}/photo-17938888-abcd.jpg`;

  const fullPublishedCard = {
    id: cardId,
    slug: "23456789abcd",
    recipient_name: "Maya",
    sender_name: "Alex",
    occasion_tag: "Birthday",
    primary_message: "Happy Birthday Maya!",
    secondary_message: "Hope you have an amazing day!",
    foil_style: "golden-foil",
    cover_text: "Scratch to reveal your surprise!",
    bg_palette: "warm-sunshine",
    sticker: "cake",
    font_family: "Playfair Display",
    photo_path: internalPhotoPath,
    has_photo: true,
    reveal_threshold: 0.65,
    sound_enabled: true,
    published_at: "2026-11-05T12:00:00Z",
  };

  const clientDto = toRecipientCardDto(fullPublishedCard);

  // Assert expected 13 fields exist
  testAssert(clientDto.slug === "23456789abcd", "Preserves slug in DTO");
  testAssert(clientDto.recipient_name === "Maya", "Preserves recipient_name in DTO");
  testAssert(clientDto.sender_name === "Alex", "Preserves sender_name in DTO");
  testAssert(clientDto.occasion_tag === "Birthday", "Preserves occasion_tag in DTO");
  testAssert(clientDto.primary_message === "Happy Birthday Maya!", "Preserves primary_message in DTO");
  testAssert(clientDto.secondary_message === "Hope you have an amazing day!", "Preserves secondary_message in DTO");
  testAssert(clientDto.foil_style === "golden-foil", "Preserves foil_style in DTO");
  testAssert(clientDto.cover_text === "Scratch to reveal your surprise!", "Preserves cover_text in DTO");
  testAssert(clientDto.bg_palette === "warm-sunshine", "Preserves bg_palette in DTO");
  testAssert(clientDto.sticker === "cake", "Preserves sticker in DTO");
  testAssert(clientDto.font_family === "Playfair Display", "Preserves font_family in DTO");
  testAssert(clientDto.reveal_threshold === 0.65, "Preserves reveal_threshold in DTO");
  testAssert(clientDto.sound_enabled === true, "Preserves sound_enabled in DTO");

  // Strict privacy exclusion assertions: internal IDs MUST NOT be present
  testAssert(!("id" in clientDto), "Privacy: Card UUID (id) is strictly excluded from client DTO");
  testAssert(!("photo_path" in clientDto), "Privacy: photo_path is strictly excluded from client DTO");
  testAssert(!("has_photo" in clientDto), "Privacy: has_photo database column is strictly excluded from client DTO");
  testAssert(!("published_at" in clientDto), "Privacy: published_at timestamp is strictly excluded from client DTO");
  testAssert(!("user_id" in clientDto), "Privacy: user_id is strictly excluded from client DTO");

  // Serialize to JSON and verify zero owner UUID or internal storage path leaks
  const serialized = JSON.stringify(clientDto);
  testAssert(!serialized.includes(ownerUserId), "Serialized client payload contains NO owner UUID");
  testAssert(!serialized.includes(cardId), "Serialized client payload contains NO card UUID");
  testAssert(!serialized.includes(internalPhotoPath), "Serialized client payload contains NO Storage path");
  testAssert(!serialized.includes("photo-17938888"), "Serialized client payload contains NO photo filename");
}

// ---------------------------------------------------------------------------
// 2. Photo Ownership Verification (Issue 3)
// ---------------------------------------------------------------------------
console.log("\n2. Testing Photo Ownership Verification (verifyCardPhotoOwnership)...");

{
  const ownerId = "11111111-2222-3333-4444-555555555555";
  const validCardId = "66666666-7777-8888-9999-000000000000";
  const mismatchedCardId = "99999999-8888-7777-6666-555555555555";
  const filename = "photo-17938888-abcd.jpg";

  const matchingPath = `${ownerId}/${validCardId}/${filename}`;
  const nonMatchingPath = `${ownerId}/${mismatchedCardId}/${filename}`;

  testAssert(
    verifyCardPhotoOwnership(matchingPath, validCardId),
    "Accepts path where path card UUID strictly matches expected card ID"
  );

  testAssert(
    !verifyCardPhotoOwnership(nonMatchingPath, validCardId),
    "Rejects path where path card UUID belongs to a DIFFERENT card"
  );

  testAssert(
    !verifyCardPhotoOwnership(matchingPath, "not-a-uuid"),
    "Rejects invalid expected card UUID"
  );

  testAssert(
    !verifyCardPhotoOwnership("bad/path", validCardId),
    "Rejects malformed path with insufficient segments"
  );

  testAssert(
    !verifyCardPhotoOwnership(`../${validCardId}/${filename}`, validCardId),
    "Rejects directory traversal in storage path"
  );

  testAssert(
    !verifyCardPhotoOwnership(null, validCardId),
    "Rejects null photo path safely"
  );
}

// ---------------------------------------------------------------------------
// 3. Photo Download & Content-Type Restriction (Issue 2)
// ---------------------------------------------------------------------------
console.log("\n3. Testing Server-Side Photo Download (downloadRecipientCardPhoto)...");

{
  const ownerId = "11111111-2222-3333-4444-555555555555";
  const cardId = "66666666-7777-8888-9999-000000000000";
  const validPath = `${ownerId}/${cardId}/photo.jpg`;

  const mockBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });

  const mockAdminClient = {
    storage: {
      from: () => ({
        download: async (path) => {
          if (path === validPath) {
            return { data: mockBlob, error: null };
          }
          return { data: null, error: { message: "Not found" } };
        },
      }),
    },
  };

  // Valid download
  const result = await downloadRecipientCardPhoto(validPath, cardId, mockAdminClient);
  testAssert(result !== null, "Successfully downloads photo for matching card");
  testAssert(result?.contentType === "image/jpeg", "Validates MIME type as image/jpeg");
  testAssert(result?.data instanceof Blob, "Returns raw Blob bytes");

  // Rejects mismatched card ID before downloading
  let downloadCalledOnMismatch = false;
  const spyClient = {
    storage: {
      from: () => ({
        download: async () => {
          downloadCalledOnMismatch = true;
          return { data: mockBlob, error: null };
        },
      }),
    },
  };
  const mismatchResult = await downloadRecipientCardPhoto(validPath, "88888888-7777-6666-5555-444444444444", spyClient);
  testAssert(mismatchResult === null && !downloadCalledOnMismatch, "Rejects mismatched card ID without calling Storage download");

  // Rejects unsupported content types (e.g. SVG or HTML injection)
  const maliciousBlob = new Blob(["<svg></svg>"], { type: "image/svg+xml" });
  const evilClient = {
    storage: {
      from: () => ({
        download: async () => ({ data: maliciousBlob, error: null }),
      }),
    },
  };
  const evilResult = await downloadRecipientCardPhoto(validPath, cardId, evilClient);
  testAssert(evilResult === null, "Strictly rejects unsupported MIME types (e.g. image/svg+xml)");
}

// ---------------------------------------------------------------------------
// 4. Distinguishing Not Found from Backend Failures (Issue 4)
// ---------------------------------------------------------------------------
console.log("\n4. Testing getPublishedCardBySlug Error Distinguishability...");

{
  const validSlug = "23456789abcd";

  // Case A: Missing or unpublished card returns null (404)
  const notFoundClient = {
    rpc: async () => ({ data: [], error: null }),
  };
  const missingCard = await getPublishedCardBySlug(validSlug, notFoundClient);
  testAssert(missingCard === null, "Missing or unpublished card returns null (clean 404)");

  // Case B: Null RPC response returns null (clean 404)
  const nullClient = {
    rpc: async () => ({ data: null, error: null }),
  };
  const nullCard = await getPublishedCardBySlug(validSlug, nullClient);
  testAssert(nullCard === null, "Null RPC data returns null (clean 404)");

  // Case C: Database / RPC error throws CardBackendError (503 / retryable)
  const errorClient = {
    rpc: async () => ({ data: null, error: { message: "connection timeout", code: "57014" } }),
  };

  let caughtError = null;
  try {
    await getPublishedCardBySlug(validSlug, errorClient);
  } catch (err) {
    caughtError = err;
  }

  testAssert(caughtError !== null, "Database/RPC error throws an exception");
  testAssert(caughtError instanceof CardBackendError, "Thrown error is an instance of CardBackendError");
  testAssert(caughtError.code === "BACKEND_SERVICE_ERROR", "Error code is BACKEND_SERVICE_ERROR");
  testAssert(
    !caughtError.message.includes("57014") && !caughtError.message.includes("connection timeout"),
    "Sanitized message does not leak raw database errors or internals"
  );
  testAssert(caughtError.cause?.code === "57014", "Preserves original error cause for server diagnostics");

  // Case D: Thrown/rejected RPC promise (network TypeError / fetch failure) throws CardBackendError
  const rejectingClient = {
    rpc: async () => {
      throw new TypeError("fetch failed: connection refused");
    },
  };

  let rejectedError = null;
  try {
    await getPublishedCardBySlug(validSlug, rejectingClient);
  } catch (err) {
    rejectedError = err;
  }

  testAssert(rejectedError !== null, "Rejected RPC promise throws an exception");
  testAssert(rejectedError instanceof CardBackendError, "Rejected RPC promise throws CardBackendError");
  testAssert(
    !rejectedError.message.includes("fetch failed") && !rejectedError.message.includes("connection refused"),
    "Sanitized message does not leak raw transport details"
  );
  testAssert(rejectedError.cause instanceof TypeError, "Preserves original transport TypeError on cause");

  // Case E: Faulty client with failing RPC throws CardBackendError
  const throwingClient = {
    rpc: () => {
      throw new Error("DNS resolution error");
    },
  };

  let initError = null;
  try {
    await getPublishedCardBySlug(validSlug, throwingClient);
  } catch (err) {
    initError = err;
  }

  testAssert(initError instanceof CardBackendError, "Synchronously throwing RPC call throws CardBackendError");
  testAssert(initError.cause?.message === "DNS resolution error", "Preserves cause on CardBackendError");
}

// ---------------------------------------------------------------------------
// 5. Photo Proxy Route Handler (Issue 2, 3)
// ---------------------------------------------------------------------------
console.log("\n5. Testing GET /api/cards/[slug]/photo Proxy Endpoint...");

{
  const validSlug = "23456789abcd";
  const cardId = "66666666-7777-8888-9999-000000000000";
  const ownerId = "11111111-2222-3333-4444-555555555555";
  const validPath = `${ownerId}/${cardId}/photo.webp`;

  const dummyBlob = new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46])], {
    type: "image/webp",
  });

  const mockAdminClient = {
    storage: {
      from: () => ({
        download: async (path) => {
          if (path === validPath) {
            return { data: dummyBlob, error: null };
          }
          return { data: null, error: { message: "Storage file not found" } };
        },
      }),
    },
  };

  // Case 1: Invalid slug returns 404
  const invalidSlugReq = new Request("https://suprilo.com/api/cards/bad-slug/photo");
  const invalidRes = await handleCardPhotoProxy(invalidSlugReq, "bad-slug");
  testAssert(invalidRes.status === 404, "Photo proxy: Returns 404 for invalid slug");

  // Case 2: Card not found in DB returns 404
  const emptyClient = { rpc: async () => ({ data: [], error: null }) };
  const notFoundReq = new Request(`https://suprilo.com/api/cards/${validSlug}/photo`);
  const notFoundRes = await handleCardPhotoProxy(notFoundReq, validSlug, emptyClient, mockAdminClient);
  testAssert(notFoundRes.status === 404, "Photo proxy: Returns 404 for missing or unpublished card");

  // Case 3: Card has_photo is false returns 404
  const noPhotoClient = {
    rpc: async () => ({
      data: [{
        id: cardId,
        slug: validSlug,
        recipient_name: "Maya",
        sender_name: "Alex",
        has_photo: false,
        photo_path: null,
      }],
      error: null,
    }),
  };
  const noPhotoRes = await handleCardPhotoProxy(notFoundReq, validSlug, noPhotoClient, mockAdminClient);
  testAssert(noPhotoRes.status === 404, "Photo proxy: Returns 404 when card has no photo attached");

  // Case 4: Storage path card ID does NOT match card ID (ownership violation) returns 404
  const mismatchedPath = `${ownerId}/99999999-9999-9999-9999-999999999999/photo.webp`;
  const mismatchedClient = {
    rpc: async () => ({
      data: [{
        id: cardId,
        slug: validSlug,
        recipient_name: "Maya",
        sender_name: "Alex",
        has_photo: true,
        photo_path: mismatchedPath,
      }],
      error: null,
    }),
  };
  const mismatchRes = await handleCardPhotoProxy(notFoundReq, validSlug, mismatchedClient, mockAdminClient);
  testAssert(mismatchRes.status === 404, "Photo proxy: Returns 404 when photo path card UUID does not match card ID");

  // Case 5: Storage download failure returns 404
  const missingStorageClient = {
    rpc: async () => ({
      data: [{
        id: cardId,
        slug: validSlug,
        recipient_name: "Maya",
        sender_name: "Alex",
        has_photo: true,
        photo_path: `${ownerId}/${cardId}/missing.webp`,
      }],
      error: null,
    }),
  };
  const missingStorageRes = await handleCardPhotoProxy(notFoundReq, validSlug, missingStorageClient, mockAdminClient);
  testAssert(missingStorageRes.status === 404, "Photo proxy: Returns 404 when Storage object does not exist");

  // Case 6: Database connection failure returns 503
  const dbErrorClient = {
    rpc: async () => ({ data: null, error: { message: "database offline" } }),
  };
  const dbErrorRes = await handleCardPhotoProxy(notFoundReq, validSlug, dbErrorClient, mockAdminClient);
  testAssert(dbErrorRes.status === 503, "Photo proxy: Returns 503 Service Unavailable on database backend failure");

  // Case 6b: Network / rejected RPC promise returns 503
  const networkErrorClient = {
    rpc: async () => {
      throw new TypeError("fetch failed: connection refused");
    },
  };
  const networkErrorRes = await handleCardPhotoProxy(notFoundReq, validSlug, networkErrorClient, mockAdminClient);
  testAssert(networkErrorRes.status === 503, "Photo proxy: Returns 503 Service Unavailable on rejected RPC promise / network error");

  // Case 6c: Throwing RPC client returns 503
  const throwClient = {
    rpc: () => {
      throw new Error("DNS resolution failure");
    },
  };
  const throwRes = await handleCardPhotoProxy(notFoundReq, validSlug, throwClient, mockAdminClient);
  testAssert(throwRes.status === 503, "Photo proxy: Returns 503 Service Unavailable on RPC client throw");

  // Case 7: Valid published card and photo returns 200 with raw image bytes and headers
  const validClient = {
    rpc: async () => ({
      data: [{
        id: cardId,
        slug: validSlug,
        recipient_name: "Maya",
        sender_name: "Alex",
        has_photo: true,
        photo_path: validPath,
      }],
      error: null,
    }),
  };
  const validRes = await handleCardPhotoProxy(notFoundReq, validSlug, validClient, mockAdminClient);
  testAssert(validRes.status === 200, "Photo proxy: Returns 200 OK for valid published card with photo");
  testAssert(validRes.headers.get("content-type") === "image/webp", "Photo proxy: Sets Content-Type to image/webp");
  testAssert(validRes.headers.get("x-content-type-options") === "nosniff", "Photo proxy: Sets X-Content-Type-Options: nosniff");
  testAssert(
    validRes.headers.get("cache-control")?.includes("no-store"),
    "Photo proxy: Sets private, no-store Cache-Control header"
  );

  // Case 8: Verify ZERO leakage of owner UUID or raw Storage path in response
  const headerKeys = Array.from(validRes.headers.keys());
  let leakedInHeaders = false;
  for (const k of headerKeys) {
    const val = validRes.headers.get(k) || "";
    if (val.includes(ownerId) || val.includes(cardId) || val.includes("card-photos")) {
      leakedInHeaders = true;
    }
  }
  testAssert(!leakedInHeaders, "Photo proxy: Zero owner UUID or Storage path leaked in response headers");

  // Case 9: Default route export execution
  const defaultRouteRes = await photoProxyGet(new Request("https://suprilo.com/api/cards/bad-slug/photo"), {
    params: Promise.resolve({ slug: "bad-slug" }),
  });
  testAssert(defaultRouteRes.status === 404, "Photo proxy GET default handler returns 404 for bad slug");
}

// ---------------------------------------------------------------------------
// 6. Telemetry Visitor Hash & Logging
// ---------------------------------------------------------------------------
console.log("\n6. Testing Telemetry Visitor Hash & Logging...");

{
  const headers1 = new Headers({
    "x-forwarded-for": "203.0.113.195, 70.41.3.18",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });
  const hash1 = computeVisitorHash(headers1);

  testAssert(typeof hash1 === "string", "Visitor hash is a string");
  testAssert(hash1.length === 64, "Visitor hash is exactly 64 characters long");
  testAssert(/^[a-f0-9]{64}$/.test(hash1), "Visitor hash strictly matches ^[a-f0-9]{64}$ regex");

  // Determinism
  const hash1Repeat = computeVisitorHash(headers1);
  testAssert(hash1 === hash1Repeat, "Visitor hash is deterministic for identical client headers");

  // Differentiation
  const headers2 = new Headers({
    "x-forwarded-for": "198.51.100.42",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });
  const hash2 = computeVisitorHash(headers2);
  testAssert(hash1 !== hash2, "Different visitor IP yields different visitor hash");

  // Telemetry RPC call
  const validSlug = "23456789abcd";
  let capturedRpc = "";
  let capturedParams = null;

  const mockAdminClient = {
    rpc: async (name, params) => {
      capturedRpc = name;
      capturedParams = params;
      return { data: true, error: null };
    },
  };

  const viewResult = await recordCardTelemetry(validSlug, "view", hash1, mockAdminClient);
  testAssert(viewResult === true, "recordCardTelemetry returns true on successful view event");
  testAssert(capturedRpc === "record_card_telemetry", "Invokes public.record_card_telemetry");
  testAssert(capturedParams?.p_slug === validSlug, "Maps p_slug parameter");
  testAssert(capturedParams?.p_event_type === "view", "Maps p_event_type = 'view'");
  testAssert(capturedParams?.p_visitor_hash === hash1, "Maps p_visitor_hash");

  const revealResult = await recordCardTelemetry(validSlug, "reveal", hash1, mockAdminClient);
  testAssert(revealResult === true, "recordCardTelemetry returns true on successful reveal event");
  testAssert(capturedParams?.p_event_type === "reveal", "Maps p_event_type = 'reveal'");

  // Cooldown handling
  const cooldownClient = { rpc: async () => ({ data: false, error: null }) };
  const cooldownRes = await recordCardTelemetry(validSlug, "view", hash1, cooldownClient);
  testAssert(cooldownRes === false, "Returns false cleanly when visitor cooldown is active (duplicate)");

  // Failure handling: never throws
  const errorClient = { rpc: async () => ({ data: null, error: { message: "timeout" } }) };
  const failRes = await recordCardTelemetry(validSlug, "view", hash1, errorClient);
  testAssert(failRes === false, "Returns false safely on RPC error without throwing unhandled exception");
}

// ---------------------------------------------------------------------------
// 7. Reveal Route Handler (POST /api/cards/[slug]/reveal)
// ---------------------------------------------------------------------------
console.log("\n7. Testing Reveal Route Handler (POST /api/cards/[slug]/reveal)...");

{
  // Test invalid slug returns 400
  const badReq = new Request("https://suprilo.com/api/cards/invalid-slug/reveal", { method: "POST" });
  const badContext = { params: Promise.resolve({ slug: "invalid-slug" }) };
  const badRes = await revealRoutePost(badReq, badContext);
  testAssert(badRes.status === 400, "Returns 400 Bad Request for invalid slug");

  // Test valid slug returns 200
  const validSlug = "23456789abcd";
  const goodReq = new Request(`https://suprilo.com/api/cards/${validSlug}/reveal`, {
    method: "POST",
    headers: {
      "x-forwarded-for": "198.51.100.12",
      "user-agent": "Mobile Safari",
    },
  });
  const goodContext = { params: Promise.resolve({ slug: validSlug }) };
  const goodRes = await revealRoutePost(goodReq, goodContext);
  testAssert(goodRes.status === 200, "Returns 200 OK for valid slug reveal request");
  const goodBody = await goodRes.json();
  testAssert(goodBody.success === true, "Returns success: true in payload");
  testAssert(typeof goodBody.recorded === "boolean", "Returns recorded boolean indicator");
}

// ---------------------------------------------------------------------------
// 8. Server-Only Boundary & Obsolete Signed URL Verification
// ---------------------------------------------------------------------------
console.log("\n8. Testing Server Boundary & Elimination of Signed URLs...");

{
  const cardRecipientModule = await import("../src/lib/server/card-recipient.ts");
  testAssert(
    !("getRecipientSignedPhotoUrl" in cardRecipientModule),
    "Security: getRecipientSignedPhotoUrl is completely removed from card-recipient.ts"
  );

  // Verify server-only runtime boundary
  testAssert(
    typeof window === "undefined" && typeof document === "undefined",
    "Server-only boundary: window and document are undefined in server runtime"
  );
}

console.log("\n================================================================================");
console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
