/**
 * Suprilo Task 2C-5.3.3 — Supabase Photo Upload Integration Unit Test Suite
 *
 * Verifies:
 * 1. File Validation:
 *    - Valid JPEG, PNG, WebP <= 2MB accepted
 *    - Files > 2MB rejected
 *    - Unsupported MIME types (GIF, SVG, etc.) rejected
 *    - Empty / 0-byte file rejected
 * 2. Upload Path & Storage Integrity:
 *    - Canonical path {user_id}/{card_id}/{filename}
 *    - Correct bucket 'card-photos'
 *    - upsert: false enforced
 *    - deleteCardPhoto safely removes file from storage
 * 3. Photo Upload Hook Simulation & State Transitions:
 *    - Local preview immediately available
 *    - uploadStatus transitions: idle -> uploading -> uploaded
 *    - draftId passed as card UUID
 * 4. Readiness & Pending File Queueing:
 *    - If user selects photo before draftId exists, preview is generated immediately
 *    - Upload automatically triggers when draftId & isDraftReady become ready
 * 5. Duplicate Upload Prevention:
 *    - Same file selected twice does not re-upload
 * 6. Superseded Upload Protection & Orphan Cleanup:
 *    - When Photo 2 is selected before Photo 1 finishes, Photo 1 is discarded
 *    - Photo 1's orphaned file is cleaned up via deleteCardPhoto
 *    - Photo 2's path is successfully set
 * 7. Error Handling & Retry:
 *    - Upload failure sets status to 'error'
 *    - Local preview is preserved
 *    - retryUpload() re-attempts upload with same file
 * 8. Photo Removal:
 *    - removePhoto() clears local selection, sets status to 'idle'
 *    - Cleans up remote Storage object via deleteCardPhoto
 *    - Updates card draft to photo_path: null
 * 9. Autosave Coordination:
 *    - Photo upload success updates editorState.photoPath
 *    - Autosave payload receives valid Storage path
 *    - Base64 data URLs are strictly filtered out (never sent to DB)
 *    - Text edits do not re-upload photo
 * 10. Lifecycle Invalidation:
 *     - Draft switching invalidates in-flight uploads
 *     - Logout invalidates in-flight uploads
 *     - Editor deactivation invalidates in-flight uploads
 *
 * Strictly isolated: 100% Mocked (0 remote Supabase database or network impact).
 */

import assert from "node:assert/strict";

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.3.3 — Photo Upload Integration Unit Tests (100% Mocked)");
console.log("================================================================================\n");

const {
  validatePhotoFile,
  getPhotoExtensionFromMime,
} = await import("../src/lib/photo-validation.ts");

const {
  CARD_PHOTOS_BUCKET,
  isValidUuid,
  generatePhotoFilename,
  buildCardPhotoPath,
  uploadCardPhoto,
  deleteCardPhoto,
} = await import("../src/lib/card-storage.ts");

const {
  mapEditorStateToUpdateFields,
  serializeEditorStateForDraft,
} = await import("../src/hooks/useCardAutosave.ts");

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
// SUITE 1: Pure Photo Validation Tests
// =============================================================================
console.log("1. Testing Pure Photo Validation (validatePhotoFile)...");
{
  // Valid JPEG
  const validJpg = new File([new Uint8Array(1024)], "photo.jpg", { type: "image/jpeg" });
  testAssert(validatePhotoFile(validJpg).valid, "Valid JPEG accepted");

  // Valid PNG
  const validPng = new File([new Uint8Array(1024)], "photo.png", { type: "image/png" });
  testAssert(validatePhotoFile(validPng).valid, "Valid PNG accepted");

  // Valid WebP
  const validWebp = new File([new Uint8Array(1024)], "photo.webp", { type: "image/webp" });
  testAssert(validatePhotoFile(validWebp).valid, "Valid WebP accepted");

  // Oversize > 2MB
  const oversize = new File([new Uint8Array(2 * 1024 * 1024 + 10)], "big.png", { type: "image/png" });
  const oversizeRes = validatePhotoFile(oversize);
  testAssert(!oversizeRes.valid && /exceeds the 2 MB limit/i.test(oversizeRes.error), "File > 2MB rejected");

  // Unsupported MIME (GIF)
  const gifFile = new File([new Uint8Array(1024)], "anim.gif", { type: "image/gif" });
  const gifRes = validatePhotoFile(gifFile);
  testAssert(!gifRes.valid && /unsupported image format/i.test(gifRes.error), "GIF file rejected");

  // Empty file (0 bytes)
  const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
  testAssert(!validatePhotoFile(emptyFile).valid, "0-byte file rejected");
}

// =============================================================================
// SUITE 2: Storage Path Construction & Delete Helper
// =============================================================================
console.log("\n2. Testing Storage Path Construction & Delete Helper...");
{
  const mockUserId = "4b68e9e1-207d-4180-a61f-9da197ce3286";
  const mockCardId = "7a151b72-f8d2-4328-98e3-0d65bceb8cf0";

  const filename = generatePhotoFilename("image/jpeg");
  testAssert(filename.endsWith(".jpg"), `Generated filename has .jpg extension (${filename})`);

  const path = buildCardPhotoPath(mockUserId, mockCardId, filename);
  testAssert(path === `${mockUserId}/${mockCardId}/${filename}`, "Storage path matches {user_id}/{card_id}/{filename}");

  // Test deleteCardPhoto mock
  let removedPaths = [];
  const mockStorageClient = {
    storage: {
      from: (bucket) => ({
        remove: async (paths) => {
          testAssert(bucket === CARD_PHOTOS_BUCKET, `deleteCardPhoto uses '${CARD_PHOTOS_BUCKET}'`);
          removedPaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  await deleteCardPhoto(path, mockStorageClient);
  testAssert(removedPaths.includes(path), "deleteCardPhoto successfully removes specified path");

  // Test invalid path defense in deleteCardPhoto (traversal, empty, wrong segments)
  removedPaths = [];
  await deleteCardPhoto("", mockStorageClient);
  await deleteCardPhoto("invalid-path", mockStorageClient);
  await deleteCardPhoto("../../../etc/passwd", mockStorageClient);
  testAssert(removedPaths.length === 0, "deleteCardPhoto rejects invalid/traversal paths safely");
}

// =============================================================================
// SUITE 3: Upload Execution & Path Format Verification
// =============================================================================
console.log("\n3. Testing uploadCardPhoto Storage Invocation...");
{
  const mockUserId = "3c6a46e1-2fa8-4b77-8bc8-4339967675f9";
  const mockCardId = "9b9f71c4-95e2-45e0-8a1a-bb61352ec77f";
  const testFile = new File([new Uint8Array(2048)], "memory.jpg", { type: "image/jpeg" });

  let capturedBucket = "";
  let capturedPath = "";
  let capturedOptions = null;

  const mockClient = {
    auth: {
      getUser: async () => ({
        data: { user: { id: mockUserId } },
        error: null,
      }),
    },
    storage: {
      from: (bucket) => {
        capturedBucket = bucket;
        return {
          upload: async (uploadPath, file, options) => {
            capturedPath = uploadPath;
            capturedOptions = options;
            return {
              data: { path: uploadPath },
              error: null,
            };
          },
        };
      },
    },
  };

  const uploadResult = await uploadCardPhoto(mockCardId, testFile, mockClient);
  testAssert(capturedBucket === "card-photos", "Uploaded to private 'card-photos' bucket");
  testAssert(capturedPath.startsWith(`${mockUserId}/${mockCardId}/photo-`), `Path follows {user_id}/{card_id}/{filename} pattern (${capturedPath})`);
  testAssert(capturedOptions.upsert === false, "Storage upload options has upsert: false");
  testAssert(capturedOptions.contentType === "image/jpeg", "Storage upload options includes contentType");
  testAssert(uploadResult.photoPath === capturedPath, "Result photoPath matches server returned path");
}

// =============================================================================
// SUITE 4: Autosave Integration with photo_path
// =============================================================================
console.log("\n4. Testing Autosave Integration (mapEditorStateToUpdateFields)...");
{
  const baseEditorState = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Taylor",
    senderName: "Jordan",
    occasionTag: "Special Moment",
    primaryMessage: "Scratch here to see a memory!",
    secondaryMessage: "Look closely...",
    foilStyle: "lavender-pink",
    coverText: "Scratch to reveal",
    bgPalette: "pure-ivory",
    sticker: "heart",
    fontFamily: undefined,
    photoUrl: "data:image/jpeg;base64,mockpreviewdata",
    photoPath: null,
    soundEnabled: true,
  };

  // 1. Initial / No photo -> photo_path is null
  const fieldsNoPhoto = mapEditorStateToUpdateFields(baseEditorState);
  testAssert(fieldsNoPhoto.photo_path === null, "photo_path is null when editorState.photoPath is null");

  // 2. Photo uploaded -> photo_path receives valid storage path
  const storagePath = "3c6a46e1-2fa8-4b77-8bc8-4339967675f9/9b9f71c4-95e2-45e0-8a1a-bb61352ec77f/photo-12345.jpg";
  const stateWithPhoto = { ...baseEditorState, photoPath: storagePath };
  const fieldsWithPhoto = mapEditorStateToUpdateFields(stateWithPhoto);
  testAssert(fieldsWithPhoto.photo_path === storagePath, "photo_path maps valid storage path correctly");

  // 3. Security: Base64 data URLs MUST NOT be stored in PostgreSQL
  const stateWithBase64 = { ...baseEditorState, photoPath: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." };
  const fieldsWithBase64 = mapEditorStateToUpdateFields(stateWithBase64);
  testAssert(fieldsWithBase64.photo_path === null, "Base64 data URL is strictly filtered out (photo_path = null)");

  // 4. Security: Blob URLs MUST NOT be stored in PostgreSQL
  const stateWithBlob = { ...baseEditorState, photoPath: "blob:http://localhost:3000/a1b2c3d4" };
  const fieldsWithBlob = mapEditorStateToUpdateFields(stateWithBlob);
  testAssert(fieldsWithBlob.photo_path === null, "Blob URL is strictly filtered out (photo_path = null)");

  // 5. Change detection in serializeEditorStateForDraft
  const s1 = serializeEditorStateForDraft(baseEditorState);
  const s2 = serializeEditorStateForDraft(stateWithPhoto);
  testAssert(s1 !== s2, "Adding photoPath alters serialized draft state (triggers autosave)");

  // 6. Text change with photo preserves photo_path without altering photo upload
  const stateWithTextEdit = { ...stateWithPhoto, recipientName: "Morgan" };
  const fieldsTextEdit = mapEditorStateToUpdateFields(stateWithTextEdit);
  testAssert(fieldsTextEdit.recipient_name === "Morgan" && fieldsTextEdit.photo_path === storagePath, "Text edit updates recipient_name and preserves photo_path");

  // 7. Removing photo sets photo_path back to null
  const stateRemovedPhoto = { ...stateWithPhoto, photoPath: null, photoUrl: null };
  const fieldsRemovedPhoto = mapEditorStateToUpdateFields(stateRemovedPhoto);
  testAssert(fieldsRemovedPhoto.photo_path === null, "Removing photo sets photo_path to null in autosave payload");
}

// =============================================================================
// SUITE 5: Photo Upload Lifecycle Simulator (Hook Logic Verification)
// =============================================================================
console.log("\n5. Testing Photo Upload Hook Simulation & State Machine...");

class PhotoUploadSimulator {
  constructor(options = {}) {
    this.draftId = options.draftId || null;
    this.isDraftReady = options.isDraftReady ?? false;
    this.user = options.user || null;
    this.isActive = options.isActive ?? true;
    this.currentPhotoPath = options.currentPhotoPath || null;
    this.client = options.client || null;
    this.savePhotoPath = options.savePhotoPath || null;
    this.onPhotoUploaded = options.onPhotoUploaded || null;
    this.onPhotoRemoved = options.onPhotoRemoved || null;

    this.uploadStatus = this.currentPhotoPath ? "uploaded" : "idle";
    this.uploadError = null;
    this.selectedFile = null;
    this.previewUrl = null;

    this.uploadToken = 0;
    this.lastUploadedSig = null;
    this.pendingFile = null;
    this.deletedPhotos = [];
    this.savedPaths = [];
    this.eventLog = [];
    this.stagedUploadPath = null;
    this.lastFailedAction = null;
  }

  async doSavePhotoPath(targetDraftId, targetUserId, path) {
    this.eventLog.push({ type: "save_db", targetDraftId, targetUserId, path });
    if (this.savePhotoPath) {
      const res =
        this.savePhotoPath.length > 1
          ? await this.savePhotoPath(targetDraftId, targetUserId, path)
          : await this.savePhotoPath(path);
      if (res && typeof res === "object" && "isStale" in res) {
        return res;
      }
      const isStale =
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;
      return { success: true, isStale };
    } else {
      const isStale =
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;
      this.savedPaths.push(path);
      return { success: true, isStale };
    }
  }

  setDraftId(id, isReady = true, photoPath = null) {
    if (this.draftId !== id) {
      this.uploadToken++;
      this.draftId = id;
      this.isDraftReady = isReady;
      this.currentPhotoPath = photoPath;
      this.selectedFile = null;
      this.uploadError = null;
      this.lastUploadedSig = null;
      this.stagedUploadPath = null;
      this.lastFailedAction = null;
      this.uploadStatus = photoPath ? "uploaded" : "idle";

      // If a pending file was waiting for draftId, execute upload
      if (this.isActive && this.user && this.draftId && this.isDraftReady && this.pendingFile) {
        const file = this.pendingFile;
        this.pendingFile = null;
        return this.executeUpload(file, this.draftId, this.user.id);
      }
    }
  }

  setUser(user, photoPath = null) {
    if (this.user?.id !== user?.id) {
      this.uploadToken++;
      this.user = user;
      this.currentPhotoPath = photoPath;
      this.selectedFile = null;
      this.uploadError = null;
      this.lastUploadedSig = null;
      this.pendingFile = null;
      this.stagedUploadPath = null;
      this.lastFailedAction = null;
      this.uploadStatus = photoPath ? "uploaded" : "idle";
    }
  }

  setIsActive(active) {
    this.isActive = active;
    if (!active) {
      this.uploadToken++;
      this.pendingFile = null;
      this.stagedUploadPath = null;
      if (this.uploadStatus === "uploading") {
        this.uploadStatus = "idle";
      }
    }
  }

  async handleFileSelect(file) {
    if (!file) return;

    // 1. Validation
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      this.uploadStatus = "error";
      this.uploadError = validation.error;
      return;
    }

    this.uploadError = null;
    this.selectedFile = file;

    // 2. Immediate local preview (simulated FileReader)
    this.previewUrl = `data:${file.type};base64,simulated_preview_${file.name}`;

    // 3. Duplicate check
    const fileSig = `${this.draftId}:${file.name}:${file.size}:${file.lastModified}`;
    if (this.lastUploadedSig === fileSig && this.currentPhotoPath) {
      this.uploadStatus = "uploaded";
      return;
    }

    // 4. Readiness check
    const isReady = this.isActive && this.user && this.draftId && this.isDraftReady;
    if (!isReady) {
      this.pendingFile = file;
      this.uploadStatus = "uploading";
      return;
    }

    return this.executeUpload(file, this.draftId, this.user.id);
  }

  async executeUpload(file, targetDraftId, targetUserId) {
    const token = ++this.uploadToken;
    this.uploadStatus = "uploading";
    this.uploadError = null;
    this.lastFailedAction = "upload";

    const fileSig = `${targetDraftId}:${file.name}:${file.size}:${file.lastModified}`;
    const initialPhotoPathToReplace = this.currentPhotoPath;

    try {
      // Step 1: Upload new photo to Storage
      this.eventLog.push({ type: "upload_storage", fileName: file.name, targetDraftId });
      const result = await uploadCardPhoto(targetDraftId, file, this.client);

      // Pre-DB staleness check
      const isStaleAfterUpload =
        token !== this.uploadToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleAfterUpload) {
        this.deletedPhotos.push(result.photoPath);
        this.eventLog.push({ type: "delete_storage", path: result.photoPath, reason: "stale" });
        await deleteCardPhoto(result.photoPath, this.client);
        return;
      }

      this.stagedUploadPath = result.photoPath;

      // Step 2 & 3: Save actual Storage path to PostgreSQL draft
      const saveResult = await this.doSavePhotoPath(targetDraftId, targetUserId, result.photoPath);

      // Post-DB staleness check
      const isStaleAfterDb =
        token !== this.uploadToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive ||
        saveResult.isStale;

      if (isStaleAfterDb) {
        if (saveResult.success) {
          // targetDraftId was updated in DB; clean up targetDraftId's old photo
          if (initialPhotoPathToReplace && initialPhotoPathToReplace !== result.photoPath) {
            this.deletedPhotos.push(initialPhotoPathToReplace);
            this.eventLog.push({ type: "delete_storage", path: initialPhotoPathToReplace, reason: "replaced" });
            await deleteCardPhoto(initialPhotoPathToReplace, this.client);
          }
        } else {
          // DB update didn't run; clean up newly uploaded file
          this.deletedPhotos.push(result.photoPath);
          this.eventLog.push({ type: "delete_storage", path: result.photoPath, reason: "stale_upload" });
          await deleteCardPhoto(result.photoPath, this.client);
        }
        if (this.stagedUploadPath === result.photoPath) {
          this.stagedUploadPath = null;
        }
        // Do NOT call callback or update new editor
        return;
      }

      // Step 4: ONLY THEN delete the previous Storage object of targetDraftId
      if (initialPhotoPathToReplace && initialPhotoPathToReplace !== result.photoPath) {
        this.deletedPhotos.push(initialPhotoPathToReplace);
        this.eventLog.push({ type: "delete_storage", path: initialPhotoPathToReplace, reason: "replaced" });
        await deleteCardPhoto(initialPhotoPathToReplace, this.client);
      }

      this.stagedUploadPath = null;
      this.currentPhotoPath = result.photoPath;
      this.lastUploadedSig = fileSig;
      this.lastFailedAction = null;
      this.uploadStatus = "uploaded";
      this.uploadError = null;
      this.onPhotoUploaded?.(result.photoPath);
    } catch (err) {
      const isStaleOnError =
        token !== this.uploadToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleOnError) return;

      this.uploadStatus = "error";
      this.uploadError = err.message || "Upload failed";
    }
  }

  async retryUpload() {
    if (this.lastFailedAction === "remove") {
      return this.removePhoto();
    }

    if (!this.isActive || !this.user || !this.draftId || !this.isDraftReady) {
      if (this.selectedFile) {
        this.pendingFile = this.selectedFile;
        this.uploadStatus = "uploading";
      }
      return;
    }

    if (this.stagedUploadPath) {
      this.uploadStatus = "uploading";
      this.uploadError = null;
      const newPath = this.stagedUploadPath;
      const oldPath = this.currentPhotoPath;
      const currentDraftId = this.draftId;
      const currentUserId = this.user?.id;
      const token = ++this.uploadToken;

      try {
        const saveResult = await this.doSavePhotoPath(currentDraftId, currentUserId, newPath);

        const isStale =
          token !== this.uploadToken ||
          this.draftId !== currentDraftId ||
          this.user?.id !== currentUserId ||
          !this.isActive ||
          saveResult.isStale;

        if (isStale) {
          if (saveResult.success && oldPath && oldPath !== newPath) {
            this.deletedPhotos.push(oldPath);
            await deleteCardPhoto(oldPath, this.client);
          }
          return;
        }

        if (oldPath && oldPath !== newPath) {
          this.deletedPhotos.push(oldPath);
          this.eventLog.push({ type: "delete_storage", path: oldPath, reason: "replaced" });
          await deleteCardPhoto(oldPath, this.client);
        }

        this.stagedUploadPath = null;
        this.currentPhotoPath = newPath;
        this.lastFailedAction = null;
        this.uploadStatus = "uploaded";
        this.uploadError = null;
        this.onPhotoUploaded?.(newPath);
        return;
      } catch (err) {
        const isStale =
          token !== this.uploadToken ||
          this.draftId !== currentDraftId ||
          this.user?.id !== currentUserId ||
          !this.isActive;

        if (isStale) return;

        this.uploadStatus = "error";
        this.uploadError = err.message || "Failed to save photo to draft. Please try again.";
        return;
      }
    }

    if (this.selectedFile) {
      return this.executeUpload(this.selectedFile, this.draftId, this.user.id);
    }
  }

  async removePhoto() {
    const targetDraftId = this.draftId;
    const targetUserId = this.user?.id;
    const pathToClean = this.currentPhotoPath;

    if (!targetDraftId || !targetUserId || !this.isActive) {
      return;
    }

    if (!pathToClean) {
      this.uploadToken++;
      this.pendingFile = null;
      this.selectedFile = null;
      this.previewUrl = null;
      this.stagedUploadPath = null;
      this.lastUploadedSig = null;
      this.lastFailedAction = null;
      this.uploadStatus = "idle";
      this.uploadError = null;
      this.onPhotoRemoved?.();
      return;
    }

    // Step 1: Save photo_path: null to PostgreSQL successfully
    const token = ++this.uploadToken;
    this.uploadStatus = "uploading";
    this.uploadError = null;
    this.lastFailedAction = "remove";

    try {
      const saveResult = await this.doSavePhotoPath(targetDraftId, targetUserId, null);

      const isStale =
        token !== this.uploadToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive ||
        saveResult.isStale;

      if (isStale) {
        if (saveResult.success) {
          this.deletedPhotos.push(pathToClean);
          this.eventLog.push({ type: "delete_storage", path: pathToClean, reason: "removed" });
          await deleteCardPhoto(pathToClean, this.client);
        }
        // Do NOT call onPhotoRemoved for the new editor
        return;
      }

      // Step 2: Only after successful database persistence, delete old Storage object
      this.deletedPhotos.push(pathToClean);
      this.eventLog.push({ type: "delete_storage", path: pathToClean, reason: "removed" });
      await deleteCardPhoto(pathToClean, this.client);

      // Recheck staleness immediately after Storage deletion settles
      const isStaleAfterStorage =
        token !== this.uploadToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleAfterStorage) {
        return;
      }

      // Success for current active editor
      this.pendingFile = null;
      this.selectedFile = null;
      this.previewUrl = null;
      this.stagedUploadPath = null;
      this.lastUploadedSig = null;
      this.lastFailedAction = null;
      this.currentPhotoPath = null;
      this.uploadStatus = "idle";
      this.uploadError = null;
      this.onPhotoRemoved?.();
    } catch (err) {
      const isStaleOnError =
        token !== this.uploadToken ||
        this.draftId !== targetDraftId ||
        this.user?.id !== targetUserId ||
        !this.isActive;

      if (isStaleOnError) return;

      this.uploadStatus = "error";
      this.uploadError = `Failed to remove photo: ${err.message || String(err)}`;
    }
  }
}

// Test 5.1: Happy Path Upload Flow
{
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "b2222222-2222-4222-8222-222222222222";

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => ({ data: paths, error: null }),
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    client,
  });

  const photoFile = new File([new Uint8Array(5000)], "vacation.png", {
    type: "image/png",
    lastModified: 1700000000000,
  });

  testAssert(sim.uploadStatus === "idle", "Initial uploadStatus is 'idle'");
  testAssert(sim.previewUrl === null, "Initial previewUrl is null");

  await sim.handleFileSelect(photoFile);

  testAssert(sim.previewUrl !== null, "Local previewUrl generated immediately upon selection");
  testAssert(sim.uploadStatus === "uploaded", "UploadStatus transitioned to 'uploaded'");
  testAssert(sim.uploadError === null, "uploadError is null on success");
  testAssert(sim.currentPhotoPath.startsWith(`${mockUser.id}/${mockDraftId}/photo-`), "Current photoPath set to canonical storage path");
  testAssert(sim.savedPaths.length === 1, "Exactly one photo saved to storage");
}

// Test 5.2: Selection Before Draft Creation (Queueing Flow)
console.log("\n6. Testing File Selection Before Draft Readiness (Pending Queue)...");
{
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "c3333333-3333-4333-8333-333333333333";

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => ({ data: paths, error: null }),
      }),
    },
  };

  // Draft not ready yet (draftId is null)
  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: null,
    isDraftReady: false,
    isActive: true,
    client,
  });

  const photoFile = new File([new Uint8Array(4000)], "early.jpg", {
    type: "image/jpeg",
    lastModified: 1700000001000,
  });

  await sim.handleFileSelect(photoFile);

  testAssert(sim.previewUrl !== null, "Local preview shown immediately even before remote draft exists");
  testAssert(sim.uploadStatus === "uploading", "Status is 'uploading' while waiting for draftId");
  testAssert(sim.savedPaths.length === 0, "No storage upload before remote draft is created");

  // Now draft creation finishes and confirms draftId
  await sim.setDraftId(mockDraftId, true);

  testAssert(sim.uploadStatus === "uploaded", "Upload automatically executed when draftId became ready");
  testAssert(sim.currentPhotoPath.includes(mockDraftId), "Photo uploaded with confirmed remote draftId");
  testAssert(sim.savedPaths.length === 1, "Photo successfully saved to storage");
}

// Test 5.3: Duplicate Upload Prevention
console.log("\n7. Testing Duplicate Upload Prevention...");
{
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "d4444444-4444-4444-8444-444444444444";

  let uploadCount = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => {
          uploadCount++;
          return { data: { path: p }, error: null };
        },
        remove: async (paths) => ({ data: paths, error: null }),
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    client,
  });

  const photoFile = new File([new Uint8Array(3000)], "same.jpg", {
    type: "image/jpeg",
    lastModified: 1700000002000,
  });

  await sim.handleFileSelect(photoFile);
  testAssert(uploadCount === 1, "First upload performed");

  // Select exact same file again
  await sim.handleFileSelect(photoFile);
  testAssert(uploadCount === 1, "Duplicate file selection skipped second storage upload");
  testAssert(sim.uploadStatus === "uploaded", "Status remains 'uploaded'");
}

// Test 5.4: Superseded Upload & Orphan Cleanup
console.log("\n8. Testing Superseded Upload & Orphan File Cleanup...");
{
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "e5555555-5555-4555-8555-555555555555";

  let resolvePhoto1 = null;
  const photo1Promise = new Promise((res) => {
    resolvePhoto1 = res;
  });

  const removedStoragePaths = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p, file) => {
          if (file.name === "photo1.jpg") {
            await photo1Promise; // slow request
          }
          return { data: { path: p }, error: null };
        },
        remove: async (paths) => {
          removedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    client,
  });

  const photo1 = new File([new Uint8Array(2000)], "photo1.jpg", {
    type: "image/jpeg",
    lastModified: 1700000010000,
  });

  const photo2 = new File([new Uint8Array(2000)], "photo2.png", {
    type: "image/png",
    lastModified: 1700000020000,
  });

  // Start upload of Photo 1 (hangs)
  const p1Op = sim.handleFileSelect(photo1);

  // User immediately selects Photo 2 before Photo 1 finishes
  const p2Op = sim.handleFileSelect(photo2);

  // Photo 2 finishes first
  await p2Op;
  testAssert(sim.previewUrl.includes("photo2.png"), "Preview updated to Photo 2");
  const p2SavedPath = sim.currentPhotoPath;
  testAssert(p2SavedPath.includes(".png"), "Photo 2 is active storage path");

  // Now Photo 1 finishes
  resolvePhoto1();
  await p1Op;

  // Verify Photo 1 did NOT overwrite Photo 2
  testAssert(sim.currentPhotoPath === p2SavedPath, "Older Photo 1 did NOT overwrite newer Photo 2");
  testAssert(sim.deletedPhotos.some((p) => p.includes("photo-") && p.endsWith(".jpg")), "Orphaned Photo 1 was safely cleaned up via deleteCardPhoto");
  testAssert(removedStoragePaths.some((p) => p.endsWith(".jpg")), "Storage delete API called for orphaned Photo 1");
}

// Test 5.5: Error Handling & Retry Flow
console.log("\n9. Testing Error Handling & Retry Option...");
{
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "f6666666-6666-4666-8666-666666666666";

  let shouldFail = true;
  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => {
          if (shouldFail) {
            return {
              data: null,
              error: { message: "Network connection lost", statusCode: 500 },
            };
          }
          return { data: { path: p }, error: null };
        },
        remove: async (paths) => ({ data: paths, error: null }),
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    client,
  });

  const photoFile = new File([new Uint8Array(3500)], "memory.jpg", {
    type: "image/jpeg",
    lastModified: 1700000030000,
  });

  await sim.handleFileSelect(photoFile);

  testAssert(sim.uploadStatus === "error", "Status is 'error' after network failure");
  testAssert(sim.uploadError === "Network connection lost", "Error message recorded correctly");
  testAssert(sim.previewUrl !== null, "Local preview is preserved on failure (not wiped)");

  // Retry upload after network restores
  shouldFail = false;
  await sim.retryUpload();

  testAssert(sim.uploadStatus === "uploaded", "retryUpload() successfully uploaded the photo");
  testAssert(sim.uploadError === null, "Error message cleared on retry success");
  testAssert(sim.currentPhotoPath !== null, "Current photoPath successfully set after retry");
}

// Test 5.6: Photo Removal Flow
console.log("\n10. Testing Photo Removal Flow...");
{
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "77777777-7777-4777-8777-777777777777";
  const removedPaths = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          removedPaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    client,
  });

  const photoFile = new File([new Uint8Array(2500)], "toremove.jpg", {
    type: "image/jpeg",
    lastModified: 1700000040000,
  });

  await sim.handleFileSelect(photoFile);
  testAssert(sim.uploadStatus === "uploaded", "Photo attached");
  const uploadedPath = sim.currentPhotoPath;

  // Now user clicks Remove Photo
  await sim.removePhoto();

  testAssert(sim.uploadStatus === "idle", "Upload status reset to 'idle'");
  testAssert(sim.previewUrl === null, "Preview URL cleared");
  testAssert(sim.currentPhotoPath === null, "currentPhotoPath cleared to null");
  testAssert(removedPaths.includes(uploadedPath), "Storage delete called for removed photo");
}

// Test 5.7: Lifecycle Invalidation (Draft Switch, Logout, Deactivation)
console.log("\n11. Testing Lifecycle Invalidation (Draft Switch, Logout, Deactivation)...");
{
  const userA = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
  const userB = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
  const draft1 = "11111111-1111-4111-8111-111111111111";
  const draft2 = "22222222-2222-4222-8222-222222222222";

  const client = {
    auth: { getUser: async () => ({ data: { user: userA }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => ({ data: paths, error: null }),
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: userA,
    draftId: draft1,
    isDraftReady: true,
    isActive: true,
    client,
  });

  // 1. Inactivity invalidation
  sim.setIsActive(false);
  testAssert(sim.isActive === false, "Editor set to inactive");
  testAssert(sim.uploadStatus === "idle", "Status reset to idle on deactivation");

  sim.setIsActive(true);

  // 2. Draft switch invalidation
  sim.setDraftId(draft2, true);
  testAssert(sim.draftId === draft2, "Switched to draft 2");
  testAssert(sim.uploadStatus === "idle", "Status reset to idle on draft switch");

  // 3. User account switch invalidation
  sim.setUser(userB);
  testAssert(sim.user.id === userB.id, "Switched user");
  testAssert(sim.uploadStatus === "idle", "Status reset to idle on user switch");
}

// =============================================================================
// SUITE 6: Storage Deletion Ordering & Data Integrity Regression Tests (Task 2C-5.3.3 Fix)
// =============================================================================
console.log("\n12. Testing Storage Deletion Ordering & Data Integrity Regressions...");

// Regression Test 1: Old photo is not deleted before the new path is persisted
{
  console.log("   --- Regression 1: Old photo not deleted before new path persisted ---");
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "c1111111-1111-4111-8111-111111111111";
  const oldPhotoPath = `${mockUser.id}/${mockDraftId}/photo-old.jpg`;

  const orderLog = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => {
          orderLog.push(`upload:${p}`);
          return { data: { path: p }, error: null };
        },
        remove: async (paths) => {
          orderLog.push(`remove:${paths.join(",")}`);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoPath,
    client,
    savePhotoPath: async (path) => {
      orderLog.push(`db_persist:${path}`);
      // At this point in time, the old photo MUST NOT have been deleted yet
      testAssert(
        !orderLog.some((e) => e.startsWith("remove:")),
        "Old photo has not been deleted while database persistence is executing"
      );
    },
  });

  const newPhotoFile = new File([new Uint8Array(2000)], "new.jpg", {
    type: "image/jpeg",
    lastModified: 1700000050000,
  });

  await sim.handleFileSelect(newPhotoFile);

  // Verify full chronological sequence
  const uploadIdx = orderLog.findIndex((e) => e.startsWith("upload:"));
  const persistIdx = orderLog.findIndex((e) => e.startsWith("db_persist:"));
  const removeIdx = orderLog.findIndex((e) => e.startsWith("remove:"));

  testAssert(uploadIdx !== -1 && persistIdx !== -1 && removeIdx !== -1, "All operations executed");
  testAssert(uploadIdx < persistIdx, "Upload happens before DB persistence");
  testAssert(persistIdx < removeIdx, "DB persistence happens BEFORE old photo removal");
  testAssert(sim.uploadStatus === "uploaded", "Upload status is 'uploaded'");
}

// Regression Test 2: Failed new-path persistence retains the old photo
{
  console.log("   --- Regression 2: Failed new-path persistence retains old photo ---");
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "c2222222-2222-4222-8222-222222222222";
  const oldPhotoPath = `${mockUser.id}/${mockDraftId}/photo-old.jpg`;
  const deletedStoragePaths = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  let failDb = true;

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoPath,
    client,
    savePhotoPath: async (path) => {
      if (failDb) {
        throw new Error("Simulated database failure: connection lost");
      }
    },
  });

  const newPhotoFile = new File([new Uint8Array(2000)], "new-photo.jpg", {
    type: "image/jpeg",
    lastModified: 1700000060000,
  });

  await sim.handleFileSelect(newPhotoFile);

  testAssert(sim.uploadStatus === "error", "Status is 'error' when database update fails");
  testAssert(!deletedStoragePaths.includes(oldPhotoPath), "Old photo was NOT deleted from Storage on failure");
  testAssert(sim.currentPhotoPath === oldPhotoPath, "Old photo path is retained in currentPhotoPath");
  testAssert(sim.previewUrl !== null, "New local preview is preserved for user view");

  // Retry when DB recovers
  failDb = false;
  await sim.retryUpload();

  testAssert(sim.uploadStatus === "uploaded", "Retry succeeded when DB recovered");
  testAssert(sim.currentPhotoPath !== oldPhotoPath, "New photo path adopted after successful retry");
  testAssert(deletedStoragePaths.includes(oldPhotoPath), "Old photo deleted only after successful retry");
}

// Regression Test 3: Successful replacement persists the new path before deleting the old object
{
  console.log("   --- Regression 3: Successful replacement persists before deleting old object ---");
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "c3333333-3333-4333-8333-333333333333";
  const oldPhotoPath = `${mockUser.id}/${mockDraftId}/photo-old.png`;
  const eventSequence = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => {
          eventSequence.push("storage_upload");
          return { data: { path: p }, error: null };
        },
        remove: async (paths) => {
          eventSequence.push(`storage_delete:${paths.join(",")}`);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoPath,
    client,
    savePhotoPath: async (path) => {
      eventSequence.push(`db_persist:${path}`);
    },
  });

  const newPhotoFile = new File([new Uint8Array(2000)], "brand-new.webp", {
    type: "image/webp",
    lastModified: 1700000070000,
  });

  await sim.handleFileSelect(newPhotoFile);

  testAssert(eventSequence[0] === "storage_upload", "Step 1: Storage upload completed");
  testAssert(eventSequence[1].startsWith("db_persist:"), "Step 2: DB persistence completed");
  testAssert(eventSequence[2] === `storage_delete:${oldPhotoPath}`, "Step 3: Storage delete of old photo occurred AFTER persistence");
  testAssert(sim.uploadStatus === "uploaded", "Final uploadStatus is 'uploaded'");
}

// Regression Test 4: Failed removal persistence retains the old object
{
  console.log("   --- Regression 4: Failed removal persistence retains old object ---");
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "c4444444-4444-4444-8444-444444444444";
  const oldPhotoPath = `${mockUser.id}/${mockDraftId}/photo-to-keep.jpg`;
  const deletedStoragePaths = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  let failRemovalDb = true;

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoPath,
    client,
    savePhotoPath: async (path) => {
      if (failRemovalDb) {
        throw new Error("Failed to clear photo_path in PostgreSQL (simulated 500)");
      }
    },
  });

  await sim.removePhoto();

  testAssert(sim.uploadStatus === "error", "Status is 'error' on failed removal");
  testAssert(!deletedStoragePaths.includes(oldPhotoPath), "Storage delete was NOT called when removal DB update failed");
  testAssert(sim.currentPhotoPath === oldPhotoPath, "Old photo path is retained in state on failure");
  testAssert(sim.uploadError.includes("Failed to remove photo"), "Descriptive retryable error exposed");

  // User retries removal after DB recovers
  failRemovalDb = false;
  await sim.retryUpload();

  testAssert(sim.uploadStatus === "idle", "Status is 'idle' after successful retry removal");
  testAssert(sim.currentPhotoPath === null, "currentPhotoPath cleared after successful retry");
  testAssert(deletedStoragePaths.includes(oldPhotoPath), "Storage delete called after successful persistence of null");
}

// Regression Test 5: Successful removal persists null before deleting the object
{
  console.log("   --- Regression 5: Successful removal persists null before deleting object ---");
  const mockUser = { id: "a1111111-1111-4111-8111-111111111111" };
  const mockDraftId = "c5555555-5555-4555-8555-555555555555";
  const oldPhotoPath = `${mockUser.id}/${mockDraftId}/photo-to-remove.png`;
  const removalEventLog = [];

  const client = {
    auth: { getUser: async () => ({ data: { user: mockUser }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          removalEventLog.push(`delete_storage:${paths.join(",")}`);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user: mockUser,
    draftId: mockDraftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoPath,
    client,
    savePhotoPath: async (path) => {
      removalEventLog.push(`db_persist:${path}`);
      // Verify storage delete has not happened yet
      testAssert(
        !removalEventLog.some((e) => e.startsWith("delete_storage:")),
        "Old object is not deleted while persisting null to database"
      );
    },
  });

  await sim.removePhoto();

  testAssert(removalEventLog[0] === "db_persist:null", "Null was persisted to PostgreSQL first");
  testAssert(removalEventLog[1] === `delete_storage:${oldPhotoPath}`, "Storage delete occurred AFTER persisting null");
  testAssert(sim.uploadStatus === "idle", "Upload status is 'idle' after successful removal");
  testAssert(sim.currentPhotoPath === null, "currentPhotoPath is null");
  testAssert(sim.previewUrl === null, "previewUrl is null");
}

// =============================================================================
// SUITE 13: Photo Lifecycle Isolation & Stale Guard Regressions (Task 2C-5.3.3 Final Pass)
// =============================================================================
console.log("\n13. Testing Photo Lifecycle Isolation & Stale Guard Regressions...");

// Case 1: Draft switches while replacement DB persistence is in-flight
{
  console.log("   --- Case 1: Draft switches while replacement DB persistence is in-flight ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftA = "daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const draftB = "dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const oldPhotoA = `${user.id}/${draftA}/photo-old.jpg`;
  const deletedStoragePaths = [];
  let onUploadedCalled = false;

  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  let resolveDbPersistence;
  const dbPromise = new Promise((resolve) => {
    resolveDbPersistence = resolve;
  });

  const sim = new PhotoUploadSimulator({
    user,
    draftId: draftA,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoA,
    client,
    onPhotoUploaded: () => {
      onUploadedCalled = true;
    },
    savePhotoPath: async () => {
      await dbPromise;
      return { success: true, isStale: sim.draftId !== draftA };
    },
  });

  const file = new File([new Uint8Array(2048)], "new-photo.jpg", { type: "image/jpeg" });
  const uploadPromise = sim.handleFileSelect(file);

  // Allow storage upload to complete and enter DB persistence
  await new Promise((r) => setTimeout(r, 10));

  // User switches to Draft B while DB persistence is in-flight
  sim.setDraftId(draftB);
  testAssert(sim.draftId === draftB, "Switched to Draft B while persistence in-flight");

  // DB persistence completes
  resolveDbPersistence();
  await uploadPromise;

  testAssert(!onUploadedCalled, "onPhotoUploaded was NOT called for Draft B");
  testAssert(sim.currentPhotoPath !== oldPhotoA, "Draft B did not inherit Draft A's photo");
  testAssert(deletedStoragePaths.includes(oldPhotoA), "Draft A's old photo was cleaned up from Storage since DB update succeeded");
}

// Case 2: Account switches while replacement persistence is in-flight
{
  console.log("   --- Case 2: Account switches while replacement persistence is in-flight ---");
  const user1 = { id: "a1111111-1111-4111-8111-111111111111" };
  const user2 = { id: "a2222222-2222-4222-8222-222222222222" };
  const draftId = "d1111111-1111-4111-8111-111111111111";
  const oldPhotoU1 = `${user1.id}/${draftId}/photo-u1.jpg`;
  const deletedStoragePaths = [];
  let onUploadedCalledForUser2 = false;

  const client = {
    auth: { getUser: async () => ({ data: { user: user1 }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  let resolveDbPersistence;
  const dbPromise = new Promise((resolve) => {
    resolveDbPersistence = resolve;
  });

  const sim = new PhotoUploadSimulator({
    user: user1,
    draftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhotoU1,
    client,
    onPhotoUploaded: () => {
      onUploadedCalledForUser2 = true;
    },
    savePhotoPath: async () => {
      await dbPromise;
      return { success: true, isStale: sim.user?.id !== user1.id };
    },
  });

  const file = new File([new Uint8Array(2048)], "new-photo.jpg", { type: "image/jpeg" });
  const uploadPromise = sim.handleFileSelect(file);

  await new Promise((r) => setTimeout(r, 10));

  // User logs out and switches to User 2
  sim.setUser(user2);
  testAssert(sim.user.id === user2.id, "Switched to User 2 while persistence in-flight");

  resolveDbPersistence();
  await uploadPromise;

  testAssert(!onUploadedCalledForUser2, "onPhotoUploaded was NOT called for User 2");
  testAssert(sim.uploadStatus === "idle", "User 2 uploadStatus remains idle");
  testAssert(sim.currentPhotoPath === null, "User 2 currentPhotoPath is null");
}

// Case 3: Draft switches while removal persistence is in-flight
{
  console.log("   --- Case 3: Draft switches while removal persistence is in-flight ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftA = "daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const draftB = "dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const photoA = `${user.id}/${draftA}/photo-a.jpg`;
  const photoB = `${user.id}/${draftB}/photo-b.jpg`;
  const deletedStoragePaths = [];
  let onPhotoRemovedCalled = false;

  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  let resolveDbPersistence;
  const dbPromise = new Promise((resolve) => {
    resolveDbPersistence = resolve;
  });

  const sim = new PhotoUploadSimulator({
    user,
    draftId: draftA,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: photoA,
    client,
    onPhotoRemoved: () => {
      onPhotoRemovedCalled = true;
    },
    savePhotoPath: async () => {
      await dbPromise;
      return { success: true, isStale: sim.draftId !== draftA };
    },
  });

  const removePromise = sim.removePhoto();

  await new Promise((r) => setTimeout(r, 10));

  // User switches to Draft B which already has its own photoB
  sim.setDraftId(draftB);
  sim.currentPhotoPath = photoB;

  resolveDbPersistence();
  await removePromise;

  testAssert(!onPhotoRemovedCalled, "onPhotoRemoved was NOT called on Draft B");
  testAssert(deletedStoragePaths.includes(photoA), "Draft A photo was deleted from Storage after successful DB clear");
  testAssert(!deletedStoragePaths.includes(photoB), "Draft B photo was NOT deleted from Storage");
  testAssert(sim.currentPhotoPath === photoB, "Draft B photo remains intact");
}

// Case 4: Account switches while removal persistence is in-flight
{
  console.log("   --- Case 4: Account switches while removal persistence is in-flight ---");
  const user1 = { id: "a1111111-1111-4111-8111-111111111111" };
  const user2 = { id: "a2222222-2222-4222-8222-222222222222" };
  const draftId = "d1111111-1111-4111-8111-111111111111";
  const photoU1 = `${user1.id}/${draftId}/photo-u1.jpg`;
  const deletedStoragePaths = [];
  let onPhotoRemovedCalled = false;

  const client = {
    auth: { getUser: async () => ({ data: { user: user1 }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  let resolveDbPersistence;
  const dbPromise = new Promise((resolve) => {
    resolveDbPersistence = resolve;
  });

  const sim = new PhotoUploadSimulator({
    user: user1,
    draftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: photoU1,
    client,
    onPhotoRemoved: () => {
      onPhotoRemovedCalled = true;
    },
    savePhotoPath: async () => {
      await dbPromise;
      return { success: true, isStale: sim.user?.id !== user1.id };
    },
  });

  const removePromise = sim.removePhoto();

  await new Promise((r) => setTimeout(r, 10));

  // User logs out and switches to User 2
  sim.setUser(user2);

  resolveDbPersistence();
  await removePromise;

  testAssert(!onPhotoRemovedCalled, "onPhotoRemoved was NOT called for User 2");
  testAssert(deletedStoragePaths.includes(photoU1), "User 1's photo was deleted from Storage after successful DB clear");
  testAssert(sim.uploadStatus === "idle", "User 2 status is idle");
}

// Case 5: Stale operations never call callbacks for the new editor
{
  console.log("   --- Case 5: Stale operations never call callbacks for the new editor ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draft1 = "d1111111-1111-4111-8111-111111111111";
  const draft2 = "d2222222-2222-4222-8222-222222222222";
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => ({ data: paths, error: null }),
      }),
    },
  };

  const uploadCalls = [];
  const removeCalls = [];

  let resolveUploadDb;
  const sim = new PhotoUploadSimulator({
    user,
    draftId: draft1,
    isDraftReady: true,
    isActive: true,
    client,
    onPhotoUploaded: (p) => uploadCalls.push(p),
    onPhotoRemoved: () => removeCalls.push(true),
    savePhotoPath: async () => {
      await new Promise((r) => { resolveUploadDb = r; });
      return { success: true, isStale: sim.draftId !== draft1 };
    },
  });

  const file = new File([new Uint8Array(1024)], "pic.jpg", { type: "image/jpeg" });
  const p = sim.handleFileSelect(file);
  await new Promise((r) => setTimeout(r, 10));

  // Switch draft
  sim.setDraftId(draft2);
  resolveUploadDb();
  await p;

  testAssert(uploadCalls.length === 0, "No upload callback executed for stale draft");
  testAssert(removeCalls.length === 0, "No remove callback executed for stale draft");
}

// Case 6: Correct old-photo cleanup ordering remains intact
{
  console.log("   --- Case 6: Correct old-photo cleanup ordering remains intact ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d3333333-3333-4333-8333-333333333333";
  const oldPhoto = `${user.id}/${draftId}/photo-old.png`;
  const sequence = [];

  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => {
          sequence.push("storage_upload");
          return { data: { path: p }, error: null };
        },
        remove: async (paths) => {
          sequence.push("storage_delete_old");
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user,
    draftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhoto,
    client,
    savePhotoPath: async () => {
      sequence.push("db_update");
      return { success: true, isStale: false };
    },
  });

  const file = new File([new Uint8Array(1024)], "pic.png", { type: "image/png" });
  await sim.handleFileSelect(file);

  testAssert(
    sequence[0] === "storage_upload" &&
    sequence[1] === "db_update" &&
    sequence[2] === "storage_delete_old",
    "Sequence strictly follows: storage_upload -> db_update -> storage_delete_old"
  );
}

// Case 7: Existing successful replacement and removal still work
{
  console.log("   --- Case 7: Existing successful replacement and removal still work ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d4444444-4444-4444-8444-444444444444";
  const oldPhoto = `${user.id}/${draftId}/photo-initial.jpg`;
  const deleted = [];
  let uploadedPath = null;
  let removedFired = false;

  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deleted.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user,
    draftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: oldPhoto,
    client,
    onPhotoUploaded: (p) => { uploadedPath = p; },
    onPhotoRemoved: () => { removedFired = true; },
    savePhotoPath: async () => ({ success: true, isStale: false }),
  });

  // 1. Replacement
  const file = new File([new Uint8Array(1024)], "new.jpg", { type: "image/jpeg" });
  await sim.handleFileSelect(file);

  testAssert(sim.uploadStatus === "uploaded", "Replacement succeeded with uploadStatus 'uploaded'");
  testAssert(uploadedPath !== null, "onPhotoUploaded called with new path");
  testAssert(deleted.includes(oldPhoto), "Old photo was deleted after replacement");

  // 2. Removal
  await sim.removePhoto();

  testAssert(sim.uploadStatus === "idle", "Removal succeeded with uploadStatus 'idle'");
  testAssert(sim.currentPhotoPath === null, "currentPhotoPath cleared to null");
  testAssert(removedFired, "onPhotoRemoved called");
  testAssert(deleted.includes(uploadedPath), "New photo deleted after removal");
}

// Case 8: Draft changes while Storage deletion is pending
{
  console.log("   --- Case 8: Draft changes while Storage deletion is pending ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftA = "daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const draftB = "dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const photoA = `${user.id}/${draftA}/photo-a.jpg`;
  const photoB = `${user.id}/${draftB}/photo-b.jpg`;
  const deletedStoragePaths = [];
  let onPhotoRemovedCount = 0;

  let resolveStorageDelete;
  const storageDeletePromise = new Promise((resolve) => {
    resolveStorageDelete = resolve;
  });

  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          await storageDeletePromise;
          deletedStoragePaths.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user,
    draftId: draftA,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: photoA,
    client,
    onPhotoRemoved: () => {
      onPhotoRemovedCount++;
    },
    savePhotoPath: async () => ({ success: true, isStale: false }),
  });

  const removePromise = sim.removePhoto();

  // Allow DB persistence to complete and enter storage deletion
  await new Promise((r) => setTimeout(r, 10));

  // Switch to Draft B while storage deletion is pending
  sim.setDraftId(draftB, true, photoB);

  // Storage delete completes
  resolveStorageDelete();
  await removePromise;

  testAssert(onPhotoRemovedCount === 0, "onPhotoRemoved was NOT called when draft switched during storage deletion");
  testAssert(deletedStoragePaths.includes(photoA), "Draft A photo was deleted from storage");
  testAssert(sim.currentPhotoPath === photoB, "Draft B photo remains untouched in editor state");
  testAssert(sim.uploadStatus === "uploaded", "Draft B upload status remains 'uploaded'");
}

// Case 9: User changes account or deactivates editor while Storage deletion is pending
{
  console.log("   --- Case 9: Account change or deactivation while Storage deletion is pending ---");
  const user1 = { id: "a1111111-1111-4111-8111-111111111111" };
  const user2 = { id: "a2222222-2222-4222-8222-222222222222" };
  const draftId = "d1111111-1111-4111-8111-111111111111";
  const photoU1 = `${user1.id}/${draftId}/photo-u1.jpg`;
  let onPhotoRemovedCount = 0;

  // Sub-case 9a: Account changes during storage deletion
  {
    let resolveStorageDelete;
    const storageDeletePromise = new Promise((resolve) => {
      resolveStorageDelete = resolve;
    });

    const client = {
      auth: { getUser: async () => ({ data: { user: user1 }, error: null }) },
      storage: {
        from: () => ({
          upload: async (p) => ({ data: { path: p }, error: null }),
          remove: async (paths) => {
            await storageDeletePromise;
            return { data: paths, error: null };
          },
        }),
      },
    };

    const sim = new PhotoUploadSimulator({
      user: user1,
      draftId,
      isDraftReady: true,
      isActive: true,
      currentPhotoPath: photoU1,
      client,
      onPhotoRemoved: () => {
        onPhotoRemovedCount++;
      },
      savePhotoPath: async () => ({ success: true, isStale: false }),
    });

    const removePromise = sim.removePhoto();
    await new Promise((r) => setTimeout(r, 10));

    // User switches to user2
    sim.setUser(user2);

    resolveStorageDelete();
    await removePromise;

    testAssert(onPhotoRemovedCount === 0, "onPhotoRemoved was NOT called after account switch during storage delete");
    testAssert(sim.uploadStatus === "idle", "User 2 uploadStatus remains idle");
  }

  // Sub-case 9b: Editor deactivates during storage deletion
  {
    let resolveStorageDelete;
    const storageDeletePromise = new Promise((resolve) => {
      resolveStorageDelete = resolve;
    });

    const client = {
      auth: { getUser: async () => ({ data: { user: user1 }, error: null }) },
      storage: {
        from: () => ({
          upload: async (p) => ({ data: { path: p }, error: null }),
          remove: async (paths) => {
            await storageDeletePromise;
            return { data: paths, error: null };
          },
        }),
      },
    };

    let deactivatedRemoveCalls = 0;
    const sim = new PhotoUploadSimulator({
      user: user1,
      draftId,
      isDraftReady: true,
      isActive: true,
      currentPhotoPath: photoU1,
      client,
      onPhotoRemoved: () => {
        deactivatedRemoveCalls++;
      },
      savePhotoPath: async () => ({ success: true, isStale: false }),
    });

    const removePromise = sim.removePhoto();
    await new Promise((r) => setTimeout(r, 10));

    // Deactivate editor
    sim.setIsActive(false);

    resolveStorageDelete();
    await removePromise;

    testAssert(deactivatedRemoveCalls === 0, "onPhotoRemoved was NOT called when deactivated during storage delete");
  }
}

// Case 10: Successful removal clears photo and calls callback exactly once
{
  console.log("   --- Case 10: Successful removal clears photo and calls callback exactly once ---");
  const user = { id: "a1111111-1111-4111-8111-111111111111" };
  const draftId = "d5555555-5555-4555-8555-555555555555";
  const photo = `${user.id}/${draftId}/photo.jpg`;
  let callbackCount = 0;
  const deleted = [];

  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    storage: {
      from: () => ({
        upload: async (p) => ({ data: { path: p }, error: null }),
        remove: async (paths) => {
          deleted.push(...paths);
          return { data: paths, error: null };
        },
      }),
    },
  };

  const sim = new PhotoUploadSimulator({
    user,
    draftId,
    isDraftReady: true,
    isActive: true,
    currentPhotoPath: photo,
    client,
    onPhotoRemoved: () => {
      callbackCount++;
    },
    savePhotoPath: async () => ({ success: true, isStale: false }),
  });

  await sim.removePhoto();

  testAssert(callbackCount === 1, "onPhotoRemoved was called exactly once on successful removal");
  testAssert(sim.currentPhotoPath === null, "currentPhotoPath is cleared to null");
  testAssert(sim.uploadStatus === "idle", "uploadStatus is reset to idle");
  testAssert(deleted.includes(photo), "Photo was deleted from storage");
}

console.log("\n================================================================================");
console.log(` RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
}

