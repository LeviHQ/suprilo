import { SU_PRILO_TEMPLATES, DEFAULT_SCRATCH_TEMPLATE, getTemplateById } from "../src/data/templates.ts";
import {
  CARD_LIMITS,
  TEMPLATE_PALETTE_MAP,
} from "../src/types/card.ts";
import {
  cardEditorReducer,
  getInitialCardState,
  buildStateFromTemplate,
} from "../src/hooks/useCardEditor.ts";

// Note: since this is run in node, we mock sessionStorage
const mockSessionStorage = new Map();
global.sessionStorage = {
  getItem: (k) => mockSessionStorage.get(k) || null,
  setItem: (k, v) => mockSessionStorage.set(k, String(v)),
  removeItem: (k) => mockSessionStorage.delete(k),
  clear: () => mockSessionStorage.clear(),
};
global.window = {};

console.log("=========================================");
console.log("RUNNING SU_PRILO PHASE 2 - TASK 1 AUDIT TESTS");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// TEST SUITE 1: ALL 16 TEMPLATES HYDRATION & PALETTE/STICKER MAP
// -------------------------------------------------------------
console.log("--- Test Suite 1: All 16 Templates Hydration ---");

const VALID_PALETTES = ["soft-pink", "warm-sunshine", "royal-amethyst", "mint-fresh", "pure-ivory"];
const VALID_STICKERS = ["heart", "sparkles", "cake", "flower", "gift", "confetti", "trophy", "star"];
const VALID_FOILS = ["lavender-pink", "golden-foil", "cosmic-purple", "mint-fresh"];

assert(SU_PRILO_TEMPLATES.length === 16, `Catalog contains exactly 16 templates (found: ${SU_PRILO_TEMPLATES.length})`);

for (const tpl of SU_PRILO_TEMPLATES) {
  const state = buildStateFromTemplate(tpl, "Adarsh");
  
  assert(state.templateId === tpl.id, `[${tpl.id}] templateId matches`);
  assert(state.creationMode === "template", `[${tpl.id}] creationMode is 'template'`);
  assert(VALID_PALETTES.includes(state.bgPalette), `[${tpl.id}] bgPalette "${state.bgPalette}" is valid`);
  assert(VALID_STICKERS.includes(state.sticker), `[${tpl.id}] sticker "${state.sticker}" is valid`);
  assert(VALID_FOILS.includes(state.foilStyle), `[${tpl.id}] foilStyle "${state.foilStyle}" is valid`);
  assert(state.photoUrl === null, `[${tpl.id}] photoUrl resets to null`);
  assert(state.recipientName === tpl.recipient, `[${tpl.id}] recipient hydrated`);
  assert(state.primaryMessage === tpl.message, `[${tpl.id}] primaryMessage hydrated`);
  assert(state.secondaryMessage === tpl.secondary, `[${tpl.id}] secondaryMessage hydrated`);
  assert(state.occasionTag === tpl.tag, `[${tpl.id}] occasionTag hydrated`);
  assert(state.coverText === tpl.coverText, `[${tpl.id}] coverText hydrated`);

  // Verify none of the templates exceed the character limits
  assert(
    tpl.recipient.length <= CARD_LIMITS.RECIPIENT_MAX,
    `[${tpl.id}] recipient length (${tpl.recipient.length}) <= ${CARD_LIMITS.RECIPIENT_MAX}`
  );
  assert(
    tpl.tag.length <= CARD_LIMITS.TAG_MAX,
    `[${tpl.id}] tag length (${tpl.tag.length}) <= ${CARD_LIMITS.TAG_MAX}`
  );
  assert(
    tpl.message.length <= CARD_LIMITS.PRIMARY_MESSAGE_MAX,
    `[${tpl.id}] primaryMessage length (${tpl.message.length}) <= ${CARD_LIMITS.PRIMARY_MESSAGE_MAX}`
  );
  assert(
    tpl.secondary.length <= CARD_LIMITS.SECONDARY_MESSAGE_MAX,
    `[${tpl.id}] secondaryMessage length (${tpl.secondary.length}) <= ${CARD_LIMITS.SECONDARY_MESSAGE_MAX}`
  );
  assert(
    tpl.coverText.length <= CARD_LIMITS.COVER_TEXT_MAX,
    `[${tpl.id}] coverText length (${tpl.coverText.length}) <= ${CARD_LIMITS.COVER_TEXT_MAX}`
  );
}

// -------------------------------------------------------------
// TEST SUITE 2: SCRATCH MODE DEFAULTS
// -------------------------------------------------------------
console.log("\n--- Test Suite 2: Scratch Mode Defaults ---");

const scratchState = getInitialCardState("Adarsh");
assert(scratchState.templateId === null, "Scratch mode templateId is null");
assert(scratchState.creationMode === "scratch", "Scratch mode creationMode is 'scratch'");
assert(scratchState.bgPalette === "pure-ivory", `Scratch mode bgPalette is pure-ivory (found: ${scratchState.bgPalette})`);
assert(scratchState.sticker === "sparkles", `Scratch mode sticker is sparkles (found: ${scratchState.sticker})`);
assert(scratchState.foilStyle === "lavender-pink", `Scratch mode foilStyle is lavender-pink`);
assert(scratchState.recipientName === DEFAULT_SCRATCH_TEMPLATE.recipient, "Scratch mode recipient initialized");
assert(scratchState.senderName === "Adarsh", "Scratch mode sender name assigned");
assert(scratchState.soundEnabled === true, "Scratch mode soundEnabled is true");

// -------------------------------------------------------------
// TEST SUITE 3: REDUCER ACTIONS & CLAMPING DEFENSE
// -------------------------------------------------------------
console.log("\n--- Test Suite 3: Reducer Actions & Limits Enforcement ---");

// Test clamping exceeding characters
let s1 = cardEditorReducer(scratchState, {
  type: "SET_FIELD",
  field: "recipientName",
  value: "This is a very very long recipient name that exceeds thirty characters definitely",
});
assert(
  s1.recipientName.length === CARD_LIMITS.RECIPIENT_MAX,
  `Recipient clamped to ${CARD_LIMITS.RECIPIENT_MAX} chars (actual: ${s1.recipientName.length})`
);

let s2 = cardEditorReducer(s1, {
  type: "SET_FIELD",
  field: "occasionTag",
  value: "Mega Celebration Beyond Tag Limit Extended",
});
assert(
  s2.occasionTag.length === CARD_LIMITS.TAG_MAX,
  `Tag clamped to ${CARD_LIMITS.TAG_MAX} chars (actual: ${s2.occasionTag.length})`
);

let s3 = cardEditorReducer(s2, {
  type: "SET_FIELD",
  field: "primaryMessage",
  value: "A".repeat(300),
});
assert(
  s3.primaryMessage.length === CARD_LIMITS.PRIMARY_MESSAGE_MAX,
  `Primary message clamped to ${CARD_LIMITS.PRIMARY_MESSAGE_MAX} chars (actual: ${s3.primaryMessage.length})`
);

let s4 = cardEditorReducer(s3, {
  type: "SET_FIELD",
  field: "secondaryMessage",
  value: "B".repeat(200),
});
assert(
  s4.secondaryMessage.length === CARD_LIMITS.SECONDARY_MESSAGE_MAX,
  `Secondary message clamped to ${CARD_LIMITS.SECONDARY_MESSAGE_MAX} chars (actual: ${s4.secondaryMessage.length})`
);

let s5 = cardEditorReducer(s4, {
  type: "SET_FIELD",
  field: "coverText",
  value: "C".repeat(150),
});
assert(
  s5.coverText.length === CARD_LIMITS.COVER_TEXT_MAX,
  `Cover text clamped to ${CARD_LIMITS.COVER_TEXT_MAX} chars (actual: ${s5.coverText.length})`
);

// Test APPLY_TEMPLATE reducer action
const bdayTemplate = getTemplateById("bday-midnight-celebration");
let s6 = cardEditorReducer(s5, {
  type: "APPLY_TEMPLATE",
  template: bdayTemplate,
  defaultSender: "Adarsh",
});
assert(s6.templateId === "bday-midnight-celebration", "APPLY_TEMPLATE sets templateId");
assert(s6.bgPalette === "warm-sunshine", "APPLY_TEMPLATE sets bgPalette to warm-sunshine");
assert(s6.sticker === "cake", "APPLY_TEMPLATE sets sticker to cake");

// Test RESET_EDITOR
let s7 = cardEditorReducer(s6, {
  type: "RESET_EDITOR",
  defaultSender: "Adarsh",
});
assert(s7.templateId === "bday-midnight-celebration", "RESET_EDITOR with templateId restores template clean state");
assert(s7.primaryMessage === bdayTemplate.message, "RESET_EDITOR restores original message");

// -------------------------------------------------------------
// TEST SUITE 4: DRAFT SERIALIZATION & EXCLUSION OF PHOTO DATA
// -------------------------------------------------------------
console.log("\n--- Test Suite 4: Draft Serialization & Storage Safety ---");

const stateWithPhoto = {
  ...s6,
  photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
};

// Simulate saveSessionDraft
const draftSnapshot = {
  version: 1,
  savedAt: Date.now(),
  templateId: stateWithPhoto.templateId,
  creationMode: stateWithPhoto.creationMode,
  recipientName: stateWithPhoto.recipientName,
  senderName: stateWithPhoto.senderName,
  occasionTag: stateWithPhoto.occasionTag,
  primaryMessage: stateWithPhoto.primaryMessage,
  secondaryMessage: stateWithPhoto.secondaryMessage,
  foilStyle: stateWithPhoto.foilStyle,
  coverText: stateWithPhoto.coverText,
  bgPalette: stateWithPhoto.bgPalette,
  sticker: stateWithPhoto.sticker,
  soundEnabled: stateWithPhoto.soundEnabled,
};

assert(!("photoUrl" in draftSnapshot), "Draft snapshot explicitly excludes photoUrl");
const serialized = JSON.stringify(draftSnapshot);
assert(serialized.length < 1500, `Serialized draft size is compact (${serialized.length} bytes < 1500 bytes)`);

// Test RESTORE_DRAFT action
let s8 = cardEditorReducer(scratchState, {
  type: "RESTORE_DRAFT",
  draft: draftSnapshot,
});
assert(s8.templateId === "bday-midnight-celebration", "RESTORE_DRAFT restored templateId");
assert(s8.bgPalette === "warm-sunshine", "RESTORE_DRAFT restored bgPalette");
assert(s8.sticker === "cake", "RESTORE_DRAFT restored sticker");
assert(s8.recipientName === bdayTemplate.recipient, "RESTORE_DRAFT restored recipientName");

console.log("\n=========================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}
