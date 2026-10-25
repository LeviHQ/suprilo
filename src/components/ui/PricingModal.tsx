"use client";

import * as React from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "./Button";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string | null;
}

export function PricingModal({
  isOpen,
  onClose,
  selectedPlan,
}: PricingModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const actionButtonRef = React.useRef<HTMLButtonElement>(null);

  // Store active element when opening to restore focus on close
  React.useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";

      // Focus the primary action button after mounting
      const timer = setTimeout(() => {
        actionButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }

        // Trap focus inside modal
        if (e.key === "Tab" && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
      aria-describedby="pricing-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-warm-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          {/* Visual icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>

          {/* Heading and description as requested */}
          <div className="space-y-2">
            {selectedPlan && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-purple-light text-brand-purple border border-[#DDD6FE]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selected: {selectedPlan} Plan</span>
              </span>
            )}
            <h3
              id="pricing-modal-title"
              className="text-2xl font-extrabold text-brand-dark tracking-tight"
            >
              Suprilo is still taking shape!
            </h3>
            <p
              id="pricing-modal-desc"
              className="text-sm text-brand-muted leading-relaxed"
            >
              We&apos;re building this experience right now. Pricing and checkout
              will be available in a future update. Stay tuned for the launch.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <Button
              ref={actionButtonRef}
              variant="primary"
              size="md"
              className="w-full justify-center shadow-md hover:shadow-brand-pink/25"
              onClick={onClose}
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
