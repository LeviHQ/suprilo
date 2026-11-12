import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Zap,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { getPublicBadgeByToken } from "@/lib/badges/service";
import { createClient } from "@/lib/supabase/server";
import { getBadgeById, RARITY_STYLES, BADGE_CATEGORIES } from "@/data/badges";
import { BadgeMedallion } from "@/components/badges/BadgeMedallion";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Validates 24-character hexadecimal share token format
 */
function isValidShareToken(token?: string): boolean {
  if (!token || typeof token !== "string") return false;
  return /^[a-f0-9]{24}$/i.test(token.trim());
}

/**
 * Generates dynamic OpenGraph metadata for public badge verification page.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (!isValidShareToken(id)) {
    const badgeDef = getBadgeById(id);
    if (badgeDef) {
      return {
        title: `${badgeDef.name} Badge | Suprilo`,
        description: badgeDef.description,
      };
    }
    return {
      title: "Badge Not Found | Suprilo",
      robots: { index: false, follow: false },
    };
  }

  const supabase = await createClient();
  const badge = await getPublicBadgeByToken(id, supabase);
  if (!badge) {
    return {
      title: "Badge Not Found | Suprilo",
      robots: { index: false, follow: false },
    };
  }

  const ogUrl = `/api/og/badge?id=${encodeURIComponent(badge.badge_id)}&name=${encodeURIComponent(
    badge.badge_name
  )}&rarity=${badge.rarity}&creator=${encodeURIComponent(badge.creator_display_name)}`;

  return {
    title: `${badge.badge_name} — Unlocked by ${badge.creator_display_name} | Suprilo`,
    description: `${badge.creator_display_name} earned the ${badge.rarity.toUpperCase()} "${
      badge.badge_name
    }" achievement badge on Suprilo!`,
    openGraph: {
      title: `${badge.badge_name} ✨ Official Suprilo Achievement`,
      description: `${badge.creator_display_name} earned the ${badge.rarity.toUpperCase()} "${
        badge.badge_name
      }" achievement badge on Suprilo!`,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: badge.badge_name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${badge.badge_name} ✨ Suprilo Achievement`,
      description: `Unlocked by ${badge.creator_display_name}!`,
      images: [ogUrl],
    },
  };
}

/**
 * Public Badge Verification & Seal Showcase Page
 * Route: /b/[id]
 */
export default async function PublicBadgePage({ params }: PageProps) {
  const { id } = await params;

  if (!isValidShareToken(id)) {
    const badgeDef = getBadgeById(id);
    if (badgeDef) {
      redirect(`/profile/badges?badge=${id}`);
    }
    return <BadgeNotFoundState />;
  }

  const supabase = await createClient();
  const verification = await getPublicBadgeByToken(id, supabase);
  if (!verification) {
    return <BadgeNotFoundState />;
  }

  const badgeDef = getBadgeById(verification.badge_id);
  const rarityStyle = RARITY_STYLES[verification.rarity];
  const categoryInfo = BADGE_CATEGORIES.find((c) => c.id === verification.category);

  const formattedDate = verification.unlocked_at
    ? new Date(verification.unlocked_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="min-h-screen flex flex-col bg-brand-warm selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Brand Header */}
      <header className="w-full max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <BrandLogo href="/" size="sm" priority />

        <Link href="/create">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create a Card</span>
          </Button>
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-brand-warm-border text-center space-y-6">
          {/* Official Verification Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Suprilo Verification Seal</span>
          </div>

          {/* Large Medallion */}
          <div className="flex justify-center pt-2">
            {badgeDef ? (
              <BadgeMedallion badge={badgeDef} isUnlocked={true} size="hero" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xl">
                <Sparkles className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Metadata Pills */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs",
                  rarityStyle.badge,
                  rarityStyle.text,
                  rarityStyle.border
                )}
              >
                {verification.rarity}
              </span>

              {categoryInfo && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-warm-subtle text-brand-dark border border-brand-warm-border">
                  {categoryInfo.label}
                </span>
              )}

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>+{verification.points_awarded} XP</span>
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl text-brand-dark tracking-tight pt-1">
              {verification.badge_name}
            </h1>

            <p className="text-sm text-brand-muted max-w-sm mx-auto leading-relaxed">
              {verification.description}
            </p>
          </div>

          {/* Recipient & Unlock Card Details */}
          <div className="bg-brand-warm-subtle/80 p-5 rounded-2xl border border-brand-warm-border/60 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-muted font-medium">Earned by:</span>
              <span className="font-bold text-brand-dark">{verification.creator_display_name}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-muted font-medium">Unlocked on:</span>
              <span className="font-semibold text-brand-dark flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-muted" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-brand-muted font-mono">
              <span>Token:</span>
              <span className="truncate max-w-[200px]">{id}</span>
            </div>
          </div>

          {/* Call to action */}
          <div className="pt-2 space-y-3">
            <Link href="/create" className="w-full block">
              <Button variant="primary" size="md" className="w-full justify-center gap-2 shadow-sm">
                <span>Create Your Own Scratch Card</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/" className="w-full block">
              <Button variant="ghost" size="sm" className="w-full text-xs text-brand-muted">
                Learn more about Suprilo
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} Suprilo. Make every moment a surprise.
      </footer>
    </div>
  );
}

function BadgeNotFoundState() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-warm selection:bg-brand-pink/15 selection:text-brand-pink">
      <header className="w-full max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
        <BrandLogo href="/" size="sm" priority />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-brand-warm-border space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-sm">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-extrabold text-brand-dark tracking-tight">
              Badge Verification Not Found
            </h1>
            <p className="text-sm text-brand-muted leading-relaxed">
              This verification link is invalid, expired, or has not been recognized.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/">
              <Button variant="primary" size="md" className="w-full justify-center">
                Back to Suprilo
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

