"use client";

import * as React from "react";
import Image from "next/image";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  returnUrl = "/create",
}: AuthModalProps) {
  const { isSigningIn, signInWithGoogle, error, clearError } = useAuth();

  // Close on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    clearError();
    const user = await signInWithGoogle(returnUrl);
    if (user) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl border border-brand-warm-border text-center space-y-6 z-10 animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle transition-colors"
          aria-label="Close sign in dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo & Subtle Badge */}
        <div className="space-y-3 pt-2">
          <div className="relative h-10 w-32 sm:w-36 mx-auto aspect-[800/285]">
            <Image
              src="/brand/logo.png"
              alt="Suprilo"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light border border-brand-pink/20">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
            <span>Start Creating Surprises</span>
          </div>
        </div>

        {/* Heading & Short Description */}
        <div className="space-y-2">
          <h3
            id="auth-modal-title"
            className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight leading-snug"
          >
            Sign in to Continue
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-xs mx-auto">
            Connect your Google account to craft interactive scratch cards, customize secret messages, and share unforgettable surprise moments.
          </p>
        </div>

        {/* Continue with Google Action */}
        <div className="space-y-3 pt-1">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full justify-center gap-2.5 shadow-md hover:shadow-brand-pink/25 font-bold text-sm py-3.5"
          >
            <GoogleIcon className="w-4 h-4 shrink-0" />
            <span>{isSigningIn ? "Connecting to Google..." : "Continue with Google"}</span>
          </Button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Safe & Secure Guarantee Note */}
        <div className="pt-2 border-t border-brand-warm-border/60">
          <p className="text-[11px] text-brand-muted/80">
            Safe, fast & secure. No password required.
          </p>
        </div>
      </div>
    </div>
  );
}
