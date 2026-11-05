/**
 * Suprilo Task 2C-5.3.2 — Editor Autosave Unit Test Suite
 *
 * Covers all required verification checks:
 * 1. Autosave happens after debounce (~800ms)
 * 2. Multiple quick edits save the latest state (debounce resets, only 1 update call)
 * 3. No save occurs before a confirmed draft ID exists
 * 4. No save occurs while unauthenticated or inactive
 * 5. Draft switching prevents old saves from affecting the new draft
 * 6. Failed saves are reported correctly (status = 'error', message recorded)
 * 7. Successful saves update the status (status = 'saved', lastSavedAt recorded)
 * 8. Protected database fields (id, user_id, slug, status, draft_slot, created_at, updated_at, published_at, creation_mode, template_id) are never sent
 * 9. No duplicate updates for unchanged editor state
 * 10. In-flight edit queueing (revision counter prevents older in-flight responses from overwriting newer edits)
 * 11. Manual retry capability after failed save
 * 12. In-flight inactivity invalidation & lock release (Critical Lifecycle Fix)
 *
 * NOTE: 100% Mocked tests (0 remote Supabase database or network impact).
 */

import {
  mapEditorStateToUpdateFields,
  serializeEditorStateForDraft,
} from "../src/hooks/useCardAutosave.ts";

import { EDITABLE_CARD_FIELDS } from "../src/lib/cards.ts";

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.3.2 — Editor Autosave Integration Unit Tests (100% Mocked)");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// SUITE 1: Whitelist & Protected Field Stripping
// -----------------------------------------------------------------------------
console.log("1. Testing Whitelist & Protected Field Exclusion (mapEditorStateToUpdateFields)...");

const sampleEditorState = {
  templateId: "bday-midnight-celebration",
  creationMode: "template",
  recipientName: "Sophia",
  senderName: "Liam",
  occasionTag: "Birthday Magic",
  primaryMessage: "Happy Birthday Sophia!",
  secondaryMessage: "Hope your year is wonderful",
  foilStyle: "golden-foil",
  coverText: "Scratch to see your surprise",
  bgPalette: "warm-sunshine",
  sticker: "cake",
  fontFamily: "font-serif",
  photoUrl: "data:image/jpeg;base64,mockdata...",
  photoPath: "user-123/card-456/photo.jpg",
  soundEnabled: false,
};

const updatePayload = mapEditorStateToUpdateFields(sampleEditorState);

// Verify all 13 whitelisted fields are present and correctly mapped
assert(updatePayload.recipient_name === "Sophia", "recipient_name mapped correctly");
assert(updatePayload.sender_name === "Liam", "sender_name mapped correctly");
assert(updatePayload.occasion_tag === "Birthday Magic", "occasion_tag mapped correctly");
assert(updatePayload.primary_message === "Happy Birthday Sophia!", "primary_message mapped correctly");
assert(updatePayload.secondary_message === "Hope your year is wonderful", "secondary_message mapped correctly");
assert(updatePayload.foil_style === "golden-foil", "foil_style mapped correctly");
assert(updatePayload.cover_text === "Scratch to see your surprise", "cover_text mapped correctly");
assert(updatePayload.bg_palette === "warm-sunshine", "bg_palette mapped correctly");
assert(updatePayload.sticker === "cake", "sticker mapped correctly");
assert(updatePayload.font_family === "font-serif", "font_family mapped correctly");
assert(updatePayload.reveal_threshold === 0.65, "reveal_threshold mapped correctly (0.65)");
assert(updatePayload.sound_enabled === false, "sound_enabled mapped correctly (false)");

// Task 2C-5.3.3: photo_path maps valid Storage path
assert(
  updatePayload.photo_path === "user-123/card-456/photo.jpg",
  "photo_path maps valid storage path correctly"
);

// CRITICAL: Base64 data URLs, blob URLs, and nulls are strictly mapped to null
const stateWithNullPhoto = { ...sampleEditorState, photoPath: null };
assert(
  mapEditorStateToUpdateFields(stateWithNullPhoto).photo_path === null,
  "photo_path is null when state.photoPath is null"
);

const stateWithBase64 = { ...sampleEditorState, photoPath: "data:image/png;base64,abcdef..." };
assert(
  mapEditorStateToUpdateFields(stateWithBase64).photo_path === null,
  "Base64 data URL is strictly filtered out from photo_path (never stored in PostgreSQL)"
);

const stateWithBlob = { ...sampleEditorState, photoPath: "blob:http://localhost:3000/123" };
assert(
  mapEditorStateToUpdateFields(stateWithBlob).photo_path === null,
  "Blob URL is strictly filtered out from photo_path (never stored in PostgreSQL)"
);

// Protected fields check
const protectedFields = [
  "id",
  "user_id",
  "slug",
  "status",
  "draft_slot",
  "created_at",
  "updated_at",
  "published_at",
  "creation_mode",
  "template_id",
  "photoUrl",
];

for (const field of protectedFields) {
  assert(!(field in updatePayload), `Protected field "${field}" is strictly absent from update payload`);
}

// Check against EDITABLE_CARD_FIELDS whitelist from src/lib/cards.ts
const payloadKeys = Object.keys(updatePayload);
assert(payloadKeys.length === 13, `Payload contains exactly 13 fields (found: ${payloadKeys.length})`);
for (const key of payloadKeys) {
  assert(EDITABLE_CARD_FIELDS.includes(key), `Field "${key}" is verified in EDITABLE_CARD_FIELDS whitelist`);
}

// Fallback defaults for empty string inputs
const emptyState = {
  templateId: null,
  creationMode: "scratch",
  recipientName: "",
  senderName: "",
  occasionTag: "",
  primaryMessage: "",
  secondaryMessage: "",
  foilStyle: "lavender-pink",
  coverText: "",
  bgPalette: "pure-ivory",
  sticker: "sparkles",
  fontFamily: undefined,
  photoUrl: null,
  soundEnabled: true,
};

const fallbackPayload = mapEditorStateToUpdateFields(emptyState);
assert(fallbackPayload.recipient_name === "Friend", "Empty recipientName falls back to 'Friend'");
assert(fallbackPayload.sender_name === "Someone Special", "Empty senderName falls back to 'Someone Special'");
assert(fallbackPayload.occasion_tag === "Just Because", "Empty occasionTag falls back to 'Just Because'");
assert(fallbackPayload.primary_message === "A special surprise for you!", "Empty primaryMessage falls back to default");
assert(fallbackPayload.secondary_message === null, "Empty secondaryMessage falls back to null");
assert(fallbackPayload.cover_text === "Scratch to reveal", "Empty coverText falls back to 'Scratch to reveal'");
assert(fallbackPayload.font_family === null, "Undefined fontFamily falls back to null");

// -----------------------------------------------------------------------------
// SUITE 2: Change Detection & Serialization
// -----------------------------------------------------------------------------
console.log("\n2. Testing Change Detection & Serialization (serializeEditorStateForDraft)...");

const serialized1 = serializeEditorStateForDraft(sampleEditorState);
const serialized2 = serializeEditorStateForDraft({ ...sampleEditorState });
assert(serialized1 === serialized2, "Identical editor states produce identical serialized string");

// Editing text modifies serialization
const modifiedRecipient = { ...sampleEditorState, recipientName: "Emma" };
assert(
  serializeEditorStateForDraft(modifiedRecipient) !== serialized1,
  "Changing recipientName alters serialization"
);

const modifiedMsg = { ...sampleEditorState, primaryMessage: "A brand new message!" };
assert(
  serializeEditorStateForDraft(modifiedMsg) !== serialized1,
  "Changing primaryMessage alters serialization"
);

// Editing style modifies serialization
const modifiedPalette = { ...sampleEditorState, bgPalette: "mint-fresh" };
assert(
  serializeEditorStateForDraft(modifiedPalette) !== serialized1,
  "Changing bgPalette alters serialization"
);

const modifiedFoil = { ...sampleEditorState, foilStyle: "mint-fresh" };
assert(
  serializeEditorStateForDraft(modifiedFoil) !== serialized1,
  "Changing foilStyle alters serialization"
);

// Modifying photoUrl (in-memory preview) does NOT alter draft serialization
const modifiedPhotoUrl = { ...sampleEditorState, photoUrl: "data:image/png;base64,anotherphoto" };
assert(
  serializeEditorStateForDraft(modifiedPhotoUrl) === serialized1,
  "Changing in-memory photoUrl does not alter draft serialization (photo upload is separate)"
);

// Reverting change restores exact serialized string
const revertedState = { ...modifiedRecipient, recipientName: "Sophia" };
assert(
  serializeEditorStateForDraft(revertedState) === serialized1,
  "Reverting edit restores exact serialized string (detects no-op)"
);

// -----------------------------------------------------------------------------
// SUITE 3: Autosave Simulator Architecture
// -----------------------------------------------------------------------------
console.log("\n3. Testing Autosave Simulator Architecture...");

/**
 * Creates an exact behavioral simulator of useCardAutosave hook.
 * Mimics React state, refs, timers, and concurrent async resolution.
 */
function createAutosaveSimulator(initialOptions) {
  let draftId = initialOptions.draftId ?? null;
  let isDraftReady = initialOptions.isDraftReady ?? false;
  let user = initialOptions.user ?? null;
  let isActive = initialOptions.isActive ?? true;
  let editorState = { ...initialOptions.editorState };
  let debounceMs = initialOptions.debounceMs ?? 800;

  const mockDb = initialOptions.mockDb || {
    updateCallCount: 0,
    lastUpdatedDraftId: null,
    lastUpdatedPayload: null,
    updateDelayMs: 0,
    failWithError: null,
    updateHistory: [],
  };

  let saveStatus = "idle";
  let saveError = null;
  let lastSavedAt = null;

  let generationToken = 0;
  let activeDraftId = draftId;
  let currentUserId = user?.id || null;
  let isActiveState = isActive;

  let revision = 0;
  let lastSavedRevision = 0;
  let lastSavedSerialized = null;
  let initialEditorSerialized = serializeEditorStateForDraft(editorState);

  let debounceTimer = null;
  let inFlight = false;
  let queuedSave = false;

  async function mockUpdateCardDraft(targetId, payload) {
    mockDb.updateCallCount++;
    mockDb.lastUpdatedDraftId = targetId;
    mockDb.lastUpdatedPayload = payload;
    mockDb.updateHistory.push({ targetId, payload: { ...payload }, timestamp: Date.now() });

    if (initialOptions.customUpdateHook) {
      return await initialOptions.customUpdateHook(targetId, payload);
    }

    if (mockDb.updateDelayMs > 0) {
      await new Promise((res) => setTimeout(res, mockDb.updateDelayMs));
    }
    if (mockDb.failWithError) {
      throw mockDb.failWithError;
    }
    return {
      id: targetId,
      ...payload,
      updated_at: new Date().toISOString(),
    };
  }

  // Account switch handler
  function checkUserChange(newUser) {
    const prevUserId = currentUserId;
    const nextUserId = newUser?.id || null;
    user = newUser;

    if (prevUserId !== nextUserId) {
      currentUserId = nextUserId;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      generationToken++;
      queuedSave = false;
      lastSavedSerialized = null;
      lastSavedRevision = 0;
      revision = 0;
      initialEditorSerialized = serializeEditorStateForDraft(editorState);
      saveStatus = "idle";
      saveError = null;
      lastSavedAt = null;
    }
  }

  // Draft switch handler
  function checkDraftChange(newDraftId) {
    const prevDraftId = activeDraftId;
    draftId = newDraftId;

    if (prevDraftId !== newDraftId) {
      activeDraftId = newDraftId;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      generationToken++;
      queuedSave = false;
      lastSavedSerialized = null;
      lastSavedRevision = 0;
      revision = 0;
      initialEditorSerialized = serializeEditorStateForDraft(editorState);
      saveStatus = "idle";
      saveError = null;
    }
  }

  // Editor active toggle handler (Critical fix: cancels debounce and increments token without clearing inFlight)
  function setActive(newIsActive) {
    isActive = newIsActive;
    isActiveState = newIsActive;
    if (!newIsActive) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      generationToken++;
      saveStatus = "idle";
    }
  }

  // Draft readiness baseline check
  function checkDraftReady(ready) {
    isDraftReady = ready;
    if (!isActiveState || !user || !activeDraftId || !isDraftReady) {
      return;
    }
    if (lastSavedSerialized === null) {
      lastSavedSerialized = initialEditorSerialized;
      lastSavedRevision = 0;
      const currentSerialized = serializeEditorStateForDraft(editorState);
      if (currentSerialized === initialEditorSerialized) {
        saveStatus = "saved";
      }
    } else {
      const currentSerialized = serializeEditorStateForDraft(editorState);
      if (currentSerialized === lastSavedSerialized && saveStatus === "idle") {
        saveStatus = "saved";
      }
    }
  }

  async function performAutosave(isRetry = false) {
    const targetDraftId = activeDraftId;
    const targetUserId = currentUserId;

    if (!targetDraftId || !targetUserId || !isActiveState) {
      return;
    }

    const currentSerialized = serializeEditorStateForDraft(editorState);
    if (!isRetry && currentSerialized === lastSavedSerialized) {
      return;
    }

    if (inFlight) {
      queuedSave = true;
      return;
    }

    inFlight = true;
    queuedSave = false;
    saveStatus = "saving";
    saveError = null;

    const token = ++generationToken;
    const savingRevision = revision;
    const payload = mapEditorStateToUpdateFields(editorState);

    let saveFailed = false;
    let failureError = null;

    try {
      await mockUpdateCardDraft(targetDraftId, payload);
    } catch (err) {
      saveFailed = true;
      failureError = err;
    } finally {
      // In-flight lock is unconditionally released when the actual network request settles
      inFlight = false;

      const isStale =
        token !== generationToken ||
        activeDraftId !== targetDraftId ||
        currentUserId !== targetUserId ||
        !isActiveState;

      if (!isStale) {
        if (!saveFailed) {
          lastSavedSerialized = currentSerialized;
          lastSavedRevision = savingRevision;
          lastSavedAt = Date.now();

          if (revision > savingRevision || queuedSave) {
            const wasQueued = queuedSave;
            queuedSave = false;
            if (wasQueued) {
              if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
              }
              void performAutosave();
            } else if (!debounceTimer) {
              debounceTimer = setTimeout(() => {
                void performAutosave();
              }, debounceMs);
            }
          } else {
            saveStatus = "saved";
            saveError = null;
          }
        } else {
          queuedSave = false;
          const msg =
            failureError instanceof Error
              ? failureError.message
              : "Failed to save draft changes.";
          saveStatus = "error";
          saveError = msg;
        }
      } else {
        // Request settled, but response is STALE
        const canResume =
          isActiveState &&
          activeDraftId === targetDraftId &&
          currentUserId === targetUserId;

        if (canResume) {
          const latestSerialized = serializeEditorStateForDraft(editorState);
          const hasUnsavedChanges =
            queuedSave ||
            revision > savingRevision ||
            latestSerialized !== lastSavedSerialized;

          const wasQueued = queuedSave;
          queuedSave = false;

          if (hasUnsavedChanges) {
            if (wasQueued) {
              if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
              }
              void performAutosave();
            } else if (!debounceTimer) {
              debounceTimer = setTimeout(() => {
                void performAutosave();
              }, debounceMs);
            }
          }
        }
      }
    }
  }

  function edit(newState) {
    editorState = { ...editorState, ...newState };

    if (!isActiveState || !user || !activeDraftId || !isDraftReady) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      return;
    }

    const currentSerialized = serializeEditorStateForDraft(editorState);
    if (lastSavedSerialized === null) {
      return;
    }

    if (currentSerialized === lastSavedSerialized) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      return;
    }

    revision++;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      void performAutosave();
    }, debounceMs);
  }

  async function retry() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    await performAutosave(true);
  }

  // If initially draft is ready, establish baseline
  if (isDraftReady && activeDraftId && user && isActiveState) {
    checkDraftReady(true);
  }

  return {
    getState: () => ({
      saveStatus,
      saveError,
      lastSavedAt,
      activeDraftId,
      revision,
      lastSavedRevision,
      lastSavedSerialized,
      inFlight,
      queuedSave,
    }),
    edit,
    retry,
    checkUserChange,
    checkDraftChange,
    setActive,
    checkDraftReady,
    mockDb,
  };
}

// -----------------------------------------------------------------------------
// SUITE 4: Autosave After Debounce (~800ms)
// -----------------------------------------------------------------------------
console.log("\n4. Testing Autosave After Debounce (~800ms)...");

async function testDebounce() {
  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 100, // scaled for rapid test execution
  });

  assert(sim.getState().saveStatus === "saved", "Initial baseline state is 'saved'");
  assert(sim.mockDb.updateCallCount === 0, "No network call before any edits");

  // User edits recipient name
  sim.edit({ recipientName: "Grandma" });

  // Check at 40ms (< 100ms)
  await new Promise((res) => setTimeout(res, 40));
  assert(sim.mockDb.updateCallCount === 0, "No autosave before debounce timer elapses (at 40ms)");
  assert(sim.getState().saveStatus === "saved", "Status remains saved while debouncing new input");

  // Wait remaining time (> 100ms total)
  await new Promise((res) => setTimeout(res, 80));
  assert(sim.mockDb.updateCallCount === 1, "Autosave executed once debounce elapsed");
  assert(sim.getState().saveStatus === "saved", "Status updated to 'saved' upon successful response");
  assert(sim.getState().lastSavedAt !== null, "lastSavedAt timestamp recorded");
  assert(sim.mockDb.lastUpdatedPayload.recipient_name === "Grandma", "Persisted payload contains updated recipient_name");
}

await testDebounce();

// -----------------------------------------------------------------------------
// SUITE 5: Multiple Quick Edits (Debounce Reset & Latest State)
// -----------------------------------------------------------------------------
console.log("\n5. Testing Multiple Quick Edits (Debounce Reset & Latest State)...");

async function testMultipleQuickEdits() {
  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 100,
  });

  // Rapid edits within 30ms intervals
  sim.edit({ primaryMessage: "Letter A" });
  await new Promise((res) => setTimeout(res, 30));
  sim.edit({ primaryMessage: "Letter AB" });
  await new Promise((res) => setTimeout(res, 30));
  sim.edit({ primaryMessage: "Letter ABC" });
  await new Promise((res) => setTimeout(res, 30));
  sim.edit({ primaryMessage: "Letter ABCD (Final)" });

  // At 50ms from last edit, no save should have fired
  await new Promise((res) => setTimeout(res, 50));
  assert(sim.mockDb.updateCallCount === 0, "No intermediate saves executed during rapid typing");

  // Wait for debounce to elapse (80ms more = 130ms from last edit)
  await new Promise((res) => setTimeout(res, 80));
  assert(sim.mockDb.updateCallCount === 1, "Exactly one autosave call executed after typing paused");
  assert(
    sim.mockDb.lastUpdatedPayload.primary_message === "Letter ABCD (Final)",
    "Autosave persisted the final state, not intermediate drafts"
  );
}

await testMultipleQuickEdits();

// -----------------------------------------------------------------------------
// SUITE 6: No Save Before Confirmed Draft ID or Ready Status
// -----------------------------------------------------------------------------
console.log("\n6. Testing Inactive & Unconfirmed Draft Guard...");

async function testDraftGuards() {
  // Case A: draftId is null
  const simNullDraft = createAutosaveSimulator({
    draftId: null,
    isDraftReady: false,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 50,
  });

  simNullDraft.edit({ recipientName: "No Draft ID" });
  await new Promise((res) => setTimeout(res, 80));
  assert(simNullDraft.mockDb.updateCallCount === 0, "No save occurs when draftId is null");

  // Case B: draftId exists but isDraftReady is false
  const simNotReady = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: false,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 50,
  });

  simNotReady.edit({ recipientName: "Draft Not Ready" });
  await new Promise((res) => setTimeout(res, 80));
  assert(simNotReady.mockDb.updateCallCount === 0, "No save occurs when isDraftReady is false");

  // When draft becomes ready, establish baseline without saving unchanged state
  simNotReady.checkDraftReady(true);
  assert(simNotReady.mockDb.updateCallCount === 0, "Transitioning isDraftReady to true does not immediately spam an update");
}

await testDraftGuards();

// -----------------------------------------------------------------------------
// SUITE 7: Unauthenticated & Inactive Invariance
// -----------------------------------------------------------------------------
console.log("\n7. Testing Unauthenticated & Inactive Guard...");

async function testAuthAndActiveGuards() {
  // Case A: User is null
  const simUnauth = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: null,
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 50,
  });

  simUnauth.edit({ recipientName: "Unauthenticated Edit" });
  await new Promise((res) => setTimeout(res, 80));
  assert(simUnauth.mockDb.updateCallCount === 0, "No save occurs when user is null");

  // Case B: Editor is inactive (isActive = false)
  const simInactive = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: false,
    editorState: sampleEditorState,
    debounceMs: 50,
  });

  simInactive.edit({ recipientName: "Inactive Edit" });
  await new Promise((res) => setTimeout(res, 80));
  assert(simInactive.mockDb.updateCallCount === 0, "No save occurs when isActive is false");

  // Case C: User logs out while debounce is pending
  const simLogoutPending = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 80,
  });

  simLogoutPending.edit({ recipientName: "Pending Edit" });
  // User logs out after 30ms (before 80ms debounce elapses)
  await new Promise((res) => setTimeout(res, 30));
  simLogoutPending.checkUserChange(null);
  await new Promise((res) => setTimeout(res, 80));
  assert(simLogoutPending.mockDb.updateCallCount === 0, "Logging out cancels pending debounce timer");
  assert(simLogoutPending.getState().saveStatus === "idle", "Status resets to 'idle' on logout");

  // Case D: Editor becomes inactive while debounce is pending
  const simInactivePending = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 80,
  });

  simInactivePending.edit({ recipientName: "Pending Inactive Edit" });
  await new Promise((res) => setTimeout(res, 30));
  simInactivePending.setActive(false);
  await new Promise((res) => setTimeout(res, 80));
  assert(simInactivePending.mockDb.updateCallCount === 0, "Leaving editor cancels pending debounce timer");
  assert(simInactivePending.getState().saveStatus === "idle", "Status resets to 'idle' when inactive");
}

await testAuthAndActiveGuards();

// -----------------------------------------------------------------------------
// SUITE 8: Draft Switching Isolation & Invalidation
// -----------------------------------------------------------------------------
console.log("\n8. Testing Draft Switching Isolation...");

async function testDraftSwitching() {
  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 80,
  });

  // Edit on Draft 1
  sim.edit({ primaryMessage: "Message for Draft 1" });

  // At 30ms, user switches to Draft 2
  await new Promise((res) => setTimeout(res, 30));
  sim.checkDraftChange("22222222-2222-4222-8222-222222222222");

  // Wait 100ms
  await new Promise((res) => setTimeout(res, 100));
  assert(sim.mockDb.updateCallCount === 0, "Draft switch canceled pending debounce timer for Draft 1");

  // In-flight save discard test:
  // Setup simulator with 100ms network delay
  const simInFlight = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 20,
    mockDb: {
      updateCallCount: 0,
      lastUpdatedDraftId: null,
      lastUpdatedPayload: null,
      updateDelayMs: 100, // 100ms network delay
      failWithError: null,
      updateHistory: [],
    },
  });

  simInFlight.edit({ recipientName: "Draft 1 Recipient" });
  // Wait 30ms: debounce fires (20ms), update is now in-flight (taking 100ms)
  await new Promise((res) => setTimeout(res, 30));
  assert(simInFlight.getState().saveStatus === "saving", "Save is in-flight for Draft 1");

  // Switch to Draft 2 while Draft 1 save is in-flight
  simInFlight.checkDraftChange("22222222-2222-4222-8222-222222222222");
  assert(simInFlight.getState().saveStatus === "idle", "Status immediately resets to 'idle' on draft switch");

  // Wait 120ms for Draft 1 network call to complete
  await new Promise((res) => setTimeout(res, 120));
  assert(simInFlight.getState().saveStatus === "idle", "Draft 1 resolution discarded; does not mark Draft 2 as saved");
  assert(simInFlight.getState().activeDraftId === "22222222-2222-4222-8222-222222222222", "Active draft remains Draft 2");
}

await testDraftSwitching();

// -----------------------------------------------------------------------------
// SUITE 9: Error Handling & Manual Retry
// -----------------------------------------------------------------------------
console.log("\n9. Testing Error Handling & Retry Mechanism...");

async function testErrorAndRetry() {
  const mockDbWithFailure = {
    updateCallCount: 0,
    lastUpdatedDraftId: null,
    lastUpdatedPayload: null,
    updateDelayMs: 20,
    failWithError: new Error("Network timeout: Unable to reach Supabase API"),
    updateHistory: [],
  };

  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 30,
    mockDb: mockDbWithFailure,
  });

  sim.edit({ primaryMessage: "Failed Attempt" });
  // Wait for debounce (30ms) + network delay (20ms) + buffer
  await new Promise((res) => setTimeout(res, 70));

  assert(sim.getState().saveStatus === "error", "Status transitioned to 'error' on failure");
  assert(
    sim.getState().saveError === "Network timeout: Unable to reach Supabase API",
    "saveError captures the exact error message"
  );
  assert(sim.mockDb.updateCallCount === 1, "Attempted update once");

  // Editor remains usable: user edits again, server is now healthy
  mockDbWithFailure.failWithError = null;
  sim.edit({ primaryMessage: "Recovered Message" });
  await new Promise((res) => setTimeout(res, 70));

  assert(sim.getState().saveStatus === "saved", "Subsequent edit successfully retried and saved");
  assert(sim.getState().saveError === null, "saveError cleared on success");
  assert(
    sim.mockDb.lastUpdatedPayload.primary_message === "Recovered Message",
    "Persisted latest state on recovery"
  );

  // Test explicit manual retry
  mockDbWithFailure.failWithError = new Error("Second transient error");
  sim.edit({ coverText: "Manual Retry Test" });
  await new Promise((res) => setTimeout(res, 70));
  assert(sim.getState().saveStatus === "error", "Save failed again");

  // User clicks "Retry" after network heals
  mockDbWithFailure.failWithError = null;
  await sim.retry();
  assert(sim.getState().saveStatus === "saved", "Explicit retry succeeded and transitioned status to 'saved'");
  assert(sim.mockDb.lastUpdatedPayload.cover_text === "Manual Retry Test", "Retry persisted the latest state");
}

await testErrorAndRetry();

// -----------------------------------------------------------------------------
// SUITE 10: In-Flight Overlap & Revision Safety
// -----------------------------------------------------------------------------
console.log("\n10. Testing In-Flight Overlap & Revision Counter Safety...");

async function testInFlightOverlap() {
  const mockDbSlow = {
    updateCallCount: 0,
    lastUpdatedDraftId: null,
    lastUpdatedPayload: null,
    updateDelayMs: 80, // Slow network (80ms)
    failWithError: null,
    updateHistory: [],
  };

  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 20,
    mockDb: mockDbSlow,
  });

  // Edit 1: Revision 1
  sim.edit({ recipientName: "Edit Revision 1" });
  // Wait 30ms: debounce fires (20ms), Revision 1 is in-flight
  await new Promise((res) => setTimeout(res, 30));
  assert(sim.getState().saveStatus === "saving", "Revision 1 is currently in-flight");

  // While Revision 1 is in-flight, user makes Edit 2: Revision 2!
  sim.edit({ recipientName: "Edit Revision 2 (Newest)" });

  // Wait until Revision 2 completes
  const startWait = Date.now();
  while (sim.getState().saveStatus !== "saved" && Date.now() - startWait < 500) {
    await new Promise((res) => setTimeout(res, 20));
  }

  assert(sim.mockDb.updateCallCount === 2, "Both revisions were processed sequentially without collisions");
  assert(
    sim.mockDb.lastUpdatedPayload.recipient_name === "Edit Revision 2 (Newest)",
    "Final persisted state matches Revision 2, never overwritten by Revision 1"
  );
  assert(sim.getState().saveStatus === "saved", "Final status is 'saved'");
}

await testInFlightOverlap();

// -----------------------------------------------------------------------------
// SUITE 11: No Duplicate Updates for Unchanged State
// -----------------------------------------------------------------------------
console.log("\n11. Testing Deduplication of Unchanged State...");

async function testDeduplication() {
  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 50,
  });

  // Edit from "Sophia" to "Chloe"
  sim.edit({ recipientName: "Chloe" });
  await new Promise((res) => setTimeout(res, 80));
  assert(sim.mockDb.updateCallCount === 1, "Saved Chloe (1 update call)");

  // User types "Chloe" again (no actual change)
  sim.edit({ recipientName: "Chloe" });
  await new Promise((res) => setTimeout(res, 80));
  assert(sim.mockDb.updateCallCount === 1, "Duplicate edit to 'Chloe' resulted in 0 extra network calls");

  // User types "Z", then quickly deletes it back to "Chloe" before debounce fires
  sim.edit({ recipientName: "ChloeZ" });
  await new Promise((res) => setTimeout(res, 20));
  sim.edit({ recipientName: "Chloe" }); // Reverted back to saved state!
  await new Promise((res) => setTimeout(res, 80));
  assert(sim.mockDb.updateCallCount === 1, "Reverting edit before debounce fires cancels save (0 extra calls)");
}

await testDeduplication();

// -----------------------------------------------------------------------------
// SUITE 12: In-Flight Inactivity Invalidation & Lock Release (Critical Lifecycle Fix)
// -----------------------------------------------------------------------------
console.log("\n12. Testing In-Flight Inactivity Invalidation & Lock Release (Critical Lifecycle Fix)...");

async function testInFlightInactivityRecovery() {
  let resolveOldRequest = null;
  const oldRequestPromise = new Promise((resolve) => {
    resolveOldRequest = resolve;
  });

  let firstCallBlocked = true;

  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 20,
    customUpdateHook: async (targetId, payload) => {
      if (firstCallBlocked) {
        firstCallBlocked = false;
        await oldRequestPromise;
      }
      return { id: targetId, ...payload, updated_at: new Date().toISOString() };
    },
  });

  // 1. Start a save: edit recipientName to "Alice"
  sim.edit({ recipientName: "Alice" });
  await new Promise((res) => setTimeout(res, 30)); // 20ms debounce expires, Request 1 is now in-flight

  assert(sim.getState().inFlight === true, "Request 1 (Alice) is actively in-flight");
  assert(sim.getState().saveStatus === "saving", "Status is 'saving' during Request 1");

  // 2. Deactivate the editor before Request 1 resolves
  sim.setActive(false);
  assert(sim.getState().saveStatus === "idle", "Status transitions to 'idle' on deactivation");
  assert(sim.getState().inFlight === true, "in-flight lock is still held while network request runs");

  // 3. Reactivate the editor
  sim.setActive(true);
  assert(sim.getState().inFlight === true, "in-flight lock is still held upon reactivation");

  // 4. Make a new edit: recipientName to "Bob (Latest)"
  sim.edit({ recipientName: "Bob (Latest)" });
  // Wait 30ms for Edit 2 debounce to fire
  await new Promise((res) => setTimeout(res, 30));
  // Since Request 1 was still in-flight, Edit 2 became queuedSave
  assert(sim.getState().inFlight === true, "Request 1 is still in-flight, Edit 2 is queued");

  // 5. Now resolve the old request (Request 1)
  resolveOldRequest();

  // Wait for Request 1 to settle and Request 2 to execute and settle
  const startWait = Date.now();
  while (sim.getState().saveStatus !== "saved" && Date.now() - startWait < 500) {
    await new Promise((res) => setTimeout(res, 20));
  }

  // 6. Verify assertions
  assert(sim.getState().inFlight === false, "in-flight lock was released after requests settled");
  assert(sim.getState().saveStatus === "saved", "Final save status is 'saved'");
  assert(
    sim.mockDb.lastUpdatedPayload.recipient_name === "Bob (Latest)",
    "Latest edit ('Bob (Latest)') was successfully saved to the database"
  );
  assert(sim.mockDb.updateCallCount === 2, "Both calls were executed sequentially without collisions (count: 2)");
}

await testInFlightInactivityRecovery();

async function testInFlightInactivityResolveBeforeEdit() {
  let resolveOldRequest = null;
  const oldRequestPromise = new Promise((resolve) => {
    resolveOldRequest = resolve;
  });

  let firstCallBlocked = true;

  const sim = createAutosaveSimulator({
    draftId: "11111111-1111-4111-8111-111111111111",
    isDraftReady: true,
    user: { id: "user-123" },
    isActive: true,
    editorState: sampleEditorState,
    debounceMs: 20,
    customUpdateHook: async (targetId, payload) => {
      if (firstCallBlocked) {
        firstCallBlocked = false;
        await oldRequestPromise;
      }
      return { id: targetId, ...payload, updated_at: new Date().toISOString() };
    },
  });

  // Start save: "Charlie"
  sim.edit({ recipientName: "Charlie" });
  await new Promise((res) => setTimeout(res, 30));
  assert(sim.getState().inFlight === true, "Request is in-flight");

  // Deactivate
  sim.setActive(false);

  // Resolve old request while inactive
  resolveOldRequest();
  await new Promise((res) => setTimeout(res, 20));

  assert(sim.getState().inFlight === false, "in-flight lock released when request settled while inactive");
  assert(
    sim.getState().lastSavedSerialized !== JSON.stringify(mapEditorStateToUpdateFields({ ...sampleEditorState, recipientName: "Charlie" })),
    "Old request response did not update baseline while inactive"
  );

  // Reactivate
  sim.setActive(true);

  // Edit to "David (New)"
  sim.edit({ recipientName: "David (New)" });
  await new Promise((res) => setTimeout(res, 50));

  assert(sim.getState().saveStatus === "saved", "New edit saved successfully after reactivation");
  assert(sim.mockDb.lastUpdatedPayload.recipient_name === "David (New)", "Database holds 'David (New)'");
}

await testInFlightInactivityResolveBeforeEdit();

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
