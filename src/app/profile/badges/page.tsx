"use client";

import * as React from "react";
import {
  Award,
  Sparkles,
  Layers,
  Palette,
  Send,
  Trophy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BADGE_DEFINITIONS } from "@/data/badges";
import type {
  BadgeCategory,
  BadgeDefinition,
  UserBadgeRecord,
} from "@/types/badges";
import { useAuth } from "@/context/AuthContext";
import { useUserBadgesData } from "@/lib/client/db-cache";
import { LevelProgressBar } from "@/components/badges/LevelProgressBar";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeDetailModal } from "@/components/badges/BadgeDetailModal";
import { StoryShareModal } from "@/components/badges/StoryShareModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const CATEGORY_TABS: Array<{
  id: BadgeCategory | "all";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}> = [
  { id: "all", label: "All Badges", icon: Layers, count: 50 },
  { id: "getting-started", label: "Getting Started", icon: Sparkles, count: 10 },
  { id: "creator-journey", label: "Creator Journey", icon: Trophy, count: 12 },
  { id: "sharing-impact", label: "Sharing & Impact", icon: Send, count: 10 },
  { id: "milestones", label: "Milestones", icon: Award, count: 10 },
  { id: "creative-mastery", label: "Creative Mastery", icon: Palette, count: 8 },
];

export default function BadgesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<BadgeCategory | "all">("all");
  const [selectedBadge, setSelectedBadge] = React.useState<BadgeDefinition | null>(null);
  const [storyBadge, setStoryBadge] = React.useState<BadgeDefinition | null>(null);

  const { user } = useAuth();
  const {
    summary,
    unlockedBadges,
    isLoading: loading,
    refresh: refreshBadges,
  } = useUserBadgesData(user);
  const [refreshing, setRefreshing] = React.useState(false);

  const creatorName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Suprilo Creator";

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshBadges();
    setRefreshing(false);
  }, [refreshBadges]);

  // Auto-open badge detail modal if ?badge=<id> is present in the URL
  React.useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      const params = new URLSearchParams(window.location.search);
      const badgeParam = params.get("badge");
      if (badgeParam) {
        const match = (BADGE_DEFINITIONS as readonly BadgeDefinition[]).find(
          (b) => b.id === badgeParam
        );
        if (match) {
          setSelectedBadge(match);
        }
      }
    }
  }, [loading]);

  // Index unlocked records by badge_id for O(1) lookup
  const unlockedMap = React.useMemo(() => {
    const map = new Map<string, UserBadgeRecord>();
    for (const record of unlockedBadges) {
      map.set(record.badge_id, record);
    }
    return map;
  }, [unlockedBadges]);

  // Filtered badge list
  const filteredBadges = React.useMemo(() => {
    if (selectedCategory === "all") return BADGE_DEFINITIONS as readonly BadgeDefinition[];
    return (BADGE_DEFINITIONS as readonly BadgeDefinition[]).filter(
      (b: BadgeDefinition) => b.category === selectedCategory
    );
  }, [selectedCategory]);

  const totalUnlocked = unlockedBadges.length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <PageHeader
        title="Creator Badges & Achievements"
        description="Celebrate your milestones, craft memorable surprise moments, and unlock collectible badges as you delight recipients."
        badge={`${totalUnlocked} / 50 Unlocked`}
        badgeVariant="purple"
        breadcrumbs={[
          { label: "Studio Hub", href: "/profile" },
          { label: "Badges" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="gap-1.5 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        }
      />

      {/* Level & XP Progression Hero Bar */}
      <LevelProgressBar totalXp={summary?.total_xp || 0} />

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;

          // Calculate unlocked count for this tab
          const categoryUnlockedCount =
            tab.id === "all"
              ? totalUnlocked
              : (BADGE_DEFINITIONS as readonly BadgeDefinition[]).filter(
                  (b: BadgeDefinition) => b.category === tab.id && unlockedMap.has(b.id)
                ).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all select-none border",
                isSelected
                  ? "bg-brand-dark text-white border-brand-dark shadow-sm"
                  : "bg-white text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle border-brand-warm-border"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-brand-warm-subtle text-brand-dark"
                )}
              >
                {categoryUnlockedCount}/{tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Badges Grid or Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
          <p className="text-sm text-brand-muted">Loading your achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredBadges.map((badge: BadgeDefinition) => {
            const userBadge = unlockedMap.get(badge.id);
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                userBadge={userBadge}
                onClick={() => setSelectedBadge(badge)}
              />
            );
          })}
        </div>
      )}

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        userBadge={selectedBadge ? unlockedMap.get(selectedBadge.id) : undefined}
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
        onOpenStoryModal={(badge) => {
          setSelectedBadge(null);
          setStoryBadge(badge);
        }}
      />

      {/* Story Exporter Modal */}
      <StoryShareModal
        badge={storyBadge}
        userBadge={storyBadge ? unlockedMap.get(storyBadge.id) : undefined}
        creatorName={creatorName}
        isOpen={Boolean(storyBadge)}
        onClose={() => setStoryBadge(null)}
      />
    </div>
  );
}
