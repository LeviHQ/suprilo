"use client";

import * as React from "react";
import {
  Users,
  Copy,
  Check,
  Tag,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  Receipt,
  Info,
  Share2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Button } from "@/components/ui/Button";

export default function ReferralPage() {
  const { user } = useAuth();
  const [code, setCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "info" | "error"; message: string } | null>(null);

  // Generate clean referral code and share URL based on creator identity
  const referralCode = React.useMemo(() => {
    if (!user?.id) return "SUPRILO-CREATOR";
    // Clean alphanumeric snippet
    const idSnippet = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    return `REF-${idSnippet}`;
  }, [user?.id]);

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://suprilo.com/?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a valid promotional or creator referral code.",
      });
      return;
    }

    // Honest notification that referral attribution & redemption engine is launching in Phase 4
    setFeedback({
      type: "info",
      message:
        "The Suprilo Referral & Partner Rewards engine is launching in Phase 4. Referral and promo codes cannot be processed yet.",
    });
  };

  return (
    <div className="space-y-8 w-full min-w-0">
      <PageHeader
        title="Referral & Partner Rewards"
        description="Share your unique referral link, invite fellow creators, and monitor affiliate commissions."
        badge="Referral Program"
        badgeVariant="orange"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Referral" },
        ]}
      />

      {/* Share Referral Link Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card relative overflow-hidden space-y-5">
        <div
          className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-transparent rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-pink-light text-brand-pink flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-dark tracking-tight">Your Referral Link</h3>
              <p className="text-xs text-brand-muted">Share this link to earn commissions on creator signups</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded-full bg-brand-warm border border-brand-warm-border text-xs font-mono font-bold text-brand-dark">
            <span className="text-brand-muted font-sans font-normal text-[11px]">Code:</span>
            <span>{referralCode}</span>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full px-4 py-3 rounded-xl border border-brand-warm-border bg-brand-warm/40 text-brand-dark font-mono text-xs sm:text-sm select-all focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>

          <Button
            type="button"
            variant={copied ? "secondary" : "primary"}
            size="md"
            onClick={handleCopyLink}
            className="shrink-0 gap-2 shadow-sm font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Referral Link</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code Input Box for Applying a Referral Code */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-pink-light text-brand-pink flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark tracking-tight">Have an Invite or Referral Code?</h3>
            <p className="text-xs text-brand-muted">Enter a creator referral code, gift pass, or partner voucher</p>
          </div>
        </div>

        <form onSubmit={handleReferralSubmit} className="max-w-xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (feedback) setFeedback(null);
                }}
                placeholder="e.g. REF-CREATOR-2026"
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

      {/* Referral & Commission Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-dark tracking-tight">Referral & Commission Stats</h3>
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
            label="Total Referrals"
            value="0"
            subtext="Creators invited"
            icon={Users}
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

      {/* Referral History with Honest Empty State */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-brand-dark tracking-tight">Referral History</h3>

        <EmptyState
          icon={Receipt}
          title="No Referrals Recorded"
          description="You haven't referred any creators or redeemed referral invite codes yet. Active referrals and commissions will appear here."
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Architecture Roadmap Panel */}
      <ComingSoonPanel
        title="Creator Referral & Commission Engine"
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

