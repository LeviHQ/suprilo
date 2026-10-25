"use client";

import * as React from "react";
import { X, Sparkles, Heart, Rocket } from "lucide-react";
import { Button } from "./Button";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-warm-subtle transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-orange-light text-[#D97706]">
              <Rocket className="w-3.5 h-3.5" />
              <span>Phase 2 in Progress</span>
            </div>
            <h3 id="modal-title" className="text-2xl font-bold text-brand-dark">
              Card Studio Coming Soon!
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              We&apos;re putting the finishing touches on our interactive card editor,
              scratch effects, and secure sharing engine.
            </p>
          </div>

          <div className="p-4 bg-brand-warm-subtle rounded-2xl border border-brand-warm-border text-left space-y-2.5">
            <p className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
              What&apos;s coming next:
            </p>
            <ul className="text-xs text-brand-muted space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
                Interactive canvas scratch-off engine
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                Custom photo uploads and heartfelt notes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                Instant unique links for sharing anywhere
              </li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={onClose}
            >
              Explore the Preview
            </Button>
            <p className="text-[11px] text-brand-muted flex items-center justify-center gap-1">
              <span>Made with love for happy moments</span>
              <Heart className="w-3 h-3 text-brand-pink fill-brand-pink" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
