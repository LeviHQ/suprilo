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
  Copy,
  Check,
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
  const [copiedName, setCopiedName] = React.useState(false);
  const [copiedDelete, setCopiedDelete] = React.useState(false);

  const handleCopy = async (text: string, type: "name" | "delete") => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      if (type === "name") {
        setCopiedName(true);
        setTimeout(() => setCopiedName(false), 2000);
      } else {
        setCopiedDelete(true);
        setTimeout(() => setCopiedDelete(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Reset inputs on open/close
  React.useEffect(() => {
    if (!isOpen) {
      setInputName("");
      setInputDelete("");
      setErrorMessage(null);
      setIsDeleting(false);
      setCopiedName(false);
      setCopiedDelete(false);
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
              <h3 id="delete-account-title" className="text-lg font-bold text-rose-950 tracking-normal">
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
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-brand-dark">
                1. Type your creator name <span className="font-mono text-rose-600 font-bold select-all">&ldquo;{expectedDisplayName}&rdquo;</span> to confirm:
              </label>
              <button
                type="button"
                onClick={() => handleCopy(expectedDisplayName, "name")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 transition-colors shrink-0 active:scale-95 cursor-pointer"
                title="Copy creator name"
              >
                {copiedName ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-rose-600" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-brand-dark">
                2. Type <span className="font-mono text-rose-600 font-bold select-all">&ldquo;DELETE&rdquo;</span> in uppercase:
              </label>
              <button
                type="button"
                onClick={() => handleCopy("DELETE", "delete")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 transition-colors shrink-0 active:scale-95 cursor-pointer"
                title="Copy DELETE"
              >
                {copiedDelete ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-rose-600" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
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
              className="flex-1 justify-center gap-2 text-xs border transition-all duration-150 bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-md active:bg-rose-800 disabled:opacity-100 disabled:bg-rose-50 disabled:text-rose-500 disabled:border-rose-200 disabled:shadow-none disabled:cursor-not-allowed"
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

