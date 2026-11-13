"use client";

import * as React from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Eye,
  Share2,
  Check,
  Sparkles,
  ArrowRight,
  Flame,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardStatsDockProps {
  senderName?: string;
  recipientName?: string;
  occasionTag?: string;
  scratchPercent: number; // 0 to 100
  revealThreshold?: number; // 0 to 1 (default 0.65)
  isRevealed: boolean;
  isMuted: boolean;
  onToggleSound: () => void;
  onResetFoil: () => void;
  onInstantReveal: () => void;
  onShare?: () => void;
  shareCopied?: boolean;
  isCreatorPreview?: boolean;
  className?: string;
}

export function CardStatsDock({
  senderName = "Someone Special",
  recipientName = "Friend",
  occasionTag = "Surprise",
  scratchPercent,
  revealThreshold = 0.65,
  isRevealed,
  isMuted,
  onToggleSound,
  onResetFoil,
  onInstantReveal,
  onShare,
  shareCopied = false,
  isCreatorPreview = false,
  className = "",
}: CardStatsDockProps) {
  // Normalize progress percentage relative to reveal threshold (0..100%)
  const thresholdPercent = revealThreshold * 100;
  const progressRatio = Math.min(100, Math.round((scratchPercent / thresholdPercent) * 100));

  return (
    <div
      className={cn(
        "w-full max-w-[380px] mx-auto mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-3xl",
        "bg-white/85 backdrop-blur-xl border border-brand-warm-border/80",
        "shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-black/[0.03]",
        "transition-all duration-300 space-y-3.5",
        className
      )}
    >
      {/* ROW 1: Sender & Recipient Gift Badge + Occasion Tag */}
      <div className="flex items-center justify-between gap-2">
        {/* Sender -> Recipient with Heart */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-pink to-brand-orange flex items-center justify-center text-white shadow-sm shrink-0">
            <Gift className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs truncate font-medium text-brand-dark">
            <span className="font-bold text-brand-purple truncate inline-block max-w-[85px] sm:max-w-[100px] align-bottom">
              {senderName}
            </span>
            <span className="mx-1 text-brand-muted/70">➔</span>
            <span className="font-bold text-brand-dark truncate inline-block max-w-[85px] sm:max-w-[100px] align-bottom">
              {recipientName}
            </span>
          </div>
        </div>

        {/* Occasion Pill */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-brand-warm-subtle text-brand-dark border border-brand-warm-border">
            <Sparkles className="w-3 h-3 text-brand-orange" />
            <span className="truncate max-w-[90px]">{occasionTag}</span>
          </span>
        </div>
      </div>

      {/* ROW 2: Live Scratch Progression Meter */}
      <div className="space-y-1.5 bg-brand-warm-subtle/60 p-2.5 rounded-2xl border border-brand-warm-border/50">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1 text-brand-muted">
            {isRevealed ? (
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" style={{ animationDuration: "4s" }} />
                Surprise Unlocked!
              </span>
            ) : scratchPercent > 0 ? (
              <span className="flex items-center gap-1 text-brand-pink font-bold">
                <Flame className="w-3 h-3 text-brand-orange animate-bounce" />
                Scratching...
              </span>
            ) : (
              <span>Swipe or click foil above</span>
            )}
          </span>

          <span className="font-mono text-brand-dark">
            {isRevealed ? (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
                100% REVEALED
              </span>
            ) : (
              <span className="text-brand-purple font-extrabold">
                {Math.round(scratchPercent)}%
              </span>
            )}
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-brand-warm-border/60 rounded-full h-2 overflow-hidden p-[1px]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-200 ease-out",
              isRevealed
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple"
            )}
            style={{ width: `${isRevealed ? 100 : progressRatio}%` }}
          />
        </div>
      </div>

      {/* ROW 3: Interactive Action Dock Buttons */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        {/* Left: Audio Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95",
            isMuted
              ? "bg-stone-100 text-brand-muted border-stone-200 hover:bg-stone-200"
              : "bg-brand-purple/10 text-brand-purple border-brand-purple/20 hover:bg-brand-purple/15"
          )}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[11px] hidden sm:inline">Sound ON</span>
            </>
          )}
        </button>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5">
          {!isRevealed ? (
            <button
              type="button"
              onClick={onInstantReveal}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-pink hover:text-brand-pink-hover bg-brand-pink/10 hover:bg-brand-pink/15 px-3 py-1.5 rounded-xl border border-brand-pink/20 transition-all active:scale-95"
            >
              <Eye className="w-3 h-3" />
              <span>Instant Reveal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetFoil}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-dark hover:text-black bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl border border-stone-200 transition-all active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Scratch Again</span>
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95",
                shareCopied
                  ? "bg-emerald-500 text-white border-emerald-600"
                  : "bg-white hover:bg-stone-50 text-brand-dark border-brand-warm-border shadow-xs"
              )}
            >
              {shareCopied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 text-brand-purple" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Recipient CTA footer (if viewing on recipient page) */}
      {!isCreatorPreview && (
        <div className="pt-1 border-t border-brand-warm-border/50 text-center">
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-pink hover:text-brand-pink-hover group transition-colors py-0.5"
          >
            <span>Want to send a surprise card like this?</span>
            <span className="underline underline-offset-2 flex items-center gap-0.5">
              Make one for free <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
