"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publishCardDraft, buildCardShareUrl } from "@/lib/cards";
import type { DbCard } from "@/types/card";
import type { AutosaveStatus } from "./useCardAutosave";
import type { PhotoUploadStatus } from "./useCardPhotoUpload";

export type PublishStatus = "idle" | "publishing" | "published" | "error";

export interface UseCardPublishOptions {
  draftId: string | null;
  isDraftReady: boolean;
  user: { id: string; email?: string | null } | null;
  isActive: boolean;
  saveStatus: AutosaveStatus;
  saveError: string | null;
  flushAutosave: () => Promise<{ success: boolean; error?: string }>;
  uploadStatus: PhotoUploadStatus;
  uploadError: string | null;
  client?: SupabaseClient;
  onPublished?: (card: DbCard, shareUrl: string) => void;
}

export interface UseCardPublishReturn {
  publishStatus: PublishStatus;
  publishError: string | null;
  publishedCard: DbCard | null;
  publishedUrl: string | null;
  isPublishing: boolean;
  publishCard: (overrideDraftId?: string) => Promise<boolean>;
  clearPublishError: () => void;
  resetPublishState: () => void;
}

/**
 * Hook governing the card publishing lifecycle for the Suprilo card editor.
 *
 * Guarantees (Task 2C-5.3.4 Supabase Publish Integration):
 * 1. Requires authenticated user and confirmed, ready remote draft ID before invoking RPC.
 * 2. Concurrency guard: prevents duplicate requests while publishing is in flight.
 * 3. Atomic pre-persistence flush: flushes and awaits any pending autosave edits before RPC.
 * 4. Photo upload guard: blocks publishing while photo upload/removal is running or failed.
 * 5. Calls database stored procedure `public.publish_card_draft(p_card_id)` exclusively.
 * 6. Never generates fake slugs or demo URLs; constructs canonical share URL from returned slug.
 * 7. Lifecycle safety:
 *    - In-flight operations invalidated on user logout, account switch, draft switch, or deactivation.
 *    - Stale responses cannot mark a newer editor as published or overwrite newer editor state.
 * 8. Error resilience: preserves editor state on failure and exposes clear, retryable errors.
 */
export function useCardPublish({
  draftId,
  isDraftReady,
  user,
  isActive,
  saveStatus,
  saveError,
  flushAutosave,
  uploadStatus,
  uploadError,
  client,
  onPublished,
}: UseCardPublishOptions): UseCardPublishReturn {
  const [publishStatus, setPublishStatus] = React.useState<PublishStatus>("idle");
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [publishedCard, setPublishedCard] = React.useState<DbCard | null>(null);
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null);

  // Invalidation & lifecycle tokens
  const publishTokenRef = React.useRef(0);
  const activeDraftIdRef = React.useRef<string | null>(draftId);
  const activeUserIdRef = React.useRef<string | null>(user?.id ?? null);
  const isActiveRef = React.useRef(isActive);
  const isDraftReadyRef = React.useRef(isDraftReady);
  const saveStatusRef = React.useRef(saveStatus);
  const saveErrorRef = React.useRef(saveError);
  const uploadStatusRef = React.useRef(uploadStatus);
  const uploadErrorRef = React.useRef(uploadError);
  const flushAutosaveRef = React.useRef(flushAutosave);
  const clientRef = React.useRef(client);
  const onPublishedRef = React.useRef(onPublished);
  // Concurrency lock ownership: tracks the exact request token that currently holds the lock
  const inFlightTokenRef = React.useRef<number | null>(null);

  // Keep references current on every render
  activeDraftIdRef.current = draftId;
  activeUserIdRef.current = user?.id ?? null;
  isActiveRef.current = isActive;
  isDraftReadyRef.current = isDraftReady;
  saveStatusRef.current = saveStatus;
  saveErrorRef.current = saveError;
  uploadStatusRef.current = uploadStatus;
  uploadErrorRef.current = uploadError;
  flushAutosaveRef.current = flushAutosave;
  clientRef.current = client;
  onPublishedRef.current = onPublished;

  // 1. Account switching safety: invalidate old request and release lock for the new account
  React.useEffect(() => {
    publishTokenRef.current++;
    inFlightTokenRef.current = null;
    setPublishStatus("idle");
    setPublishError(null);
    setPublishedCard(null);
    setPublishedUrl(null);
  }, [user?.id]);

  // 2. Draft switching safety: invalidate old request and release lock for the new draft
  React.useEffect(() => {
    publishTokenRef.current++;
    inFlightTokenRef.current = null;
    setPublishStatus("idle");
    setPublishError(null);
    setPublishedCard(null);
    setPublishedUrl(null);
  }, [draftId]);

  // 3. Inactivity safety
  React.useEffect(() => {
    if (!isActive) {
      publishTokenRef.current++;
      setPublishStatus((prev) => (prev === "publishing" ? "idle" : prev));
    }
  }, [isActive]);

  // 4. Primary publish action handler
  const publishCard = React.useCallback(async (overrideDraftId?: string): Promise<boolean> => {
    // Duplicate click guard: block if another publish request is actively in-flight
    if (inFlightTokenRef.current !== null) {
      return false;
    }

    // Idempotent guard: if already published for this exact draft, reuse existing share URL
    if (
      publishStatus === "published" &&
      publishedCard &&
      publishedCard.id === (overrideDraftId || activeDraftIdRef.current)
    ) {
      return true;
    }

    const targetDraftId = overrideDraftId || activeDraftIdRef.current;
    const targetUserId = activeUserIdRef.current;

    // Authentication guard
    if (!targetUserId) {
      setPublishStatus("error");
      setPublishError("Please sign in to publish your card.");
      return false;
    }

    // Confirmed remote draft readiness guard
    if (!targetDraftId || (!overrideDraftId && !isDraftReadyRef.current)) {
      setPublishStatus("error");
      setPublishError("Draft is not ready to publish. Please wait for draft sync.");
      return false;
    }

    // Active editor guard
    if (!isActiveRef.current) {
      return false;
    }

    // Photo upload guard
    const getUploadStatus = (): PhotoUploadStatus => uploadStatusRef.current;
    if (getUploadStatus() === "uploading") {
      setPublishStatus("error");
      setPublishError("Please wait for your photo to finish uploading before publishing.");
      return false;
    }

    if (getUploadStatus() === "error") {
      setPublishStatus("error");
      setPublishError(
        uploadErrorRef.current || "Please resolve the photo upload error before publishing."
      );
      return false;
    }

    // Autosave error guard
    if (saveStatusRef.current === "error") {
      setPublishStatus("error");
      setPublishError(
        saveErrorRef.current || "Please resolve draft save errors before publishing."
      );
      return false;
    }

    const token = ++publishTokenRef.current;
    inFlightTokenRef.current = token;
    setPublishStatus("publishing");
    setPublishError(null);

    try {
      // Step A: Flush any pending debounced autosave to PostgreSQL
      const flushResult = await flushAutosaveRef.current();

      // Staleness check after autosave flush
      const isStaleAfterFlush =
        token !== publishTokenRef.current ||
        (!overrideDraftId && activeDraftIdRef.current !== targetDraftId) ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current;

      if (isStaleAfterFlush) {
        return false;
      }

      if (!flushResult.success) {
        setPublishStatus("error");
        setPublishError(
          flushResult.error || "Failed to save latest changes before publishing."
        );
        return false;
      }

      // Re-verify photo upload hasn't started during flush
      if (getUploadStatus() === "uploading") {
        setPublishStatus("error");
        setPublishError("Please wait for your photo to finish uploading before publishing.");
        return false;
      }
      if (getUploadStatus() === "error") {
        setPublishStatus("error");
        setPublishError(
          uploadErrorRef.current || "Please resolve the photo upload error before publishing."
        );
        return false;
      }

      // Step B: Invoke atomic stored procedure public.publish_card_draft(p_card_id)
      const published = await publishCardDraft(targetDraftId, clientRef.current);

      // Post-RPC staleness check
      const isStaleAfterRpc =
        token !== publishTokenRef.current ||
        (!overrideDraftId && activeDraftIdRef.current !== targetDraftId) ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current;

      if (isStaleAfterRpc) {
        // Do not update state for a newer/different editor context
        return false;
      }

      // Step C: Construct canonical recipient share URL from returned slug
      const shareUrl = buildCardShareUrl(published.slug);

      setPublishedCard(published);
      setPublishedUrl(shareUrl);
      setPublishStatus("published");
      setPublishError(null);
      onPublishedRef.current?.(published, shareUrl);
      return true;
    } catch (err) {
      const isStaleOnError =
        token !== publishTokenRef.current ||
        activeDraftIdRef.current !== targetDraftId ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current;

      if (isStaleOnError) {
        return false;
      }

      const rawMsg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
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

      setPublishStatus("error");
      setPublishError(msg);
      return false;
    } finally {
      // Concurrency lock ownership: only the request that currently owns the lock may release it
      if (inFlightTokenRef.current === token) {
        inFlightTokenRef.current = null;
      }
    }
  }, [publishStatus, publishedCard]);

  const clearPublishError = React.useCallback(() => {
    setPublishError(null);
    if (publishStatus === "error") {
      setPublishStatus("idle");
    }
  }, [publishStatus]);

  const resetPublishState = React.useCallback(() => {
    publishTokenRef.current++;
    inFlightTokenRef.current = null;
    setPublishStatus("idle");
    setPublishError(null);
    setPublishedCard(null);
    setPublishedUrl(null);
  }, []);

  return {
    publishStatus,
    publishError,
    publishedCard,
    publishedUrl,
    isPublishing: publishStatus === "publishing",
    publishCard,
    clearPublishError,
    resetPublishState,
  };
}
