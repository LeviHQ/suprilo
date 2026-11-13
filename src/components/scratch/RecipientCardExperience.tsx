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
  ArrowRight,
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
    accentGlow: string;
    quoteBg: string;
  }
> = {
  "soft-pink": {
    gradient: "from-pink-50 via-white to-rose-100",
    textColor: "text-rose-950",
    accentGlow: "shadow-[0_0_25px_rgba(244,114,182,0.3)]",
    quoteBg: "bg-rose-50/80 border-rose-200/60 text-rose-900",
  },
  "warm-sunshine": {
    gradient: "from-amber-50 via-white to-orange-100",
    textColor: "text-amber-950",
    accentGlow: "shadow-[0_0_25px_rgba(251,191,36,0.3)]",
    quoteBg: "bg-amber-50/80 border-amber-200/60 text-amber-900",
  },
  "royal-amethyst": {
    gradient: "from-purple-50 via-white to-indigo-100",
    textColor: "text-indigo-950",
    accentGlow: "shadow-[0_0_25px_rgba(168,85,247,0.3)]",
    quoteBg: "bg-purple-50/80 border-purple-200/60 text-purple-900",
  },
  "mint-fresh": {
    gradient: "from-emerald-50 via-white to-teal-100",
    textColor: "text-emerald-950",
    accentGlow: "shadow-[0_0_25px_rgba(52,211,153,0.3)]",
    quoteBg: "bg-emerald-50/80 border-emerald-200/60 text-emerald-900",
  },
  "pure-ivory": {
    gradient: "from-stone-50 via-white to-amber-50/40",
    textColor: "text-stone-900",
    accentGlow: "shadow-[0_0_25px_rgba(255,77,109,0.25)]",
    quoteBg: "bg-stone-50/90 border-brand-warm-border text-stone-800",
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

  // Post-mount Telemetry Handshake execution
  React.useEffect(() => {
    if (!cardId || !pageSessionId || !handshakeToken) {
      return;
    }

    const storageKey = `suprilo_receipt_${cardId}`;

    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        receiptIdRef.current = cached;
        handshakePromiseRef.current = Promise.resolve(cached);
        return;
      }
    } catch {}

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
          } catch {}
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
        return <Heart className="w-10 h-10 fill-brand-pink text-brand-pink animate-pulse" />;
      case "sparkles":
        return <Sparkles className="w-10 h-10 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />;
      case "cake":
        return <Cake className="w-10 h-10 text-amber-500" />;
      case "flower":
        return <Flower2 className="w-10 h-10 text-pink-500" />;
      case "gift":
        return <Gift className="w-10 h-10 text-purple-600" />;
      case "confetti":
        return <PartyPopper className="w-10 h-10 text-orange-500" />;
      case "trophy":
        return <Trophy className="w-10 h-10 text-amber-500" />;
      case "star":
        return <Star className="w-10 h-10 text-yellow-500 fill-yellow-400" />;
      default:
        return <Sparkles className="w-10 h-10 text-brand-pink" />;
    }
  };

  // Synchronized reveal telemetry logger
  const handleReveal = React.useCallback(async () => {
    if (revealLoggedRef.current) return;
    revealLoggedRef.current = true;

    try {
      let receiptId = receiptIdRef.current;

      if (!receiptId && handshakePromiseRef.current) {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2500)
        );
        receiptId = await Promise.race([handshakePromiseRef.current, timeoutPromise]);
      }

      if (cardId && receiptId) {
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
          fetch(`/api/cards/${encodeURIComponent(card.slug)}/reveal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch(() => {});
        });
      } else {
        fetch(`/api/cards/${encodeURIComponent(card.slug)}/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
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

  /**
   * PURE SURPRISE REVEAL CONTENT (Zero Boring Metadata Inside!)
   */
  const hiddenContent = (
    <div
      className={cn(
        "flex flex-col justify-center items-center h-full w-full text-center px-4 py-6 rounded-[22px] bg-gradient-to-br transition-all duration-500 space-y-4 sm:space-y-5",
        palette.gradient,
        palette.textColor
      )}
    >
      {/* 1. HERO VISUAL: Secret Memory Photo OR Celebratory 3D Sticker */}
      {hasPhoto && !photoError ? (
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl overflow-hidden shadow-xl border-3 border-white ring-4 ring-brand-pink/25 transform rotate-[-2deg] hover:rotate-0 transition-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/cards/${encodeURIComponent(card.slug)}/photo`}
            alt="Secret card memory"
            className="w-full h-full object-cover"
            onError={() => setPhotoError(true)}
          />
        </div>
      ) : (
        <div
          className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-white/95 border border-white flex items-center justify-center shadow-lg",
            palette.accentGlow
          )}
        >
          {renderStickerIcon()}
        </div>
      )}

      {/* 2. THE BIG SURPRISE MESSAGE (Emotional, Bold, Dramatic Typography) */}
      <div className="space-y-2 max-w-[290px] mx-auto">
        <h2
          className={cn(
            "font-black tracking-tight leading-tight px-1 break-words drop-shadow-xs",
            card.primary_message.length > 80
              ? "text-base sm:text-lg"
              : card.primary_message.length > 40
              ? "text-lg sm:text-xl"
              : "text-xl sm:text-2xl md:text-3xl"
          )}
          style={{ fontFamily: card.font_family || undefined }}
        >
          {card.primary_message}
        </h2>

        {/* 3. OPTIONAL SECONDARY SECRET NOTE */}
        {card.secondary_message && (
          <div
            className={cn(
              "px-3 py-2 rounded-2xl border text-xs sm:text-sm font-medium leading-relaxed break-words shadow-xs backdrop-blur-xs",
              palette.quoteBg
            )}
          >
            {card.secondary_message}
          </div>
        )}
      </div>

      {/* 4. Atmospheric floating decorative spark */}
      <div className="flex items-center justify-center gap-1.5 opacity-60 text-[11px] font-semibold tracking-wider uppercase">
        <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
        <span>Suprilo Special Surprise</span>
        <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Top Welcome Pill */}
      <div className="mb-4 sm:mb-5 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md shadow-xs border border-brand-warm-border text-brand-dark">
          <Sparkles className="w-3.5 h-3.5 text-brand-pink animate-pulse" />
          <span>Surprise Ticket for <strong className="text-brand-purple">{card.recipient_name}</strong></span>
        </span>
      </div>

      {/* The Luminous Ticket Scratch Card Engine + Docked Stats */}
      <div className="w-full">
        <ScratchCard
          hiddenContent={hiddenContent}
          coverText={card.cover_text || "Scratch to reveal your surprise ✨"}
          coverStyle={card.foil_style}
          revealThreshold={card.reveal_threshold}
          soundEnabled={card.sound_enabled}
          onReveal={handleReveal}
          metadata={{
            senderName: card.sender_name,
            recipientName: card.recipient_name,
            occasionTag: card.occasion_tag,
          }}
          onShare={handleCopyLink}
          shareCopied={copied}
          className="shadow-2xl"
        />
      </div>

      {/* Recipient Conversion / Viral Banner */}
      <div className="w-full max-w-[380px] mt-6 p-5 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-brand-warm-border shadow-sm text-center space-y-3">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-pink to-brand-orange text-white shadow-md">
          <Gift className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-brand-dark tracking-tight">
            Want to surprise someone?
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted max-w-xs mx-auto">
            Design an interactive scratch card with your secret photos and messages in under 2 minutes.
          </p>
        </div>
        <div className="pt-1">
          <Link href="/create">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center px-6 gap-2 shadow-md hover:shadow-brand-pink/25 font-bold"
            >
              <span>Create Your Free Card</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
