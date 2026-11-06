"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Clock,
  Layers,
  RotateCw,
  AlertTriangle,
  ExternalLink,
  Search,
  X,
  PlusCircle,
  Camera,
  FileText,
  Palette,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { getUserCardsWithMetrics, buildCardShareUrl } from "@/lib/cards";
import type { CardRecord, CoverStyle } from "@/types/card";
import { cn } from "@/lib/utils";

type AnalyticsTab = "overview" | "creation" | "reveals" | "engagement" | "history";

const FOIL_LABELS: Record<CoverStyle, string> = {
  "lavender-pink": "Lavender Pink",
  "golden-foil": "Golden Foil",
  "cosmic-purple": "Cosmic Purple",
  "mint-fresh": "Mint Fresh",
};

export default function AnalyticsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = React.useState<AnalyticsTab>("overview");
  const [cards, setCards] = React.useState<CardRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const loadData = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserCardsWithMetrics();
      setCards(data);
      setLastSyncedAt(new Date());
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to retrieve analytics. Please check your connection.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab definitions
  const tabs: { id: AnalyticsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "creation", label: "Card Creation", icon: Layers },
    { id: "reveals", label: "Scratch & Reveal", icon: Eye },
    { id: "engagement", label: "Engagement Insights", icon: TrendingUp },
    { id: "history", label: "Latest Activity", icon: Clock },
  ];

  // Defined Populations (Strictly adhering to Requirement 3)
  const allCards = cards;
  const publishedCards = React.useMemo(() => cards.filter((c) => c.status === "published"), [cards]);
  const archivedCards = React.useMemo(() => cards.filter((c) => c.status === "archived"), [cards]);
  const activeAndArchivedCards = React.useMemo(
    () => cards.filter((c) => c.status === "published" || c.status === "archived"),
    [cards]
  );

  // Overview KPI totals (Based strictly on currently published cards only)
  const overviewMetrics = React.useMemo(() => {
    let totalViews = 0;
    let totalReveals = 0;

    for (const card of publishedCards) {
      totalViews += card.views_count || 0;
      totalReveals += card.reveals_count || 0;
    }

    // Uncapped recorded ratio as required (Requirement 1)
    const revealRatio = totalViews > 0 ? (totalReveals / totalViews) * 100 : 0;

    return {
      totalViews,
      totalReveals,
      revealRatio,
      publishedCount: publishedCards.length,
      archivedCount: archivedCards.length,
    };
  }, [publishedCards, archivedCards]);

  // Search-filtered cards for Per-Card Table
  const filteredTableCards = React.useMemo(() => {
    if (!searchQuery.trim()) return activeAndArchivedCards;
    const q = searchQuery.toLowerCase().trim();
    return activeAndArchivedCards.filter(
      (c) =>
        c.recipient_name?.toLowerCase().includes(q) ||
        c.sender_name?.toLowerCase().includes(q) ||
        c.occasion_tag?.toLowerCase().includes(q) ||
        c.primary_message?.toLowerCase().includes(q)
    );
  }, [activeAndArchivedCards, searchQuery]);

  // Creation Analytics (Disclosed population: all cards in catalogue)
  const creationStats = React.useMemo(() => {
    const total = allCards.length;
    let templateCount = 0;
    let scratchCount = 0;
    let photoCount = 0;
    let textOnlyCount = 0;

    const occasionMap: Record<string, number> = {};
    const foilMap: Record<CoverStyle, number> = {
      "lavender-pink": 0,
      "golden-foil": 0,
      "cosmic-purple": 0,
      "mint-fresh": 0,
    };

    for (const card of allCards) {
      if (card.creation_mode === "template") templateCount++;
      else scratchCount++;

      if (card.photo_path) photoCount++;
      else textOnlyCount++;

      const tag = card.occasion_tag || "General";
      occasionMap[tag] = (occasionMap[tag] || 0) + 1;

      if (card.foil_style && foilMap[card.foil_style] !== undefined) {
        foilMap[card.foil_style]++;
      }
    }

    const topOccasions = Object.entries(occasionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      templateCount,
      scratchCount,
      photoCount,
      textOnlyCount,
      topOccasions,
      foilMap,
    };
  }, [allCards]);

  // Scratch & Reveal Performance (Published cards only)
  const revealStats = React.useMemo(() => {
    let highEngagement = 0; // >= 75%
    let moderateEngagement = 0; // 40% - 74%
    let lowOrPending = 0; // < 40% or 0 views

    for (const card of publishedCards) {
      const views = card.views_count || 0;
      const reveals = card.reveals_count || 0;
      if (views === 0) {
        lowOrPending++;
      } else {
        const ratio = (reveals / views) * 100;
        if (ratio >= 75) highEngagement++;
        else if (ratio >= 40) moderateEngagement++;
        else lowOrPending++;
      }
    }

    const avgRevealsPerCard =
      publishedCards.length > 0 ? (overviewMetrics.totalReveals / publishedCards.length).toFixed(1) : "0.0";

    return {
      highEngagement,
      moderateEngagement,
      lowOrPending,
      avgRevealsPerCard,
    };
  }, [publishedCards, overviewMetrics.totalReveals]);

  // Comparative Insights (Strict sample size gate: Requirement 4)
  const comparativeInsights = React.useMemo(() => {
    // 1. Photo vs Text-only check
    const photoGroup = publishedCards.filter((c) => Boolean(c.photo_path) && (c.views_count || 0) >= 1);
    const textGroup = publishedCards.filter((c) => !c.photo_path && (c.views_count || 0) >= 1);

    const hasPhotoTextSample = photoGroup.length >= 3 && textGroup.length >= 3;
    let photoComparison = null;

    if (hasPhotoTextSample) {
      const photoViews = photoGroup.reduce((sum, c) => sum + (c.views_count || 0), 0);
      const photoReveals = photoGroup.reduce((sum, c) => sum + (c.reveals_count || 0), 0);
      const photoRatio = photoViews > 0 ? ((photoReveals / photoViews) * 100).toFixed(1) : "0.0";

      const textViews = textGroup.reduce((sum, c) => sum + (c.views_count || 0), 0);
      const textReveals = textGroup.reduce((sum, c) => sum + (c.reveals_count || 0), 0);
      const textRatio = textViews > 0 ? ((textReveals / textViews) * 100).toFixed(1) : "0.0";

      photoComparison = {
        photoCount: photoGroup.length,
        photoRatio,
        textCount: textGroup.length,
        textRatio,
      };
    }

    // 2. Creation Mode check (Template vs Scratch)
    const templateGroup = publishedCards.filter((c) => c.creation_mode === "template" && (c.views_count || 0) >= 1);
    const scratchGroup = publishedCards.filter((c) => c.creation_mode === "scratch" && (c.views_count || 0) >= 1);

    const hasCreationModeSample = templateGroup.length >= 3 && scratchGroup.length >= 3;
    let modeComparison = null;

    if (hasCreationModeSample) {
      const tViews = templateGroup.reduce((sum, c) => sum + (c.views_count || 0), 0);
      const tReveals = templateGroup.reduce((sum, c) => sum + (c.reveals_count || 0), 0);
      const tRatio = tViews > 0 ? ((tReveals / tViews) * 100).toFixed(1) : "0.0";

      const sViews = scratchGroup.reduce((sum, c) => sum + (c.views_count || 0), 0);
      const sReveals = scratchGroup.reduce((sum, c) => sum + (c.reveals_count || 0), 0);
      const sRatio = sViews > 0 ? ((sReveals / sViews) * 100).toFixed(1) : "0.0";

      modeComparison = {
        templateCount: templateGroup.length,
        templateRatio: tRatio,
        scratchCount: scratchGroup.length,
        scratchRatio: sRatio,
      };
    }

    const hasAnyComparison = Boolean(photoComparison || modeComparison);

    return {
      hasAnyComparison,
      photoComparison,
      modeComparison,
      photoEligibleCount: photoGroup.length,
      textEligibleCount: textGroup.length,
      templateEligibleCount: templateGroup.length,
      scratchEligibleCount: scratchGroup.length,
    };
  }, [publishedCards]);

  // Activity History: Sorted by latest recorded activity timestamp
  const sortedActivityCards = React.useMemo(() => {
    return [...activeAndArchivedCards].sort((a, b) => {
      const timeA = Math.max(
        a.last_revealed_at ? new Date(a.last_revealed_at).getTime() : 0,
        a.last_viewed_at ? new Date(a.last_viewed_at).getTime() : 0,
        a.published_at ? new Date(a.published_at).getTime() : 0,
        a.created_at ? new Date(a.created_at).getTime() : 0
      );
      const timeB = Math.max(
        b.last_revealed_at ? new Date(b.last_revealed_at).getTime() : 0,
        b.last_viewed_at ? new Date(b.last_viewed_at).getTime() : 0,
        b.published_at ? new Date(b.published_at).getTime() : 0,
        b.created_at ? new Date(b.created_at).getTime() : 0
      );
      return timeB - timeA;
    });
  }, [activeAndArchivedCards]);

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return "None recorded";
    try {
      return new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* 1. Page Header with Honest Last Synced Indicator */}
      <PageHeader
        title="Analytics & Performance"
        description="Monitor how recipients interact with your surprise cards and explore data-driven performance trends."
        badge={overviewMetrics.publishedCount > 0 ? "Active Telemetry" : undefined}
        badgeVariant="pink"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Analytics" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {lastSyncedAt && (
              <span className="text-xs text-brand-muted hidden sm:inline">
                Last synced: {lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="gap-2 text-xs"
            >
              <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              <span>Refresh Data</span>
            </Button>
          </div>
        }
      />

      {/* 2. Sub-navigation Tabs */}
      <div className="border-b border-brand-warm-border overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-brand-dark text-white shadow-xs"
                    : "text-brand-muted hover:text-brand-dark hover:bg-white"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-brand-pink" : "text-brand-muted")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Error Alert State */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs text-rose-700 bg-white">
            Retry Connection
          </Button>
        </div>
      )}

      {/* 4. Main Tab Content */}
      {isLoading ? (
        // Loading Skeleton
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-brand-warm-border" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-brand-warm-border" />
        </div>
      ) : allCards.length === 0 ? (
        // Empty State: No Cards Created
        <EmptyState
          icon={Layers}
          title="No Card Analytics Yet"
          description="You haven't created any surprise scratch cards yet. Head over to the Card Studio to create and share your first card."
          action={
            <Link href="/create">
              <Button variant="primary" size="md" className="gap-2 shadow-md">
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Card</span>
              </Button>
            </Link>
          }
        />
      ) : activeTab === "overview" ? (
        // TAB 1: OVERVIEW
        <div className="space-y-8">
          {/* Top 4 KPI Cards (Published Cards Only - Requirement 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Card Views"
              value={overviewMetrics.totalViews.toLocaleString()}
              subtext="Across published cards"
              icon={Eye}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
              badge="15m Deduplicated"
              badgeVariant="muted"
            />

            <StatCard
              label="Total Reveals"
              value={overviewMetrics.totalReveals.toLocaleString()}
              subtext="Completed scratch reveals"
              icon={Sparkles}
              iconBgColor="bg-brand-pink-light"
              iconColor="text-brand-pink"
              badge="Recorded Events"
              badgeVariant="default"
            />

            <StatCard
              label="Reveal-to-View Ratio"
              value={
                overviewMetrics.totalViews > 0
                  ? `${overviewMetrics.revealRatio.toFixed(1)}%`
                  : "0% (No views)"
              }
              subtext="Recorded reveals per view"
              icon={TrendingUp}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              badge="Uncapped Ratio"
              badgeVariant="success"
            />

            <StatCard
              label="Active Live Cards"
              value={overviewMetrics.publishedCount}
              subtext={`${overviewMetrics.archivedCount} archived`}
              icon={Layers}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
              badge={`${overviewMetrics.publishedCount} Published`}
              badgeVariant="muted"
              href="/profile#my-cards"
            />
          </div>

          {/* Metric Note on Ratio Interpretation */}
          <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border text-xs text-brand-dark/80 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-pink shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-brand-dark">About Recorded Telemetry Metrics</p>
              <p className="text-brand-muted leading-relaxed">
                Views and reveals are recorded with a 15-minute deduplication window per visitor. Because views and reveals
                are deduplicated independently, this ratio reflects aggregate recorded events rather than 1:1 unique-recipient
                conversions.
              </p>
            </div>
          </div>

          {/* Per-Card Performance Table (Published & Archived Cards - Requirement 3) */}
          <div className="bg-white rounded-3xl border border-brand-warm-border shadow-card overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-brand-dark tracking-tight">Card-by-Card Performance</h3>
                <p className="text-xs text-brand-muted">
                  Includes published and archived cards. Drafts are excluded as they cannot receive recipient traffic.
                </p>
              </div>

              {/* Table Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter cards..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-white border border-brand-warm-border focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink text-brand-dark placeholder:text-brand-muted shadow-xs transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-brand-muted hover:text-brand-dark"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {activeAndArchivedCards.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted space-y-2">
                <p className="font-semibold text-brand-dark">No Published or Archived Cards Yet</p>
                <p>Publish a draft card to start tracking recipient views and reveals.</p>
              </div>
            ) : filteredTableCards.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted space-y-2">
                <p className="font-semibold text-brand-dark">No Matching Cards</p>
                <p>No cards match &ldquo;{searchQuery}&rdquo;. Try another search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-warm-subtle text-brand-muted uppercase font-semibold text-[10px] tracking-wider border-y border-brand-warm-border">
                    <tr>
                      <th className="py-3 px-6">Card</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Recorded Views</th>
                      <th className="py-3 px-4">Recorded Reveals</th>
                      <th className="py-3 px-4">Reveal-to-View Ratio</th>
                      <th className="py-3 px-4">Latest Interaction</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-warm-border">
                    {filteredTableCards.map((card) => {
                      const views = card.views_count || 0;
                      const reveals = card.reveals_count || 0;
                      // Uncapped ratio calculation (Requirement 1)
                      const ratio = views > 0 ? (reveals / views) * 100 : 0;
                      const latestTimestamp = card.last_revealed_at || card.last_viewed_at;

                      return (
                        <tr key={card.id} className="hover:bg-brand-warm-subtle/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <p className="font-bold text-brand-dark text-xs truncate max-w-[200px]">
                                For {card.recipient_name}
                              </p>
                              <p className="text-[11px] text-brand-muted truncate max-w-[200px]">
                                {card.occasion_tag} &bull; {card.sender_name}
                              </p>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {card.status === "published" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Published</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                <Archive className="w-3 h-3 text-slate-500" />
                                <span>Archived</span>
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-semibold text-brand-dark">
                            {views.toLocaleString()}
                          </td>

                          <td className="py-4 px-4 font-semibold text-brand-dark">
                            {reveals.toLocaleString()}
                          </td>

                          <td className="py-4 px-4">
                            <div className="space-y-1 min-w-[120px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-brand-dark">
                                  {views > 0 ? `${ratio.toFixed(1)}%` : "0% (No views)"}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-brand-warm-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-pink rounded-full transition-all"
                                  style={{ width: `${Math.min(100, ratio)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-brand-muted text-[11px]">
                            {latestTimestamp ? formatTimestamp(latestTimestamp) : "No activity"}
                          </td>

                          <td className="py-4 px-6 text-right">
                            {card.status === "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(buildCardShareUrl(card.slug), "_blank", "noopener,noreferrer")
                                }
                                className="text-[11px] gap-1 py-1 px-2.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] text-brand-muted italic">Archived</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "creation" ? (
        // TAB 2: CARD CREATION ANALYTICS (Disclosed population: all cards - Requirement 3)
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-brand-warm-border shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-brand-dark">Creative Portfolio Distribution</h3>
              <p className="text-xs text-brand-muted">
                Analyzes your entire creative catalogue of {creationStats.total} cards (including drafts, published, and archived).
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-warm text-brand-dark border border-brand-warm-border">
              {creationStats.total} Total Cards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creation Modes */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">Creation Mode Breakdown</h4>
                  <p className="text-xs text-brand-muted">From Scratch vs From Template</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between font-semibold pb-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                      <span>Custom Scratch</span>
                    </span>
                    <span>
                      {creationStats.scratchCount} ({creationStats.total > 0 ? Math.round((creationStats.scratchCount / creationStats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-warm rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-pink rounded-full"
                      style={{
                        width: `${creationStats.total > 0 ? (creationStats.scratchCount / creationStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold pb-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>Gallery Templates</span>
                    </span>
                    <span>
                      {creationStats.templateCount} ({creationStats.total > 0 ? Math.round((creationStats.templateCount / creationStats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-warm rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{
                        width: `${creationStats.total > 0 ? (creationStats.templateCount / creationStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Customization */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">Media Integration</h4>
                  <p className="text-xs text-brand-muted">Photo Attachments vs Text-Only Surprises</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between font-semibold pb-1">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Custom Photo Surprise</span>
                    </span>
                    <span>
                      {creationStats.photoCount} ({creationStats.total > 0 ? Math.round((creationStats.photoCount / creationStats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-warm rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${creationStats.total > 0 ? (creationStats.photoCount / creationStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold pb-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-muted" />
                      <span>Text-Only Surprises</span>
                    </span>
                    <span>
                      {creationStats.textOnlyCount} ({creationStats.total > 0 ? Math.round((creationStats.textOnlyCount / creationStats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-brand-warm rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{
                        width: `${creationStats.total > 0 ? (creationStats.textOnlyCount / creationStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Occasions */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">Top Occasion Categories</h4>
                  <p className="text-xs text-brand-muted">Most frequent occasions in your portfolio</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 text-xs">
                {creationStats.topOccasions.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between p-2 rounded-xl bg-brand-warm-subtle">
                    <span className="font-semibold text-brand-dark">{tag}</span>
                    <span className="text-brand-muted">{count} {count === 1 ? "card" : "cards"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Foil Finishes */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-brand-pink flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">Foil Style Distribution</h4>
                  <p className="text-xs text-brand-muted">Your selected card cover themes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {(Object.entries(creationStats.foilMap) as [CoverStyle, number][]).map(([style, count]) => (
                  <div key={style} className="p-3 rounded-2xl border border-brand-warm-border space-y-1">
                    <p className="font-semibold text-brand-dark">{FOIL_LABELS[style] || style}</p>
                    <p className="text-base font-extrabold text-brand-dark">{count}</p>
                    <p className="text-[10px] text-brand-muted">
                      {creationStats.total > 0 ? Math.round((count / creationStats.total) * 100) : 0}% of portfolio
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "reveals" ? (
        // TAB 3: SCRATCH & REVEAL PERFORMANCE (Published cards only - Requirement 3, NO unrevealed views - Requirement 2)
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-brand-warm-border shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-brand-dark">Scratch & Reveal Efficiency</h3>
              <p className="text-xs text-brand-muted">
                Analyzes interaction efficiency across your {publishedCards.length} currently published cards.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {publishedCards.length} Live Cards
            </span>
          </div>

          {/* Views to Reveals Comparison (Requirement 2: Strictly Views, Reveals, and Ratio) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6">
            <div>
              <h4 className="text-base font-bold text-brand-dark">Recorded Interaction Metrics</h4>
              <p className="text-xs text-brand-muted">
                Direct comparison between recorded link opens and completed scratch reveals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-xs font-semibold text-blue-700 uppercase">Recorded Views</span>
                <p className="text-2xl font-extrabold text-blue-900">{overviewMetrics.totalViews.toLocaleString()}</p>
                <p className="text-[11px] text-blue-700/80">Total deduplicated link opens</p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-pink-light border border-brand-pink/20 space-y-1">
                <span className="text-xs font-semibold text-brand-pink uppercase">Recorded Reveals</span>
                <p className="text-2xl font-extrabold text-brand-dark">{overviewMetrics.totalReveals.toLocaleString()}</p>
                <p className="text-[11px] text-brand-muted">Completed scratch reveals</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs font-semibold text-emerald-700 uppercase">Reveal-to-View Ratio</span>
                <p className="text-2xl font-extrabold text-emerald-900">
                  {overviewMetrics.totalViews > 0
                    ? `${overviewMetrics.revealRatio.toFixed(1)}%`
                    : "0% (No views)"}
                </p>
                <p className="text-[11px] text-emerald-700/80">Aggregate reveals per view</p>
              </div>
            </div>

            <div className="p-3 bg-brand-warm-subtle rounded-xl border border-brand-warm-border text-xs text-brand-muted leading-relaxed">
              <strong>Methodology Note:</strong> Views and reveals are independently deduplicated within 15-minute visitor sessions.
              Because independent visitor sessions may view without revealing, or view multiple times prior to scratching,
              unrevealed views are not subtracted to preserve metric integrity.
            </div>
          </div>

          {/* Performance Tiers & Averages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <h4 className="text-sm font-bold text-brand-dark">Card Engagement Distribution</h4>
              <p className="text-xs text-brand-muted">Categorized by reveal-to-view ratio across published cards</p>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div>
                    <p className="font-bold text-emerald-900">High Reveal Ratio (&ge; 75%)</p>
                    <p className="text-[11px] text-emerald-700">Cards converting most views to reveals</p>
                  </div>
                  <span className="text-lg font-extrabold text-emerald-800">{revealStats.highEngagement}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div>
                    <p className="font-bold text-amber-900">Moderate Reveal Ratio (40% &ndash; 74%)</p>
                    <p className="text-[11px] text-amber-700">Healthy interaction baseline</p>
                  </div>
                  <span className="text-lg font-extrabold text-amber-800">{revealStats.moderateEngagement}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800">Low / Awaiting Views (&lt; 40%)</p>
                    <p className="text-[11px] text-slate-600">Recently published or lower conversion</p>
                  </div>
                  <span className="text-lg font-extrabold text-slate-700">{revealStats.lowOrPending}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-brand-dark">Average Reveals per Published Card</h4>
                <p className="text-xs text-brand-muted">
                  Mathematical average of completed reveals across your {publishedCards.length} published cards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border text-center space-y-1">
                <span className="text-4xl font-extrabold text-brand-dark">{revealStats.avgRevealsPerCard}</span>
                <p className="text-xs text-brand-muted">Average reveals per card</p>
              </div>

              <p className="text-[11px] text-brand-muted text-center">
                Calculated strictly as: total recorded reveals ({overviewMetrics.totalReveals}) divided by active published cards ({publishedCards.length}).
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === "engagement" ? (
        // TAB 4: ENGAGEMENT INSIGHTS (Strict sample size gate: Requirement 4)
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-brand-warm-border shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-brand-dark">Comparative Engagement Insights</h3>
              <p className="text-xs text-brand-muted">
                Observational data comparisons based strictly on your published cards with recorded views.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-warm text-brand-dark border border-brand-warm-border">
              Sample Gated
            </span>
          </div>

          {!comparativeInsights.hasAnyComparison ? (
            // Insufficient Data State (Requirement 4)
            <div className="rounded-3xl p-8 sm:p-12 border-2 border-dashed border-brand-warm-border bg-white text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                <Info className="w-7 h-7" />
              </div>

              <div className="space-y-2 max-w-md">
                <h4 className="text-base font-bold text-brand-dark">Insufficient Data for Comparative Insights</h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  To ensure statistical validity and prevent misleading conclusions, comparative insights require{" "}
                  <strong>at least 3 cards in each comparison group</strong>, with <strong>at least 1 recorded view per card</strong>.
                </p>
              </div>

              {/* Progress towards threshold */}
              <div className="w-full max-w-sm pt-4 border-t border-brand-warm-border/60 text-xs space-y-2 text-left">
                <p className="font-semibold text-brand-dark text-center pb-1">Current Eligibility Progress:</p>
                <div className="flex justify-between text-brand-muted">
                  <span>Photo cards with views:</span>
                  <span className="font-bold text-brand-dark">{comparativeInsights.photoEligibleCount} of 3 required</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Text-only cards with views:</span>
                  <span className="font-bold text-brand-dark">{comparativeInsights.textEligibleCount} of 3 required</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Template cards with views:</span>
                  <span className="font-bold text-brand-dark">{comparativeInsights.templateEligibleCount} of 3 required</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Scratch cards with views:</span>
                  <span className="font-bold text-brand-dark">{comparativeInsights.scratchEligibleCount} of 3 required</span>
                </div>
              </div>
            </div>
          ) : (
            // Sized Sample Comparison Insights
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparativeInsights.photoComparison && (
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark">Format Comparison</h4>
                      <p className="text-xs text-brand-muted">Photo Attachments vs Text-Only</p>
                    </div>
                  </div>

                  <p className="text-xs text-brand-dark/80 leading-relaxed">
                    In your portfolio, published cards with custom photo attachments recorded an aggregate reveal-to-view
                    ratio of <strong>{comparativeInsights.photoComparison.photoRatio}%</strong> (across{" "}
                    {comparativeInsights.photoComparison.photoCount} qualifying cards), compared to{" "}
                    <strong>{comparativeInsights.photoComparison.textRatio}%</strong> for text-only cards (across{" "}
                    {comparativeInsights.photoComparison.textCount} qualifying cards).
                  </p>

                  <p className="text-[11px] text-brand-muted italic">
                    Note: This is an observational summary of recorded events and does not imply guaranteed causation.
                  </p>
                </div>
              )}

              {comparativeInsights.modeComparison && (
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark">Creation Mode Comparison</h4>
                      <p className="text-xs text-brand-muted">Template vs Custom Scratch</p>
                    </div>
                  </div>

                  <p className="text-xs text-brand-dark/80 leading-relaxed">
                    In your portfolio, cards customized from templates recorded an aggregate reveal-to-view ratio of{" "}
                    <strong>{comparativeInsights.modeComparison.templateRatio}%</strong> (across{" "}
                    {comparativeInsights.modeComparison.templateCount} qualifying cards), compared to{" "}
                    <strong>{comparativeInsights.modeComparison.scratchRatio}%</strong> for cards built from scratch
                    (across {comparativeInsights.modeComparison.scratchCount} qualifying cards).
                  </p>

                  <p className="text-[11px] text-brand-muted italic">
                    Note: This is an observational summary of recorded events and does not imply guaranteed causation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // TAB 5: LATEST RECORDED ACTIVITY (Published and Archived Cards - Requirement 3 & 4)
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-brand-warm-border shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-brand-dark">Latest Recorded Card Activity</h3>
              <p className="text-xs text-brand-muted">
                Displays the latest recorded activity timestamps for your cards. Suprilo does not maintain an exhaustive historical event log.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-warm text-brand-dark border border-brand-warm-border">
              {activeAndArchivedCards.length} Tracked Cards
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-warm-border shadow-card overflow-hidden">
            {sortedActivityCards.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted space-y-2">
                <p className="font-semibold text-brand-dark">No Activity Recorded Yet</p>
                <p>Activity will appear here once cards are published and opened by recipients.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-warm-subtle text-brand-muted uppercase font-semibold text-[10px] tracking-wider border-b border-brand-warm-border">
                    <tr>
                      <th className="py-3 px-6">Card</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Published Date</th>
                      <th className="py-3 px-4">Latest Recorded View</th>
                      <th className="py-3 px-4">Latest Recorded Reveal</th>
                      <th className="py-3 px-6 text-right">Lifetime Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-warm-border">
                    {sortedActivityCards.map((card) => (
                      <tr key={card.id} className="hover:bg-brand-warm-subtle/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-brand-dark text-xs truncate max-w-[200px]">
                            For {card.recipient_name}
                          </p>
                          <p className="text-[11px] text-brand-muted truncate max-w-[200px]">
                            {card.occasion_tag}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          {card.status === "published" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Published</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              <Archive className="w-3 h-3 text-slate-500" />
                              <span>Archived</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-brand-dark">
                          {formatTimestamp(card.published_at)}
                        </td>

                        <td className="py-4 px-4 text-brand-muted">
                          {card.last_viewed_at ? formatTimestamp(card.last_viewed_at) : "None recorded"}
                        </td>

                        <td className="py-4 px-4 text-brand-muted">
                          {card.last_revealed_at ? formatTimestamp(card.last_revealed_at) : "None recorded"}
                        </td>

                        <td className="py-4 px-6 text-right font-medium text-brand-dark">
                          {(card.views_count || 0)} views &bull; {(card.reveals_count || 0)} reveals
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
