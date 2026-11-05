"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateCardDraft } from "@/lib/cards";
import type {
  CardEditorState,
  UpdateCardDraftFields,
} from "@/types/card";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface SavePhotoPathResult {
  success: boolean;
  isStale: boolean;
}

export interface UseCardAutosaveOptions {
  draftId: string | null;
  isDraftReady: boolean;
  user: { id: string; email?: string | null } | null;
  isActive: boolean;
  editorState: CardEditorState;
  client?: SupabaseClient;
  debounceMs?: number;
}

export interface UseCardAutosaveReturn {
  saveStatus: AutosaveStatus;
  saveError: string | null;
  retryAutosave: () => Promise<void>;
  lastSavedAt: number | null;
  savePhotoPath: (photoPath: string | null) => Promise<SavePhotoPathResult>;
}

/**
 * Maps current CardEditorState into the whitelisted UpdateCardDraftFields payload.
 *
 * Guarantees:
 * 1. Valid Storage path ({user_id}/{card_id}/{filename}) is mapped to photo_path.
 * 2. Base64 data URLs, blob URLs, and HTTP URLs are NEVER persisted in PostgreSQL.
 * 3. When no photo exists or photoPath is empty/null, photo_path is strictly null.
 * 4. Protected system columns (id, user_id, slug, status, draft_slot, created_at,
 *    updated_at, published_at, creation_mode, template_id) are strictly excluded.
 * 5. Default fallbacks match schema constraints.
 */
export function mapEditorStateToUpdateFields(
  state: CardEditorState
): UpdateCardDraftFields {
  let validPhotoPath: string | null = null;
  if (
    typeof state.photoPath === "string" &&
    state.photoPath.trim().length > 0 &&
    !state.photoPath.startsWith("data:") &&
    !state.photoPath.startsWith("blob:") &&
    !state.photoPath.startsWith("http://") &&
    !state.photoPath.startsWith("https://")
  ) {
    validPhotoPath = state.photoPath.trim();
  }

  return {
    recipient_name: state.recipientName || "Friend",
    sender_name: state.senderName || "Someone Special",
    occasion_tag: state.occasionTag || "Just Because",
    primary_message: state.primaryMessage || "A special surprise for you!",
    secondary_message: state.secondaryMessage || null,
    foil_style: state.foilStyle,
    cover_text: state.coverText || "Scratch to reveal",
    bg_palette: state.bgPalette,
    sticker: state.sticker,
    font_family: state.fontFamily || null,
    photo_path: validPhotoPath,
    reveal_threshold: 0.65,
    sound_enabled: state.soundEnabled,
  };
}

/**
 * Deterministically serializes editable fields to detect actual editor changes.
 * Avoids duplicate network calls when typing or interactions do not alter editable fields.
 */
export function serializeEditorStateForDraft(state: CardEditorState): string {
  const fields = mapEditorStateToUpdateFields(state);
  return JSON.stringify(fields);
}

/**
 * Hook governing debounced autosave of card editor changes to Supabase.
 *
 * Guarantees:
 * 1. Autosaves ONLY when: authenticated, editor active, confirmed remote draftId exists,
 *    and initial draft creation/restoration has completed (isDraftReady).
 * 2. Debounces updates by ~800ms after the user's last edit.
 * 3. Prevents duplicate network updates when editor state is unchanged from last saved state.
 * 4. Serialized revision tracking prevents older in-flight responses from overwriting newer edits.
 * 5. Lifecycle safety:
 *    - Inactivity cancels debounce and invalidates in-flight operations without prematurely
 *      clearing inFlightRef while the network request is still running.
 *    - When the actual request settles, inFlightRef is reliably released in `finally`.
 *    - If the user reactivates and a newer revision is waiting, that latest revision saves cleanly.
 * 6. Never updates protected database columns (id, user_id, slug, status, draft_slot, created_at).
 * 7. Keeps editor completely usable on save errors and provides explicit retry capability.
 */
export function useCardAutosave({
  draftId,
  isDraftReady,
  user,
  isActive,
  editorState,
  client,
  debounceMs = 800,
}: UseCardAutosaveOptions): UseCardAutosaveReturn {
  const [saveStatus, setSaveStatus] = React.useState<AutosaveStatus>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);

  // Invalidation & lifecycle tokens
  const generationTokenRef = React.useRef(0);
  const activeDraftIdRef = React.useRef<string | null>(draftId);
  const currentUserIdRef = React.useRef<string | null>(user?.id || null);
  const isActiveRef = React.useRef(isActive);
  isActiveRef.current = isActive;

  // Track latest editorState and client in refs
  const editorStateRef = React.useRef(editorState);
  editorStateRef.current = editorState;
  const clientRef = React.useRef(client);
  clientRef.current = client;

  // Revision & baseline tracking
  const revisionRef = React.useRef(0);
  const lastSavedRevisionRef = React.useRef(0);
  const lastSavedSerializedRef = React.useRef<string | null>(null);
  const initialEditorSerializedRef = React.useRef<string>(
    serializeEditorStateForDraft(editorState)
  );

  // Timer & concurrency refs
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = React.useRef(false);
  const queuedSaveRef = React.useRef(false);

  // 1. Account switching safety
  React.useEffect(() => {
    const prevUserId = currentUserIdRef.current;
    const nextUserId = user?.id || null;

    if (prevUserId !== nextUserId) {
      currentUserIdRef.current = nextUserId;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      generationTokenRef.current++;
      queuedSaveRef.current = false;
      lastSavedSerializedRef.current = null;
      lastSavedRevisionRef.current = 0;
      revisionRef.current = 0;
      initialEditorSerializedRef.current = serializeEditorStateForDraft(editorState);
      setSaveStatus("idle");
      setSaveError(null);
      setLastSavedAt(null);
    }
  }, [user?.id, editorState]);

  // 2. Draft switching safety
  React.useEffect(() => {
    const prevDraftId = activeDraftIdRef.current;
    if (prevDraftId !== draftId) {
      activeDraftIdRef.current = draftId;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      generationTokenRef.current++;
      queuedSaveRef.current = false;
      lastSavedSerializedRef.current = null;
      lastSavedRevisionRef.current = 0;
      revisionRef.current = 0;
      initialEditorSerializedRef.current = serializeEditorStateForDraft(editorState);
      setSaveStatus("idle");
      setSaveError(null);
    }
  }, [draftId, editorState]);

  // 3. Inactivity safety: cancel pending debounce timer and invalidate in-flight operation
  React.useEffect(() => {
    if (!isActive) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      generationTokenRef.current++;
      setSaveStatus("idle");
    }
  }, [isActive]);

  // 4. Draft ready baseline establishment
  React.useEffect(() => {
    if (!isActive || !user || !draftId || !isDraftReady) {
      return;
    }

    // When draft first becomes ready, establish baseline
    if (lastSavedSerializedRef.current === null) {
      lastSavedSerializedRef.current = initialEditorSerializedRef.current;
      lastSavedRevisionRef.current = 0;
      const currentSerialized = serializeEditorStateForDraft(editorState);
      if (currentSerialized === initialEditorSerializedRef.current) {
        setSaveStatus("saved");
      }
    } else {
      const currentSerialized = serializeEditorStateForDraft(editorState);
      if (currentSerialized === lastSavedSerializedRef.current && saveStatus === "idle") {
        setSaveStatus("saved");
      }
    }
  }, [isActive, user, draftId, isDraftReady, editorState, saveStatus]);

  // 5. Perform autosave execution
  const performAutosave = React.useCallback(async (isRetry = false) => {
    const targetDraftId = activeDraftIdRef.current;
    const targetUserId = currentUserIdRef.current;

    // Prerequisite guard: authenticated, active, draft exists and is ready
    if (!targetDraftId || !targetUserId || !isActiveRef.current) {
      return;
    }

    const currentState = editorStateRef.current;
    const currentSerialized = serializeEditorStateForDraft(currentState);

    // If unchanged and not an explicit retry, skip
    if (!isRetry && currentSerialized === lastSavedSerializedRef.current) {
      return;
    }

    // Concurrency guard: if a save is already in-flight, queue a follow-up save
    if (inFlightRef.current) {
      queuedSaveRef.current = true;
      return;
    }

    inFlightRef.current = true;
    queuedSaveRef.current = false;
    setSaveStatus("saving");
    setSaveError(null);

    const token = ++generationTokenRef.current;
    const savingRevision = revisionRef.current;
    const payload = mapEditorStateToUpdateFields(currentState);

    let saveFailed = false;
    let failureError: unknown = null;

    try {
      await updateCardDraft(targetDraftId, payload, clientRef.current);
    } catch (err) {
      saveFailed = true;
      failureError = err;
    } finally {
      // In-flight lock is unconditionally released when the actual network request settles
      inFlightRef.current = false;

      // Invalidation check: did user switch accounts, draft, or deactivate editor?
      const isStale =
        token !== generationTokenRef.current ||
        activeDraftIdRef.current !== targetDraftId ||
        currentUserIdRef.current !== targetUserId ||
        !isActiveRef.current;

      if (!isStale) {
        if (!saveFailed) {
          // Success & not stale: record baseline
          lastSavedSerializedRef.current = currentSerialized;
          lastSavedRevisionRef.current = savingRevision;
          setLastSavedAt(Date.now());

          // Check if newer edits occurred while this save was in-flight
          if (revisionRef.current > savingRevision || queuedSaveRef.current) {
            const wasQueued = queuedSaveRef.current;
            queuedSaveRef.current = false;
            if (wasQueued) {
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
              }
              void performAutosave();
            } else if (!debounceTimerRef.current) {
              debounceTimerRef.current = setTimeout(() => {
                void performAutosave();
              }, debounceMs);
            }
          } else {
            setSaveStatus("saved");
            setSaveError(null);
          }
        } else {
          // Error & not stale: report error
          queuedSaveRef.current = false;
          const msg =
            failureError instanceof Error
              ? failureError.message
              : "Failed to save draft changes.";
          setSaveStatus("error");
          setSaveError(msg);
        }
      } else {
        // Request settled, but response is STALE.
        // Do NOT update saveStatus or baseline with stale data.
        // If the editor is currently active for the same draft and user, check if a newer revision is waiting
        const canResume =
          isActiveRef.current &&
          activeDraftIdRef.current === targetDraftId &&
          currentUserIdRef.current === targetUserId;

        if (canResume) {
          const latestSerialized = serializeEditorStateForDraft(editorStateRef.current);
          const hasUnsavedChanges =
            queuedSaveRef.current ||
            revisionRef.current > savingRevision ||
            latestSerialized !== lastSavedSerializedRef.current;

          const wasQueued = queuedSaveRef.current;
          queuedSaveRef.current = false;

          if (hasUnsavedChanges) {
            if (wasQueued) {
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
              }
              void performAutosave();
            } else if (!debounceTimerRef.current) {
              debounceTimerRef.current = setTimeout(() => {
                void performAutosave();
              }, debounceMs);
            }
          }
        }
      }
    }
  }, [debounceMs]);

  // 6. Debounced autosave effect on editor state changes
  React.useEffect(() => {
    // Prerequisite checks:
    // Autosave only when authenticated, editor active, confirmed draftId exists, and draft is ready
    if (!isActive || !user || !draftId || !isDraftReady) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    const currentSerialized = serializeEditorStateForDraft(editorState);

    // If baseline is not yet established, wait for baseline effect
    if (lastSavedSerializedRef.current === null) {
      return;
    }

    // Change detection: if current state equals what was already saved, no-op
    if (currentSerialized === lastSavedSerializedRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    // State is dirty: increment revision counter
    revisionRef.current++;

    // Reset debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void performAutosave();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [editorState, isActive, user, draftId, isDraftReady, debounceMs, performAutosave]);

  // 7. Manual retry handler
  const retryAutosave = React.useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await performAutosave(true);
  }, [performAutosave]);

  // 8. Explicit immediate draft update for photo path changes (Task 2C-5.3.3 ordering & isolation fix)
  const savePhotoPath = React.useCallback(
    async (newPhotoPath: string | null): Promise<SavePhotoPathResult> => {
      const targetDraftId = activeDraftIdRef.current;
      const targetUserId = currentUserIdRef.current;

      if (!targetDraftId || !targetUserId || !isActiveRef.current) {
        return { success: false, isStale: true };
      }

      // Cancel any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Wait if an autosave is currently settling
      while (inFlightRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // Recheck draft ID, user ID, and activity after waiting for in-flight autosave
      if (
        activeDraftIdRef.current !== targetDraftId ||
        currentUserIdRef.current !== targetUserId ||
        !isActiveRef.current
      ) {
        return { success: false, isStale: true };
      }

      inFlightRef.current = true;
      queuedSaveRef.current = false;
      setSaveStatus("saving");
      setSaveError(null);

      const token = ++generationTokenRef.current;
      const savingRevision = ++revisionRef.current;

      const targetState: CardEditorState = {
        ...editorStateRef.current,
        photoPath: newPhotoPath,
      };
      const targetSerialized = serializeEditorStateForDraft(targetState);
      const payload = mapEditorStateToUpdateFields(targetState);

      try {
        await updateCardDraft(targetDraftId, payload, clientRef.current);

        const isStale =
          token !== generationTokenRef.current ||
          activeDraftIdRef.current !== targetDraftId ||
          currentUserIdRef.current !== targetUserId ||
          !isActiveRef.current;

        if (!isStale) {
          lastSavedSerializedRef.current = targetSerialized;
          lastSavedRevisionRef.current = savingRevision;
          setLastSavedAt(Date.now());
          setSaveStatus("saved");
          setSaveError(null);
          return { success: true, isStale: false };
        } else {
          return { success: true, isStale: true };
        }
      } catch (err) {
        const isStale =
          token !== generationTokenRef.current ||
          activeDraftIdRef.current !== targetDraftId ||
          currentUserIdRef.current !== targetUserId ||
          !isActiveRef.current;

        if (!isStale) {
          const msg =
            err instanceof Error ? err.message : "Failed to save draft changes.";
          setSaveStatus("error");
          setSaveError(msg);
        }
        throw err;
      } finally {
        inFlightRef.current = false;
      }
    },
    []
  );

  return {
    saveStatus,
    saveError,
    retryAutosave,
    lastSavedAt,
    savePhotoPath,
  };
}
