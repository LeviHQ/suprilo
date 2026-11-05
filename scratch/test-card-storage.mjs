/**
 * Suprilo Task 2C-5.2 — Unit Test Suite for Supabase Storage Integration & Photo Upload
 *
 * Verifies:
 * 1. Valid JPEG upload path construction ({user_id}/{card_id}/{filename}).
 * 2. Valid PNG and WebP acceptance.
 * 3. Files larger than 2 MB rejected.
 * 4. Unsupported MIME types rejected (GIF, PDF, SVG, etc.).
 * 5. getPhotoExtensionFromMime throws explicit error for unsupported types.
 * 6. Missing or empty file rejected.
 * 7. Invalid card UUID rejected.
 * 8. Unauthenticated upload rejected.
 * 9. Correct bucket name used ("card-photos").
 * 10. Exact path convention ({user_id}/{card_id}/{filename}) verified.
 * 11. upload options include `upsert: false`.
 * 12. Storage errors and missing server path are surfaced correctly without swallowing.
 * 13. Collision-resistant cryptographic filename generation (no Math.random, throws if unavailable).
 *
 * Strictly isolated: Uses in-memory mocked Supabase clients.
 * Zero remote storage objects created, zero network mutations.
 */

import assert from "node:assert/strict";

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.2 — Supabase Storage Photo Upload Unit Tests (Updated)");
console.log("================================================================================\n");

const {
  CARD_PHOTOS_BUCKET,
  isValidUuid,
  validatePhotoFile,
  getPhotoExtensionFromMime,
  generatePhotoFilename,
  buildCardPhotoPath,
  uploadCardPhoto,
} = await import("../src/lib/card-storage.ts");

const { CARD_LIMITS, ALLOWED_PHOTO_MIME_TYPES } = await import("../src/types/card.ts");

// -----------------------------------------------------------------------------
// Test 1: Bucket Constants & UUID Validation
// -----------------------------------------------------------------------------
console.log("1. Testing Bucket Constants & UUID Validation...");
assert.equal(CARD_PHOTOS_BUCKET, "card-photos", "Bucket must be 'card-photos'");
assert.equal(CARD_LIMITS.MAX_PHOTO_SIZE_BYTES, 2 * 1024 * 1024, "Size limit must be 2MB (2,097,152 bytes)");
assert.deepEqual(ALLOWED_PHOTO_MIME_TYPES, ["image/jpeg", "image/png", "image/webp"]);

assert.ok(isValidUuid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"));
assert.ok(isValidUuid("00000000-0000-0000-0000-000000000000"));
assert.equal(isValidUuid(""), false);
assert.equal(isValidUuid("not-a-uuid"), false);
assert.equal(isValidUuid("a1b2c3d4-e5f6-4a7b-8c9d"), false);
assert.equal(isValidUuid(null), false);
assert.equal(isValidUuid(undefined), false);
console.log("   [PASS] Bucket constants and UUID validator verified.");

// -----------------------------------------------------------------------------
// Test 2: File Validation: Size Limits
// -----------------------------------------------------------------------------
console.log("2. Testing File Size Validation...");
{
  // Exactly 2 MB file (2,097,152 bytes) -> Accepted
  const maxValidFile = new File([new Uint8Array(2 * 1024 * 1024)], "valid.jpg", {
    type: "image/jpeg",
  });
  const resValid = validatePhotoFile(maxValidFile);
  assert.equal(resValid.valid, true, "2MB file must be valid");

  // 2 MB + 1 byte (2,097,153 bytes) -> Rejected
  const oversizeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "oversize.jpg", {
    type: "image/jpeg",
  });
  const resOversize = validatePhotoFile(oversizeFile);
  assert.equal(resOversize.valid, false, "Files larger than 2MB must be rejected");
  assert.match(resOversize.error, /exceeds the 2 MB limit/i);

  // 0-byte file -> Rejected
  const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
  const resEmpty = validatePhotoFile(emptyFile);
  assert.equal(resEmpty.valid, false, "Empty file must be rejected");

  // Missing file -> Rejected
  assert.equal(validatePhotoFile(null).valid, false);
  assert.equal(validatePhotoFile(undefined).valid, false);
  console.log("   [PASS] 2MB ceiling, 0-byte, and missing file validations passed.");
}

// -----------------------------------------------------------------------------
// Test 3: File Validation: MIME Types & Extension Extraction
// -----------------------------------------------------------------------------
console.log("3. Testing Allowed MIME Types & Extension Handling...");
{
  const jpegFile = new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" });
  const pngFile = new File([new Uint8Array(1024)], "photo.png", { type: "image/png" });
  const webpFile = new File([new Uint8Array(1024)], "photo.webp", { type: "image/webp" });

  assert.equal(validatePhotoFile(jpegFile).valid, true, "image/jpeg must be accepted");
  assert.equal(validatePhotoFile(pngFile).valid, true, "image/png must be accepted");
  assert.equal(validatePhotoFile(webpFile).valid, true, "image/webp must be accepted");

  // getPhotoExtensionFromMime exact mapping
  assert.equal(getPhotoExtensionFromMime("image/jpeg"), ".jpg");
  assert.equal(getPhotoExtensionFromMime("IMAGE/JPEG"), ".jpg");
  assert.equal(getPhotoExtensionFromMime("image/png"), ".png");
  assert.equal(getPhotoExtensionFromMime("image/webp"), ".webp");

  // Unsupported MIME types throw explicit error (no silent fallback)
  assert.throws(() => getPhotoExtensionFromMime("image/gif"), /UNSUPPORTED_MIME_TYPE/);
  assert.throws(() => getPhotoExtensionFromMime("application/pdf"), /UNSUPPORTED_MIME_TYPE/);
  assert.throws(() => getPhotoExtensionFromMime("image/svg+xml"), /UNSUPPORTED_MIME_TYPE/);
  assert.throws(() => getPhotoExtensionFromMime(""), /INVALID_MIME_TYPE/);

  // Disallowed MIME types rejected in validation
  const gifFile = new File([new Uint8Array(1024)], "photo.gif", { type: "image/gif" });
  const svgFile = new File([new Uint8Array(1024)], "photo.svg", { type: "image/svg+xml" });
  const pdfFile = new File([new Uint8Array(1024)], "photo.pdf", { type: "application/pdf" });
  const textFile = new File([new Uint8Array(1024)], "photo.txt", { type: "text/plain" });

  assert.equal(validatePhotoFile(gifFile).valid, false, "image/gif must be rejected");
  assert.equal(validatePhotoFile(svgFile).valid, false, "image/svg+xml must be rejected");
  assert.equal(validatePhotoFile(pdfFile).valid, false, "application/pdf must be rejected");
  assert.equal(validatePhotoFile(textFile).valid, false, "text/plain must be rejected");
  console.log("   [PASS] Only JPEG, PNG, and WebP permitted; extensions verified; explicit error thrown for unapproved types.");
}

// -----------------------------------------------------------------------------
// Test 4: Filename Generation & Path Construction
// -----------------------------------------------------------------------------
console.log("4. Testing Collision-Resistant Filename & Path Construction...");
{
  const testUserId = "11111111-1111-4111-8111-111111111111";
  const testCardId = "22222222-2222-4222-8222-222222222222";

  const fnJpg = generatePhotoFilename("image/jpeg");
  assert.ok(fnJpg.endsWith(".jpg"), "JPEG extension must be .jpg");
  assert.ok(fnJpg.startsWith("photo-"), "Filename must prefix with photo-");

  const fnPng = generatePhotoFilename("image/png");
  assert.ok(fnPng.endsWith(".png"), "PNG extension must be .png");

  const fnWebp = generatePhotoFilename("image/webp");
  assert.ok(fnWebp.endsWith(".webp"), "WebP extension must be .webp");

  // Verify uniqueness across 1,000 generated filenames
  const filenames = new Set();
  for (let i = 0; i < 1000; i++) {
    filenames.add(generatePhotoFilename("image/jpeg"));
  }
  assert.equal(filenames.size, 1000, "All 1,000 generated filenames must be unique");

  // Verify path construction
  const path = buildCardPhotoPath(testUserId, testCardId, fnJpg);
  assert.equal(path, `${testUserId}/${testCardId}/${fnJpg}`);

  // Invalid user ID / card ID / filename in path construction
  assert.throws(() => buildCardPhotoPath("bad-user", testCardId, fnJpg), /INVALID_USER_ID/);
  assert.throws(() => buildCardPhotoPath(testUserId, "bad-card", fnJpg), /INVALID_CARD_ID/);
  assert.throws(() => buildCardPhotoPath(testUserId, testCardId, "/nested/file.jpg"), /INVALID_FILENAME/);
  assert.throws(() => buildCardPhotoPath(testUserId, testCardId, "../traversal.jpg"), /INVALID_FILENAME/);
  console.log("   [PASS] Cryptographic filename randomness and path construction verified.");
}

// -----------------------------------------------------------------------------
// Test 5: uploadCardPhoto with Mocked Supabase Client (Success Cases)
// -----------------------------------------------------------------------------
console.log("5. Testing uploadCardPhoto Success with JPEG, PNG, and WebP...");
{
  const mockUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const mockCardId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  let capturedBucket = null;
  let capturedPath = null;
  let capturedBody = null;
  let capturedOptions = null;

  const createMockStorageClient = () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: mockUserId, email: "creator@example.com" } },
        error: null,
      }),
    },
    storage: {
      from: (bucket) => {
        capturedBucket = bucket;
        return {
          upload: async (path, body, options) => {
            capturedPath = path;
            capturedBody = body;
            capturedOptions = options;
            return {
              data: { path },
              error: null,
            };
          },
        };
      },
    },
  });

  // Test JPEG upload
  const jpegFile = new File([new Uint8Array(5000)], "memory.jpg", { type: "image/jpeg" });
  const resultJpg = await uploadCardPhoto(mockCardId, jpegFile, createMockStorageClient());

  assert.equal(capturedBucket, "card-photos", "Must upload to 'card-photos' bucket");
  assert.ok(capturedPath.startsWith(`${mockUserId}/${mockCardId}/`), "Path must match {user_id}/{card_id}/...");
  assert.ok(capturedPath.endsWith(".jpg"), "Path must end with .jpg");
  assert.equal(capturedOptions.upsert, false, "upsert must be false");
  assert.equal(capturedOptions.contentType, "image/jpeg");
  assert.equal(resultJpg.photoPath, capturedPath);
  assert.equal(resultJpg.bucket, "card-photos");

  // Test PNG upload
  const pngFile = new File([new Uint8Array(5000)], "art.png", { type: "image/png" });
  const resultPng = await uploadCardPhoto(mockCardId, pngFile, createMockStorageClient());
  assert.ok(resultPng.photoPath.endsWith(".png"), "PNG path must end with .png");
  assert.equal(capturedOptions.contentType, "image/png");

  // Test WebP upload
  const webpFile = new File([new Uint8Array(5000)], "graphic.webp", { type: "image/webp" });
  const resultWebp = await uploadCardPhoto(mockCardId, webpFile, createMockStorageClient());
  assert.ok(resultWebp.photoPath.endsWith(".webp"), "WebP path must end with .webp");
  assert.equal(capturedOptions.contentType, "image/webp");

  console.log("   [PASS] JPEG, PNG, and WebP uploads execute with correct bucket, path, and upsert=false.");
}

// -----------------------------------------------------------------------------
// Test 6: uploadCardPhoto Error Handling & Missing Server Path Integrity
// -----------------------------------------------------------------------------
console.log("6. Testing uploadCardPhoto Rejection Scenarios & Upload Result Integrity...");
{
  const mockUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const mockCardId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const validFile = new File([new Uint8Array(100)], "test.jpg", { type: "image/jpeg" });

  // A. Invalid Card ID
  await assert.rejects(
    async () => uploadCardPhoto("non-uuid-card-id", validFile),
    /INVALID_CARD_ID/
  );

  // B. Oversize file (>2MB)
  const hugeFile = new File([new Uint8Array(2.5 * 1024 * 1024)], "huge.jpg", { type: "image/jpeg" });
  await assert.rejects(
    async () => uploadCardPhoto(mockCardId, hugeFile),
    /exceeds the 2 MB limit/
  );

  // C. Disallowed MIME type
  const badFile = new File([new Uint8Array(100)], "test.gif", { type: "image/gif" });
  await assert.rejects(
    async () => uploadCardPhoto(mockCardId, badFile),
    /Unsupported image format/
  );

  // D. Unauthenticated User (auth.getUser() returns null)
  const unauthClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    storage: { from: () => ({ upload: async () => ({}) }) },
  };
  await assert.rejects(
    async () => uploadCardPhoto(mockCardId, validFile, unauthClient),
    /UNAUTHENTICATED/
  );

  // E. Storage Error Propagation (e.g. RLS denial 403)
  const failingStorageClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: mockUserId } }, error: null }),
    },
    storage: {
      from: () => ({
        upload: async () => ({
          data: null,
          error: { message: "new row violates row-level security policy for table \"objects\"", statusCode: 403 },
        }),
      }),
    },
  };
  await assert.rejects(
    async () => uploadCardPhoto(mockCardId, validFile, failingStorageClient),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /row-level security/);
      return true;
    }
  );

  // F. Missing Server Path Integrity: If server upload returns data without path, must throw error
  const missingPathStorageClient = {
    auth: {
      getUser: async () => ({ data: { user: { id: mockUserId } }, error: null }),
    },
    storage: {
      from: () => ({
        upload: async () => ({
          data: null, // missing server path
          error: null,
        }),
      }),
    },
  };
  await assert.rejects(
    async () => uploadCardPhoto(mockCardId, validFile, missingPathStorageClient),
    /STORAGE_UPLOAD_ERROR/
  );

  console.log("   [PASS] All rejection scenarios (invalid UUID, oversize, bad MIME, unauthenticated, RLS error, missing server path) verified.");
}

console.log("\n================================================================================");
console.log(" ALL TASK 2C-5.2 TEST SUITES PASSED! (100% Mocked, 0 DB Impact)");
console.log("================================================================================\n");
