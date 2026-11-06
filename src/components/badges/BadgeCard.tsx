"use client";

import * as React from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import type { BadgeDefinition, UserBadgeRecord } from "@/types/badges";
import { RARITY_STYLES } from "@/data/badges";
import { BadgeMedallion } from "@/components/badges/BadgeMedallion";
import { cn } from "@/lib/utils";

export interface BadgeCardProps {
  badge: BadgeDefinition;
  userBadge?: UserBadgeRecord;
  onClick?: () => void;
  className?: string;
}

export function BadgeCard({
  badge,
  userBadge,
  onClick,
  className,
}: BadgeCardProps) {
  const isUnlocked = Boolean(userBadge);
  const rarityStyle = RARITY_STYLES[badge.rarity];

  const formattedDate = React.useMemo(() => {
    if (!userBadge?.unlocked_at) return null;
    try {
      const d = new Date(userBadge.unlocked_at);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [userBadge?.unlocked_at]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group relative flex flex-col items-center text-center p-5 rounded-3xl border transition-all duration-200 cursor-pointer select-none",
        isUnlocked
          ? "bg-white hover:bg-brand-warm-subtle/50 border-brand-warm-border hover:shadow-md hover:border-brand-pink/30"
          : "bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/80 opacity-85 hover:opacity-100",
        className
      )}
    >
      {/* Top XP Pill */}
      <div className="w-full flex items-center justify-between gap-1 mb-3">
        <span
          className={cn(
            "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shadow-2xs",
            rarityStyle.badge,
            rarityStyle.text,
            rarityStyle.border
          )}
        >
          {badge.rarity}
        </span>
        <span className="text-[11px] font-bold text-brand-dark bg-brand-warm-subtle px-2 py-0.5 rounded-full border border-brand-warm-border">
          +{badge.xp_award ?? badge.points} XP
        </span>
      </div>

      {/* Badge Medallion */}
      <div className="my-2 group-hover:scale-105 transition-transform duration-300">
        <BadgeMedallion badge={badge} isUnlocked={isUnlocked} size="lg" />
      </div>

      {/* Badge Title */}
      <h3 className="font-heading font-extrabold text-sm text-brand-dark mt-2 tracking-tight group-hover:text-brand-pink transition-colors line-clamp-1">
        {badge.name}
      </h3>

      {/* Criteria / Description Teaser */}
      <p className="text-xs text-brand-muted mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
        {badge.description}
      </p>

      {/* Unlock Status Footer */}
      <div className="w-full mt-4 pt-3 border-t border-black/5 flex items-center justify-center gap-1.5 text-[11px]">
        {isUnlocked ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unlocked {formattedDate || ""}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </span>
        )}
      </div>
    </div>
  );
}
