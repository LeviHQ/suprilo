"use client";

import * as React from "react";
import { Sparkles, Heart, RefreshCw, Hand, PartyPopper } from "lucide-react";

export function ScratchCardDemo() {
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [scratchProgress, setScratchProgress] = React.useState(0);
  const [isScratching, setIsScratching] = React.useState(false);

  const handleScratch = () => {
    if (isRevealed) return;
    setScratchProgress((prev) => {
      const next = prev + 35;
      if (next >= 90) {
        setIsRevealed(true);
        return 100;
      }
      return next;
    });
  };

  const handleRevealAll = () => {
    setScratchProgress(100);
    setIsRevealed(true);
  };

  const handleReset = () => {
    setScratchProgress(0);
    setIsRevealed(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto group">
      {/* Decorative background glow rings matching brand colors */}
      <div
        className="absolute -inset-2 bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple rounded-3xl opacity-30 blur-xl group-hover:opacity-40 transition-opacity duration-500"
        aria-hidden="true"
      />

      {/* Main card container */}
      <div className="relative bg-white rounded-3xl border border-brand-warm-border/80 shadow-2xl p-4 sm:p-6 transition-all duration-300">
        {/* Card Header & Preview Badge */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-brand-warm-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-pink animate-pulse" />
            <span className="text-xs font-semibold text-brand-dark tracking-wide uppercase">
              Surprise Card Preview
            </span>
          </div>
          <span className="text-[11px] font-medium text-brand-muted bg-brand-warm-subtle px-2.5 py-1 rounded-full border border-brand-warm-border">
            Interactive Demo
          </span>
        </div>

        {/* Card Body — The Scratch Canvas Experience */}
        <div
          id="preview"
          className="relative mt-4 aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-inner bg-gradient-to-br from-[#FFF5F7] via-[#FFF9F2] to-[#F5F0FF] border border-brand-warm-border cursor-pointer select-none"
          onClick={handleScratch}
          onMouseEnter={() => setIsScratching(true)}
          onMouseLeave={() => setIsScratching(false)}
          role="button"
          tabIndex={0}
          aria-label={
            isRevealed
              ? "Surprise revealed: Happy 25th Birthday Maya!"
              : "Interactive scratch card: click or tap repeatedly to scratch and reveal"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleScratch();
            }
          }}
        >
          {/* UNDERNEATH LAYER: The Revealed Surprise Message & Memory */}
          <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-0">
            {/* Top row with celebration tag */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-pink text-white shadow-sm">
                <PartyPopper className="w-3.5 h-3.5" />
                <span>Happy Birthday!</span>
              </span>
              <span className="text-xs font-bold text-brand-purple">
                From Alex with ❤️
              </span>
            </div>

            {/* Heartfelt Note */}
            <div className="my-auto py-2 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-sm">
                <Heart className="w-6 h-6 fill-brand-pink text-brand-pink animate-bounce" />
              </div>
              <h4 className="text-lg sm:text-xl font-extrabold text-brand-dark">
                &ldquo;Happy 25th, Maya! ✨&rdquo;
              </h4>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-[280px] mx-auto font-medium">
                Every single day is brighter with your laugh. Can&apos;t wait to celebrate tonight!
              </p>
            </div>

            {/* Card Footer detail */}
            <div className="flex items-center justify-between text-[11px] text-brand-muted/80 pt-2 border-t border-brand-warm-border/50">
              <span>Card #SPR-2026-081</span>
              <span>suprilo.com/s/maya-25</span>
            </div>
          </div>

          {/* TOP LAYER: Silver & Holographic Foil Scratch Surface */}
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm"
            style={{
              opacity: isRevealed ? 0 : 1 - scratchProgress / 120,
              pointerEvents: isRevealed ? "none" : "auto",
              background: `
                linear-gradient(135deg, 
                  rgba(255, 159, 28, 0.92) 0%, 
                  rgba(255, 77, 109, 0.95) 50%, 
                  rgba(139, 92, 246, 0.92) 100%
                )
              `,
            }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer" />

            {/* Silver Scratch Foil Pad in center */}
            <div
              className={`relative w-4/5 max-w-[260px] py-6 px-4 rounded-2xl bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] shadow-lg border-2 border-white/60 text-center flex flex-col items-center justify-center gap-2 transform transition-all duration-200 ${
                isScratching ? "scale-105 shadow-xl" : "scale-100"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center text-brand-pink">
                <Heart className="w-5 h-5 fill-brand-pink" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1">
                  <span>Scratch to Reveal</span>
                  <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {scratchProgress === 0
                    ? "Tap or click here"
                    : `${Math.min(100, scratchProgress)}% scratched! Keep going!`}
                </p>
              </div>

              {/* Progress bar inside foil */}
              {scratchProgress > 0 && (
                <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-brand-pink h-full rounded-full transition-all duration-200"
                    style={{ width: `${scratchProgress}%` }}
                  />
                </div>
              )}
            </div>

            <p className="mt-3 text-[11px] font-medium text-white/90 flex items-center gap-1 drop-shadow-sm">
              <Hand className="w-3 h-3 animate-pulse" />
              Click or tap repeatedly to scratch
            </p>
          </div>
        </div>

        {/* Card Controls & Helper */}
        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-brand-muted">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
            <span>
              {isRevealed
                ? "Surprise uncovered! 🎉"
                : "A unique interactive moment"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isRevealed ? (
              <button
                type="button"
                onClick={handleRevealAll}
                className="text-xs font-semibold text-brand-pink hover:text-brand-pink-hover underline underline-offset-2 py-1 px-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-pink rounded"
              >
                Reveal directly
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-muted hover:text-brand-dark bg-brand-warm-subtle hover:bg-brand-warm-border px-3 py-1 rounded-full border border-brand-warm-border transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Scratch Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
