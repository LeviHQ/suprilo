"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  illustration: string;
  checkStyle: string;
  cardStyle: string;
  ctaStyle: string;
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
    illustration: "/landing/pricing/plan-free.png",
    checkStyle: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
    cardStyle:
      "bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1",
    ctaStyle:
      "bg-[#FFFDF6] border border-[#FDE68A] text-[#17152A] font-extrabold hover:bg-[#FEF9C3]/40 shadow-2xs hover:shadow-sm",
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
    illustration: "/landing/pricing/plan-pro.png",
    checkStyle: "bg-[#FFE4E8] text-[#FF4D6D] border border-[#FECDD3]",
    cardStyle:
      "bg-white border-2 border-[#FF4D6D] shadow-xl shadow-pink-500/10 lg:-translate-y-2.5 z-10 ring-4 ring-[#FF4D6D]/10 hover:shadow-2xl hover:shadow-pink-500/15",
    ctaStyle:
      "bg-gradient-to-r from-[#FF4D6D] to-[#F43F5E] text-white font-extrabold shadow-md shadow-pink-500/30 hover:shadow-pink-500/50 hover:brightness-105",
    features: [
      "30 cards per month",
      "Everything in Free",
      "Premium scratch effects",
      "More templates and cover styles",
      "Up to 3 images per card",
      "Remove Suprilo branding",
      "Custom card colors and message styling",
      "Basic card statistics (once implemented)",
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
    illustration: "/landing/pricing/plan-advanced.png",
    checkStyle: "bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]",
    cardStyle:
      "bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1",
    ctaStyle:
      "bg-[#FFFDF6] border border-slate-200 text-[#17152A] font-extrabold hover:bg-slate-50 shadow-2xs hover:shadow-sm",
    features: [
      "100 cards per month",
      "Everything in Pro",
      "Exclusive premium templates and effects",
      "Advanced cover and reveal customization",
      "Higher image capacity per card",
      "Detailed views, reveals and share analytics (once implemented)",
      "90-day analytics history (once implemented)",
      "Priority support (once available)",
    ],
  },
];

interface PricingProps {
  onSelectPlan: (planName: string) => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleAction = (plan: Plan) => {
    if (plan.id === "free") {
      if (!user) {
        openAuthModal("/create");
      } else {
        router.push("/create");
      }
    } else {
      onSelectPlan(plan.name);
    }
  };

  return (
    <section
      id="pricing"
      className="py-18 sm:py-24 bg-[#FFFDFB] relative scroll-mt-16 overflow-hidden overflow-x-clip w-full max-w-full select-none"
    >
      {/* Background glow accents */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[450px] bg-gradient-to-tr from-[#FF4D6D]/5 via-[#FF9F1C]/5 to-[#8B5CF6]/5 blur-3xl pointer-events-none -z-10 rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* SECTION HEADER WITH HAND-DRAWN ANNOTATIONS & PLAYFUL BADGES               */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20 relative">
          {/* Eyebrow Badges: Simple Joyful Pricing & Early Access */}
          <div className="inline-flex items-center justify-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF0F2] text-[#FF4D6D] text-xs font-black tracking-wider uppercase border border-[#FECDD3] shadow-2xs">
              <Heart className="w-3.5 h-3.5 fill-[#FF4D6D] text-[#FF4D6D]" />
              <span>Simple, Joyful Pricing</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold border border-[#FDE68A] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
              <span>Early Access Pricing</span>
            </span>
          </div>

          {/* Floating Hand-Drawn Annotation on Left: "Start with a smile it's free!" */}
          <div
            className="hidden lg:flex flex-col items-center absolute -top-4 -left-6 xl:-left-14 -rotate-6 pointer-events-none select-none text-left"
            aria-hidden="true"
          >
            <span className="font-extrabold text-[#FF4D6D] text-sm tracking-tight leading-tight">
              Start
            </span>
            <span className="font-extrabold text-[#FF4D6D] text-sm tracking-tight leading-tight">
              with a smile
            </span>
            <span className="font-bold text-pink-400 text-xs">
              it&apos;s free!
            </span>
            {/* Outline pink heart & curved arrow */}
            <span className="text-[#FF4D6D] text-lg mt-0.5">♡</span>
            <svg className="w-10 h-7 text-[#FF4D6D] overflow-visible" viewBox="0 0 50 35" fill="none">
              <path
                d="M10 6C22 12 36 22 36 30M36 30L29 27M36 30L40 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Floating Hand-Drawn Annotation on Right: "More moments More surprises More happiness" */}
          <div
            className="hidden lg:flex flex-col items-center absolute -top-4 -right-6 xl:-right-14 rotate-6 pointer-events-none select-none text-right"
            aria-hidden="true"
          >
            <span className="font-extrabold text-[#FF4D6D] text-sm tracking-tight leading-tight">
              More moments
            </span>
            <span className="font-extrabold text-[#FF4D6D] text-sm tracking-tight leading-tight">
              More surprises
            </span>
            <span className="font-bold text-pink-400 text-xs">
              More happiness
            </span>
            {/* Outline pink heart & curved arrow */}
            <span className="text-[#FF4D6D] text-lg mt-0.5">♡</span>
            <svg className="w-10 h-7 text-[#FF4D6D] overflow-visible" viewBox="0 0 50 35" fill="none">
              <path
                d="M40 6C28 12 14 22 14 30M14 30L21 27M14 30L10 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Main Headline */}
          <div className="relative inline-block px-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-[#17152A] tracking-tight leading-[1.15]">
              A little joy.{" "}
              <span className="relative inline-flex items-center">
                <span className="bg-gradient-to-r from-[#FF4D6D] via-[#FF9F1C] to-[#8B5CF6] bg-clip-text text-transparent">
                  A plan that fits.
                </span>

                {/* 3 Radiating Yellow Rays on the top-right of fits. */}
                <svg
                  className="w-5 sm:w-6 h-5 sm:h-6 text-[#FF9F1C] absolute -top-2 -right-6 pointer-events-none select-none hidden sm:inline-block"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <line x1="4" y1="18" x2="16" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="20" x2="22" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="2" y1="12" x2="14" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-normal">
            Start free. Create meaningful surprises. Upgrade when you want more ways to make every moment special.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* THREE PRICING CARDS WITH RICH 3D PASTEL ILLUSTRATIONS                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2">
          {PRICING_PLANS.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-[32px] p-7 sm:p-8 transition-all duration-300 group ${plan.cardStyle}`}
              >
                {/* Popular highlight pill badge */}
                {plan.highlightBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#FF4D6D] to-[#F43F5E] text-white shadow-md shadow-pink-500/25">
                      <span>👑 {plan.highlightBadge}</span>
                    </span>
                  </div>
                )}

                {/* Top Section: Plan Illustration, Title, Description, & Price */}
                <div>
                  {/* Plan 3D Pastel Artwork */}
                  <div className="relative w-full h-[165px] sm:h-[175px] mb-4 flex items-center justify-center">
                    <Image
                      src={plan.illustration}
                      alt={`${plan.name} plan illustration`}
                      width={280}
                      height={180}
                      priority
                      className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Plan Heading */}
                  <h3 className="text-2xl font-black text-[#17152A] tracking-tight group-hover:text-brand-pink transition-colors">
                    {plan.name}
                  </h3>

                  {/* Plan Description */}
                  <p className="text-xs sm:text-sm text-slate-500 min-h-[38px] leading-relaxed mt-1 font-normal">
                    {plan.description}
                  </p>

                  {/* Price Display */}
                  <div className="pt-4 pb-5 border-b border-slate-200/70">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-[#17152A] tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        {plan.billingPeriod}
                      </span>
                    </div>

                    {plan.subPriceNote && (
                      <p className="text-xs font-bold text-[#FF9F1C] mt-1">
                        {plan.subPriceNote}
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="pt-6 space-y-3.5">
                    <ul className="space-y-3 text-xs sm:text-[13px] text-slate-600 font-medium">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.checkStyle}`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call To Action Button */}
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => handleAction(plan)}
                    className={`w-full py-3.5 px-6 rounded-full flex items-center justify-center gap-2 text-sm transition-all duration-200 cursor-pointer ${plan.ctaStyle}`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TRUST AND TRANSPARENCY STRIP                                              */}
        {/* ========================================================================= */}
        <div className="mt-16 pt-8 border-t border-slate-200/60 max-w-5xl mx-auto relative px-4 sm:px-10">
          {/* Decorative Pink Ribbon on the Left */}
          <div className="hidden lg:block absolute -left-6 top-6 w-11 h-13 pointer-events-none select-none opacity-85">
            <Image
              src="/landing/pricing/deco-ribbon.png"
              alt=""
              width={44}
              height={52}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Decorative Paper Airplane on the Right */}
          <div className="hidden lg:block absolute -right-6 top-3 w-16 h-16 pointer-events-none select-none opacity-90 animate-pulse duration-1000">
            <Image
              src="/landing/pricing/deco-plane.png"
              alt=""
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Four Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
            {/* 1. No hidden fees */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF9C3] flex items-center justify-center text-[#CA8A04] shrink-0 shadow-2xs">
                <Zap className="w-5 h-5 fill-[#CA8A04]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-[#17152A]">No hidden fees</h4>
                <p className="text-[11px] text-slate-500">Transparent and simple pricing.</p>
              </div>
            </div>

            {/* 2. Early-access rates */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] shrink-0 shadow-2xs">
                <Shield className="w-5 h-5 fill-[#3B82F6]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-[#17152A]">Early-access rates</h4>
                <p className="text-[11px] text-slate-500">Designed to grow with celebrations.</p>
              </div>
            </div>

            {/* 3. Secure payments */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6] shrink-0 shadow-2xs">
                <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-[#17152A]">Secure payments</h4>
                <p className="text-[11px] text-slate-500">Powered by trusted partners.</p>
              </div>
            </div>

            {/* 4. Cancel anytime */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFE4E8] flex items-center justify-center text-[#E11D48] shrink-0 shadow-2xs">
                <Heart className="w-5 h-5 fill-[#E11D48]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-[#17152A]">Cancel anytime</h4>
                <p className="text-[11px] text-slate-500">Upgrade or downgrade anytime.</p>
              </div>
            </div>
          </div>

          {/* Honest Note */}
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            <p>Payment integration and checkout will go live in an upcoming release.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
