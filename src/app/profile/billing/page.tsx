"use client";

import * as React from "react";
import {
  CheckCircle2,
  Lock,
  Layers,
  Receipt,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Card Usage"
        description="Review your active plan, manage surprise card creation quota, and view account allowances."
        badge="Free Plan Active"
        badgeVariant="neutral"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Billing & Usage" },
        ]}
      />

      {/* Current Plan Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="purple">Starter Tier</Badge>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active Forever
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">
              Free Creator Starter Plan
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted max-w-xl">
              Enjoy core Suprilo features: create interactive scratch cards, select custom colors, and share joy with friends and family at no cost.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border text-center sm:text-right shrink-0">
            <span className="text-xs font-bold text-brand-muted uppercase">Monthly Price</span>
            <p className="text-2xl font-black text-brand-dark">$0 <span className="text-xs font-normal text-brand-muted">/ month</span></p>
          </div>
        </div>

        {/* Quota Progress Meter */}
        <div className="p-5 rounded-2xl bg-brand-warm/30 border border-brand-warm-border space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-pink" />
              <span>Card Creation Allowance</span>
            </span>
            <span>0 of 3 Active Cards Used</span>
          </div>

          <div className="w-full h-2.5 bg-brand-warm-border/60 rounded-full overflow-hidden">
            <div className="h-full bg-brand-pink rounded-full w-0" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-brand-muted">
            <span>3 card creations remaining on free tier</span>
            <span>No expiration</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans Comparison (Honest Coming Soon for Upgrades) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-dark tracking-tight">Creator Tiers & Add-ons</h3>
            <p className="text-xs text-brand-muted">Upgrade options currently under active development</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Billing Engine Coming Soon</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Starter */}
          <div className="bg-white rounded-3xl p-6 border-2 border-brand-pink/30 shadow-card flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Badge variant="pink">Current Plan</Badge>
                <h4 className="text-lg font-bold text-brand-dark">Starter</h4>
                <p className="text-xs text-brand-muted">Perfect for trying out surprises</p>
              </div>

              <p className="text-2xl font-black text-brand-dark">$0</p>

              <ul className="space-y-2 text-xs text-brand-dark/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Up to 3 active surprise cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Standard scratch foil overlays</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Mobile & desktop compatibility</span>
                </li>
              </ul>
            </div>

            <Button variant="secondary" size="sm" disabled className="w-full text-xs">
              Current Plan
            </Button>
          </div>

          {/* Plan 2: Pro Creator */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="space-y-1">
                <Badge variant="orange">Most Popular</Badge>
                <h4 className="text-lg font-bold text-brand-dark">Pro Surprise Maker</h4>
                <p className="text-xs text-brand-muted">For creators and event planners</p>
              </div>

              <p className="text-2xl font-black text-brand-dark">$4.99 <span className="text-xs font-normal text-brand-muted">/ month</span></p>

              <ul className="space-y-2 text-xs text-brand-dark/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited card creations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Custom background audio tracks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Foil texture upload & HD stickers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Detailed recipient reveal analytics</span>
                </li>
              </ul>
            </div>

            <Button variant="primary" size="sm" disabled className="w-full text-xs gap-1 opacity-70">
              <Lock className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </Button>
          </div>

          {/* Plan 3: Brand & Event */}
          <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Badge variant="purple">Business</Badge>
                <h4 className="text-lg font-bold text-brand-dark">Brand & Events</h4>
                <p className="text-xs text-brand-muted">For weddings, retail & marketing</p>
              </div>

              <p className="text-2xl font-black text-brand-dark">$19 <span className="text-xs font-normal text-brand-muted">/ month</span></p>

              <ul className="space-y-2 text-xs text-brand-dark/80">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Whitelabeling (remove Suprilo badge)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bulk card generation (CSV upload)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Custom domain links</span>
                </li>
              </ul>
            </div>

            <Button variant="secondary" size="sm" disabled className="w-full text-xs gap-1 opacity-70">
              <Lock className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices & Billing History with Honest Empty State */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-brand-dark tracking-tight">Billing History & Invoices</h3>

        <EmptyState
          icon={Receipt}
          title="No Billing History"
          description="You are currently on the Free Starter Plan. Invoices, tax receipts, and payment statements will appear here once paid subscriptions are enabled."
          iconBgColor="bg-slate-100"
          iconColor="text-slate-600"
        />
      </div>
    </div>
  );
}
