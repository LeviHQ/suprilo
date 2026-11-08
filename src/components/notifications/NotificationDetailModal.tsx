"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Award,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Zap,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Info,
  Gift,
} from "lucide-react";
import { BADGE_DEFINITIONS, RARITY_STYLES, BADGE_CATEGORIES } from "@/data/badges";
import { LEVEL_DEFINITIONS } from "@/types/badges";
import { BadgeMedallion } from "@/components/badges/BadgeMedallion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/components/notifications/NotificationBell";

export interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Formats an ISO date string into clean date, exact time, and relative duration.
 */
function formatFullDateTime(isoString: string): {
  fullDate: string;
  exactTime: string;
  relative: string;
} {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { fullDate: isoString, exactTime: "", relative: "" };
    }

    const fullDate = d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const exactTime = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = "just now";
    if (diffSec >= 60 && diffMin < 60) relative = `${diffMin}m ago`;
    else if (diffMin >= 60 && diffHours < 24) relative = `${diffHours}h ago`;
    else if (diffHours >= 24 && diffDays === 1) relative = "yesterday";
    else if (diffDays > 1 && diffDays < 30) relative = `${diffDays}d ago`;

    return { fullDate, exactTime, relative };
  } catch {
    return { fullDate: isoString, exactTime: "", relative: "" };
  }
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  // Close on Escape key and lock body scroll
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

  if (!isOpen || !notification) return null;

  const { fullDate, exactTime, relative } = formatFullDateTime(notification.created_at);

  // Render Type A: Badge Unlocked
  if (notification.type === "BADGE_UNLOCKED") {
    const badgeId = (notification.metadata?.badge_id as string) || "";
    const badge =
      BADGE_DEFINITIONS.find((b) => b.id === badgeId) ||
      BADGE_DEFINITIONS.find((b) =>
        notification.body.toLowerCase().includes(b.name.toLowerCase())
      ) ||
      BADGE_DEFINITIONS[0];

    const rarityStyle = RARITY_STYLES[badge.rarity];
    const categoryInfo = BADGE_CATEGORIES.find((c) => c.id === badge.category);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-6"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-brand-orange flex items-center justify-center shadow-xs">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Badge Achievement
                </span>
              </div>
            </div>

            {/* Cross / Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notification details"
              className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-warm transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge Visual & Title */}
          <div className="text-center space-y-4 pt-1">
            <div className="flex justify-center">
              <BadgeMedallion badge={badge} size="lg" isUnlocked={true} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-xs",
                    rarityStyle.badge
                  )}
                >
                  {badge.rarity}
                </span>
                {categoryInfo && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-warm text-brand-dark border border-brand-warm-border">
                    {categoryInfo.label}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                  <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                  +{badge.points} XP
                </span>
              </div>

              <h3
                id="notification-detail-title"
                className="text-2xl font-black text-brand-dark tracking-tight"
              >
                {badge.name}
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed max-w-sm mx-auto">
                {badge.description}
              </p>
            </div>
          </div>

          {/* Detailed Criteria Box */}
          <div className="p-4 rounded-2xl bg-brand-warm-subtle/80 border border-brand-warm-border space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-brand-dark">Achievement Requirement: </span>
                <span className="text-brand-dark/80">{badge.requirement_summary}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-brand-warm-border/50 text-brand-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-pink shrink-0" />
              <span>Permanently recorded and verified on your Creator Profile</span>
            </div>
          </div>

          {/* Date & Time Timestamp Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-brand-warm-border flex items-center justify-between text-xs text-brand-dark">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-pink-light/60 flex items-center justify-center text-brand-pink shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-brand-dark">Unlocked On</p>
                <p className="text-xs text-brand-muted">{fullDate}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-brand-dark font-semibold justify-end">
                <Clock className="w-3.5 h-3.5 text-brand-muted" />
                <span>{exactTime}</span>
              </div>
              <span className="text-[10px] text-brand-muted font-medium">{relative}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/profile/badges?badge=${badge.id}`}
              onClick={onClose}
              className="w-full sm:flex-1"
            >
              <Button variant="primary" size="md" className="w-full justify-center gap-2 shadow-md">
                <span>View in Badges Showcase</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto justify-center text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Type B: Level Up
  if (notification.type === "LEVEL_UP") {
    const levelNum =
      Number(notification.metadata?.level) ||
      Number(notification.body.match(/Level\s*(\d+)/i)?.[1]) ||
      2;

    const currentLevelInfo =
      LEVEL_DEFINITIONS.find((l) => l.level === levelNum) || LEVEL_DEFINITIONS[0];
    const nextLevelInfo = LEVEL_DEFINITIONS.find((l) => l.level === levelNum + 1);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-6"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Level Milestone
                </span>
              </div>
            </div>

            {/* Cross / Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notification details"
              className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-warm transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Level Visual & Heading */}
          <div className="text-center space-y-4 pt-1">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-brand-orange to-brand-pink flex items-center justify-center text-white shadow-xl shadow-brand-orange/20 ring-4 ring-amber-100/80">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
              <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-brand-dark text-white text-[11px] font-black uppercase tracking-wider border border-white/20 shadow-md">
                Level {levelNum}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tier Milestone Achieved!</span>
              </div>

              <h3
                id="notification-detail-title"
                className="text-2xl font-black text-brand-dark tracking-tight"
              >
                Level {levelNum} — {currentLevelInfo.title}
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed max-w-sm mx-auto">
                Congratulations on advancing your creator progression! You have reached a new milestone
                on Suprilo.
              </p>
            </div>
          </div>

          {/* Progression Overview Card */}
          <div className="p-4 rounded-2xl bg-brand-warm-subtle/80 border border-brand-warm-border space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-dark">Milestone XP Threshold:</span>
              <span className="font-extrabold text-brand-orange bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {currentLevelInfo.requiredXp} XP Required
              </span>
            </div>

            {nextLevelInfo && (
              <div className="flex items-center justify-between text-brand-muted pt-2 border-t border-brand-warm-border/50">
                <span>Next Milestone Tier:</span>
                <span className="font-bold text-brand-dark">
                  Level {nextLevelInfo.level} ({nextLevelInfo.title}) @ {nextLevelInfo.requiredXp} XP
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 text-[11px] text-brand-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unlocks higher creator ranking, showcase privileges, and exclusive tier badges.</span>
            </div>
          </div>

          {/* Date & Time Timestamp Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-brand-warm-border flex items-center justify-between text-xs text-brand-dark">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-brand-dark">Level Achieved On</p>
                <p className="text-xs text-brand-muted">{fullDate}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-brand-dark font-semibold justify-end">
                <Clock className="w-3.5 h-3.5 text-brand-muted" />
                <span>{exactTime}</span>
              </div>
              <span className="text-[10px] text-brand-muted font-medium">{relative}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/profile" onClick={onClose} className="w-full sm:flex-1">
              <Button variant="primary" size="md" className="w-full justify-center gap-2 shadow-md">
                <span>Go to Studio Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto justify-center text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Type C: Card Scratched / Reveal
  if (notification.type === "CARD_REVEAL") {
    const cardId = (notification.metadata?.card_id as string) || "";
    // Extract recipient name if available from body e.g. "for Adarsh!"
    const recipientMatch = notification.body.match(/for\s+([^!.]+)/i);
    const recipientName = recipientMatch ? recipientMatch[1].trim() : "your recipient";

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-6"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 text-brand-pink flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                  Card Scratch Event
                </span>
              </div>
            </div>

            {/* Cross / Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notification details"
              className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-warm transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Visual & Title */}
          <div className="text-center space-y-4 pt-1">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-brand-pink via-brand-pink-hover to-brand-orange flex items-center justify-center text-white shadow-xl shadow-brand-pink/20 ring-4 ring-pink-100/80">
              <Gift className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
              <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-brand-dark text-white text-[11px] font-black uppercase tracking-wider border border-white/20 shadow-md">
                100% Revealed
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-brand-pink border border-pink-100 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Card Uncovered by Recipient!</span>
              </div>

              <h3
                id="notification-detail-title"
                className="text-2xl font-black text-brand-dark tracking-tight"
              >
                Surprise Card Revealed
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed max-w-sm mx-auto">
                {notification.body}
              </p>
            </div>
          </div>

          {/* Reveal Details Card */}
          <div className="p-4 rounded-2xl bg-brand-warm-subtle/80 border border-brand-warm-border space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-dark">Recipient:</span>
              <span className="font-bold text-brand-dark bg-white px-2.5 py-0.5 rounded-full border border-brand-warm-border shadow-xs">
                {recipientName}
              </span>
            </div>

            <div className="flex items-center justify-between text-brand-muted pt-2 border-t border-brand-warm-border/50">
              <span>Scratch Interaction Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Foil Completely Scratched
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-brand-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cryptographically verified reveal event tracked in your creator analytics.</span>
            </div>
          </div>

          {/* Date & Time Timestamp Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-brand-warm-border flex items-center justify-between text-xs text-brand-dark">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-brand-pink shrink-0 border border-pink-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-brand-dark">Scratched On</p>
                <p className="text-xs text-brand-muted">{fullDate}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-brand-dark font-semibold justify-end">
                <Clock className="w-3.5 h-3.5 text-brand-muted" />
                <span>{exactTime}</span>
              </div>
              <span className="text-[10px] text-brand-muted font-medium">{relative}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={cardId ? `/c/${cardId}` : "/profile"}
              onClick={onClose}
              className="w-full sm:flex-1"
            >
              <Button variant="primary" size="md" className="w-full justify-center gap-2 shadow-md">
                <span>View Card Details</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto justify-center text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render Type D: SYSTEM or General Fallback
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 my-auto text-left space-y-6"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-brand-warm-border/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Info className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                System Notification
              </span>
            </div>
          </div>

          {/* Cross / Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification details"
            className="p-2 text-brand-muted hover:text-brand-dark rounded-full hover:bg-brand-warm transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual & Title */}
        <div className="text-center space-y-3 pt-1">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner border border-blue-100">
            <Info className="w-8 h-8" />
          </div>

          <h3
            id="notification-detail-title"
            className="text-xl font-bold text-brand-dark tracking-tight"
          >
            {notification.title}
          </h3>
          <p className="text-sm text-brand-muted leading-relaxed max-w-sm mx-auto">
            {notification.body}
          </p>
        </div>

        {/* Date & Time Timestamp Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-brand-warm-border flex items-center justify-between text-xs text-brand-dark">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-brand-dark">Notification Date</p>
              <p className="text-xs text-brand-muted">{fullDate}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-brand-dark font-semibold justify-end">
              <Clock className="w-3.5 h-3.5 text-brand-muted" />
              <span>{exactTime}</span>
            </div>
            <span className="text-[10px] text-brand-muted font-medium">{relative}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {notification.action_url && (
            <Link href={notification.action_url} onClick={onClose} className="w-full sm:flex-1">
              <Button variant="primary" size="md" className="w-full justify-center gap-2 shadow-md">
                <span>View Linked Page</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto justify-center text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
