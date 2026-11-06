"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Calendar,
  Zap,
  Download,
} from "lucide-react";
import type { BadgeDefinition, UserBadgeRecord } from "@/types/badges";
import { RARITY_STYLES, BADGE_CATEGORIES } from "@/data/badges";
import { BadgeMedallion } from "@/components/badges/BadgeMedallion";
import { Button } from "@/components/ui/Button";
import { recordCreatorShareEvent } from "@/lib/badges/service";
import { cn } from "@/lib/utils";

export interface BadgeDetailModalProps {
  badge: BadgeDefinition | null;
  userBadge?: UserBadgeRecord;
  isOpen: boolean;
  onClose: () => void;
  onOpenStoryModal?: (badge: BadgeDefinition, userBadge?: UserBadgeRecord) => void;
}

export function BadgeDetailModal({
  badge,
  userBadge,
  isOpen,
  onClose,
  onOpenStoryModal,
}: BadgeDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !badge) return null;

  const isUnlocked = Boolean(userBadge);
  const rarityStyle = RARITY_STYLES[badge.rarity];
  const categoryInfo = BADGE_CATEGORIES.find((c) => c.id === badge.category);

  const formattedDate = userBadge?.unlocked_at
    ? new Date(userBadge.unlocked_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const shareUrl =
    typeof window !== "undefined" && userBadge?.share_token
      ? `${window.location.origin}/b/${userBadge.share_token}`
      : userBadge?.share_token
      ? `https://suprilo.com/b/${userBadge.share_token}`
      : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);

        // Record creator share event in background
        recordCreatorShareEvent({
          targetType: "badge",
          targetId: badge.id,
          actionType: "link_copied",
        }).catch(() => {});
      }
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    try {
      if (navigator?.share) {
        await navigator.share({
          title: `Suprilo Badge: ${badge.name}`,
          text: `I just unlocked the "${badge.name}" badge on Suprilo! ✨`,
          url: shareUrl,
        });

        // Record creator share event in background
        recordCreatorShareEvent({
          targetType: "badge",
          targetId: badge.id,
          actionType: "native_share_opened",
        }).catch(() => {});
      } else {
        handleCopyLink();
      }
    } catch {
      // Share cancelled or rejected
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-brand-warm-border space-y-6 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Medallion */}
        <div className="flex justify-center pt-2">
          <BadgeMedallion badge={badge} isUnlocked={isUnlocked} size="hero" />
        </div>

        {/* Title and Metadata Pills */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs",
                rarityStyle.badge,
                rarityStyle.text,
                rarityStyle.border
              )}
            >
              {badge.rarity}
            </span>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-warm-subtle text-brand-dark border border-brand-warm-border">
              {categoryInfo?.label || badge.category}
            </span>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>+{badge.xp_award ?? badge.points} XP</span>
            </span>
          </div>

          <h2 className="font-heading font-extrabold text-2xl text-brand-dark tracking-tight">
            {badge.name}
          </h2>
        </div>

        {/* Narrative & Unlock Criteria */}
        <div className="space-y-4 text-left bg-brand-warm-subtle/60 p-4 sm:p-5 rounded-2xl border border-brand-warm-border/60">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              About This Achievement
            </h4>
            <p className="text-sm text-brand-dark mt-1 leading-relaxed">
              {badge.lore ?? badge.description}
            </p>
          </div>

          <div className="pt-2 border-t border-black/5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Unlock Criteria
            </h4>
            <p className="text-xs text-brand-dark/90 mt-1 leading-relaxed font-medium">
              {badge.criteria ?? badge.requirement_summary}
            </p>
          </div>

          {isUnlocked && formattedDate && (
            <div className="pt-2 border-t border-black/5 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unlocked on {formattedDate}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {isUnlocked ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleCopyLink}
                className="w-full sm:w-auto gap-2 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Link Copied!" : "Copy Public Link"}</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleNativeShare}
                className="w-full sm:w-auto gap-2 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>

              {onOpenStoryModal && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onOpenStoryModal(badge, userBadge)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Story Card</span>
                </Button>
              )}

              {userBadge?.share_token && (
                <Link
                  href={`/b/${userBadge.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button variant="ghost" size="md" className="w-full gap-1.5">
                    <span>View Public Seal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 font-medium">
              <Lock className="w-4 h-4" />
              <span>Continue creating and sharing cards to unlock this achievement.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
