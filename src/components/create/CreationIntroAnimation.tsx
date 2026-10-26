"use client";

import * as React from "react";
import { Sparkles, Heart } from "lucide-react";

interface CreationIntroAnimationProps {
  onComplete: () => void;
}

/**
 * Delightful, ultra-lightweight transition animation (500–850ms)
 * Features:
 * - Small drifting cloud
 * - Minimal paper airplane gliding across with trail
 * - Subtle blooming rose
 * - Floating hearts and sparkles
 *
 * Performance-conscious: uses only transform & opacity, non-blocking,
 * automatically completes in ~750ms or on user tap/interaction.
 */
export function CreationIntroAnimation({ onComplete }: CreationIntroAnimationProps) {
  const [isSkipped, setIsSkipped] = React.useState(false);

  React.useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      onComplete();
      return;
    }

    // Snappy timer: 750ms total transition
    const timer = setTimeout(() => {
      onComplete();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setIsSkipped(true);
    onComplete();
  };

  if (isSkipped) return null;

  return (
    <div
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") handleSkip();
      }}
      className="relative w-full max-w-lg mx-auto h-44 sm:h-52 overflow-hidden rounded-3xl bg-gradient-to-b from-brand-pink-light/40 via-brand-warm to-brand-warm-subtle/30 border border-brand-warm-border/60 flex items-center justify-center cursor-pointer select-none"
      title="Click to skip intro"
    >
      {/* 1. Drifting Soft Cloud */}
      <div
        className="absolute top-6 left-6 animate-pulse opacity-85 transition-transform"
        style={{ animationDuration: "3s" }}
      >
        <svg
          className="w-16 h-10 text-white drop-shadow-sm"
          viewBox="0 0 64 40"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16 36h34a12 12 0 0 0 2-23.8A16 16 0 0 0 20 16a12 12 0 0 0-4 20z" />
        </svg>
      </div>

      <div
        className="absolute bottom-6 right-8 opacity-75 hidden sm:block"
        style={{ transform: "scale(0.85)" }}
      >
        <svg
          className="w-16 h-10 text-white drop-shadow-sm"
          viewBox="0 0 64 40"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16 36h34a12 12 0 0 0 2-23.8A16 16 0 0 0 20 16a12 12 0 0 0-4 20z" />
        </svg>
      </div>

      {/* 2. Gliding Minimal Airplane with Trail */}
      <div
        className="absolute left-[-20%] top-12 sm:top-14 z-20 pointer-events-none flex items-center"
        style={{
          animation: "supriloPlaneGlide 0.85s cubic-bezier(0.25, 1, 0.5, 1) forwards",
        }}
      >
        {/* Dash trail */}
        <div className="w-24 sm:w-32 h-0.5 border-t-2 border-dashed border-brand-pink/50 mr-1" />
        {/* Paper Plane SVG */}
        <svg
          className="w-8 h-8 text-brand-pink drop-shadow-md transform rotate-12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </div>

      {/* 3. Central Blooming Rose Illustration */}
      <div
        className="relative z-10 flex flex-col items-center justify-center space-y-2 pointer-events-none"
        style={{
          animation: "supriloRoseBloom 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-card border border-brand-warm-border flex items-center justify-center text-brand-pink relative">
          {/* Rose SVG icon */}
          <svg
            className="w-8 h-8 text-brand-pink transform transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m4.5 0a4.5 4.5 0 1 1-4.5 4.5M16.5 12H12m-4.5 0A4.5 4.5 0 1 0 12 16.5M7.5 12H12m0 4.5V21" />
            <path d="M8.5 16.5c-2.5 1-3.5 3-3.5 3s2.5.5 4.5-1M15.5 16.5c2.5 1 3.5 3 3.5 3s-2.5.5-4.5-1" />
          </svg>

          {/* Sparkle top right */}
          <Sparkles className="w-4 h-4 text-brand-orange absolute -top-1.5 -right-1.5 animate-spin" style={{ animationDuration: "4s" }} />
        </div>

        <span className="text-xs font-bold text-brand-dark tracking-tight">
          Crafting your surprise moment...
        </span>
      </div>

      {/* 4. Floating Decorative Hearts & Sparkles */}
      <div
        className="absolute z-10 pointer-events-none text-brand-pink"
        style={{
          top: "22%",
          right: "26%",
          animation: "supriloHeartFloat 0.8s ease-out forwards",
        }}
      >
        <Heart className="w-4 h-4 fill-brand-pink/70 text-brand-pink" />
      </div>

      <div
        className="absolute z-10 pointer-events-none text-brand-purple"
        style={{
          bottom: "28%",
          left: "24%",
          animation: "supriloHeartFloat 0.85s ease-out 0.1s forwards",
        }}
      >
        <Heart className="w-3.5 h-3.5 fill-brand-purple/70 text-brand-purple" />
      </div>

      <div
        className="absolute z-10 pointer-events-none text-brand-orange"
        style={{
          top: "30%",
          left: "32%",
          animation: "supriloSparklePop 0.7s ease-out forwards",
        }}
      >
        <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
      </div>

      {/* Skip button prompt */}
      <span className="absolute bottom-2.5 right-3 text-[10px] font-semibold text-brand-muted/70 hover:text-brand-dark transition-colors">
        Click to skip
      </span>

      {/* Scoped CSS Keyframes for lightweight 60fps hardware acceleration */}
      <style jsx>{`
        @keyframes supriloPlaneGlide {
          0% {
            transform: translateX(-50px) translateY(15px) scale(0.8);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(480px) translateY(-20px) scale(1.05);
            opacity: 0.9;
          }
        }
        @keyframes supriloRoseBloom {
          0% {
            transform: scale(0.6) rotate(-10deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.08) rotate(3deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes supriloHeartFloat {
          0% {
            transform: translateY(12px) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-16px) scale(1);
            opacity: 0.8;
          }
        }
        @keyframes supriloSparklePop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          60% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
