"use client";

import * as React from "react";
import Link from "next/link";
import {
  Fingerprint,
  Calendar,
  Trophy,
  Zap,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserBadgesData } from "@/lib/client/db-cache";
import { getLevelProgress } from "@/types/badges";

export function CreatorMetaOverviewCard() {
  const { user } = useAuth();
  const { summary: badgeSummary } = useUserBadgesData(user);
  const [copied, setCopied] = React.useState(false);

  const totalXp = badgeSummary?.total_xp ?? 0;
  const levelInfo = React.useMemo(() => getLevelProgress(totalXp), [totalXp]);

  if (!user) return null;

  // Real creation timestamp from authenticated session metadata
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently joined";

  const handleCopyCreatorId = () => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(user.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div
      id="creator-meta"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-warm-border/60 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-normal inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>Creator Meta & Overview</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap shrink-0">
              Verified Account
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1">
            Your unique cryptographic identifier, membership timeline, and gamification tier standings.
          </p>
        </div>

        {user.isGoogleVerified && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Verified</span>
          </span>
        )}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Creator ID */}
        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-brand-pink" />
              <span>Creator ID</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCreatorId}
              className="p-1 rounded-md hover:bg-white text-brand-muted hover:text-brand-dark transition-colors"
              title="Copy Creator ID"
              aria-label="Copy Creator ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="font-mono text-xs font-bold text-brand-dark truncate" title={user.id}>
            {user.id}
          </p>
          <span className="text-[10px] text-brand-muted block">
            {copied ? "Copied to clipboard!" : "Unique UUID identifier"}
          </span>
        </div>

        {/* 2. Member Since */}
        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
          <div className="flex items-center gap-1.5 text-brand-muted text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-brand-orange" />
            <span>Member Since</span>
          </div>
          <p className="font-bold text-sm text-brand-dark">{memberSince}</p>
          <span className="text-[10px] text-brand-muted block">Initial account onboarding date</span>
        </div>

        {/* 3. Creator Level & Tier */}
        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
          <div className="flex items-center gap-1.5 text-brand-muted text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Creator Level</span>
          </div>
          <div className="flex items-center flex-wrap gap-1.5 min-w-0">
            <span className="font-black text-sm text-brand-dark whitespace-nowrap">
              Level {badgeSummary?.current_level ?? levelInfo.currentLevel.level}
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 whitespace-nowrap shrink-0 inline-flex items-center leading-none">
              {levelInfo.currentLevel.title}
            </span>
          </div>
          <span className="text-[10px] text-brand-muted block">Current progression tier</span>
        </div>

        {/* 4. Experience Points (XP) */}
        <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
          <div className="flex items-center gap-1.5 text-brand-muted text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Total XP</span>
          </div>
          <p className="font-black text-sm text-brand-dark">{totalXp.toLocaleString()} XP</p>
          <span className="text-[10px] text-brand-muted block">
            {levelInfo.nextLevel
              ? `${(levelInfo.nextLevel.requiredXp - totalXp).toLocaleString()} XP to Level ${levelInfo.nextLevel.level}`
              : "Max Level Mastered"}
          </span>
        </div>
      </div>

      {/* Gamification Progress Bar Strip */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-brand-warm-border/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-pink animate-pulse" />
          <span className="font-semibold text-brand-dark">
            Level {levelInfo.currentLevel.level} Mastery:
          </span>
          <span className="text-brand-muted">
            {Math.round(levelInfo.progressPercent)}% progress toward {levelInfo.nextLevel?.title || "Master"}
          </span>
        </div>

        <Link
          href="/profile/badges"
          className="inline-flex items-center gap-1.5 font-bold text-brand-pink hover:text-brand-pink-hover transition-colors"
        >
          <span>View Badges & Milestone Rewards</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

