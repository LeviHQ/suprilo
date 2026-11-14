"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FoilAvatarTheme {
  background: string;
  borderColor: string;
  icon: string;
  glow: string;
  textColor: string;
}

export function getFoilAvatarTheme(foilId?: string | null): FoilAvatarTheme {
  const id = (foilId || "").toLowerCase();

  // 1. 24K Champagne Gold
  if (
    id.includes("champagne-gold") ||
    id === "gold-confetti" ||
    id === "golden-foil" ||
    id === "birthday-champagne-gold"
  ) {
    return {
      background: "linear-gradient(135deg, #FFF7C2 0%, #F59E0B 40%, #B45309 75%, #78350F 100%)",
      borderColor: "#FCD34D",
      icon: "✦",
      glow: "rgba(245, 158, 11, 0.45)",
      textColor: "#78350F",
    };
  }

  // 2. Holo Party Prism
  if (
    id.includes("holo-party") ||
    id.includes("night-club") ||
    id === "birthday-holo-party-prism" ||
    id === "cosmic-purple" ||
    id === "neon-cyber-glow"
  ) {
    return {
      background: "linear-gradient(135deg, #F0ABFC 0%, #818CF8 35%, #06B6D4 70%, #C026D3 100%)",
      borderColor: "#67E8F9",
      icon: "⚡",
      glow: "rgba(6, 182, 212, 0.5)",
      textColor: "#3B0764",
    };
  }

  // 3. Celebration Balloon Pop
  if (
    id.includes("balloon-pop") ||
    id === "birthday-balloon-pop" ||
    id === "pastel-candy-pop"
  ) {
    return {
      background: "linear-gradient(135deg, #38BDF8 0%, #FB7185 45%, #FBBF24 85%, #F97316 100%)",
      borderColor: "#FDE047",
      icon: "🎈",
      glow: "rgba(251, 113, 133, 0.45)",
      textColor: "#7C2D12",
    };
  }

  // 4. Mint Emerald Shimmer
  if (
    id.includes("mint-shimmer") ||
    id === "birthday-mint-shimmer" ||
    id === "mint-fresh"
  ) {
    return {
      background: "linear-gradient(135deg, #6EE7B7 0%, #0D9488 45%, #047857 80%, #064E3B 100%)",
      borderColor: "#A7F3D0",
      icon: "🎁",
      glow: "rgba(13, 148, 136, 0.45)",
      textColor: "#064E3B",
    };
  }

  // 5. Roast & Revelry
  if (
    id.includes("roast-revelry") ||
    id.includes("aging-alert") ||
    id === "birthday-roast-revelry"
  ) {
    return {
      background: "linear-gradient(135deg, #FBBF24 0%, #EA580C 45%, #DC2626 80%, #991B1B 100%)",
      borderColor: "#FCA5A5",
      icon: "🔥",
      glow: "rgba(220, 38, 38, 0.45)",
      textColor: "#7F1D1D",
    };
  }

  // ==========================================================================
  // LOVE FOILS (Exact Reference Image Row 1)
  // ==========================================================================
  // 6. The Glowing Heartbeat
  if (id.includes("glowing-heartbeat") || id.includes("heartbeat")) {
    return {
      background: "linear-gradient(135deg, #FDA4AF 0%, #E11D48 45%, #9F1239 80%, #4C0519 100%)",
      borderColor: "#FB7185",
      icon: "💖",
      glow: "rgba(225, 29, 72, 0.55)",
      textColor: "#4C0519",
    };
  }

  // 7. The Sunset Soulmate
  if (id.includes("sunset-soulmate") || (id.includes("sunset") && id.includes("love"))) {
    return {
      background: "linear-gradient(135deg, #7C3AED 0%, #C026D3 35%, #FB923C 70%, #FBBF24 100%)",
      borderColor: "#F472B6",
      icon: "♡",
      glow: "rgba(192, 38, 211, 0.5)",
      textColor: "#581C87",
    };
  }

  // 8. The Rose Gold Chronicles
  if (id.includes("rose-gold-chronicles") || id.includes("rose-gold")) {
    return {
      background: "linear-gradient(135deg, #FFE4E6 0%, #FB7185 40%, #E11D48 70%, #BE123C 100%)",
      borderColor: "#FECDD3",
      icon: "💌",
      glow: "rgba(251, 113, 133, 0.45)",
      textColor: "#881337",
    };
  }

  // 9. The Pastel Cupid's Dream
  if (id.includes("cupids-dream") || id.includes("cupid")) {
    return {
      background: "linear-gradient(135deg, #BAE6FD 0%, #FBCFE8 50%, #FDE047 100%)",
      borderColor: "#F9A8D4",
      icon: "🏹",
      glow: "rgba(244, 114, 182, 0.45)",
      textColor: "#831843",
    };
  }

  // 10. The Savage Romance
  if (id.includes("savage-romance") || (id.includes("savage") && id.includes("love"))) {
    return {
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 40%, #991B1B 80%, #18181B 100%)",
      borderColor: "#F87171",
      icon: "🔥",
      glow: "rgba(220, 38, 38, 0.55)",
      textColor: "#7F1D1D",
    };
  }

  // ==========================================================================
  // ANNIVERSARY FOILS (Exact Reference Image Row 2)
  // ==========================================================================
  // 11. The Forever Gold 24K
  if (id.includes("forever-gold") || (id.includes("gold") && id.includes("anniv"))) {
    return {
      background: "linear-gradient(135deg, #FEF08A 0%, #EAB308 35%, #CA8A04 70%, #713F12 100%)",
      borderColor: "#FACC15",
      icon: "👑",
      glow: "rgba(234, 179, 8, 0.5)",
      textColor: "#713F12",
    };
  }

  // 12. The Holographic Universe
  if (id.includes("holographic-universe") || (id.includes("holo") && id.includes("anniv"))) {
    return {
      background: "linear-gradient(135deg, #C7D2FE 0%, #DDD6FE 30%, #FBCFE8 60%, #BAE6FD 100%)",
      borderColor: "#A5B4FC",
      icon: "🌌",
      glow: "rgba(165, 180, 252, 0.5)",
      textColor: "#312E81",
    };
  }

  // 13. The Midnight Stars
  if (id.includes("midnight-stars") || id.includes("stars-love")) {
    return {
      background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4338CA 75%, #0F172A 100%)",
      borderColor: "#818CF8",
      icon: "✨",
      glow: "rgba(67, 56, 202, 0.55)",
      textColor: "#E0E7FF",
    };
  }

  // 14. The Emerald Bond
  if (id.includes("emerald-bond") || (id.includes("emerald") && id.includes("anniv"))) {
    return {
      background: "linear-gradient(135deg, #D1FAE5 0%, #059669 40%, #047857 75%, #064E3B 100%)",
      borderColor: "#FDE047",
      icon: "🥂",
      glow: "rgba(5, 150, 105, 0.45)",
      textColor: "#064E3B",
    };
  }

  // 15. The Cinematic Memories
  if (id.includes("cinematic-memories") || id.includes("cinematic")) {
    return {
      background: "linear-gradient(135deg, #E2E8F0 0%, #94A3B8 35%, #475569 70%, #0F172A 100%)",
      borderColor: "#CBD5E1",
      icon: "🎬",
      glow: "rgba(148, 163, 184, 0.45)",
      textColor: "#0F172A",
    };
  }

  // Fallback
  return {
    background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)",
    borderColor: "#FCD34D",
    icon: "★",
    glow: "rgba(245, 158, 11, 0.35)",
    textColor: "#78350F",
  };
}

export function FoilAvatar({
  foilId,
  className,
  size = "md",
}: {
  foilId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const theme = getFoilAvatarTheme(foilId);
  const sizeClasses =
    size === "sm"
      ? "w-7 h-7 rounded-lg text-xs"
      : size === "lg"
      ? "w-11 h-11 rounded-2xl text-base"
      : "w-9 h-9 rounded-xl text-sm";

  return (
    <div
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 2px 6px ${theme.glow}`,
      }}
      className={cn(
        "relative flex items-center justify-center shrink-0 border select-none overflow-hidden transition-transform",
        sizeClasses,
        className
      )}
    >
      {/* Light sheen band */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/35 to-white/0 pointer-events-none" />
      <span className="relative z-10 drop-shadow-sm font-black">{theme.icon}</span>
    </div>
  );
}
