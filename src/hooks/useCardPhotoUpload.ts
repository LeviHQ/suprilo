"use client";

import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validatePhotoFile,
  type PhotoUploadStatus,
} from "@/lib/photo-validation";
import {
  uploadCardPhoto,
  deleteCardPhoto,
} from "@/lib/card-storage";
import { updateCardDraft } from "@/lib/cards";

export type { PhotoUploadStatus };

export interface SavePhotoPathResult {
  success: boolean;
  isStale: boolean;
}

export interface UseCardPhotoUploadOptions {
  draftId: string | null;
  isDraftReady: boolean;
  user: { id: string; email?: string | null } | null;
  isActive: boolean;
  currentPhotoPath?: string | null;
  onPhotoUploaded: (photoPath: string) => void;
  onPhotoRemoved: () => void;
  onPreviewReady: (previewUrl: string) => void;
  savePhotoPath?: (
    photoPath: string | null
  ) => Promise<SavePhotoPathResult | void>;
  client?: SupabaseClient;
}

export interface UseCardPhotoUploadReturn {
  uploadStatus: PhotoUploadStatus;
  uploadError: string | null;
  selectedFile: File | null;
  handleFileSelect: (file: File) => Promise<void>;
  retryUpload: () => Promise<void>;
  removePhoto: () => Promise<void>;
  clearUploadError: () => void;
}

/**
 * Hook governing photo upload lifecycle for the Suprilo card editor.
 *
 * Guarantees (Task 2C-5.3.3 Lifecycle Isolation & Storage Ordering Fix):
 * 1. Immediate local preview (Data URL) under scratch foil before upload completes.
 * 2. Strict file validation (2MB limit, JPEG/PNG/WebP, non-empty) before upload.
 * 3. Uploads exclusively to private `card-photos` bucket using canonical path:
 *    {user_id}/{card_id}/{filename}
 * 4. Never initiates upload before a confirmed remote `draftId` exists.
 * 5. Prevents duplicate uploads for the exact same file.
 * 6. Photo replacement data integrity & lifecycle isolation:
 *    - Upload new photo to Storage.
 *    - Save new path to PostgreSQL draft via autosave infrastructure.
 *    - Confirm database update succeeds.
 *    - Recheck token, draft ID, user ID, and active status: if stale, do NOT call
 *      onPhotoUploaded, do NOT alter new editor state, do NOT delete old photo of new draft.
 *    - ONLY THEN delete previous Storage object of the originating draft.
 *    - If database update fails, retain previous photo and do NOT delete its Storage object.
 *    - Preserve new local preview and allow retry.
 * 7. Photo removal data integrity & lifecycle isolation:
 *    - Save photo_path: null to PostgreSQL successfully.
 *    - Recheck token, draft ID, user ID, and active status.
 *    - ONLY after successful database persistence, delete old Storage object.
 *    - If database update fails, retain old Storage object, expose retryable error,
 *      and do NOT leave editor showing successful removal.
 *    - Stale removal never calls onPhotoRemoved on a different draft/account.
 * 8. Superseded upload protection: if user selects a new photo while upload is running,
 *    the older upload is discarded and its Storage object is safely cleaned up.
 * 9. Safe draft switching and logout: invalidates in-flight uploads.
 */
export function useCardPhotoUpload({
  draftId,
  isDraftReady,
  user,
  isActive,
  currentPhotoPath,
  onPhotoUploaded,
  onPhotoRemoved,
  onPreviewReady,
  savePhotoPath,
  client,
}: UseCardPhotoUploadOptions): UseCardPhotoUploadReturn {
  const [uploadStatus, setUploadStatus] = React.useState<PhotoUploadStatus>(() => {
    return currentPhotoPath ? "uploaded" : "idle";
  });
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Invalidation & lifecycle tracking tokens
  const uploadTokenRef = React.useRef(0);
  const activeDraftIdRef = React.useRef<string | null>(draftId);
  const activeUserIdRef = React.useRef<string | null>(user?.id ?? null);
  const isActiveRef = React.useRef(isActive);
  const isDraftReadyRef = React.useRef(isDraftReady);
  const clientRef = React.useRef(client);
  const currentPhotoPathRef = React.useRef(currentPhotoPath);
  const lastUploadedSigRef = React.useRef<string | null>(null);
  const pendingFileRef = React.useRef<File | null>(null);
  const selectedFileRef = React.useRef<File | null>(null);
  const stagedUploadPathRef = React.useRef<string | null>(null);
  const lastFailedActionRef = React.useRef<"upload" | "remove" | null>(null);
  const savePhotoPathRef = React.useRef(savePhotoPath);

  // Keep references current on each render
  activeDraftIdRef.current = draftId;
  activeUserIdRef.current = user?.id ?? null;
  isActiveRef.current = isActive;
  isDraftReadyRef.current = isDraftReady;
  clientRef.current = client;
  currentPhotoPathRef.current = currentPhotoPath;
  selectedFileRef.current = selectedFile;
  savePhotoPathRef.current = savePhotoPath;

  // Persistence bridge to PostgreSQL draft with staleness detection
  const doSavePhotoPath = React.useCallback(
    async (
      targetDraftId: string,
      targetUserId: string,
      path: string | null
    ): Promise<SavePhotoPathResult> => {
      // Pre-check staleness before initiating network call
      if (
        activeDraftIdRef.current !== targetDraftId ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current
      ) {
        return { success: false, isStale: true };
      }

      if (savePhotoPathRef.current) {
        const res = await savePhotoPathRef.current(path);
        if (res && typeof res === "object" && "isStale" in res) {
          return res as SavePhotoPathResult;
        }
        // Fallback staleness check if savePhotoPath returned void
        const isStale =
          activeDraftIdRef.current !== targetDraftId ||
          activeUserIdRef.current !== targetUserId ||
          !isActiveRef.current;
        return { success: true, isStale };
      } else {
        await updateCardDraft(
          targetDraftId,
          { photo_path: path },
          clientRef.current
        );
        const isStale =
          activeDraftIdRef.current !== targetDraftId ||
          activeUserIdRef.current !== targetUserId ||
          !isActiveRef.current;
        return { success: true, isStale };
      }
    },
    []
  );

  // 1. Account switching safety
  React.useEffect(() => {
    uploadTokenRef.current++;
    if (stagedUploadPathRef.current) {
      deleteCardPhoto(stagedUploadPathRef.current, clientRef.current).catch(() => {});
      stagedUploadPathRef.current = null;
    }
    pendingFileRef.current = null;
    selectedFileRef.current = null;
    setSelectedFile(null);
    setUploadError(null);
    lastUploadedSigRef.current = null;
    lastFailedActionRef.current = null;
    setUploadStatus("idle");
  }, [user?.id]);

  // 2. Draft switching safety
  React.useEffect(() => {
    uploadTokenRef.current++;
    if (stagedUploadPathRef.current) {
      deleteCardPhoto(stagedUploadPathRef.current, clientRef.current).catch(() => {});
      stagedUploadPathRef.current = null;
    }
    pendingFileRef.current = null;
    selectedFileRef.current = null;
    setSelectedFile(null);
    setUploadError(null);
    lastUploadedSigRef.current = null;
    lastFailedActionRef.current = null;
    setUploadStatus(currentPhotoPath ? "uploaded" : "idle");
  }, [draftId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Inactivity safety: cancel pending upload indicators if editor is deactivated
  React.useEffect(() => {
    if (!isActive) {
      uploadTokenRef.current++;
      pendingFileRef.current = null;
      if (stagedUploadPathRef.current) {
        deleteCardPhoto(stagedUploadPathRef.current, clientRef.current).catch(() => {});
        stagedUploadPathRef.current = null;
      }
      setUploadStatus((prev) => (prev === "uploading" ? "idle" : prev));
    }
  }, [isActive]);

  // 4. Core upload execution function with safe ordering and strict lifecycle checks
  const executeUpload = React.useCallback(
    async (file: File, targetDraftId: string, targetUserId: string) => {
      const token = ++uploadTokenRef.current;
      setUploadStatus("uploading");
      setUploadError(null);
      lastFailedActionRef.current = "upload";

      const fileSig = `${targetDraftId}:${file.name}:${file.size}:${file.lastModified}`;
      // Capture the old photo belonging to targetDraftId before initiating async operations
      const initialPhotoPathToReplace = currentPhotoPathRef.current;

      try {
        // Step 1: Upload the new photo to private Storage
        const result = await uploadCardPhoto(
          targetDraftId,
          file,
          clientRef.current
        );

        // Pre-DB staleness check: has user switched drafts, accounts, or deactivated?
        const isStaleAfterUpload =
          token !== uploadTokenRef.current ||
          activeDraftIdRef.current !== targetDraftId ||
          activeUserIdRef.current !== targetUserId ||
          !isActiveRef.current;

        if (isStaleAfterUpload) {
          // Orphan cleanup: safely delete the newly uploaded object
          deleteCardPhoto(result.photoPath, clientRef.current).catch(() => {});
          return;
        }

        // Track newly uploaded path in case saving to DB fails
        stagedUploadPathRef.current = result.photoPath;

        // Step 2 & 3: Save actual Storage path to PostgreSQL draft and confirm success
        const saveResult = await doSavePhotoPath(
          targetDraftId,
          targetUserId,
          result.photoPath
        );

        // Post-DB staleness check: recheck token, draft ID, user ID, active state, and saveResult.isStale
        const isStaleAfterDb =
          token !== uploadTokenRef.current ||
          activeDraftIdRef.current !== targetDraftId ||
          activeUserIdRef.current !== targetUserId ||
          !isActiveRef.current ||
          saveResult.isStale;

        if (isStaleAfterDb) {
          // If DB update succeeded for targetDraftId, targetDraftId now references result.photoPath.
          // Clean up targetDraftId's old photo:
          if (saveResult.success) {
            if (
              initialPhotoPathToReplace &&
              initialPhotoPathToReplace !== result.photoPath
            ) {
              deleteCardPhoto(
                initialPhotoPathToReplace,
                clientRef.current
              ).catch(() => {});
            }
          } else {
            // DB update was not performed; delete uploaded object
            deleteCardPhoto(result.photoPath, clientRef.current).catch(() => {});
          }

          if (stagedUploadPathRef.current === result.photoPath) {
            stagedUploadPathRef.current = null;
          }

          // CRITICAL:
          // - Do not call onPhotoUploaded
          // - Do not modify the new editor's state
          // - Do not delete an old photo belonging to another draft
          // - Do not incorrectly mark the current editor as uploaded
          return;
        }

        // Step 4: ONLY THEN delete the previous Storage object of targetDraftId
        if (
          initialPhotoPathToReplace &&
          initialPhotoPathToReplace !== result.photoPath
        ) {
          deleteCardPhoto(
            initialPhotoPathToReplace,
            clientRef.current
          ).catch(() => {});
        }

        stagedUploadPathRef.current = null;
        currentPhotoPathRef.current = result.photoPath;
        lastUploadedSigRef.current = fileSig;
        lastFailedActionRef.current = null;
        setUploadStatus("uploaded");
        setUploadError(null);
        onPhotoUploaded(result.photoPath);
      } catch (err) {
        const isStaleOnError =
          token !== uploadTokenRef.current ||
          activeDraftIdRef.current !== targetDraftId ||
          activeUserIdRef.current !== targetUserId ||
          !isActiveRef.current;

        if (isStaleOnError) {
          return;
        }

        // Step 5: If database update fails, retain previous photo and do NOT delete its Storage object
        // Step 6: Preserve new local preview and allow retry
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to upload photo. Please try again.";
        setUploadStatus("error");
        setUploadError(errorMsg);
      }
    },
    [doSavePhotoPath, onPhotoUploaded]
  );

  // 5. Automatic execution when draftId transitions to ready
  React.useEffect(() => {
    if (
      isActive &&
      user &&
      draftId &&
      isDraftReady &&
      pendingFileRef.current
    ) {
      const file = pendingFileRef.current;
      pendingFileRef.current = null;
      void executeUpload(file, draftId, user.id);
    }
  }, [isActive, user, draftId, isDraftReady, executeUpload]);

  // 6. Handle initial selection of a file from input
  const handleFileSelect = React.useCallback(
    async (file: File) => {
      if (!file) return;

      // Pure validation
      const validation = validatePhotoFile(file);
      if (!validation.valid) {
        setUploadStatus("error");
        setUploadError(validation.error || "Please select a valid image file.");
        return;
      }

      setUploadError(null);
      setSelectedFile(file);

      // Immediate local preview generation
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        if (previewUrl) {
          onPreviewReady(previewUrl);
        }
      };
      reader.onerror = () => {
        setUploadStatus("error");
        setUploadError("Failed to read image file for preview.");
      };
      reader.readAsDataURL(file);

      // Check duplicate upload for this draft
      const currentDraftId = activeDraftIdRef.current;
      const fileSig = `${currentDraftId}:${file.name}:${file.size}:${file.lastModified}`;
      if (
        lastUploadedSigRef.current === fileSig &&
        currentPhotoPathRef.current
      ) {
        setUploadStatus("uploaded");
        return;
      }

      // Check readiness
      const currentUserId = activeUserIdRef.current;
      const isReady =
        isActiveRef.current &&
        Boolean(currentUserId) &&
        Boolean(currentDraftId) &&
        isDraftReadyRef.current;

      if (!isReady || !currentDraftId || !currentUserId) {
        // Enqueue file for upload once draftId is confirmed
        pendingFileRef.current = file;
        setUploadStatus("uploading");
        return;
      }

      await executeUpload(file, currentDraftId, currentUserId);
    },
    [onPreviewReady, executeUpload]
  );

  // 7. Remove photo action with strict database persistence first and lifecycle safety
  const removePhoto = React.useCallback(async () => {
    const targetDraftId = activeDraftIdRef.current;
    const targetUserId = activeUserIdRef.current;
    const pathToClean = currentPhotoPathRef.current;

    if (!targetDraftId || !targetUserId || !isActiveRef.current) {
      return;
    }

    // If no remote photo exists, simply reset local state
    if (!pathToClean) {
      uploadTokenRef.current++;
      pendingFileRef.current = null;
      selectedFileRef.current = null;
      setSelectedFile(null);
      stagedUploadPathRef.current = null;
      lastUploadedSigRef.current = null;
      lastFailedActionRef.current = null;
      setUploadStatus("idle");
      setUploadError(null);
      onPhotoRemoved();
      return;
    }

    // Invalidate competing photo operations
    const token = ++uploadTokenRef.current;
    setUploadStatus("uploading");
    setUploadError(null);
    lastFailedActionRef.current = "remove";

    try {
      // Step 1: Save photo_path: null to PostgreSQL successfully
      const saveResult = await doSavePhotoPath(
        targetDraftId,
        targetUserId,
        null
      );

      // Verify the original operation still belongs to the same draft and user
      const isStale =
        token !== uploadTokenRef.current ||
        activeDraftIdRef.current !== targetDraftId ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current ||
        saveResult.isStale;

      if (isStale) {
        // If DB update succeeded for targetDraftId, delete targetDraftId's old Storage object
        if (saveResult.success) {
          await deleteCardPhoto(pathToClean, clientRef.current);
        }

        // CRITICAL:
        // - Never call onPhotoRemoved() on a different draft or account
        // - Never delete an object belonging to a different operation
        // - Do NOT modify new editor's state
        return;
      }

      // Step 2: Only after successful database persistence, delete old Storage object
      await deleteCardPhoto(pathToClean, clientRef.current);

      // Recheck staleness immediately after Storage deletion settles
      const isStaleAfterStorage =
        token !== uploadTokenRef.current ||
        activeDraftIdRef.current !== targetDraftId ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current;

      if (isStaleAfterStorage) {
        // Return without changing current editor state or calling onPhotoRemoved()
        return;
      }

      // Success: update state & notify parent
      pendingFileRef.current = null;
      selectedFileRef.current = null;
      setSelectedFile(null);
      stagedUploadPathRef.current = null;
      lastUploadedSigRef.current = null;
      lastFailedActionRef.current = null;
      currentPhotoPathRef.current = null;
      setUploadStatus("idle");
      setUploadError(null);
      onPhotoRemoved();
    } catch (err) {
      const isStaleOnError =
        token !== uploadTokenRef.current ||
        activeDraftIdRef.current !== targetDraftId ||
        activeUserIdRef.current !== targetUserId ||
        !isActiveRef.current;

      if (isStaleOnError) {
        return;
      }

      // Step 3: If database update fails:
      // - Retain old Storage object (deleteCardPhoto NOT called)
      // - Expose retryable error
      // - Step 4: Do NOT leave editor showing successful removal
      const msg =
        err instanceof Error ? err.message : "Failed to remove photo.";
      setUploadStatus("error");
      setUploadError(`Failed to remove photo: ${msg}`);
      // onPhotoRemoved() is intentionally NOT called; preview and draft remain intact
    }
  }, [doSavePhotoPath, onPhotoRemoved]);

  // 8. Retry failed action (upload or removal)
  const retryUpload = React.useCallback(async () => {
    // If removal failed, retry removal
    if (lastFailedActionRef.current === "remove") {
      await removePhoto();
      return;
    }

    const currentDraftId = activeDraftIdRef.current;
    const currentUserId = activeUserIdRef.current;

    if (
      !isActiveRef.current ||
      !currentUserId ||
      !currentDraftId ||
      !isDraftReadyRef.current
    ) {
      if (selectedFileRef.current) {
        pendingFileRef.current = selectedFileRef.current;
        setUploadStatus("uploading");
      }
      return;
    }

    // If new photo was already uploaded to Storage and waiting for DB save
    if (stagedUploadPathRef.current) {
      const token = ++uploadTokenRef.current;
      setUploadStatus("uploading");
      setUploadError(null);
      const newPath = stagedUploadPathRef.current;
      const initialOldPath = currentPhotoPathRef.current;

      try {
        const saveResult = await doSavePhotoPath(
          currentDraftId,
          currentUserId,
          newPath
        );

        const isStale =
          token !== uploadTokenRef.current ||
          activeDraftIdRef.current !== currentDraftId ||
          activeUserIdRef.current !== currentUserId ||
          !isActiveRef.current ||
          saveResult.isStale;

        if (isStale) {
          if (saveResult.success) {
            if (initialOldPath && initialOldPath !== newPath) {
              deleteCardPhoto(initialOldPath, clientRef.current).catch(() => {});
            }
          }
          return;
        }

        // Success: only then delete previous photo
        if (initialOldPath && initialOldPath !== newPath) {
          deleteCardPhoto(initialOldPath, clientRef.current).catch(() => {});
        }

        stagedUploadPathRef.current = null;
        currentPhotoPathRef.current = newPath;
        lastFailedActionRef.current = null;
        setUploadStatus("uploaded");
        setUploadError(null);
        onPhotoUploaded(newPath);
        return;
      } catch (err) {
        const isStaleOnError =
          token !== uploadTokenRef.current ||
          activeDraftIdRef.current !== currentDraftId ||
          activeUserIdRef.current !== currentUserId ||
          !isActiveRef.current;

        if (isStaleOnError) return;

        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to save photo to draft. Please try again.";
        setUploadStatus("error");
        setUploadError(errorMsg);
        return;
      }
    }

    // Otherwise, retry full upload with selectedFile
    const file = selectedFileRef.current;
    if (file) {
      await executeUpload(file, currentDraftId, currentUserId);
    }
  }, [doSavePhotoPath, onPhotoUploaded, removePhoto, executeUpload]);

  // 9. Clear upload error banner
  const clearUploadError = React.useCallback(() => {
    setUploadError(null);
    if (uploadStatus === "error") {
      setUploadStatus(currentPhotoPathRef.current ? "uploaded" : "idle");
    }
  }, [uploadStatus]);

  return {
    uploadStatus,
    uploadError,
    selectedFile,
    handleFileSelect,
    retryUpload,
    removePhoto,
    clearUploadError,
  };
}
