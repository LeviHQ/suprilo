"use client";

import * as React from "react";
import {
  Award,
  Sparkles,
  Lock,
  Share2,
  X,
  Medal,
  LucideIcon,
  HandMetal,
  PenTool,
  UserCheck,
  Volume2,
  Compass,
  Palette,
  Image as ImageIcon,
  KeyRound,
  Heart,
  Gem,
  Music,
  PartyPopper,
  Crown,
  Eye,
  CheckCheck,
  SmilePlus,
  Flame,
  Zap,
  Moon,
  Globe,
  Layers,
  Sparkle,
  Trophy,
  ShieldAlert,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  SU_PRILO_BADGES,
  BADGE_CATEGORIES,
  BadgeDefinition,
  BadgeCategory,
  getRarityColor,
} from "@/data/badges";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Map icon strings to actual Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  HandMetal,
  PenTool,
  UserCheck,
  Volume2,
  Compass,
  Palette,
  Image: ImageIcon,
  KeyRound,
  Heart,
  Gem,
  Music,
  PartyPopper,
  Crown,
  Share2,
  Eye,
  CheckCheck,
  SmilePlus,
  Flame,
  Zap,
  Moon,
  Globe,
  Layers,
  Sparkle,
  Trophy,
  ShieldAlert,
  CalendarCheck,
  Medal,
  ShieldCheck,
  Award,
};

export default function BadgesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<BadgeCategory | "all">("all");
  const [selectedBadge, setSelectedBadge] = React.useState<BadgeDefinition | null>(null);

  const filteredBadges = React.useMemo(() => {
    if (selectedCategory === "all") return SU_PRILO_BADGES;
    return SU_PRILO_BADGES.filter((b) => b.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Creator Badges & Achievements"
        description="Celebrate your milestones, craft memorable surprise moments, and unlock collectible badges as you delight recipients."
        badge="30 Badges"
        badgeVariant="purple"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Badges" },
        ]}
      />

      {/* Progress & Development Status Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-warm-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-pink">
                Gamification System
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Engine In Development</span>
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-brand-dark tracking-tight">
              0 of 30 Badges Collected
            </h3>
            <p className="text-xs text-brand-muted max-w-xl">
              Achievement tracking is actively being built. All 30 badges below represent the complete verified catalogue of upcoming rewards.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-brand-dark">Catalogue Ready</p>
              <p className="text-[11px] text-brand-muted">30 Definitions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-pink-light text-brand-pink flex items-center justify-center shadow-inner">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="w-full h-2.5 bg-brand-warm-border/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-pink to-brand-orange rounded-full transition-all duration-500"
              style={{ width: "3.33%" }} // 1 badge visual progress demonstration
            />
          </div>
          <div className="flex justify-between text-[11px] text-brand-muted">
            <span>Level 1: Novice Surprise Maker</span>
            <span>Next Rank at 5 Badges</span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="border-b border-brand-warm-border overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              selectedCategory === "all"
                ? "bg-brand-dark text-white shadow-sm"
                : "text-brand-muted hover:text-brand-dark hover:bg-white"
            )}
          >
            <span>All Categories</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                selectedCategory === "all" ? "bg-white/20 text-white" : "bg-brand-warm-border text-brand-muted"
              )}
            >
              30
            </span>
          </button>

          {BADGE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                  isActive
                    ? "bg-brand-dark text-white shadow-sm"
                    : "text-brand-muted hover:text-brand-dark hover:bg-white"
                )}
              >
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-brand-warm-border text-brand-muted"
                  )}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badge Grid (Exactly 30 badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Award;
          const rarity = getRarityColor(badge.rarity);

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedBadge(badge);
                }
              }}
              className="group bg-white rounded-2xl p-5 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-pink"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm",
                      rarity.iconBg,
                      rarity.iconColor
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                      rarity.badgeBg,
                      rarity.badgeText,
                      rarity.badgeBorder
                    )}
                  >
                    {badge.rarity}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-brand-dark group-hover:text-brand-pink transition-colors line-clamp-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed line-clamp-2 mt-1">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-brand-warm-border/60 flex items-center justify-between text-[11px] text-brand-muted">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </span>
                <span className="font-bold text-brand-dark/70">+{badge.points} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedBadge(null)}
            aria-hidden="true"
          />

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-warm-border space-y-6 z-10 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge Hero in Modal */}
            <div className="text-center space-y-3 pt-2">
              {(() => {
                const Icon = ICON_MAP[selectedBadge.icon] || Award;
                const rarity = getRarityColor(selectedBadge.rarity);
                return (
                  <div
                    className={cn(
                      "w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-md",
                      rarity.iconBg,
                      rarity.iconColor
                    )}
                  >
                    <Icon className="w-10 h-10" />
                  </div>
                );
              })()}

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Locked Achievement</span>
                </div>
                <h3 className="text-xl font-extrabold text-brand-dark">{selectedBadge.name}</h3>
                <p className="text-xs font-semibold text-brand-pink capitalize">
                  {selectedBadge.category.replace("-", " ")} Category • {selectedBadge.rarity}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-brand-muted text-center leading-relaxed">
              {selectedBadge.description}
            </p>

            {/* Unlock Condition Box */}
            <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-1.5">
              <p className="text-[11px] font-bold text-brand-dark uppercase tracking-wider">
                How to Unlock
              </p>
              <p className="text-xs text-brand-dark/80 leading-relaxed">
                {selectedBadge.unlockCondition}
              </p>
            </div>

            {/* Future Shareability Foundation Note */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
              <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Shareable Badges:</strong> In a future update, unlocked badges can be published to your public creator showcase or shared directly on social networks.
              </span>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setSelectedBadge(null)}
              className="w-full justify-center text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
