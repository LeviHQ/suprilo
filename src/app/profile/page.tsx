"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  Award,
  CreditCard,
  Layers,
  Eye,
  CheckCircle2,
  ArrowRight,
  Clock,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MySurpriseCards, CardFilterType } from "@/components/dashboard/MySurpriseCards";
import { getUserCardsWithMetrics } from "@/lib/cards";
import { getUserBadgesSummary, recordStudioVisit } from "@/lib/badges/service";
import { getLevelProgress, type UserBadgeSummary } from "@/types/badges";
import type { CardRecord } from "@/types/card";

export default function ProfileHomePage() {
  const { user } = useAuth();

  // Cards data state
  const [cards, setCards] = React.useState<CardRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [badgeSummary, setBadgeSummary] = React.useState<UserBadgeSummary | null>(null);

  // Controlled card filter to allow clicking StatCard to switch view
  const [cardFilter, setCardFilter] = React.useState<CardFilterType>("all");

  // Fetch user cards with metrics
  const loadCards = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const data = await getUserCardsWithMetrics();
      setCards(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to retrieve your scratch cards. Please check your connection.";
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadCards();
    if (user?.id) {
      recordStudioVisit(user.id)
        .then(() => getUserBadgesSummary(user.id))
        .then((summary) => {
          if (summary) {
            setBadgeSummary(summary);
          }
        })
        .catch(() => {
          getUserBadgesSummary(user.id)
            .then((summary) => {
              if (summary) setBadgeSummary(summary);
            })
            .catch(() => {});
        });
    }
  }, [loadCards, user?.id]);

  // Card mutation callbacks
  const handleCardArchived = React.useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: "archived" as const, draft_slot: null } : c))
    );
  }, []);

  const handleCardDeleted = React.useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  // Compute stats from real card records
  const stats = React.useMemo(() => {
    let publishedCount = 0;
    let draftsCount = 0;
    let totalReveals = 0;

    for (const card of cards) {
      if (card.status === "published") {
        publishedCount++;
        totalReveals += card.reveals_count || 0;
      } else if (card.status === "draft") {
        draftsCount++;
      }
    }

    return {
      publishedCount,
      draftsCount,
      totalReveals,
    };
  }, [cards]);

  // Gamification & Level computations from user summary
  const totalXp = badgeSummary?.total_xp ?? 0;
  const levelInfo = React.useMemo(() => getLevelProgress(totalXp), [totalXp]);

  if (!user) return null;

  // Real timestamps from authenticated session metadata
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently joined";

  const lastActive = user.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handlePublishedStatClick = () => {
    setCardFilter("published");
    const el = document.getElementById("my-cards");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Creator Hub Header */}
      <PageHeader
        title="Creator Hub"
        description="Welcome to your personal Suprilo Control Center. Craft surprises, monitor engagement, and personalize your experience."
        badge={user.isGoogleVerified ? "Active Account" : undefined}
        badgeVariant="pink"
        breadcrumbs={[{ label: "Control Center", href: "/profile" }, { label: "Home" }]}
        actions={
          <Link href="/create">
            <Button variant="primary" size="md" className="gap-2 shadow-md">
              <PlusCircle className="w-4 h-4" />
              <span>Create New Card</span>
            </Button>
          </Link>
        }
      />

      {/* 2. Profile Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card relative overflow-hidden">
        <div
          className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-brand-purple/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <UserAvatar user={user} size="xl" className="ring-4 ring-brand-pink/20 shadow-md shrink-0" />

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                {user.displayName || "Suprilo Creator"}
              </h2>

              {user.isGoogleVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Verified</span>
                </span>
              ) : null}

              {/* Creator Level Pill */}
              <Link
                href="/profile/badges"
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs group"
                title="View Creator Badges & Level Progress"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>Level {badgeSummary?.current_level ?? levelInfo.currentLevel.level}</span>
                <span className="text-amber-700 font-semibold">• {levelInfo.currentLevel.title}</span>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-brand-muted truncate max-w-md">
              {user.email || "No public email available"}
            </p>

            <p className="text-xs sm:text-sm text-brand-dark/75 font-medium pt-1">
              Make Every Moment a Surprise. Ready to create your next unforgettable surprise moment?
            </p>

            {/* Account Metadata Pills */}
            <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-brand-muted">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-warm-subtle border border-brand-warm-border">
                <Clock className="w-3.5 h-3.5 text-brand-pink" />
                <span>
                  Member since: <strong className="text-brand-dark">{memberSince}</strong>
                </span>
              </div>

              {lastActive ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-warm-subtle border border-brand-warm-border">
                  <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                  <span>
                    Last active: <strong className="text-brand-dark">{lastActive}</strong>
                  </span>
                </div>
              ) : null}

              {/* XP Counter Pill in metadata row */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-warm-subtle border border-brand-warm-border">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>
                  Experience: <strong className="text-brand-dark">{totalXp.toLocaleString()} XP</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level & XP Progression Strip */}
        <div className="mt-6 pt-5 border-t border-brand-warm-border/70 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2.5 py-0.5 rounded-full">
                Level {levelInfo.currentLevel.level} • {levelInfo.currentLevel.title}
              </span>
              <span className="text-xs text-brand-muted">
                {levelInfo.nextLevel
                  ? `${(levelInfo.nextLevel.requiredXp - totalXp).toLocaleString()} XP to Level ${levelInfo.nextLevel.level}`
                  : "Maximum Level Mastered 🎉"}
              </span>
            </div>
            <Link
              href="/profile/badges"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-pink hover:text-brand-pink/80 transition-colors"
            >
              <span>View Badges & Perks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden relative shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-pink via-rose-500 to-amber-500 transition-all duration-700 ease-out"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-brand-muted px-0.5">
            <span>
              {levelInfo.nextLevel ? (
                <>
                  <strong className="text-brand-dark">{levelInfo.xpInCurrentLevel.toLocaleString()}</strong> /{" "}
                  {levelInfo.currentLevel.deltaToNext?.toLocaleString() || 0} XP in current level
                </>
              ) : (
                "Hall of Fame Immortal"
              )}
            </span>
            <span className="font-semibold text-brand-dark">
              {totalXp.toLocaleString()} XP Total
            </span>
          </div>
        </div>
      </div>

      {/* 3. Four Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Published Cards"
          value={stats.publishedCount}
          subtext="Live surprise cards"
          icon={Layers}
          iconBgColor="bg-brand-pink-light"
          iconColor="text-brand-pink"
          badge={`${stats.publishedCount} Active`}
          badgeVariant="default"
          isLoading={isLoading}
          onClick={handlePublishedStatClick}
        />

        <StatCard
          label="Total Reveals"
          value={stats.totalReveals.toLocaleString()}
          subtext="Across published cards"
          icon={Eye}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          badge="Live Tracker"
          badgeVariant="muted"
          isLoading={isLoading}
        />

        <StatCard
          label="Badges Unlocked"
          value={`${badgeSummary?.unlocked_count ?? 0} / 50`}
          subtext="Achievement catalogue"
          icon={Award}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          badge="50 Total"
          badgeVariant="default"
          href="/profile/badges"
        />

        <StatCard
          label="Current Plan"
          value="Starter"
          subtext={`${stats.draftsCount} of 3 Draft Slots Used`}
          icon={CreditCard}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          badge={`${Math.max(0, 3 - stats.draftsCount)} Slots Free`}
          badgeVariant="success"
          isLoading={isLoading}
          href="/profile/billing"
        />
      </div>

      {/* 4. My Surprise Cards Section */}
      <MySurpriseCards
        cards={cards}
        isLoading={isLoading}
        error={fetchError}
        onRetry={loadCards}
        onCardArchived={handleCardArchived}
        onCardDeleted={handleCardDeleted}
        activeFilter={cardFilter}
        onFilterChange={setCardFilter}
      />
    </div>
  );
}
