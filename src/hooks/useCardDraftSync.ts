"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCardDraft, getCardById } from "@/lib/cards";
import { isValidUuid } from "@/lib/card-storage";
import { getTemplateById } from "@/data/templates";
import type {
  CardEditorState,
  CreateCardDraftInput,
  CreationMode,
  DbCard,
} from "@/types/card";

export const ACTIVE_DRAFT_ID_KEY = "suprilo_active_draft_id_v1";
export const ACTIVE_DRAFT_SLUG_KEY = "suprilo_active_draft_slug_v1";

export type DraftSyncStatus = "idle" | "creating" | "created" | "error";

export interface UseCardDraftSyncOptions {
  user: { id: string; email?: string | null } | null;
  isActive: boolean;
  editorState: CardEditorState;
  templateParam?: string | null;
  client?: SupabaseClient;
}

export interface UseCardDraftSyncReturn {
  draftId: string | null;
  draftSlug: string | null;
  syncStatus: DraftSyncStatus;
  syncError: string | null;
  isLimitReached: boolean;
  retryCreateDraft: () => Promise<void>;
  clearActiveDraft: () => void;
}

export interface ModeTemplateConsistency {
  valid: boolean;
  error?: string;
  mode: CreationMode;
  templateId: string | null;
}

export interface DraftInitIdentity {
  creationMode: CreationMode;
  templateId: string | null;
  templateParam: string | null;
}

export interface DraftInitSnapshot {
  userId: string;
  editorState: CardEditorState;
  creationMode: CreationMode;
  templateId: string | null;
  templateParam: string | null;
}

/**
 * Validates consistency between editorState and any active route template parameter.
 * Prevents validating one mode/template and then sending a different mode/template in the database payload.
 */
export function validateModeTemplateConsistency(
  editorState: CardEditorState,
  templateParam?: string | null
): ModeTemplateConsistency {
  // 1. If a template query parameter is active
  if (templateParam) {
    const templateDef = getTemplateById(templateParam);
    if (!templateDef) {
      return {
        valid: false,
        error: `Invalid template "${templateParam}". Please select a valid template from the catalog.`,
        mode: "template",
        templateId: templateParam,
      };
    }

    if (editorState.creationMode !== "template") {
      return {
        valid: false,
        error: `Inconsistent editor state: template route requested "${templateParam}" but editor creationMode is "${editorState.creationMode}".`,
        mode: "template",
        templateId: templateParam,
      };
    }

    if (editorState.templateId !== templateParam) {
      return {
        valid: false,
        error: `Inconsistent editor state: template route requested "${templateParam}" but editor templateId is "${editorState.templateId ?? "null"}".`,
        mode: "template",
        templateId: templateParam,
      };
    }

    return {
      valid: true,
      mode: "template",
      templateId: templateParam,
    };
  }

  // 2. No templateParam: evaluate editorState directly
  if (editorState.creationMode === "template") {
    if (!editorState.templateId) {
      return {
        valid: false,
        error: `Inconsistent editor state: creationMode is "template" but templateId is missing or null.`,
        mode: "template",
        templateId: null,
      };
    }

    const templateDef = getTemplateById(editorState.templateId);
    if (!templateDef) {
      return {
        valid: false,
        error: `Invalid template "${editorState.templateId}". Please select a valid template from the catalog.`,
        mode: "template",
        templateId: editorState.templateId,
      };
    }

    return {
      valid: true,
      mode: "template",
      templateId: editorState.templateId,
    };
  }

  if (editorState.creationMode === "scratch") {
    if (editorState.templateId !== null) {
      return {
        valid: false,
        error: `Inconsistent editor state: creationMode is "scratch" but templateId is non-null ("${editorState.templateId}").`,
        mode: "scratch",
        templateId: null,
      };
    }

    return {
      valid: true,
      mode: "scratch",
      templateId: null,
    };
  }

  return {
    valid: false,
    error: `Unsupported creation mode: "${String(editorState.creationMode)}".`,
    mode: "scratch",
    templateId: null,
  };
}

/**
 * Safely loads the active draft ID from browser sessionStorage.
 */
export function loadActiveDraftId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(ACTIVE_DRAFT_ID_KEY);
    return id && id.trim().length > 0 ? id.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Safely loads the active draft slug from browser sessionStorage.
 */
export function loadActiveDraftSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const slug = sessionStorage.getItem(ACTIVE_DRAFT_SLUG_KEY);
    return slug && slug.trim().length > 0 ? slug.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Persists active draft identifiers to browser sessionStorage.
 */
export function saveActiveDraftSession(id: string, slug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ACTIVE_DRAFT_ID_KEY, id);
    sessionStorage.setItem(ACTIVE_DRAFT_SLUG_KEY, slug);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to save active draft session:", err);
    }
  }
}

/**
 * Clears active draft identifiers from browser sessionStorage.
 */
export function clearActiveDraftSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACTIVE_DRAFT_ID_KEY);
    sessionStorage.removeItem(ACTIVE_DRAFT_SLUG_KEY);
  } catch {}
}

/**
 * Inspects an error object to determine if the PostgreSQL 3-draft ceiling was triggered.
 */
export function isDraftLimitError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  return (
    /DRAFT_LIMIT_REACHED/i.test(message) ||
    (code === "check_violation" && /3 active drafts/i.test(message)) ||
    /maximum of 3 active drafts/i.test(message)
  );
}

/**
 * Maps the card editor's current state into a CreateCardDraftInput payload.
 *
 * Guarantees:
 * - photo_path is ALWAYS null during initial draft creation.
 *   Photo upload and setting the final photo_path belong to a later integration task,
 *   after the remote card ID exists.
 * - Local Data URLs, blob URLs, or previous card Storage paths are never persisted.
 */
export function mapEditorStateToDraftInput(
  state: CardEditorState
): CreateCardDraftInput {
  return {
    creation_mode: state.creationMode,
    template_id: state.templateId,
    recipient_name: state.recipientName || "Friend",
    sender_name: state.senderName || "Someone Special",
    occasion_tag: state.occasionTag || "Just Because",
    primary_message: state.primaryMessage || "A special surprise for you!",
    secondary_message: state.secondaryMessage || null,
    foil_style: state.foilStyle,
    cover_text: state.coverText,
    bg_palette: state.bgPalette,
    sticker: state.sticker,
    font_family: state.fontFamily || null,
    photo_path: null,
    reveal_threshold: 0.65,
    sound_enabled: state.soundEnabled,
  };
}

/**
 * Hook governing the initial draft creation and synchronization lifecycle.
 *
 * Guarantees:
 * 1. Creates a Supabase draft ONLY when: user is authenticated, editor is active (isActive = true),
 *    and no active draft ID is already associated with this session.
 * 2. Immutable Snapshot Invariance: captures an immutable snapshot of user ID, editorState, mode,
 *    templateId, and route templateParam at initialization start. Validation, matching, and RPC
 *    payload construction all strictly use the identical snapshot. Never reads newer unvalidated state.
 * 3. Inactive Editor & Logout Invalidation: whenever isActive changes to false or user logs out,
 *    any in-flight initialization is immediately invalidated via the generation token and the hook
 *    transitions to idle without adopting stale results or writing to sessionStorage. Valid existing
 *    drafts are preserved across temporary inactivity.
 * 4. Complete Identity Invalidation: changes to creationMode, templateId, OR route templateParam
 *    immediately cancel and invalidate any in-flight initialization before returning for hydration
 *    or error display.
 * 5. Invalid Template Parameter Safety: invalid template query parameters invalidate prior in-flight
 *    operations immediately; the completed stale request cannot overwrite the error or adopt its draft.
 * 6. Unrelated Field Invariance: typing into recipient name or message does not cancel or invalidate
 *    an in-flight operation.
 * 7. Strict Mode & Concurrent Guard: identical complete identity (mode, templateId, and templateParam)
 *    in-flight operations are awaited without duplicate RPC invocations.
 * 8. Photo Path Invariance: photo_path is unconditionally null in initial draft creation.
 */
export function useCardDraftSync({
  user,
  isActive,
  editorState,
  templateParam,
  client,
}: UseCardDraftSyncOptions): UseCardDraftSyncReturn {
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [draftSlug, setDraftSlug] = React.useState<string | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<DraftSyncStatus>("idle");
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = React.useState(false);

  // Request generation token to invalidate superseded / canceled in-flight requests
  const generationTokenRef = React.useRef(0);

  // Track the authenticated user ID associated with the current in-memory draft
  const currentUserIdRef = React.useRef<string | null>(user?.id || null);

  // Track full identity metadata of confirmed active draft
  const activeDraftMetadataRef = React.useRef<{
    id: string;
    creationMode: CreationMode;
    templateId: string | null;
    templateParam: string | null;
  } | null>(null);

  // Track the snapshot of the currently in-flight initialization
  const inFlightSnapshotRef = React.useRef<DraftInitSnapshot | null>(null);

  // In-flight concurrency guards for React Strict Mode & fast re-renders
  const inFlightRef = React.useRef(false);
  const inFlightPromiseRef = React.useRef<Promise<DbCard | null> | null>(null);
  const activeDraftIdRef = React.useRef<string | null>(null);

  // Track latest editorState, user, isActive, and templateParam in refs
  const editorStateRef = React.useRef(editorState);
  editorStateRef.current = editorState;
  const userRef = React.useRef(user);
  userRef.current = user;
  const isActiveRef = React.useRef(isActive);
  isActiveRef.current = isActive;
  const templateParamRef = React.useRef(templateParam);
  templateParamRef.current = templateParam;

  // Track previous identity (mode, template, and route templateParam) to detect route/editor changes
  const prevIdentityRef = React.useRef<DraftInitIdentity>({
    creationMode: editorState.creationMode,
    templateId: editorState.templateId,
    templateParam: templateParam ?? null,
  });

  // Account switching safety: invalidate previous user's draft state when user changes
  React.useEffect(() => {
    const previousUserId = currentUserIdRef.current;
    const currentUserId = user?.id || null;

    if (previousUserId !== currentUserId) {
      currentUserIdRef.current = currentUserId;

      // Invalidate any in-flight requests from the previous user
      generationTokenRef.current++;

      // Reset in-memory draft references and state
      activeDraftIdRef.current = null;
      activeDraftMetadataRef.current = null;
      inFlightRef.current = false;
      inFlightPromiseRef.current = null;
      inFlightSnapshotRef.current = null;
      setDraftId(null);
      setDraftSlug(null);
      setSyncStatus("idle");
      setSyncError(null);
      setIsLimitReached(false);

      // Clear any stored session draft from the previous user
      clearActiveDraftSession();
    }
  }, [user?.id]);

  const performDraftInitialization = React.useCallback(async () => {
    const activeUser = userRef.current;

    // 1. Guard against unauthenticated or inactive editor access
    if (!activeUser || !isActive) {
      setSyncStatus("idle");
      return;
    }

    // Capture an immutable snapshot at the beginning of the initialization operation
    const snapshot: DraftInitSnapshot = {
      userId: activeUser.id,
      editorState: { ...editorStateRef.current },
      creationMode: editorStateRef.current.creationMode,
      templateId: editorStateRef.current.templateId,
      templateParam: templateParamRef.current ?? null,
    };

    // 2. Strict enforcement of creation mode and template consistency on the captured snapshot
    const consistency = validateModeTemplateConsistency(
      snapshot.editorState,
      snapshot.templateParam
    );
    if (!consistency.valid) {
      setSyncStatus("error");
      setSyncError(consistency.error || "Inconsistent editor state.");
      return;
    }

    // 3. If an active confirmed draft already exists, ensure it matches this snapshot's full identity
    if (activeDraftIdRef.current) {
      if (
        activeDraftMetadataRef.current &&
        (activeDraftMetadataRef.current.creationMode !== snapshot.creationMode ||
          activeDraftMetadataRef.current.templateId !== snapshot.templateId ||
          activeDraftMetadataRef.current.templateParam !== snapshot.templateParam)
      ) {
        // Active draft was created for a different identity; discard it
        activeDraftIdRef.current = null;
        activeDraftMetadataRef.current = null;
        clearActiveDraftSession();
        setDraftId(null);
        setDraftSlug(null);
      } else {
        // Active draft matches current snapshot
        setSyncStatus("created");
        return;
      }
    }

    // 4. Concurrency guard: check if an initialization is already in flight
    if (inFlightRef.current && inFlightPromiseRef.current) {
      const inFlightSnap = inFlightSnapshotRef.current;
      // If the in-flight initialization has the exact same full identity, await it (React Strict Mode deduplication)
      if (
        inFlightSnap &&
        inFlightSnap.creationMode === snapshot.creationMode &&
        inFlightSnap.templateId === snapshot.templateId &&
        inFlightSnap.templateParam === snapshot.templateParam
      ) {
        try {
          await inFlightPromiseRef.current;
        } catch {}
        return;
      }

      // Full identity changed while in-flight! Invalidate the old operation.
      generationTokenRef.current++;
      inFlightRef.current = false;
      inFlightPromiseRef.current = null;
      inFlightSnapshotRef.current = null;
    }

    inFlightRef.current = true;
    inFlightSnapshotRef.current = snapshot;
    setSyncStatus("creating");
    setSyncError(null);
    setIsLimitReached(false);

    // Capture generation token for this specific execution
    const currentToken = ++generationTokenRef.current;

    const initPromise = (async (): Promise<DbCard | null> => {
      // Step A: Check sessionStorage for an existing active draft ID
      const storedId = loadActiveDraftId();

      if (storedId) {
        if (isValidUuid(storedId)) {
          try {
            const existingCard = await getCardById(storedId, client);

            // Stale check 1: check token, authenticated user ID, and active editor status before processing DB response
            if (
              currentToken !== generationTokenRef.current ||
              userRef.current?.id !== snapshot.userId ||
              !isActiveRef.current
            ) {
              return null;
            }

            // Verify ownership, draft status, and template/mode matching using the captured snapshot
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
                // Reusable matching draft belonging to this user
                setDraftId(existingCard.id);
                setDraftSlug(existingCard.slug);
                activeDraftIdRef.current = existingCard.id;
                activeDraftMetadataRef.current = {
                  id: existingCard.id,
                  creationMode: snapshot.creationMode,
                  templateId: snapshot.templateId,
                  templateParam: snapshot.templateParam,
                };
                saveActiveDraftSession(existingCard.id, existingCard.slug);
                setSyncStatus("created");
                return existingCard;
              }
            }

            // Stored draft is stale, owned by another user, published, or for different mode/template
            clearActiveDraftSession();
          } catch (validateErr) {
            if (
              currentToken !== generationTokenRef.current ||
              userRef.current?.id !== snapshot.userId ||
              !isActiveRef.current
            ) {
              return null;
            }
            const msg = validateErr instanceof Error ? validateErr.message : String(validateErr);
            if (/uuid|22P02|not found|PGRST116/i.test(msg)) {
              clearActiveDraftSession();
            } else {
              setSyncStatus("error");
              setSyncError(
                validateErr instanceof Error
                  ? validateErr.message
                  : "Unable to verify existing draft session."
              );
              throw validateErr;
            }
          }
        } else {
          clearActiveDraftSession();
        }
      }

      // Stale check 2: check token, authenticated user ID, and active status before invoking remote RPC
      if (
        currentToken !== generationTokenRef.current ||
        userRef.current?.id !== snapshot.userId ||
        !isActiveRef.current
      ) {
        return null;
      }

      // Step B: Create a brand new draft record in Supabase
      // MUST use snapshot.editorState — never read editorStateRef.current after an async wait!
      const draftInput = mapEditorStateToDraftInput(snapshot.editorState);
      const newCard = await createCardDraft(draftInput, client);

      // Stale check 3: check token, authenticated user ID, and active status after remote RPC completes
      if (
        currentToken !== generationTokenRef.current ||
        userRef.current?.id !== snapshot.userId ||
        !isActiveRef.current
      ) {
        // Operation was canceled, superseded, user switched, identity changed, or editor became inactive while RPC was in-flight.
        return null;
      }

      setDraftId(newCard.id);
      setDraftSlug(newCard.slug);
      activeDraftIdRef.current = newCard.id;
      activeDraftMetadataRef.current = {
        id: newCard.id,
        creationMode: snapshot.creationMode,
        templateId: snapshot.templateId,
        templateParam: snapshot.templateParam,
      };
      saveActiveDraftSession(newCard.id, newCard.slug);
      setSyncStatus("created");
      return newCard;
    })();

    inFlightPromiseRef.current = initPromise;

    try {
      await initPromise;
    } catch (err) {
      // Discard errors from stale operations
      if (
        currentToken !== generationTokenRef.current ||
        userRef.current?.id !== snapshot.userId ||
        !isActiveRef.current
      ) {
        return;
      }

      if (isDraftLimitError(err)) {
        setIsLimitReached(true);
        setSyncError(
          "Draft limit reached: You have 3 active drafts. Please publish or delete an existing draft to create a new one."
        );
      } else {
        setIsLimitReached(false);
        setSyncError(
          err instanceof Error
            ? err.message
            : "Failed to initialize card draft in Supabase."
        );
      }
      setSyncStatus("error");
    } finally {
      if (currentToken === generationTokenRef.current) {
        inFlightRef.current = false;
        inFlightPromiseRef.current = null;
        inFlightSnapshotRef.current = null;
      }
    }
  }, [isActive, client]);

  // Trigger initialization when editor becomes active for authenticated user
  React.useEffect(() => {
    // If not active or unauthenticated, reset to idle and invalidate any in-flight initialization
    if (!isActive || !user) {
      if (inFlightRef.current) {
        generationTokenRef.current++;
        inFlightRef.current = false;
        inFlightPromiseRef.current = null;
        inFlightSnapshotRef.current = null;
      }
      setSyncStatus("idle");
      return;
    }

    const normalizedTemplateParam = templateParam ?? null;

    // Check if creationMode, templateId, or route templateParam changed since last run
    const prev = prevIdentityRef.current;
    const identityChanged =
      prev.creationMode !== editorState.creationMode ||
      prev.templateId !== editorState.templateId ||
      prev.templateParam !== normalizedTemplateParam;

    if (identityChanged) {
      prevIdentityRef.current = {
        creationMode: editorState.creationMode,
        templateId: editorState.templateId,
        templateParam: normalizedTemplateParam,
      };

      // Invalidate any in-flight initialization immediately when identity changes
      if (inFlightRef.current) {
        generationTokenRef.current++;
        inFlightRef.current = false;
        inFlightPromiseRef.current = null;
        inFlightSnapshotRef.current = null;
      }

      // If active draft does not match the new identity, clear it
      if (
        activeDraftMetadataRef.current &&
        (activeDraftMetadataRef.current.creationMode !== editorState.creationMode ||
          activeDraftMetadataRef.current.templateId !== editorState.templateId ||
          activeDraftMetadataRef.current.templateParam !== normalizedTemplateParam)
      ) {
        activeDraftIdRef.current = null;
        activeDraftMetadataRef.current = null;
        setDraftId(null);
        setDraftSlug(null);
        clearActiveDraftSession();
        setSyncStatus("idle");
      }
    }

    // Validate template query parameter if provided
    if (normalizedTemplateParam) {
      const templateDef = getTemplateById(normalizedTemplateParam);
      if (!templateDef) {
        // In-flight operation was already invalidated above when identityChanged was detected
        setSyncStatus("error");
        setSyncError(`Invalid template "${normalizedTemplateParam}". Please select a valid template from the catalog.`);
        return;
      }

      // If templateParam is valid but editorState has not yet hydrated it, wait for next render tick
      if (editorState.creationMode !== "template" || editorState.templateId !== normalizedTemplateParam) {
        return;
      }
    }

    // Trigger draft initialization
    void performDraftInitialization();
  }, [
    isActive,
    user,
    templateParam,
    editorState.creationMode,
    editorState.templateId,
    performDraftInitialization,
  ]);

  // Explicit retry handler for recovery after transient errors or limit clearance
  const retryCreateDraft = React.useCallback(async () => {
    setSyncError(null);
    setIsLimitReached(false);
    await performDraftInitialization();
  }, [performDraftInitialization]);

  // Clear active draft handler for mode reset or new card creation
  const clearActiveDraft = React.useCallback(() => {
    // Invalidate any in-flight requests immediately
    generationTokenRef.current++;

    clearActiveDraftSession();
    activeDraftIdRef.current = null;
    activeDraftMetadataRef.current = null;
    inFlightRef.current = false;
    inFlightPromiseRef.current = null;
    inFlightSnapshotRef.current = null;
    setDraftId(null);
    setDraftSlug(null);
    setSyncStatus("idle");
    setSyncError(null);
    setIsLimitReached(false);
  }, []);

  return {
    draftId,
    draftSlug,
    syncStatus,
    syncError,
    isLimitReached,
    retryCreateDraft,
    clearActiveDraft,
  };
}
