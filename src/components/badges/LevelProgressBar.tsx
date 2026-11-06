"use client";

import * as React from "react";
import { Trophy, Zap } from "lucide-react";
import { getLevelProgress } from "@/types/badges";
import { cn } from "@/lib/utils";

export interface LevelProgressBarProps {
  totalXp: number;
  className?: string;
  showDetails?: boolean;
}

export function LevelProgressBar({
  totalXp,
  className,
}: LevelProgressBarProps) {
  const progress = getLevelProgress(totalXp);
  const current = progress.currentLevel;
  const next = progress.nextLevel;
  const isMaxLevel = !next;
  const xpToNext = next ? next.requiredXp - totalXp : 0;

  return (
    <div
      className={cn(
        "w-full bg-white rounded-3xl p-5 sm:p-6 border border-brand-warm-border shadow-xs space-y-4",
        className
      )}
    >
      {/* Top Header: Current Level & Rank Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-pink to-rose-600 flex items-center justify-center text-white shadow-md shadow-brand-pink/25 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2.5 py-0.5 rounded-full">
                Level {current.level}
              </span>
              <span className="font-heading font-extrabold text-lg text-brand-dark tracking-tight">
                {current.title}
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              Unlock exclusive creator perks, badges, and recognition as you level up.
            </p>
          </div>
        </div>

        {/* XP Counter Pill */}
        <div className="text-left sm:text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-warm-subtle border border-brand-warm-border text-xs font-semibold text-brand-dark">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>
              <strong className="text-brand-pink">{totalXp.toLocaleString()}</strong> XP Total
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5">
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-pink via-rose-500 to-amber-500 transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        {/* Progress Footer Numbers */}
        <div className="flex items-center justify-between text-[11px] font-medium text-brand-muted px-0.5">
          <span>
            {isMaxLevel ? (
              "Maximum Rank Achieved"
            ) : (
              <>
                <strong className="text-brand-dark">
                  {progress.xpInCurrentLevel.toLocaleString()}
                </strong>{" "}
                / {current.deltaToNext?.toLocaleString() || 0} XP
              </>
            )}
          </span>
          <span>
            {isMaxLevel ? (
              <span className="text-amber-600 font-bold">100% Mastered</span>
            ) : (
              <>
                <strong className="text-brand-pink">{xpToNext.toLocaleString()} XP</strong> to Level {next.level}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
