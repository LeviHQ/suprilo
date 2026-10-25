"use client";

import * as React from "react";
import { Check, Sparkles, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Plan {
  id: string;
  name: string;
  price: string;
  billingPeriod: string;
  subPriceNote?: string;
  description: string;
  highlightBadge?: string;
  isPopular?: boolean;
  ctaText: string;
  ctaVariant: "primary" | "secondary" | "outline";
  features: string[];
}

const PRICING_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    billingPeriod: "/month",
    description: "Everything you need to start sharing little surprises.",
    ctaText: "Start for Free",
    ctaVariant: "secondary",
    features: [
      "3 cards per month",
      "Personal text and 1 image per card",
      "Standard scratch-to-reveal effect",
      "Basic card templates",
      "Shareable card links",
      "Suprilo branding on shared cards",
      "Mobile-friendly reveal experience",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$5",
    billingPeriod: "/month",
    subPriceNote: "Proposed early-access price",
    description: "For people who love making every occasion special.",
    highlightBadge: "Best for Most People",
    isPopular: true,
    ctaText: "Choose Pro",
    ctaVariant: "primary",
    features: [
      "30 cards per month",
      "Everything in Free",
      "Premium scratch effects",
      "More templates and cover styles",
      "Up to 3 images per card",
      "Remove Suprilo branding",
      "Custom card colors and message styling",
      "Basic card statistics, once implemented",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    price: "$10",
    billingPeriod: "/month",
    subPriceNote: "Proposed early-access price",
    description: "For creators who want more creative freedom.",
    ctaText: "Choose Advanced",
    ctaVariant: "secondary",
    features: [
      "100 cards per month",
      "Everything in Pro",
      "Exclusive premium templates and effects",
      "Advanced cover and reveal customization",
      "Higher image capacity per card",
      "Detailed views, reveals and share analytics, once implemented",
      "90-day analytics history, once implemented",
      "Priority support, once available",
    ],
  },
];

interface PricingProps {
  onSelectPlan: (planName: string) => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  return (
    <section id="pricing" className="py-20 md:py-28 relative scroll-mt-16 overflow-hidden overflow-x-clip w-full max-w-full">
      {/* Background glow accents */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[700px] h-[400px] bg-gradient-to-tr from-brand-pink/5 via-brand-orange/5 to-brand-purple/5 blur-3xl pointer-events-none -z-10 rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2">
            <Badge variant="pink">Simple, Joyful Pricing</Badge>
            <span className="text-[11px] font-semibold text-brand-orange bg-brand-orange-light px-2.5 py-0.5 rounded-full border border-[#FED7AA]">
              Early Access Pricing
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
            A little joy. A plan that fits.
          </h2>

          <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
            Start free. Create meaningful surprises. Upgrade when you want more ways
            to make every moment special.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {PRICING_PLANS.map((plan) => {
            const isPro = plan.isPopular;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all duration-300 ${
                  isPro
                    ? "bg-white border-2 border-brand-pink shadow-card-hover lg:-translate-y-3 z-10 ring-4 ring-brand-pink/10"
                    : "bg-white/80 backdrop-blur-sm border border-brand-warm-border shadow-card hover:shadow-card-hover hover:-translate-y-1"
                }`}
              >
                {/* Popular highlight pill badge */}
                {plan.highlightBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-brand-pink text-white shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{plan.highlightBadge}</span>
                    </span>
                  </div>
                )}

                {/* Plan Header & Pricing Details */}
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-xl font-bold text-brand-dark">
                      {plan.name}
                    </h3>
                    {isPro ? (
                      <div className="w-8 h-8 rounded-full bg-brand-pink-light flex items-center justify-center text-brand-pink">
                        <Heart className="w-4 h-4 fill-brand-pink" />
                      </div>
                    ) : plan.id === "advanced" ? (
                      <div className="w-8 h-8 rounded-full bg-brand-purple-light flex items-center justify-center text-brand-purple">
                        <Zap className="w-4 h-4" />
                      </div>
                    ) : null}
                  </div>

                  <p className="text-xs text-brand-muted min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price display */}
                  <div className="pt-5 pb-6 border-b border-brand-warm-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm font-semibold text-brand-muted">
                        {plan.billingPeriod}
                      </span>
                    </div>
                    {plan.subPriceNote && (
                      <p className="text-[11px] font-medium text-brand-orange mt-1">
                        {plan.subPriceNote}
                      </p>
                    )}
                  </div>

                  {/* Feature List */}
                  <div className="pt-6 space-y-3">
                    <p className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                      What&apos;s included:
                    </p>
                    <ul className="space-y-2.5 text-xs text-brand-muted">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                              isPro
                                ? "bg-brand-pink-light text-brand-pink"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </span>
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-8">
                  <Button
                    variant={plan.ctaVariant}
                    size="lg"
                    className={`w-full justify-center transition-all ${
                      isPro
                        ? "shadow-md hover:shadow-brand-pink/30 hover:scale-[1.01]"
                        : "hover:border-brand-dark"
                    }`}
                    onClick={() => onSelectPlan(plan.name)}
                  >
                    {plan.ctaText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reassurance footnote */}
        <div className="mt-12 text-center text-xs text-brand-muted space-y-1">
          <p>
            No hidden fees. Transparent, early-access rates designed to grow with your celebrations.
          </p>
          <p className="text-[11px] text-brand-muted/80">
            Payment integration and checkout will go live in an upcoming release.
          </p>
        </div>
      </div>
    </section>
  );
}
