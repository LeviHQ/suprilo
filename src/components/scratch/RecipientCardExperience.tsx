"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Cake,
  Flower2,
  Gift,
  PartyPopper,
  Trophy,
  Star,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { RecipientCardDto, BgPaletteId } from "@/types/card";
import { ScratchCard } from "@/components/scratch/ScratchCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface RecipientCardExperienceProps {
  card: RecipientCardDto;
  hasPhoto?: boolean;
  cardId?: string;
  pageSessionId?: string;
  handshakeToken?: string;
}

// Background palette configurations for the interior revealed card
const PALETTE_CONFIGS: Record<
  BgPaletteId,
  {
    gradient: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
    border: string;
  }
> = {
  "soft-pink": {
    gradient: "from-pink-50 via-white to-rose-50",
    textColor: "text-rose-950",
    badgeBg: "bg-rose-500",
    badgeText: "text-white",
    border: "border-pink-200",
  },
  "warm-sunshine": {
    gradient: "from-amber-50 via-white to-orange-50",
    textColor: "text-amber-950",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    border: "border-amber-200",
  },
  "royal-amethyst": {
    gradient: "from-purple-50 via-white to-indigo-50",
    textColor: "text-indigo-950",
    badgeBg: "bg-purple-600",
    badgeText: "text-white",
    border: "border-purple-200",
  },
  "mint-fresh": {
    gradient: "from-emerald-50 via-white to-teal-50",
    textColor: "text-emerald-950",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    border: "border-emerald-200",
  },
  "pure-ivory": {
    gradient: "from-brand-warm-subtle via-white to-brand-warm",
    textColor: "text-brand-dark",
    badgeBg: "bg-brand-pink",
    badgeText: "text-white",
    border: "border-brand-warm-border",
  },
};

export function RecipientCardExperience({
  card,
  hasPhoto = false,
  cardId,
  pageSessionId,
  handshakeToken,
}: RecipientCardExperienceProps) {
  const [photoError, setPhotoError] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const revealLoggedRef = React.useRef(false);
  const receiptIdRef = React.useRef<string | null>(null);
  const handshakePromiseRef = React.useRef<Promise<string | null> | null>(null);

  // Palette styling
  const palette = PALETTE_CONFIGS[card.bg_palette] || PALETTE_CONFIGS["pure-ivory"];

  // Post-mount Telemetry Handshake execution (SPEC-2C-5.6.1-FINAL v3.0.0 Section 7.1)
  React.useEffect(() => {
    if (!cardId || !pageSessionId || !handshakeToken) {
      return;
    }

    const storageKey = `suprilo_receipt_${cardId}`;

    // Read existing receipt from isolated tab sessionStorage if available
    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        receiptIdRef.current = cached;
        handshakePromiseRef.current = Promise.resolve(cached);
        return;
      }
    } catch {
      // Ignore sessionStorage access errors
    }

    // Execute authorized telemetry handshake
    handshakePromiseRef.current = fetch("/api/telemetry/handshake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: cardId,
        page_session_id: pageSessionId,
        handshake_token: handshakeToken,
      }),
      keepalive: true,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.success && data?.view_receipt_id) {
          receiptIdRef.current = data.view_receipt_id;
          try {
            sessionStorage.setItem(storageKey, data.view_receipt_id);
          } catch {
            // Storage quota or permission error
          }
          return data.view_receipt_id as string;
        }
        return null;
      })
      .catch(() => null);
  }, [cardId, pageSessionId, handshakeToken]);

  // Sticker component renderer
  const renderStickerIcon = () => {
    switch (card.sticker) {
      case "heart":
        return <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-brand-pink text-brand-pink animate-pulse" />;
      case "sparkles":
        return <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />;
      case "cake":
        return <Cake className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />;
      case "flower":
        return <Flower2 className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500" />;
      case "gift":
        return <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />;
      case "confetti":
        return <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />;
      case "trophy":
        return <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />;
      case "star":
        return <Star className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500 fill-yellow-400" />;
      default:
        return <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-brand-pink" />;
    }
  };

  // Synchronized reveal telemetry logger (awaits handshake resolution, falls back safely)
  const handleReveal = React.useCallback(async () => {
    if (revealLoggedRef.current) return;
    revealLoggedRef.current = true;

    try {
      let receiptId = receiptIdRef.current;

      // If receipt is not yet resolved, await pending handshake promise (bounded timeout)
      if (!receiptId && handshakePromiseRef.current) {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2500)
        );
        receiptId = await Promise.race([handshakePromiseRef.current, timeoutPromise]);
      }

      if (cardId && receiptId) {
        // Primary path: Verified reveal telemetry with Fast Scratch qualification
        await fetch("/api/telemetry/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: cardId,
            view_receipt_id: receiptId,
            slug: card.slug,
          }),
          keepalive: true,
        }).catch(() => {
          // Safe fallback
          fetch(`/api/cards/${encodeURIComponent(card.slug)}/reveal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch(() => {});
        });
      } else {
        // Fallback path: Legacy cooldown reveal telemetry
        fetch(`/api/cards/${encodeURIComponent(card.slug)}/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Telemetry errors must never disrupt the recipient experience
    }
  }, [card.slug, cardId]);

  // Share link copy
  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };

  // Hidden card content (interior surprise revealed when scratched)
  const hiddenContent = (
    <div
      className={cn(
        "flex flex-col justify-between h-full w-full text-center p-2 sm:p-3 rounded-2xl bg-gradient-to-br transition-colors duration-300",
        palette.gradient,
        palette.textColor
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold shadow-sm truncate max-w-[150px]",
            palette.badgeBg,
            palette.badgeText
          )}
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">{card.occasion_tag || "Special Surprise"}</span>
        </span>
        <span className="text-[11px] sm:text-xs font-semibold opacity-90 truncate max-w-[150px]">
          From {card.sender_name} ✨
        </span>
      </div>

      {/* Main Secret Content */}
      <div className="my-auto py-2 sm:py-3 space-y-2.5 sm:space-y-3">
        {/* Photo or Sticker */}
        {hasPhoto && !photoError ? (
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-white ring-2 ring-brand-pink/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/cards/${encodeURIComponent(card.slug)}/photo`}
              alt="Secret card memory"
              className="w-full h-full object-cover"
              onError={() => setPhotoError(true)}
            />
          </div>
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-white/90 shadow-sm border border-black/5 flex items-center justify-center">
            {renderStickerIcon()}
          </div>
        )}

        {/* Primary Message */}
        <h2
          className={cn(
            "font-extrabold leading-snug px-3 tracking-tight break-words",
            card.primary_message.length > 90
              ? "text-base sm:text-lg"
              : "text-lg sm:text-xl md:text-2xl"
          )}
          style={{ fontFamily: card.font_family || undefined }}
        >
          {card.primary_message}
        </h2>

        {/* Secondary Message (optional) */}
        {card.secondary_message && (
          <p className="text-xs sm:text-sm opacity-80 leading-relaxed max-w-[320px] mx-auto font-medium break-words px-2">
            {card.secondary_message}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs opacity-75 pt-2 border-t border-black/5">
        <span className="truncate max-w-[180px] font-medium">
          For: <span className="font-bold">{card.recipient_name}</span>
        </span>
        <span className="shrink-0 font-semibold tracking-wide text-brand-pink">
          suprilo.com
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Recipient intro pill */}
      <div className="mb-4 text-center">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white shadow-sm border border-brand-warm-border text-brand-dark">
          <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
          <span>Surprise card for <strong className="text-brand-pink">{card.recipient_name}</strong></span>
        </span>
      </div>

      {/* Interactive Scratch Card Engine */}
      <div className="w-full">
        <ScratchCard
          hiddenContent={hiddenContent}
          coverText={card.cover_text || "Scratch to reveal your surprise ✨"}
          coverStyle={card.foil_style}
          revealThreshold={card.reveal_threshold}
          soundEnabled={card.sound_enabled}
          onReveal={handleReveal}
          className="shadow-xl"
        />
      </div>

      {/* Social / Action Toolbar */}
      <div className="w-full mt-6 pt-4 border-t border-brand-warm-border/60 flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 font-semibold text-brand-muted hover:text-brand-dark py-1.5 px-3 rounded-full bg-white border border-brand-warm-border hover:bg-brand-warm-subtle transition-colors shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Link copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy link</span>
            </>
          )}
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-brand-muted hover:text-brand-dark transition-colors font-medium"
        >
          <span>About Suprilo</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Recipient CTA: Create Your Own */}
      <div className="w-full mt-8 p-5 sm:p-6 rounded-3xl bg-white border border-brand-warm-border shadow-sm text-center space-y-3">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-pink-light text-brand-pink">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-brand-dark tracking-tight">
            Loved this surprise?
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto">
            Create an interactive scratch card for your friend, partner, or family member in less than 2 minutes.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/create">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto px-6 gap-2 shadow-md"
            >
              <span>Create Your Own Scratch Card</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
