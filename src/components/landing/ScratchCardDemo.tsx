"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Heart, ArrowRight } from "lucide-react";
import { ScratchCard } from "@/components/scratch/ScratchCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function ScratchCardDemo() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [isRevealed, setIsRevealed] = React.useState(false);

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("/create");
    } else {
      router.push("/create");
    }
  };

  const hiddenContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Top row with celebration tag */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-pink text-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>A Little Joy</span>
        </span>
        <span className="text-xs font-bold text-brand-purple">
          From Alex with ❤️
        </span>
      </div>

      {/* Heartfelt Note */}
      <div className="my-auto py-2 text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-sm">
          <Heart className="w-6 h-6 fill-brand-pink text-brand-pink animate-pulse" />
        </div>
        <h4 className="text-lg sm:text-xl font-extrabold text-brand-dark leading-snug">
          &ldquo;You&apos;re someone else&apos;s little bit of magic 💖&rdquo;
        </h4>
        <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-[280px] mx-auto font-medium">
          Thanks for making ordinary moments special.
        </p>
      </div>

      {/* Card Footer detail */}
      <div className="flex items-center justify-between text-[11px] text-brand-muted/80 pt-2 border-t border-brand-warm-border/50">
        <span>Card #SPR-DEMO-01</span>
        <span>suprilo.com/s/magic-moments</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full max-w-md mx-auto group">
      {/* Decorative background glow rings matching brand colors */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple rounded-3xl opacity-25 blur-xl group-hover:opacity-35 transition-opacity duration-500 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative space-y-3">
        {/* Real Canvas Scratch Card */}
        <ScratchCard
          hiddenContent={hiddenContent}
          coverText="Scratch to reveal your surprise ✨"
          coverStyle="lavender-pink"
          revealThreshold={0.65}
          brushRadius={26}
          onReveal={() => setIsRevealed(true)}
          ariaLabel="Interactive scratch card demo"
        />

        {/* Action CTA below card */}
        <div className="pt-1">
          <Button
            variant={isRevealed ? "primary" : "secondary"}
            size="md"
            onClick={handleCreateClick}
            className="w-full justify-center gap-2 shadow-sm hover:shadow-md transition-all font-semibold"
          >
            <span>Create Your Own Surprise</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
