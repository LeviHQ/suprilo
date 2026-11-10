"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface DeleteAccountConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedDisplayName: string;
}

export function DeleteAccountConfirmModal({
  isOpen,
  onClose,
  expectedDisplayName,
}: DeleteAccountConfirmModalProps) {
  const router = useRouter();
  const { signOutUser } = useAuth();

  const [inputName, setInputName] = React.useState("");
  const [inputDelete, setInputDelete] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reset inputs on open/close
  React.useEffect(() => {
    if (!isOpen) {
      setInputName("");
      setInputDelete("");
      setErrorMessage(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Lock body scroll and handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isDeleting]);

  const isNameMatched = inputName.trim() === expectedDisplayName.trim();
  const isDeleteMatched = inputDelete.trim() === "DELETE";
  const canSubmit = isNameMatched && isDeleteMatched && !isDeleting;

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          confirmationName: inputName.trim(),
          confirmationWord: inputDelete.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to delete account. Please try again.");
      }

      // Terminate client session and navigate to home
      await signOutUser();
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error executing account deletion";
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/70 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 id="delete-account-title" className="text-lg font-bold text-rose-950 tracking-tight">
                Permanent Account Deletion
              </h3>
              <p className="text-xs text-rose-600/90 font-medium">Irreversible destructive action</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete modal"
            className="p-1.5 text-brand-muted hover:text-brand-dark rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Callout */}
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-rose-950">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Warning: Everything will be permanently erased</span>
          </div>
          <p className="leading-relaxed">
            All your created scratch cards, uploaded media attachments, recipient metrics, badges, and gamification points will be deleted immediately and cannot be recovered.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-100/70 border border-rose-300 text-xs text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dual-Input Verification Form */}
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          {/* Step 1: Current Creator Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-dark">
              1. Type your creator name <span className="font-mono text-rose-600 font-bold select-all">&ldquo;{expectedDisplayName}&rdquo;</span> to confirm:
            </label>
            <input
              type="text"
              value={inputName}
              disabled={isDeleting}
              onChange={(e) => setInputName(e.target.value)}
              placeholder={expectedDisplayName}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          {/* Step 2: Confirmation Word "DELETE" */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-dark">
              2. Type <span className="font-mono text-rose-600 font-bold select-all">&ldquo;DELETE&rdquo;</span> in uppercase:
            </label>
            <input
              type="text"
              value={inputDelete}
              disabled={isDeleting}
              onChange={(e) => setInputDelete(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 justify-center text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={!canSubmit}
              className="flex-1 justify-center gap-2 text-xs bg-rose-600 text-white hover:bg-rose-700 border-transparent shadow-md disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting Account...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

