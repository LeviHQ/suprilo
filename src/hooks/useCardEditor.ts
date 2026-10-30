"use client";

import * as React from "react";
import {
  CardEditorState,
  StoredCardDraft,
  BgPaletteId,
  StickerId,
  CARD_LIMITS,
  TEMPLATE_PALETTE_MAP,
} from "@/types/card";
import { CoverStyle } from "@/components/scratch/ScratchCard";
import {
  TemplateDefinition,
  getTemplateById,
  DEFAULT_SCRATCH_TEMPLATE,
} from "@/data/templates";

const DRAFT_STORAGE_KEY = "suprilo_card_draft_v1";

export type CardEditorAction =
  | {
      type: "SET_FIELD";
      field: keyof CardEditorState;
      value: string | number | boolean | null;
    }
  | {
      type: "APPLY_TEMPLATE";
      template: TemplateDefinition;
      defaultSender?: string;
    }
  | {
      type: "INIT_SCRATCH";
      defaultSender?: string;
    }
  | {
      type: "RESTORE_DRAFT";
      draft: StoredCardDraft;
    }
  | {
      type: "RESET_EDITOR";
      defaultSender?: string;
    };

/**
 * Creates clean initial editor state with default scratch card parameters.
 */
export function getInitialCardState(defaultSender: string = "Alex"): CardEditorState {
  return {
    templateId: null,
    creationMode: "scratch",
    recipientName: DEFAULT_SCRATCH_TEMPLATE.recipient,
    senderName: defaultSender,
    occasionTag: DEFAULT_SCRATCH_TEMPLATE.tag,
    primaryMessage: DEFAULT_SCRATCH_TEMPLATE.message,
    secondaryMessage: DEFAULT_SCRATCH_TEMPLATE.secondary,
    foilStyle: DEFAULT_SCRATCH_TEMPLATE.coverStyle,
    coverText: DEFAULT_SCRATCH_TEMPLATE.coverText,
    bgPalette: "pure-ivory",
    sticker: (DEFAULT_SCRATCH_TEMPLATE.sticker as StickerId) || "sparkles",
    fontFamily: undefined,
    photoUrl: null,
    soundEnabled: true,
  };
}

/**
 * Maps a TemplateDefinition into a complete CardEditorState, resolving
 * background palette and decorative sticker completely.
 */
export function buildStateFromTemplate(
  template: TemplateDefinition,
  defaultSender?: string,
  currentFont?: string,
  soundEnabled = true
): CardEditorState {
  const mappedPalette: BgPaletteId =
    TEMPLATE_PALETTE_MAP[template.id] || "soft-pink";
  const mappedSticker: StickerId =
    (template.sticker as StickerId) || "sparkles";

  return {
    templateId: template.id,
    creationMode: "template",
    recipientName: template.recipient,
    senderName: defaultSender || template.sender,
    occasionTag: template.tag,
    primaryMessage: template.message,
    secondaryMessage: template.secondary,
    foilStyle: template.coverStyle,
    coverText: template.coverText,
    bgPalette: mappedPalette,
    sticker: mappedSticker,
    fontFamily: currentFont,
    photoUrl: null, // Clear uploaded photo when switching templates
    soundEnabled,
  };
}

/**
 * Pure reducer function governing all card studio state modifications.
 */
export function cardEditorReducer(
  state: CardEditorState,
  action: CardEditorAction
): CardEditorState {
  switch (action.type) {
    case "SET_FIELD": {
      const { field, value } = action;

      // Defensive character limit enforcement on string inputs
      let sanitizedValue = value;
      if (typeof value === "string") {
        if (field === "recipientName") {
          sanitizedValue = value.slice(0, CARD_LIMITS.RECIPIENT_MAX);
        } else if (field === "senderName") {
          sanitizedValue = value.slice(0, CARD_LIMITS.SENDER_MAX);
        } else if (field === "occasionTag") {
          sanitizedValue = value.slice(0, CARD_LIMITS.TAG_MAX);
        } else if (field === "primaryMessage") {
          sanitizedValue = value.slice(0, CARD_LIMITS.PRIMARY_MESSAGE_MAX);
        } else if (field === "secondaryMessage") {
          sanitizedValue = value.slice(0, CARD_LIMITS.SECONDARY_MESSAGE_MAX);
        } else if (field === "coverText") {
          sanitizedValue = value.slice(0, CARD_LIMITS.COVER_TEXT_MAX);
        }
      }

      return {
        ...state,
        [field]: sanitizedValue,
      };
    }

    case "APPLY_TEMPLATE": {
      return buildStateFromTemplate(
        action.template,
        action.defaultSender,
        state.fontFamily,
        state.soundEnabled
      );
    }

    case "INIT_SCRATCH": {
      const sender = action.defaultSender || state.senderName || "Alex";
      return {
        ...getInitialCardState(sender),
        fontFamily: state.fontFamily,
        soundEnabled: state.soundEnabled,
      };
    }

    case "RESTORE_DRAFT": {
      const { draft } = action;
      return {
        ...state,
        templateId: draft.templateId,
        creationMode: draft.creationMode,
        recipientName: draft.recipientName,
        senderName: draft.senderName,
        occasionTag: draft.occasionTag,
        primaryMessage: draft.primaryMessage,
        secondaryMessage: draft.secondaryMessage,
        foilStyle: draft.foilStyle,
        coverText: draft.coverText,
        bgPalette: draft.bgPalette,
        sticker: draft.sticker,
        fontFamily: draft.fontFamily,
        soundEnabled: draft.soundEnabled,
        // In-memory photo is preserved if present
      };
    }

    case "RESET_EDITOR": {
      if (state.templateId) {
        const tpl = getTemplateById(state.templateId);
        if (tpl) {
          return buildStateFromTemplate(
            tpl,
            action.defaultSender || state.senderName,
            state.fontFamily,
            state.soundEnabled
          );
        }
      }
      return getInitialCardState(action.defaultSender || state.senderName || "Alex");
    }

    default:
      return state;
  }
}

/**
 * Loads a safely typed card draft from browser sessionStorage.
 * Returns null if no draft exists, data is malformed, or storage is unavailable.
 */
export function loadSessionDraft(): StoredCardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed.savedAt !== "number") {
      return null;
    }
    // Verify core string presence
    if (
      typeof parsed.recipientName !== "string" ||
      typeof parsed.primaryMessage !== "string" ||
      typeof parsed.coverText !== "string"
    ) {
      return null;
    }
    return parsed as StoredCardDraft;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to parse session draft:", err);
    }
    return null;
  }
}

/**
 * Persists current text and styling configuration to browser sessionStorage.
 * Intentionally omits in-memory base64 photo data to protect quota and performance.
 */
export function saveSessionDraft(state: CardEditorState): void {
  if (typeof window === "undefined") return;
  try {
    const draft: StoredCardDraft = {
      version: 1,
      savedAt: Date.now(),
      templateId: state.templateId,
      creationMode: state.creationMode,
      recipientName: state.recipientName,
      senderName: state.senderName,
      occasionTag: state.occasionTag,
      primaryMessage: state.primaryMessage,
      secondaryMessage: state.secondaryMessage,
      foilStyle: state.foilStyle,
      coverText: state.coverText,
      bgPalette: state.bgPalette,
      sticker: state.sticker,
      fontFamily: state.fontFamily,
      soundEnabled: state.soundEnabled,
    };
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to save session draft:", err);
    }
  }
}

/**
 * Clears any saved draft from browser sessionStorage.
 */
export function clearSessionDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {}
}

interface UseCardEditorOptions {
  templateParam: string | null;
  modeParam: string | null;
  defaultSender?: string;
}

export function useCardEditor({
  templateParam,
  modeParam,
  defaultSender = "Alex",
}: UseCardEditorOptions) {
  const [state, dispatch] = React.useReducer(
    cardEditorReducer,
    defaultSender,
    getInitialCardState
  );

  // Card key used to force a clean remount of the ScratchCard canvas whenever visual foil / photo changes
  const [cardKey, setCardKey] = React.useState(0);
  const [hasRestoredDraft, setHasRestoredDraft] = React.useState(false);

  const remountCanvas = React.useCallback(() => {
    setCardKey((k) => k + 1);
  }, []);

  // Update default sender name when authentication profile becomes available
  React.useEffect(() => {
    if (defaultSender && defaultSender !== "Alex" && state.senderName === "Alex") {
      dispatch({ type: "SET_FIELD", field: "senderName", value: defaultSender });
    }
  }, [defaultSender, state.senderName]);

  // Synchronize route query parameters with editor state and session drafts
  React.useEffect(() => {
    const draft = loadSessionDraft();

    if (templateParam) {
      // 1. Template route active
      const template = getTemplateById(templateParam);
      if (template) {
        // If a stored draft matches this exact template ID, restore user edits
        if (draft && draft.templateId === templateParam && !hasRestoredDraft) {
          dispatch({ type: "RESTORE_DRAFT", draft });
          setHasRestoredDraft(true);
        } else {
          // Otherwise freshly apply this template (hydrating full palette + sticker)
          dispatch({
            type: "APPLY_TEMPLATE",
            template,
            defaultSender,
          });
        }
        remountCanvas();
      }
    } else if (modeParam === "scratch") {
      // 2. Scratch mode route active
      if (draft && draft.creationMode === "scratch" && draft.templateId === null && !hasRestoredDraft) {
        dispatch({ type: "RESTORE_DRAFT", draft });
        setHasRestoredDraft(true);
      } else {
        dispatch({ type: "INIT_SCRATCH", defaultSender });
      }
      remountCanvas();
    }
  }, [templateParam, modeParam, defaultSender, hasRestoredDraft, remountCanvas]);

  // Safe automatic draft persistence: saves state updates during the session
  React.useEffect(() => {
    // Only persist once initialized with a template or scratch mode
    if (state.templateId || state.creationMode === "scratch") {
      saveSessionDraft(state);
    }
  }, [state]);

  // Convenience helper actions
  const setField = React.useCallback(
    (field: keyof CardEditorState, value: string | number | boolean | null) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    []
  );

  const applyTemplate = React.useCallback(
    (template: TemplateDefinition) => {
      dispatch({ type: "APPLY_TEMPLATE", template, defaultSender });
      remountCanvas();
    },
    [defaultSender, remountCanvas]
  );

  const initScratch = React.useCallback(() => {
    dispatch({ type: "INIT_SCRATCH", defaultSender });
    remountCanvas();
  }, [defaultSender, remountCanvas]);

  const resetEditor = React.useCallback(() => {
    clearSessionDraft();
    dispatch({ type: "RESET_EDITOR", defaultSender });
    remountCanvas();
  }, [defaultSender, remountCanvas]);

  const setPhotoUrl = React.useCallback(
    (url: string | null) => {
      dispatch({ type: "SET_FIELD", field: "photoUrl", value: url });
      remountCanvas();
    },
    [remountCanvas]
  );

  const setFoilStyle = React.useCallback(
    (foil: CoverStyle) => {
      dispatch({ type: "SET_FIELD", field: "foilStyle", value: foil });
      remountCanvas();
    },
    [remountCanvas]
  );

  const setBgPalette = React.useCallback(
    (palette: BgPaletteId) => {
      dispatch({ type: "SET_FIELD", field: "bgPalette", value: palette });
      remountCanvas();
    },
    [remountCanvas]
  );

  const setSticker = React.useCallback(
    (sticker: StickerId) => {
      dispatch({ type: "SET_FIELD", field: "sticker", value: sticker });
      remountCanvas();
    },
    [remountCanvas]
  );

  // Derived character count indicators
  const characterCounts = React.useMemo(() => {
    return {
      recipient: {
        current: state.recipientName.length,
        max: CARD_LIMITS.RECIPIENT_MAX,
        remaining: CARD_LIMITS.RECIPIENT_MAX - state.recipientName.length,
      },
      sender: {
        current: state.senderName.length,
        max: CARD_LIMITS.SENDER_MAX,
        remaining: CARD_LIMITS.SENDER_MAX - state.senderName.length,
      },
      tag: {
        current: state.occasionTag.length,
        max: CARD_LIMITS.TAG_MAX,
        remaining: CARD_LIMITS.TAG_MAX - state.occasionTag.length,
      },
      primaryMessage: {
        current: state.primaryMessage.length,
        max: CARD_LIMITS.PRIMARY_MESSAGE_MAX,
        remaining: CARD_LIMITS.PRIMARY_MESSAGE_MAX - state.primaryMessage.length,
      },
      secondaryMessage: {
        current: state.secondaryMessage.length,
        max: CARD_LIMITS.SECONDARY_MESSAGE_MAX,
        remaining: CARD_LIMITS.SECONDARY_MESSAGE_MAX - state.secondaryMessage.length,
      },
      coverText: {
        current: state.coverText.length,
        max: CARD_LIMITS.COVER_TEXT_MAX,
        remaining: CARD_LIMITS.COVER_TEXT_MAX - state.coverText.length,
      },
    };
  }, [
    state.recipientName,
    state.senderName,
    state.occasionTag,
    state.primaryMessage,
    state.secondaryMessage,
    state.coverText,
  ]);

  return {
    state,
    cardKey,
    characterCounts,
    limits: CARD_LIMITS,
    setField,
    setPhotoUrl,
    setFoilStyle,
    setBgPalette,
    setSticker,
    applyTemplate,
    initScratch,
    resetEditor,
    remountCanvas,
    clearDraft: clearSessionDraft,
  };
}
