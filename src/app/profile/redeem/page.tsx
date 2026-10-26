"use client";

import * as React from "react";
import {
  Gift,
  Tag,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Receipt,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Button } from "@/components/ui/Button";

export default function RedeemPage() {
  const [code, setCode] = React.useState("");
  const [feedback, setFeedback] = React.useState<{ type: "info" | "error"; message: string } | null>(null);

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a valid promotional or gift code.",
      });
      return;
    }

    // Honest notification that redemption engine is coming soon
    setFeedback({
      type: "info",
      message:
        "The Suprilo Code Redemption & Partner Rewards engine is launching in Phase 4. Promo codes cannot be processed yet.",
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Redeem & Partner Rewards"
        description="Enter promotional gift vouchers, coupon codes, and monitor creator affiliate referral earnings."
        badge="Rewards System"
        badgeVariant="orange"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Redeem" },
        ]}
      />

      {/* Code Input Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-pink-light text-brand-pink flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark tracking-tight">Redeem a Voucher or Code</h3>
            <p className="text-xs text-brand-muted">Enter a gift code, beta promo key, or creator voucher</p>
          </div>
        </div>

        <form onSubmit={handleRedeemSubmit} className="max-w-xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (feedback) setFeedback(null);
                }}
                placeholder="e.g. SUPRILO-SURPRISE-2026"
                className="w-full px-4 py-3 rounded-xl border border-brand-warm-border bg-brand-warm/30 text-brand-dark font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-pink focus:bg-white transition-all"
              />
              <Tag className="w-4 h-4 text-brand-muted absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            <Button type="submit" variant="primary" size="md" className="shrink-0 gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>Apply Code</span>
            </Button>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                feedback.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              {feedback.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Rewards & Commission Summary Cards (Honest 0 data with clear Coming Soon labels) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-dark tracking-tight">Affiliate & Partner Earnings</h3>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Payouts Coming Soon</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pending Commission"
            value="$0.00"
            subtext="Awaiting database connection"
            icon={Coins}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
            badge="Locked"
            badgeVariant="warning"
          />
          <StatCard
            label="Confirmed Earnings"
            value="$0.00"
            subtext="Ready for monthly payout"
            icon={CheckCircle2}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-600"
            badge="0 Referrals"
            badgeVariant="muted"
          />
          <StatCard
            label="Total Redeemed"
            value="0"
            subtext="Vouchers applied"
            icon={Tag}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            badge="None"
            badgeVariant="muted"
          />
          <StatCard
            label="Next Payout Date"
            value="N/A"
            subtext="Payout pipeline in dev"
            icon={Clock}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            badge="Inactive"
            badgeVariant="muted"
          />
        </div>
      </div>

      {/* Redemption History with Honest Empty State */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-brand-dark tracking-tight">Redemption History</h3>

        <EmptyState
          icon={Receipt}
          title="No Redemptions Recorded"
          description="You haven't redeemed any promo keys, creator vouchers, or gift codes yet. Redeemed codes and corresponding perks will be logged here."
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Architecture Roadmap Panel */}
      <ComingSoonPanel
        title="Partner & Creator Commission Engine"
        description="We are building an affiliate program that enables event organizers, influencers, and creators to earn commissions when their audience signs up or buys cards using unique referral tags."
        features={[
          "Unique shareable creator referral links with custom slugs",
          "Automated attribution tracking for referrals and conversions",
          "Stripe Connect direct deposit for creator monthly payouts",
          "Privacy-first recipient masking (no PII leak across referrers)",
        ]}
      />
    </div>
  );
}
