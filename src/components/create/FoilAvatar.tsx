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
    id === "birthday-roast-revelry" ||
    id.includes("flame")
  ) {
    return {
      background: "linear-gradient(135deg, #FBBF24 0%, #EA580C 45%, #DC2626 80%, #991B1B 100%)",
      borderColor: "#FCA5A5",
      icon: "🔥",
      glow: "rgba(220, 38, 38, 0.45)",
      textColor: "#7F1D1D",
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
