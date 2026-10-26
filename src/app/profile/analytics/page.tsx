"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  Clock,
  Share2,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { cn } from "@/lib/utils";

type AnalyticsTab = "overview" | "creation" | "reveals" | "engagement" | "history";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState<AnalyticsTab>("overview");

  const tabs: { id: AnalyticsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "creation", label: "Card Creation", icon: Layers },
    { id: "reveals", label: "Scratch & Reveal", icon: Eye },
    { id: "engagement", label: "Engagement Insights", icon: TrendingUp },
    { id: "history", label: "Activity History", icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Insights"
        description="Monitor how recipients interact with your surprise cards, track reveal completion times, and understand engagement."
        badge="Coming Soon"
        badgeVariant="orange"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Analytics" },
        ]}
      />

      {/* Modular Sub-navigation Tabs */}
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
                    ? "bg-brand-dark text-white shadow-sm"
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

      {/* Tab Content Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <ComingSoonPanel
            title="Real-Time Analytics Engine"
            description="Our telemetry & event stream architecture is being developed. Soon you'll be able to view live reveal metrics, geographical distribution of opens, and interaction heatmaps."
            features={[
              "Total card impressions and opens per link",
              "100% surface reveal completion rates",
              "Average scratch duration and reveal speed",
              "Recipient device type distribution (Mobile vs Desktop)",
              "Love note reaction counters and replies",
              "Automated weekly engagement digest via email",
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-brand-dark">Link Open Tracking</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Know the exact minute your recipient opens your custom surprise link anywhere in the world.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-blue-600">
                Awaiting Database Link
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-brand-dark">Scratch Heatmaps</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Visual analysis of which quadrant or focal point users begin scratching off first on the foil.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-amber-600">
                Under Development
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-brand-dark">Referral & Virality</h4>
              <p className="text-xs text-brand-muted leading-relaxed">
                Track secondary impressions when your card recipients share their surprise moment with friends.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-purple-600">
                Phase 4 Roadmap
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "creation" && (
        <ComingSoonPanel
          title="Card Creation Analytics"
          description="Detailed metrics on your creative habits, most frequently used color palettes, themes, and occasion categories."
          features={[
            "Most popular card themes (Valentine's, Birthday, Anniversary)",
            "Average creation session duration in Card Studio",
            "Template customization breakdown",
            "Photo vs Text surprise comparison",
          ]}
        />
      )}

      {activeTab === "reveals" && (
        <ComingSoonPanel
          title="Scratch & Reveal Performance"
          description="Track how recipients experience the suspense of your scratch cards from the first swipe to the final confetti pop."
          features={[
            "Percentage of recipients reaching 100% reveal",
            "Average seconds spent actively scratching",
            "Audio toggle rate (percentage of recipients who turned sound on)",
            "Scratch velocity and touch intensity trends",
          ]}
        />
      )}

      {activeTab === "engagement" && (
        <ComingSoonPanel
          title="Engagement & Reaction Insights"
          description="Understand emotional resonance and recipient feedback across all your published surprise links."
          features={[
            "Love note reply rate",
            "Emoji sentiment breakdown from recipients",
            "Card re-play rate (how many times recipients re-scratched your card)",
            "Social share clicks from recipient reveal screens",
          ]}
        />
      )}

      {activeTab === "history" && (
        <ComingSoonPanel
          title="Creator Activity Log"
          description="An immutable, audit-friendly event log of all actions taken on your account: card created, card edited, link shared, recipient revealed."
          features={[
            "Timestamped creation and publishing history",
            "Link status toggles (Active, Paused, Expired)",
            "IP and security access logs for your creator account",
            "CSV export capability for power creators",
          ]}
        />
      )}
    </div>
  );
}
