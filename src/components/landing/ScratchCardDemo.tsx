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
    <div className="flex flex-col justify-center items-center h-full w-full text-center px-4 py-6 space-y-4">
      {/* Visual Sticker */}
      <div className="w-16 h-16 mx-auto rounded-3xl bg-white shadow-lg border border-pink-100 flex items-center justify-center text-brand-pink shadow-brand-pink/20">
        <Heart className="w-9 h-9 fill-brand-pink text-brand-pink animate-pulse" />
      </div>

      {/* Heartfelt Note */}
      <div className="space-y-2 max-w-[280px] mx-auto">
        <h4 className="text-xl sm:text-2xl font-black text-brand-dark leading-tight tracking-tight drop-shadow-xs">
          &ldquo;You&apos;re someone else&apos;s little bit of magic 💖&rdquo;
        </h4>
        <div className="px-3 py-1.5 rounded-xl bg-pink-50/80 border border-pink-200/60 text-xs sm:text-sm text-pink-900 font-medium">
          Thanks for making ordinary moments special.
        </div>
      </div>

      {/* Decorative spark */}
      <div className="flex items-center justify-center gap-1.5 opacity-60 text-[10px] font-bold tracking-wider uppercase text-brand-dark">
        <Sparkles className="w-3 h-3 text-brand-orange" />
        <span>Suprilo Special Reveal</span>
        <Sparkles className="w-3 h-3 text-brand-orange" />
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
        {/* Real Canvas Scratch Card & Docked Stats */}
        <ScratchCard
          hiddenContent={hiddenContent}
          coverText="Scratch to reveal your surprise ✨"
          coverStyle="lavender-pink"
          revealThreshold={0.65}
          brushRadius={26}
          onReveal={() => setIsRevealed(true)}
          metadata={{
            senderName: "Alex",
            recipientName: "You",
            occasionTag: "A Little Joy",
          }}
          isCreatorPreview={true}
          showControls={true}
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
