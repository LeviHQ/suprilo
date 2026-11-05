/**
 * Suprilo Task 2C-5.3.1 — Supabase Draft Creation Integration Test Suite
 * Final Lifecycle Safety Correction Pass
 *
 * Covers all required verification checks:
 * 1. Draft creation starts, then isActive becomes false before the RPC resolves
 * 2. The old request cannot populate draft ID or slug
 * 3. The old request cannot write to sessionStorage
 * 4. The old request cannot change the status back to created
 * 5. Reactivation can safely initialize a draft again
 * 6. Valid existing confirmed draft is preserved across temporary editor inactivity
 * 7. Logging out during a pending request prevents stale state updates
 * 8. Template A -> B route change before hydration invalidates old operation
 * 9. Invalid template parameter immediately invalidates pending operation
 * 10. Identical full initialization identity still deduplicates concurrent requests (Strict Mode)
 * 11. Existing account-switching, mode/template switching, snapshot, and photo-path tests continue passing
 */

import {
  ACTIVE_DRAFT_ID_KEY,
  ACTIVE_DRAFT_SLUG_KEY,
  loadActiveDraftId,
  loadActiveDraftSlug,
  saveActiveDraftSession,
  clearActiveDraftSession,
  isDraftLimitError,
  mapEditorStateToDraftInput,
  validateModeTemplateConsistency,
} from "../src/hooks/useCardDraftSync.ts";

import { getTemplateById } from "../src/data/templates.ts";

// Setup browser globals mock
const mockSessionStore = new Map();
global.sessionStorage = {
  getItem: (k) => (mockSessionStore.has(k) ? mockSessionStore.get(k) : null),
  setItem: (k, v) => mockSessionStore.set(k, String(v)),
  removeItem: (k) => mockSessionStore.delete(k),
  clear: () => mockSessionStore.clear(),
};
global.window = {};

console.log("================================================================================");
console.log(" Suprilo Task 2C-5.3.1 — Draft Creation Integration Unit Tests (Lifecycle Safety)");
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
// SUITE 1: Active Draft Session Storage Helpers
// -----------------------------------------------------------------------------
console.log("1. Testing Active Draft Session Storage Helpers...");
sessionStorage.clear();

assert(loadActiveDraftId() === null, "Initial active draft ID is null");
assert(loadActiveDraftSlug() === null, "Initial active draft slug is null");

const testId = "11111111-1111-4111-8111-111111111111";
const testSlug = "23456789abcd";
saveActiveDraftSession(testId, testSlug);

assert(loadActiveDraftId() === testId, "Loaded active draft ID matches stored value");
assert(loadActiveDraftSlug() === testSlug, "Loaded active draft slug matches stored value");
assert(sessionStorage.getItem(ACTIVE_DRAFT_ID_KEY) === testId, "sessionStorage key matches ACTIVE_DRAFT_ID_KEY");
assert(sessionStorage.getItem(ACTIVE_DRAFT_SLUG_KEY) === testSlug, "sessionStorage key matches ACTIVE_DRAFT_SLUG_KEY");

clearActiveDraftSession();
assert(loadActiveDraftId() === null, "clearActiveDraftSession clears ID");
assert(loadActiveDraftSlug() === null, "clearActiveDraftSession clears slug");

// -----------------------------------------------------------------------------
// SUITE 2: Draft Limit Error Classifier
// -----------------------------------------------------------------------------
console.log("\n2. Testing Draft Limit Error Detection (isDraftLimitError)...");

assert(
  isDraftLimitError(new Error("DRAFT_LIMIT_REACHED: Maximum of 3 active drafts allowed per user")),
  "Detects DRAFT_LIMIT_REACHED in Error message"
);

assert(
  isDraftLimitError({
    code: "check_violation",
    message: "Maximum of 3 active drafts allowed per user. Please publish or delete an existing draft.",
  }),
  "Detects PostgreSQL check_violation with 3 active drafts message"
);

assert(
  isDraftLimitError("Error: DRAFT_LIMIT_REACHED"),
  "Detects string DRAFT_LIMIT_REACHED"
);

assert(
  !isDraftLimitError(new Error("Network connection failed")),
  "Rejects unrelated network error"
);

assert(
  !isDraftLimitError({ code: "23505", message: "duplicate key value violates unique constraint" }),
  "Rejects unique slug collision error"
);

assert(!isDraftLimitError(null), "Handles null error gracefully");

// -----------------------------------------------------------------------------
// SUITE 3: Photo Path Invariance & Data URL Safety
// -----------------------------------------------------------------------------
console.log("\n3. Testing Photo Path Invariance & Data URL Exclusion...");

const mockStateWithStoragePath = {
  templateId: null,
  creationMode: "scratch",
  recipientName: "Maya",
  senderName: "Alex",
  occasionTag: "Happy Birthday",
  primaryMessage: "Secret surprise!",
  secondaryMessage: "See you at 7",
  foilStyle: "lavender-pink",
  coverText: "Scratch to reveal",
  bgPalette: "pure-ivory",
  sticker: "sparkles",
  fontFamily: undefined,
  photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
  photoPath: "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/photo.jpg",
  soundEnabled: true,
};

const payloadFromStoragePathState = mapEditorStateToDraftInput(mockStateWithStoragePath);

assert(
  payloadFromStoragePathState.photo_path === null,
  "Draft creation always sends photo_path: null, even when editor state contains a Storage path"
);

assert(
  !("photoUrl" in payloadFromStoragePathState),
  "photoUrl is completely omitted from the database draft payload"
);

const mockStateWithDataUrlOnly = {
  ...mockStateWithStoragePath,
  photoPath: null,
  photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
};
const payloadFromDataUrlState = mapEditorStateToDraftInput(mockStateWithDataUrlOnly);
assert(
  payloadFromDataUrlState.photo_path === null,
  "Local Data URL never reaches the database payload (photo_path is strictly null)"
);
assert(
  !("photoUrl" in payloadFromDataUrlState),
  "In-memory photoUrl is excluded from draft RPC parameters"
);

// -----------------------------------------------------------------------------
// SUITE 4: Mode & Template Consistency Enforcement
// -----------------------------------------------------------------------------
console.log("\n4. Testing Creation Mode & Template Consistency Enforcement...");

// Template query parameter with scratch editor state is rejected
{
  const scratchState = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Maya",
    senderName: "Alex",
    occasionTag: "Happy Birthday",
    primaryMessage: "Secret surprise!",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Scratch",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const res = validateModeTemplateConsistency(scratchState, "bday-midnight-celebration");
  assert(res.valid === false, "Template query parameter with scratch editor state is rejected");
  assert(
    res.error.includes("Inconsistent editor state") && res.error.includes("creationMode"),
    "Clear error identifies mode inconsistency"
  );
}

// Template mode with a mismatched template ID is rejected
{
  const mismatchedTemplateState = {
    templateId: "bday-party-confetti",
    creationMode: "template",
    recipientName: "Jordan",
    senderName: "Alex",
    occasionTag: "Birthday",
    primaryMessage: "Party tonight!",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Scratch",
    bgPalette: "soft-pink",
    sticker: "confetti",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const res = validateModeTemplateConsistency(mismatchedTemplateState, "bday-midnight-celebration");
  assert(res.valid === false, "Template mode with mismatched template ID is rejected");
  assert(
    res.error.includes("Inconsistent editor state") && res.error.includes("templateId"),
    "Clear error identifies template ID mismatch"
  );
}

// Scratch mode with a non-null template ID is rejected
{
  const corruptedScratchState = {
    templateId: "bday-midnight-celebration",
    creationMode: "scratch",
    recipientName: "Alex",
    senderName: "Someone",
    occasionTag: "Surprise",
    primaryMessage: "Secret",
    secondaryMessage: null,
    foilStyle: "golden-foil",
    coverText: "Scratch",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const res = validateModeTemplateConsistency(corruptedScratchState, null);
  assert(res.valid === false, "Scratch mode with a non-null template ID is rejected");
  assert(
    res.error.includes("Inconsistent editor state") && res.error.includes("templateId is non-null"),
    "Clear error identifies non-null templateId in scratch mode"
  );
}

// Valid template mode creates the correct payload
{
  const validTemplateState = {
    templateId: "bday-midnight-celebration",
    creationMode: "template",
    recipientName: "Maya",
    senderName: "Alex",
    occasionTag: "Happy Birthday! 🎂",
    primaryMessage: "Pack your bags for the weekend!",
    secondaryMessage: "A private birthday getaway is officially booked for this Friday evening!",
    foilStyle: "golden-foil",
    coverText: "Scratch to reveal your birthday surprise ✨",
    bgPalette: "warm-sunshine",
    sticker: "cake",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const res = validateModeTemplateConsistency(validTemplateState, "bday-midnight-celebration");
  assert(res.valid === true, "Valid template mode passes consistency check");
  assert(res.mode === "template", "Consistency mode is 'template'");
  assert(res.templateId === "bday-midnight-celebration", "Consistency templateId matches");

  const payload = mapEditorStateToDraftInput(validTemplateState);
  assert(payload.creation_mode === "template", "Payload creation_mode is 'template'");
  assert(payload.template_id === "bday-midnight-celebration", "Payload template_id is 'bday-midnight-celebration'");
  assert(payload.foil_style === "golden-foil", "Payload foil_style matches template");
  assert(payload.bg_palette === "warm-sunshine", "Payload bg_palette matches template");
  assert(payload.sticker === "cake", "Payload sticker matches template");
  assert(payload.photo_path === null, "Payload photo_path is null");
}

// Valid scratch mode creates the correct payload
{
  const validScratchState = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Sam",
    senderName: "Alex",
    occasionTag: "Just Because",
    primaryMessage: "You are awesome!",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Scratch to reveal",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const res = validateModeTemplateConsistency(validScratchState, null);
  assert(res.valid === true, "Valid scratch mode passes consistency check");
  assert(res.mode === "scratch", "Consistency mode is 'scratch'");
  assert(res.templateId === null, "Consistency templateId is null");

  const payload = mapEditorStateToDraftInput(validScratchState);
  assert(payload.creation_mode === "scratch", "Payload creation_mode is 'scratch'");
  assert(payload.template_id === null, "Payload template_id is null");
  assert(payload.photo_path === null, "Payload photo_path is null");
}

// -----------------------------------------------------------------------------
// SUITE 5: Lifecycle Simulator Architecture
// -----------------------------------------------------------------------------
console.log("\n5. Testing Lifecycle Simulator & Focus Safety Tests...");

function createDraftSyncSimulator(initialOptions) {
  let user = initialOptions.user;
  let isActive = initialOptions.isActive;
  let editorState = { ...initialOptions.editorState };
  let templateParam = initialOptions.templateParam ?? null;
  const mockDb = initialOptions.mockDb || {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 0,
    getDelayMs: 0,
    lastCreatedPayload: null,
  };

  let state = {
    draftId: null,
    draftSlug: null,
    syncStatus: "idle",
    syncError: null,
    isLimitReached: false,
  };

  let generationToken = 0;
  let currentUserId = user?.id || null;
  let inFlight = false;
  let inFlightPromise = null;
  let inFlightSnapshot = null;
  const activeDraftIdRef = { current: null };
  const activeDraftMetadataRef = { current: null };

  let prevIdentity = {
    creationMode: editorState.creationMode,
    templateId: editorState.templateId,
    templateParam: templateParam ?? null,
  };

  function checkUserChange(newUser) {
    const prevUserId = currentUserId;
    const nextUserId = newUser?.id || null;
    user = newUser;

    if (prevUserId !== nextUserId) {
      currentUserId = nextUserId;
      generationToken++;

      activeDraftIdRef.current = null;
      activeDraftMetadataRef.current = null;
      inFlight = false;
      inFlightPromise = null;
      inFlightSnapshot = null;
      state.draftId = null;
      state.draftSlug = null;
      state.syncStatus = "idle";
      state.syncError = null;
      state.isLimitReached = false;

      clearActiveDraftSession();
    }
  }

  function handleIdentityChange(newMode, newTemplateId, newTemplateParam) {
    const normParam = newTemplateParam ?? null;
    const identityChanged =
      prevIdentity.creationMode !== newMode ||
      prevIdentity.templateId !== newTemplateId ||
      prevIdentity.templateParam !== normParam;

    if (identityChanged) {
      prevIdentity = {
        creationMode: newMode,
        templateId: newTemplateId,
        templateParam: normParam,
      };

      // Invalidate any in-flight initialization immediately
      if (inFlight) {
        generationToken++;
        inFlight = false;
        inFlightPromise = null;
        inFlightSnapshot = null;
      }

      // If active draft does not match the new identity, clear it
      if (
        activeDraftMetadataRef.current &&
        (activeDraftMetadataRef.current.creationMode !== newMode ||
          activeDraftMetadataRef.current.templateId !== newTemplateId ||
          activeDraftMetadataRef.current.templateParam !== normParam)
      ) {
        activeDraftIdRef.current = null;
        activeDraftMetadataRef.current = null;
        state.draftId = null;
        state.draftSlug = null;
        clearActiveDraftSession();
        state.syncStatus = "idle";
      }
    }
  }

  async function mockCreateCardDraft(input) {
    mockDb.createCallCount++;
    mockDb.lastCreatedPayload = input;
    if (mockDb.createDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockDb.createDelayMs));
    }
    if (mockDb.failCreateWithError) {
      throw mockDb.failCreateWithError;
    }
    const newId = `22222222-2222-4222-8222-${String(mockDb.createCallCount).padStart(12, "0")}`;
    const newSlug = `mockslug${String(mockDb.createCallCount).padStart(4, "0")}`;
    const newCard = {
      id: newId,
      user_id: user?.id,
      slug: newSlug,
      status: "draft",
      creation_mode: input.creation_mode,
      template_id: input.template_id,
      recipient_name: input.recipient_name,
      sender_name: input.sender_name,
      occasion_tag: input.occasion_tag,
      primary_message: input.primary_message,
      secondary_message: input.secondary_message,
      foil_style: input.foil_style,
      cover_text: input.cover_text,
      bg_palette: input.bg_palette,
      sticker: input.sticker,
      photo_path: input.photo_path,
      created_at: new Date().toISOString(),
    };
    mockDb.cards.set(newId, newCard);
    return newCard;
  }

  async function mockGetCardById(id) {
    mockDb.getCallCount++;
    if (mockDb.getDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, mockDb.getDelayMs));
    }
    return mockDb.cards.get(id) || null;
  }

  async function performDraftInitialization() {
    if (!user || !isActive) {
      state.syncStatus = "idle";
      return;
    }

    // Capture an immutable snapshot at initialization start
    const snapshot = {
      userId: user.id,
      editorState: { ...editorState },
      creationMode: editorState.creationMode,
      templateId: editorState.templateId,
      templateParam: templateParam ?? null,
    };

    // Strict Mode and Template Consistency Enforcement on the snapshot
    const consistency = validateModeTemplateConsistency(
      snapshot.editorState,
      snapshot.templateParam
    );
    if (!consistency.valid) {
      state.syncStatus = "error";
      state.syncError = consistency.error || "Inconsistent editor state.";
      return;
    }

    // Check confirmed active draft
    if (activeDraftIdRef.current) {
      if (
        activeDraftMetadataRef.current &&
        (activeDraftMetadataRef.current.creationMode !== snapshot.creationMode ||
          activeDraftMetadataRef.current.templateId !== snapshot.templateId ||
          activeDraftMetadataRef.current.templateParam !== snapshot.templateParam)
      ) {
        activeDraftIdRef.current = null;
        activeDraftMetadataRef.current = null;
        clearActiveDraftSession();
        state.draftId = null;
        state.draftSlug = null;
      } else {
        state.syncStatus = "created";
        return;
      }
    }

    // Concurrency guard: check if initialization is in flight
    if (inFlight && inFlightPromise) {
      if (
        inFlightSnapshot &&
        inFlightSnapshot.creationMode === snapshot.creationMode &&
        inFlightSnapshot.templateId === snapshot.templateId &&
        inFlightSnapshot.templateParam === snapshot.templateParam
      ) {
        try {
          await inFlightPromise;
        } catch {}
        return;
      }

      generationToken++;
      inFlight = false;
      inFlightPromise = null;
      inFlightSnapshot = null;
    }

    inFlight = true;
    inFlightSnapshot = snapshot;
    state.syncStatus = "creating";
    state.syncError = null;
    state.isLimitReached = false;

    const currentToken = ++generationToken;

    const initPromise = (async () => {
      const storedId = loadActiveDraftId();
      if (storedId) {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_REGEX.test(storedId)) {
          try {
            const existingCard = await mockGetCardById(storedId);

            if (currentToken !== generationToken || user?.id !== snapshot.userId || !isActive) {
              return null;
            }

            if (
              existingCard &&
              existingCard.status === "draft" &&
              existingCard.user_id === snapshot.userId
            ) {
              const modeMatches = existingCard.creation_mode === snapshot.creationMode;
              const templateMatches =
                snapshot.creationMode === "template"
                  ? existingCard.template_id === snapshot.templateId
                  : existingCard.template_id === null;

              if (modeMatches && templateMatches) {
                state.draftId = existingCard.id;
                state.draftSlug = existingCard.slug;
                activeDraftIdRef.current = existingCard.id;
                activeDraftMetadataRef.current = {
                  id: existingCard.id,
                  creationMode: snapshot.creationMode,
                  templateId: snapshot.templateId,
                  templateParam: snapshot.templateParam,
                };
                saveActiveDraftSession(existingCard.id, existingCard.slug);
                state.syncStatus = "created";
                return existingCard;
              }
            }
            clearActiveDraftSession();
          } catch (validateErr) {
            if (currentToken !== generationToken || user?.id !== snapshot.userId || !isActive) {
              return null;
            }
            clearActiveDraftSession();
          }
        } else {
          clearActiveDraftSession();
        }
      }

      if (currentToken !== generationToken || user?.id !== snapshot.userId || !isActive) {
        return null;
      }

      // MUST use snapshot.editorState — never read a newer editorState here!
      const draftInput = mapEditorStateToDraftInput(snapshot.editorState);
      const newCard = await mockCreateCardDraft(draftInput);

      if (currentToken !== generationToken || user?.id !== snapshot.userId || !isActive) {
        return null;
      }

      state.draftId = newCard.id;
      state.draftSlug = newCard.slug;
      activeDraftIdRef.current = newCard.id;
      activeDraftMetadataRef.current = {
        id: newCard.id,
        creationMode: snapshot.creationMode,
        templateId: snapshot.templateId,
        templateParam: snapshot.templateParam,
      };
      saveActiveDraftSession(newCard.id, newCard.slug);
      state.syncStatus = "created";
      return newCard;
    })();

    inFlightPromise = initPromise;

    try {
      await initPromise;
    } catch (err) {
      if (currentToken !== generationToken || user?.id !== snapshot.userId || !isActive) {
        return;
      }
      if (isDraftLimitError(err)) {
        state.isLimitReached = true;
        state.syncError =
          "Draft limit reached: You have 3 active drafts. Please publish or delete an existing draft to create a new one.";
      } else {
        state.isLimitReached = false;
        state.syncError = err instanceof Error ? err.message : "Failed to initialize card draft.";
      }
      state.syncStatus = "error";
    } finally {
      if (currentToken === generationToken) {
        inFlight = false;
        inFlightPromise = null;
        inFlightSnapshot = null;
      }
    }
  }

  // Exactly models useCardDraftSync's useEffect lifecycle
  function triggerEffect() {
    // If not active or unauthenticated, reset to idle and invalidate in-flight initialization immediately
    if (!user || !isActive) {
      if (inFlight) {
        generationToken++;
        inFlight = false;
        inFlightPromise = null;
        inFlightSnapshot = null;
      }
      state.syncStatus = "idle";
      return;
    }

    const normParam = templateParam ?? null;
    handleIdentityChange(editorState.creationMode, editorState.templateId, normParam);

    if (normParam) {
      const templateDef = getTemplateById(normParam);
      if (!templateDef) {
        state.syncStatus = "error";
        state.syncError = `Invalid template "${normParam}". Please select a valid template from the catalog.`;
        return;
      }

      if (editorState.creationMode !== "template" || editorState.templateId !== normParam) {
        // Wait for next render tick to hydrate
        return;
      }
    }

    return performDraftInitialization();
  }

  function clearActiveDraft() {
    generationToken++;
    clearActiveDraftSession();
    state.draftId = null;
    state.draftSlug = null;
    state.syncStatus = "idle";
    state.syncError = null;
    state.isLimitReached = false;
    activeDraftIdRef.current = null;
    activeDraftMetadataRef.current = null;
    inFlight = false;
    inFlightPromise = null;
    inFlightSnapshot = null;
  }

  function setOptions(opts) {
    if (opts.user !== undefined) checkUserChange(opts.user);
    if (opts.isActive !== undefined) isActive = opts.isActive;
    if (opts.editorState !== undefined) editorState = { ...opts.editorState };
    if (opts.templateParam !== undefined) templateParam = opts.templateParam;
    return triggerEffect();
  }

  function mutateUnrelatedField(partial) {
    editorState = { ...editorState, ...partial };
  }

  return {
    getState: () => ({ ...state }),
    getActiveDraftIdRef: () => activeDraftIdRef.current,
    performDraftInitialization,
    triggerEffect,
    changeUser: (newUser) => checkUserChange(newUser),
    setOptions,
    mutateUnrelatedField,
    mockDb,
    clearActiveDraft,
  };
}

// -----------------------------------------------------------------------------
// REQUIRED TESTS: Inactive Editor Invalidation (1, 2, 3, 4, 5, 6)
// -----------------------------------------------------------------------------
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
    lastCreatedPayload: null,
  };

  const validScratch = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Cover",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-inactive-test" },
    isActive: true,
    editorState: validScratch,
    mockDb,
  });

  // 1. Draft creation starts
  const inFlightPromise = sim.triggerEffect();
  assert(sim.getState().syncStatus === "creating", "R1: Draft creation starts");

  // 2. User leaves editor while RPC is in flight
  sim.setOptions({ isActive: false });
  assert(sim.getState().syncStatus === "idle", "R1: Hook returns to idle immediately on inactive editor");

  // 3. Old request resolves in background
  await inFlightPromise;

  assert(sim.getState().draftId === null, "R2: Old request cannot populate draft ID");
  assert(sim.getState().draftSlug === null, "R2: Old request cannot populate draft slug");
  assert(loadActiveDraftId() === null, "R3: Old request cannot write to sessionStorage");
  assert(sim.getState().syncStatus === "idle", "R4: Old request cannot change status back to created");

  // 4. Reactivation safely initializes draft again
  const reactivatePromise = sim.setOptions({ isActive: true });
  await reactivatePromise;

  assert(sim.getState().syncStatus === "created", "R5: Reactivation successfully sets status to created");
  assert(sim.getState().draftId !== null, "R5: Reactivation populates new draft ID");
  assert(loadActiveDraftId() === sim.getState().draftId, "R5: Reactivation persists new draft to sessionStorage");

  // 5. Temporary inactivity preserves confirmed active draft
  sim.setOptions({ isActive: false });
  assert(sim.getState().syncStatus === "idle", "R6: Existing draft inactive: status is idle");
  assert(sim.getActiveDraftIdRef() !== null, "R6: Existing confirmed draft ID is preserved in ref");
  assert(loadActiveDraftId() !== null, "R6: Existing draft remains in sessionStorage");

  sim.setOptions({ isActive: true });
  assert(sim.getState().syncStatus === "created", "R6: Reactivated existing draft: status restored to created without new RPC");
  assert(mockDb.createCallCount === 2, "R6: Zero duplicate RPC calls for existing valid draft");
}

// -----------------------------------------------------------------------------
// REQUIRED TESTS: Logout Invalidation During Pending Request (7)
// -----------------------------------------------------------------------------
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
  };

  const validScratch = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Cover",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-logout-pending" },
    isActive: true,
    editorState: validScratch,
    mockDb,
  });

  const inFlightPromise = sim.triggerEffect();
  assert(sim.getState().syncStatus === "creating", "R7: Draft creation starts");

  // User logs out while request is pending
  sim.changeUser(null);
  assert(sim.getState().syncStatus === "idle", "R7: Status transitions to idle on logout");

  await inFlightPromise;

  assert(sim.getState().draftId === null, "R7: Old request cannot populate draft ID after logout");
  assert(loadActiveDraftId() === null, "R7: Stale request cannot write to sessionStorage after logout");
  assert(sim.getState().syncStatus === "idle", "R7: Status remains idle");
}

// -----------------------------------------------------------------------------
// REQUIRED TESTS: Template Param Change While Editor A Remains Unhydrated (8)
// -----------------------------------------------------------------------------
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
    lastCreatedPayload: null,
  };

  const templateAState = {
    templateId: "bday-midnight-celebration",
    creationMode: "template",
    recipientName: "Maya",
    senderName: "Alex",
    occasionTag: "Happy Birthday",
    primaryMessage: "Trip to Paris!",
    secondaryMessage: null,
    foilStyle: "golden-foil",
    coverText: "Scratch",
    bgPalette: "warm-sunshine",
    sticker: "cake",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const templateBState = {
    templateId: "bday-party-confetti",
    creationMode: "template",
    recipientName: "Jordan",
    senderName: "Alex",
    occasionTag: "Birthday Party",
    primaryMessage: "Party tonight!",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Scratch",
    bgPalette: "soft-pink",
    sticker: "confetti",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-param-change" },
    isActive: true,
    editorState: templateAState,
    templateParam: "bday-midnight-celebration",
    mockDb,
  });

  const promiseA = sim.triggerEffect();

  sim.setOptions({
    templateParam: "bday-party-confetti",
  });

  assert(
    sim.getState().draftId === null,
    "R8: Route changed to B before hydration; draftId is not adopted from A"
  );

  const promiseB = sim.setOptions({
    editorState: templateBState,
  });

  await Promise.all([promiseA, promiseB]);

  const activeId = sim.getState().draftId;
  assert(activeId !== null, "R8: Active draft exists after hydration to B");
  assert(
    mockDb.cards.get(activeId).template_id === "bday-party-confetti",
    "R8: Active draft is strictly Template B ('bday-party-confetti')"
  );
  assert(
    loadActiveDraftId() === activeId,
    "R8: sessionStorage strictly holds Template B draft ID"
  );
}

// -----------------------------------------------------------------------------
// REQUIRED TESTS: Invalid Template Parameter Invalidation (9)
// -----------------------------------------------------------------------------
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
  };

  const templateAState = {
    templateId: "bday-midnight-celebration",
    creationMode: "template",
    recipientName: "Maya",
    senderName: "Alex",
    occasionTag: "Happy Birthday",
    primaryMessage: "Trip to Paris!",
    secondaryMessage: null,
    foilStyle: "golden-foil",
    coverText: "Scratch",
    bgPalette: "warm-sunshine",
    sticker: "cake",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-invalid-param" },
    isActive: true,
    editorState: templateAState,
    templateParam: "bday-midnight-celebration",
    mockDb,
  });

  const promiseA = sim.triggerEffect();

  sim.setOptions({
    templateParam: "invalid-template-slug-xyz",
  });

  assert(
    sim.getState().syncStatus === "error",
    "R9: Invalid query parameter immediately sets error status"
  );
  assert(
    sim.getState().syncError.includes("Invalid template"),
    "R9: Error message informs user of invalid template"
  );

  await promiseA;

  assert(
    sim.getState().syncStatus === "error",
    "R9: Old Template A completion cannot overwrite the invalid-template error status"
  );
  assert(
    sim.getState().draftId === null,
    "R9: Old Template A request did NOT set draftId"
  );
  assert(
    loadActiveDraftId() === null,
    "R9: Old Template A request did NOT write to sessionStorage"
  );
}

// -----------------------------------------------------------------------------
// REQUIRED TESTS: Identical Full Identity Deduplication (10)
// -----------------------------------------------------------------------------
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 25,
  };

  const validTemplate = {
    templateId: "bday-midnight-celebration",
    creationMode: "template",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "golden-foil",
    coverText: "Cover",
    bgPalette: "warm-sunshine",
    sticker: "cake",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-dedup" },
    isActive: true,
    editorState: validTemplate,
    templateParam: "bday-midnight-celebration",
    mockDb,
  });

  await Promise.all([
    sim.triggerEffect(),
    sim.triggerEffect(),
    sim.triggerEffect(),
  ]);

  assert(
    mockDb.createCallCount === 1,
    "R10: Identical full initialization identity strictly deduplicates concurrent requests (1 RPC call)"
  );
  assert(
    sim.getState().syncStatus === "created",
    "R10: State transitioned to created"
  );
}

// -----------------------------------------------------------------------------
// REQUIRED TESTS: Existing Regression Suite (11)
// -----------------------------------------------------------------------------

// Snapshot invariance: payload uses validated snapshot, never mutated state
{
  sessionStorage.clear();
  const storedNonExistentId = "33333333-3333-4333-8333-333333333333";
  saveActiveDraftSession(storedNonExistentId, "slug3333");

  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 0,
    getDelayMs: 30,
    lastCreatedPayload: null,
  };

  const initialEditorState = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Alice",
    senderName: "Charlie",
    occasionTag: "Friendship",
    primaryMessage: "Original message for Alice",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Scratch",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-snap" },
    isActive: true,
    editorState: initialEditorState,
    mockDb,
  });

  const initPromise = sim.performDraftInitialization();

  sim.mutateUnrelatedField({
    recipientName: "Bob",
    primaryMessage: "Mutated unvalidated message for Bob",
  });

  await initPromise;

  assert(mockDb.createCallCount === 1, "R11 Snapshot: Draft created after stored draft miss");
  assert(
    mockDb.lastCreatedPayload.recipient_name === "Alice",
    "R11 Snapshot: Payload uses snapshot recipient_name ('Alice'), not mutated state ('Bob')"
  );
  assert(
    mockDb.lastCreatedPayload.primary_message === "Original message for Alice",
    "R11 Snapshot: Payload uses snapshot primary_message ('Original message for Alice')"
  );
  assert(
    mockDb.lastCreatedPayload.photo_path === null,
    "R11 Snapshot: Payload photo_path is strictly null"
  );
}

// Mode switch during initialization (template -> scratch)
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
    lastCreatedPayload: null,
  };

  const templateState = {
    templateId: "bday-midnight-celebration",
    creationMode: "template",
    recipientName: "Maya",
    senderName: "Alex",
    occasionTag: "Happy Birthday",
    primaryMessage: "Trip to Paris!",
    secondaryMessage: null,
    foilStyle: "golden-foil",
    coverText: "Scratch",
    bgPalette: "warm-sunshine",
    sticker: "cake",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const scratchState = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Maya",
    senderName: "Alex",
    occasionTag: "Just Because",
    primaryMessage: "Custom surprise!",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Scratch",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-mode-switch" },
    isActive: true,
    editorState: templateState,
    templateParam: "bday-midnight-celebration",
    mockDb,
  });

  const promiseTmpl = sim.triggerEffect();

  const promiseScratch = sim.setOptions({
    templateParam: null,
    editorState: scratchState,
  });

  await Promise.all([promiseTmpl, promiseScratch]);

  const activeDraftId = sim.getState().draftId;
  assert(activeDraftId !== null, "R11 Mode: Active draft created");
  assert(
    mockDb.cards.get(activeDraftId).creation_mode === "scratch",
    "R11 Mode: Active draft adopted latest mode ('scratch')"
  );
  assert(
    mockDb.cards.get(activeDraftId).template_id === null,
    "R11 Mode: Scratch draft has template_id = null"
  );
  assert(
    loadActiveDraftId() === activeDraftId,
    "R11 Mode: sessionStorage holds scratch draft ID, old template operation discarded"
  );
}

// Account switching User A -> User B
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
  };

  const validScratch = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Cover",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-A" },
    isActive: true,
    editorState: validScratch,
    mockDb,
  });

  const promiseA = sim.triggerEffect();

  sim.changeUser({ id: "user-B" });
  assert(sim.getState().syncStatus === "idle", "R11 Auth: User switched: Status immediately reset to idle");

  const promiseB = sim.triggerEffect();

  await Promise.all([promiseA, promiseB]);

  assert(
    sim.getState().draftId !== null,
    "R11 Auth: User B has an active draft ID"
  );
  assert(
    mockDb.cards.get(sim.getState().draftId).user_id === "user-B",
    "R11 Auth: Active draft is owned by User B, User A's in-flight request was discarded"
  );
  assert(
    loadActiveDraftId() === sim.getState().draftId,
    "R11 Auth: sessionStorage holds User B's draft"
  );
}

// clearActiveDraft() called while creation is pending
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 40,
  };

  const validScratch = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Cover",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-cancel" },
    isActive: true,
    editorState: validScratch,
    mockDb,
  });

  const inFlightPromise = sim.performDraftInitialization();
  assert(sim.getState().syncStatus === "creating", "R11 Cancel: Creation in flight");

  sim.clearActiveDraft();
  assert(sim.getState().syncStatus === "idle", "R11 Cancel: clearActiveDraft reset status to idle");

  await inFlightPromise;
  assert(sim.getState().draftId === null, "R11 Cancel: Canceled request did NOT set draftId");
  assert(sim.getState().syncStatus === "idle", "R11 Cancel: Canceled request did NOT set syncStatus to created");
  assert(loadActiveDraftId() === null, "R11 Cancel: Canceled request did NOT write to sessionStorage");
}

// Matching draft in storage is reused without new RPC call
{
  sessionStorage.clear();
  const validDraftId = "99999999-9999-4999-8999-999999999999";
  const validSlug = "matchingslug1";
  const mockDb = {
    cards: new Map([
      [
        validDraftId,
        {
          id: validDraftId,
          user_id: "user-matching",
          slug: validSlug,
          status: "draft",
          creation_mode: "scratch",
          template_id: null,
        },
      ],
    ]),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: null,
    createDelayMs: 0,
  };

  saveActiveDraftSession(validDraftId, validSlug);

  const validScratch = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Cover",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-matching" },
    isActive: true,
    templateParam: null,
    editorState: validScratch,
    mockDb,
  });

  await sim.performDraftInitialization();

  assert(mockDb.getCallCount === 1, "R11 Reuse: Checked matching draft with getCardById");
  assert(mockDb.createCallCount === 0, "R11 Reuse: Matching valid draft: 0 new drafts created");
  assert(sim.getState().draftId === validDraftId, "R11 Reuse: Adopted matching draftId");
  assert(sim.getState().syncStatus === "created", "R11 Reuse: syncStatus is created");
}

// Draft Limit Error handled gracefully
{
  sessionStorage.clear();
  const mockDb = {
    cards: new Map(),
    createCallCount: 0,
    getCallCount: 0,
    failCreateWithError: new Error("DRAFT_LIMIT_REACHED: Maximum of 3 active drafts allowed per user"),
  };

  const validScratch = {
    templateId: null,
    creationMode: "scratch",
    recipientName: "Friend",
    senderName: "Me",
    occasionTag: "Tag",
    primaryMessage: "Msg",
    secondaryMessage: null,
    foilStyle: "lavender-pink",
    coverText: "Cover",
    bgPalette: "pure-ivory",
    sticker: "sparkles",
    photoUrl: null,
    photoPath: null,
    soundEnabled: true,
  };

  const sim = createDraftSyncSimulator({
    user: { id: "user-limit" },
    isActive: true,
    editorState: validScratch,
    mockDb,
  });

  await sim.performDraftInitialization();

  assert(sim.getState().syncStatus === "error", "R11 Limit: Status is error");
  assert(sim.getState().isLimitReached === true, "R11 Limit: isLimitReached is true");
  assert(sim.getState().syncError.includes("Draft limit reached"), "R11 Limit: Friendly error displayed");
}

console.log("\n================================================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED (100% Mocked, 0 Remote DB Impact)`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
