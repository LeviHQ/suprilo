"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sparkles,
  Wand2,
  Palette,
  Image as ImageIcon,
  Volume2,
  Eye,
  Send,
  Share2,
  Users,
  Flame,
  Zap,
  Trophy,
  Award,
  Crown,
  Gem,
  Heart,
  Lock,
  Star,
  Footprints,
  Globe,
  Moon,
  Sun,
  Compass,
  LucideIcon,
} from "lucide-react";
import type { BadgeDefinition, BadgeRarity } from "@/types/badges";
import { cn } from "@/lib/utils";

// Motif icons by badge ID or category
const BADGE_ICONS: Record<string, LucideIcon> = {
  // Getting Started
  "first-step": Footprints,
  "first-draft": Sparkles,
  "first-spark": Sparkles,
  "first-recipient": Send,
  "first-reveal": Eye,
  "first-memory": ImageIcon,
  "first-share": Share2,
  "first-feedback": Heart,
  "first-theme": Palette,
  "first-milestone": Trophy,

  // Creator Journey
  "triple-threat": Wand2,
  "five-in-a-row": Star,
  "ten-fold-magic": Crown,
  "quarter-century": Award,
  "half-century": Trophy,
  "century-club": Crown,
  "speed-creator": Zap,
  "habitual-creator": Star,
  "weekend-warrior": Star,
  "night-owl-creator": Moon,
  "lunch-break-artist": Sun,
  "fresh-ink": Flame,

  // Craft & Polish
  "golden-touch": Gem,
  "lavender-dreamer": Palette,
  "cosmic-voyager": Sparkles,
  "mint-condition": Heart,
  "palette-master": Palette,
  "soundtrack-director": Volume2,
  "silent-whisper": Eye,
  "sticker-collector": Star,
  "sticker-maximalist": Crown,
  "photo-memory": ImageIcon,
  "photo-storyteller": ImageIcon,
  "photo-album-card": ImageIcon,

  // Sharing & Impact
  "first-connection": Send,
  "social-butterfly": Share2,
  "town-crier": Send,
  "crowd-favorite": Heart,
  "viral-moment": Flame,
  "community-pillar": Users,
  "city-square": Globe,
  "stadium-status": Trophy,
  "high-affinity": Heart,
  "double-tap": Sparkles,

  // Engagement & Speed
  "curiosity-sparked": Zap,
  "magnetic-charm": Sparkles,
  "crowd-pleaser": Heart,
  "engagement-king": Crown,
  "fast-scratch-bronze": Zap,
  "fast-scratch-silver": Zap,
  "fast-scratch-gold": Zap,
  "perfectionist-scratch": Trophy,
  "polish-perfectionist": Wand2,
  "double-polish": Wand2,

  // Milestones & Mastery
  "template-connoisseur": Palette,
  "scratch-explorer": Compass,
  "legendary-creator": Crown,
  "suprilo-hall-of-fame": Gem,
};

export type MedallionSize = "sm" | "md" | "lg" | "xl" | "hero";

const SIZE_CONFIGS: Record<
  MedallionSize,
  {
    container: string;
    icon: string;
    lockIcon: string;
    badgeWidth: number;
    badgeHeight: number;
  }
> = {
  sm: { container: "w-10 h-10", icon: "w-5 h-5", lockIcon: "w-3 h-3", badgeWidth: 40, badgeHeight: 40 },
  md: { container: "w-16 h-16", icon: "w-8 h-8", lockIcon: "w-4 h-4", badgeWidth: 64, badgeHeight: 64 },
  lg: { container: "w-24 h-24", icon: "w-12 h-12", lockIcon: "w-6 h-6", badgeWidth: 96, badgeHeight: 96 },
  xl: { container: "w-32 h-32", icon: "w-16 h-16", lockIcon: "w-8 h-8", badgeWidth: 128, badgeHeight: 128 },
  hero: { container: "w-40 h-40", icon: "w-20 h-20", lockIcon: "w-10 h-10", badgeWidth: 160, badgeHeight: 160 },
};

const RARITY_GRADIENTS: Record<BadgeRarity, { gradient: string; ring: string; glow: string }> = {
  common: {
    gradient: "from-slate-100 via-slate-200 to-slate-300 text-slate-700",
    ring: "ring-slate-300 border-slate-400",
    glow: "shadow-slate-300/40",
  },
  rare: {
    gradient: "from-blue-400 via-indigo-500 to-blue-600 text-white",
    ring: "ring-blue-300 border-blue-400",
    glow: "shadow-blue-500/40",
  },
  epic: {
    gradient: "from-purple-500 via-fuchsia-600 to-pink-500 text-white",
    ring: "ring-purple-300 border-purple-400",
    glow: "shadow-purple-500/40",
  },
  legendary: {
    gradient: "from-amber-400 via-yellow-500 to-orange-500 text-amber-950",
    ring: "ring-amber-300 border-amber-400",
    glow: "shadow-amber-500/50",
  },
};

export interface BadgeMedallionProps {
  badge: BadgeDefinition;
  isUnlocked?: boolean;
  size?: MedallionSize;
  className?: string;
  showLockOverlay?: boolean;
}

export function BadgeMedallion({
  badge,
  isUnlocked = false,
  size = "md",
  className,
  showLockOverlay = true,
}: BadgeMedallionProps) {
  const [imageError, setImageError] = React.useState(false);
  const sizeConfig = SIZE_CONFIGS[size];
  const rarityConfig = RARITY_GRADIENTS[badge.rarity];
  const IconComponent = BADGE_ICONS[badge.id] || Award;

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center shrink-0 select-none transition-transform duration-300",
        sizeConfig.container,
        isUnlocked
          ? cn("shadow-lg ring-2 border-2", rarityConfig.ring, rarityConfig.glow)
          : "bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400",
        className
      )}
    >
      {isUnlocked && !imageError && badge.artwork_path ? (
        <div className="relative w-full h-full rounded-full overflow-hidden">
          <Image
            src={badge.artwork_path}
            alt={badge.name}
            width={sizeConfig.badgeWidth}
            height={sizeConfig.badgeHeight}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div
          className={cn(
            "w-full h-full rounded-full flex items-center justify-center transition-all",
            isUnlocked
              ? cn("bg-gradient-to-br shadow-inner", rarityConfig.gradient)
              : "bg-slate-100 text-slate-400"
          )}
        >
          <IconComponent className={cn(sizeConfig.icon, !isUnlocked && "opacity-40")} />
        </div>
      )}

      {/* Shine accent for unlocked rare+ badges */}
      {isUnlocked && badge.rarity !== "common" && (
        <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-60" />
      )}

      {/* Lock overlay when not unlocked */}
      {!isUnlocked && showLockOverlay && (
        <div className="absolute inset-0 rounded-full bg-slate-900/10 flex items-center justify-center backdrop-blur-[0.5px]">
          <div className="w-5 h-5 rounded-full bg-white/90 shadow-xs flex items-center justify-center text-slate-500">
            <Lock className={sizeConfig.lockIcon} />
          </div>
        </div>
      )}
    </div>
  );
}
