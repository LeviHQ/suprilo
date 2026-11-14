"use client";

import * as React from "react";
import { soundManager } from "@/lib/sound";
import { CelebrationConfetti } from "./CelebrationConfetti";
import { CardStatsDock } from "./CardStatsDock";
import { cn } from "@/lib/utils";
import type { CoverStyle } from "@/types/card";
import { getFoilDefinition } from "@/data/templates";

export type { CoverStyle };

export interface ScratchCardMetadata {
  senderName?: string;
  recipientName?: string;
  occasionTag?: string;
}

export interface ScratchCardProps {
  hiddenContent: React.ReactNode;
  coverText?: string;
  coverStyle?: CoverStyle;
  revealThreshold?: number; // 0 to 1, default 0.65
  brushRadius?: number; // px, default 28
  onReveal?: () => void;
  onProgress?: (percent: number) => void;
  className?: string;
  disabled?: boolean;
  showControls?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
  ariaLabel?: string;
  metadata?: ScratchCardMetadata;
  onShare?: () => void;
  shareCopied?: boolean;
  isCreatorPreview?: boolean;
}

// Particle interface for real-time scratch sparks
interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export function ScratchCard({
  hiddenContent,
  coverText = "Scratch to reveal your surprise ✨",
  coverStyle = "lavender-pink",
  revealThreshold = 0.65,
  brushRadius = 28,
  onReveal,
  onProgress,
  className = "",
  disabled = false,
  showControls = true,
  ariaLabel = "Interactive scratch card",
  metadata,
  onShare,
  shareCopied = false,
  isCreatorPreview = false,
}: ScratchCardProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sparkCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [isRevealed, setIsRevealed] = React.useState(false);
  const [scratchPercent, setScratchPercent] = React.useState(0);
  const [isScratching, setIsScratching] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(() => soundManager.getMuted());
  const [showCelebration, setShowCelebration] = React.useState(false);

  // References for drawing without re-triggering React state on every mousemove
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasRevealedRef = React.useRef(false);
  const canvasSizeRef = React.useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const dprRef = React.useRef(1);
  const lastCalculatedTimeRef = React.useRef(0);
  const sparksRef = React.useRef<SparkParticle[]>([]);
  const animFrameRef = React.useRef<number | null>(null);

  // Sound toggle handler
  const handleToggleSound = React.useCallback(() => {
    const next = soundManager.toggleMuted();
    setIsMuted(next);
  }, []);

  /**
   * High-Impact Foil Shader / Texture Drawer
   * Draws distinct luxury metallic / cyber themes inspired by high-end gaming and scratch passes
   */
  const drawCover = React.useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = dprRef.current;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      ctx.globalCompositeOperation = "source-over";

      const foilInfo = getFoilDefinition(coverStyle);
      const foilLower = (coverStyle || "").toLowerCase();
      const isChampagneGold =
        foilLower.includes("champagne-gold") ||
        foilLower === "gold-confetti" ||
        foilLower === "birthday-champagne-gold";
      const isHoloParty =
        foilLower.includes("holo-party") ||
        foilLower.includes("night-club") ||
        foilLower === "birthday-holo-party-prism" ||
        foilLower === "neon-cyber-glow";
      const isBalloonPop =
        foilLower.includes("balloon-pop") ||
        foilLower === "birthday-balloon-pop" ||
        foilLower === "pastel-candy-pop";
      const isMintShimmer =
        foilLower.includes("mint-shimmer") ||
        foilLower === "birthday-mint-shimmer";
      const isRoastRevelry =
        foilLower.includes("roast-revelry") ||
        foilLower.includes("aging-alert") ||
        foilLower === "birthday-roast-revelry";

      const isCyber = foilInfo.shaderFamily === "cyber";
      const isGold = foilInfo.shaderFamily === "gold";
      const isEmerald = foilInfo.shaderFamily === "emerald";
      const isRuby = foilInfo.shaderFamily === "ruby";
      const isSilver = foilInfo.shaderFamily === "silver" || foilInfo.shaderFamily === "dark";

      if (isChampagneGold) {
        // ====================================================================
        // THEME: 24K CHAMPAGNE GOLD (Exact Reference Foil #1)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#FFF7C2");
        grad.addColorStop(0.2, "#F59E0B");
        grad.addColorStop(0.45, "#B45309");
        grad.addColorStop(0.7, "#FDE68A");
        grad.addColorStop(0.9, "#D97706");
        grad.addColorStop(1, "#92400E");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Angled Luxury Sheen Bands
        ctx.save();
        ctx.rotate((-25 * Math.PI) / 180);
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        for (let x = -width; x < width * 2; x += 40) {
          ctx.fillRect(x, -height, 14, height * 3);
        }
        ctx.restore();

        // Scattered Gold Leaf Confetti Flakes
        for (let i = 0; i < 48; i++) {
          const fx = (i * 47) % width;
          const fy = (i * 83) % height;
          ctx.fillStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.75)" : "rgba(180, 83, 9, 0.45)";
          ctx.beginPath();
          if (i % 3 === 0) {
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + 6, fy + 2);
            ctx.lineTo(fx + 3, fy + 7);
          } else {
            ctx.arc(fx, fy, i % 2 === 0 ? 1.8 : 1, 0, Math.PI * 2);
          }
          ctx.fill();
        }

        // Top Star-Studded Plaque
        const plaqueW = Math.min(width * 0.88, 300);
        const plaqueH = 68;
        const plaqueX = (width - plaqueW) / 2;
        const plaqueY = 28;

        ctx.fillStyle = "rgba(254, 243, 199, 0.95)";
        ctx.beginPath();
        ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 14);
        ctx.fill();
        ctx.strokeStyle = "#B45309";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#B45309";
        ctx.font = "700 8px system-ui, sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText("★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★", width / 2, plaqueY + 16);

        ctx.fillStyle = "#78350F";
        ctx.font = "900 13px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("✦ SCRATCH FOR YOUR GOLDEN WISH ✦", width / 2, plaqueY + 38);

        ctx.fillStyle = "#B45309";
        ctx.font = "700 8px system-ui, sans-serif";
        ctx.fillText("★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★", width / 2, plaqueY + 56);

        // Center Gold Embossed Plate
        const boxW = Math.min(width * 0.84, 290);
        const boxH = 88;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 + 10;

        ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.strokeStyle = "#B45309";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#92400E";
        ctx.font = "900 15px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("HAPPY BIRTHDAY", width / 2, boxY + 32);

        ctx.fillStyle = "#B45309";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 54);

        ctx.fillStyle = "#78350F";
        ctx.font = "700 10px system-ui, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("24K CHAMPAGNE GOLD", width / 2, boxY + 72);

        // Bottom CTA
        ctx.fillStyle = "#78350F";
        ctx.font = "800 11px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("✦ SCRATCH TO REVEAL ✦", width / 2, height - 32);
      } else if (isHoloParty) {
        // ====================================================================
        // THEME: HOLO PARTY PRISM (Exact Reference Foil #2)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#E879F9");
        grad.addColorStop(0.25, "#818CF8");
        grad.addColorStop(0.5, "#22D3EE");
        grad.addColorStop(0.75, "#F472B6");
        grad.addColorStop(1, "#C084FC");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Holographic Rainbow Sheen
        ctx.save();
        ctx.rotate((-20 * Math.PI) / 180);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        for (let x = -width; x < width * 2; x += 32) {
          ctx.fillRect(x, -height, 10, height * 3);
        }
        ctx.restore();

        // Prismatic Stars & Music Notes
        ctx.fillStyle = "#FFFFFF";
        const symbols = ["✦", "★", "♪", "♫", "✨", "★"];
        for (let i = 0; i < 28; i++) {
          const sx = (i * 53) % (width - 20) + 10;
          const sy = (i * 71) % (height - 40) + 20;
          ctx.font = `${i % 2 === 0 ? 13 : 9}px system-ui, sans-serif`;
          ctx.fillText(symbols[i % symbols.length], sx, sy);
        }

        // Top Neon Double-Outlined Box Sign
        const signW = Math.min(width * 0.88, 300);
        const signH = 68;
        const signX = (width - signW) / 2;
        const signY = 28;

        ctx.fillStyle = "rgba(20, 10, 45, 0.85)";
        ctx.beginPath();
        ctx.roundRect(signX, signY, signW, signH, 14);
        ctx.fill();

        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = "#F472B6";
        ctx.lineWidth = 1;
        ctx.strokeRect(signX + 4, signY + 4, signW - 8, signH - 8);

        ctx.textAlign = "center";
        ctx.fillStyle = "#FDF4FF";
        ctx.font = "900 13px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("⚡ SWIPE TO UNLOCK ⚡", width / 2, signY + 28);

        ctx.fillStyle = "#22D3EE";
        ctx.font = "900 15px system-ui, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("THE PARTY", width / 2, signY + 50);

        // Center Nightclub Black Ticket Plaque
        const boxW = Math.min(width * 0.84, 290);
        const boxH = 88;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 + 10;

        ctx.fillStyle = "rgba(10, 8, 30, 0.92)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "#E879F9";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#22D3EE";
        ctx.font = "900 14px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("NIGHT-CLUB BIRTHDAY", width / 2, boxY + 32);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ⚡", width / 2, boxY + 54);

        ctx.fillStyle = "#F472B6";
        ctx.font = "700 10px system-ui, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("HOLO PARTY PRISM", width / 2, boxY + 72);

        // Bottom CTA
        ctx.fillStyle = "#22D3EE";
        ctx.font = "800 11px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("⚡ SCRATCH TO REVEAL ⚡", width / 2, height - 32);
      } else if (isBalloonPop) {
        // ====================================================================
        // THEME: CELEBRATION BALLOON POP (Exact Reference Foil #3)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#F43F5E");
        grad.addColorStop(0.3, "#FB923C");
        grad.addColorStop(0.7, "#FBBF24");
        grad.addColorStop(1, "#38BDF8");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw 3D Glossy Balloons
        const balloons = [
          { x: 38, y: 70, r: 24, color: "#38BDF8" },
          { x: width - 42, y: 80, r: 28, color: "#FB923C" },
          { x: 50, y: height - 90, r: 26, color: "#FB7185" },
          { x: width - 44, y: height - 100, r: 24, color: "#FBBF24" },
          { x: width / 2, y: 44, r: 22, color: "#60A5FA" },
        ];

        balloons.forEach((b) => {
          const bGrad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r);
          bGrad.addColorStop(0, "#FFFFFF");
          bGrad.addColorStop(0.3, b.color);
          bGrad.addColorStop(1, "#1E1B4B");
          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.beginPath();
          ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        });

        // Floating Confetti Ribbons
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 70 + 20, 20);
          ctx.bezierCurveTo(i * 70 + 40, 60, i * 70, 90, i * 70 + 30, 140);
          ctx.stroke();
        }

        // Center 3D Extruded Letters Banner
        const boxW = Math.min(width * 0.86, 296);
        const boxH = 100;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 4;

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();
        ctx.strokeStyle = "#F43F5E";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#E11D48";
        ctx.font = "900 16px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("TAP & SCRATCH", width / 2, boxY + 34);

        ctx.fillStyle = "#0284C7";
        ctx.font = "900 16px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("THE CELEBRATION", width / 2, boxY + 58);

        ctx.fillStyle = "#FB923C";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL 🎈", width / 2, boxY + 80);

        // Bottom CTA
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 12px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("🎈 SCRATCH TO REVEAL 🎈", width / 2, height - 32);
      } else if (isMintShimmer) {
        // ====================================================================
        // THEME: MINT EMERALD SHIMMER (Exact Reference Foil #4)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0F766E");
        grad.addColorStop(0.35, "#14B8A6");
        grad.addColorStop(0.7, "#2DD4BF");
        grad.addColorStop(1, "#042F2E");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Radiant 4-point Diamond Star Glints
        for (let i = 0; i < 36; i++) {
          const gx = (i * 61) % width;
          const gy = (i * 79) % height;
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";

          if (i % 3 === 0) {
            const arm = i % 2 === 0 ? 8 : 5;
            ctx.beginPath();
            ctx.moveTo(gx, gy - arm);
            ctx.lineTo(gx + 1.5, gy);
            ctx.lineTo(gx, gy + arm);
            ctx.lineTo(gx - 1.5, gy);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(gx - arm, gy);
            ctx.lineTo(gx, gy + 1.5);
            ctx.lineTo(gx + arm, gy);
            ctx.lineTo(gx, gy - 1.5);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(gx, gy, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Horizontal Silk Ribbon Band Across the Card
        const ribbonH = 46;
        const ribbonY = height * 0.38;

        ctx.fillStyle = "rgba(204, 251, 241, 0.95)";
        ctx.fillRect(0, ribbonY, width, ribbonH);

        ctx.strokeStyle = "#0D9488";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, ribbonY);
        ctx.lineTo(width, ribbonY);
        ctx.moveTo(0, ribbonY + ribbonH);
        ctx.lineTo(width, ribbonY + ribbonH);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#0F766E";
        ctx.font = "900 12px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("🎁 SCRATCH TO CLAIM YOUR SURPRISE 🎁", width / 2, ribbonY + 28);

        // Center Deep Emerald Luxury Pass Badge
        const boxW = Math.min(width * 0.84, 290);
        const boxH = 82;
        const boxX = (width - boxW) / 2;
        const boxY = height * 0.54;

        ctx.fillStyle = "rgba(4, 47, 46, 0.94)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.strokeStyle = "#2DD4BF";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#5EEAD4";
        ctx.font = "900 15px system-ui, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("BIRTHDAY VOUCHER", width / 2, boxY + 34);

        ctx.fillStyle = "#CCFBF1";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        // Bottom CTA
        ctx.fillStyle = "#5EEAD4";
        ctx.font = "800 11px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("❖ SCRATCH TO REVEAL ❖", width / 2, height - 32);
      } else if (isRoastRevelry) {
        // ====================================================================
        // THEME: ROAST & REVELRY (Exact Reference Foil #5)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#7F1D1D");
        grad.addColorStop(0.3, "#DC2626");
        grad.addColorStop(0.7, "#EA580C");
        grad.addColorStop(1, "#F59E0B");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Comic Doodle Graffiti
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        const doodles = ["🔥", "💀", "😂", "🎉", "🔥", "💀", "😂", "🎉"];
        for (let i = 0; i < 24; i++) {
          const dx = (i * 59) % (width - 30) + 15;
          const dy = (i * 73) % (height - 60) + 30;
          ctx.font = `${i % 2 === 0 ? 18 : 14}px system-ui, sans-serif`;
          ctx.fillText(doodles[i % doodles.length], dx, dy);
        }

        // Savage Bestie Pill Tag at Top
        const pillW = 120;
        const pillH = 26;
        const pillX = width - pillW - 20;
        const pillY = 24;
        ctx.fillStyle = "rgba(254, 240, 138, 0.95)";
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 12);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#000000";
        ctx.font = "900 10px system-ui, sans-serif";
        ctx.letterSpacing = "0.5px";
        ctx.fillText("SAVAGE BESTIE 🔥", pillX + pillW / 2, pillY + 17);

        // Center Warning Sign
        const boxW = Math.min(width * 0.88, 300);
        const boxH = 96;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 10;

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 18);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#DC2626";
        ctx.font = "900 15px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("🔥 WARNING: NOSTALGIA AHEAD 🔥", width / 2, boxY + 34);

        ctx.fillStyle = "#18181B";
        ctx.font = "800 12px system-ui, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 58);

        ctx.fillStyle = "#B91C1C";
        ctx.font = "700 10px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("ROAST & REVELRY", width / 2, boxY + 78);

        // Diagonal Black & Yellow Hazard Tape Banner
        const tapeW = Math.min(width * 0.82, 270);
        const tapeH = 34;
        const tapeX = (width - tapeW) / 2;
        const tapeY = boxY + boxH + 16;

        ctx.fillStyle = "#FACC15";
        ctx.beginPath();
        ctx.roundRect(tapeX, tapeY, tapeW, tapeH, 8);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.font = "900 13px system-ui, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText("⚠️ AGING ALERT ⚠️", width / 2, tapeY + 22);

        // Bottom CTA
        ctx.fillStyle = "#FEF08A";
        ctx.font = "900 12px system-ui, sans-serif";
        ctx.letterSpacing = "1px";
        ctx.fillText("🔥 SCRATCH TO REVEAL 🔥", width / 2, height - 32);
      } else if (isCyber) {
        // ====================================================================
        // THEME: CYBER JACKPOT / FUTURE SCRATCH (Neon Cyan & Violet Circuits)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0B0826");
        grad.addColorStop(0.3, "#21094E");
        grad.addColorStop(0.7, "#120826");
        grad.addColorStop(1, "#080616");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Cyber Grid Lines
        ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
        ctx.lineWidth = 1;
        const gridStep = 28;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Circuit Board Traces & Neon Nodes
        ctx.strokeStyle = "rgba(6, 182, 212, 0.45)"; // Cyan glow
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Top-left circuit
        ctx.moveTo(24, 40);
        ctx.lineTo(60, 40);
        ctx.lineTo(84, 64);
        ctx.lineTo(130, 64);
        // Bottom-right circuit
        ctx.moveTo(width - 24, height - 40);
        ctx.lineTo(width - 60, height - 40);
        ctx.lineTo(width - 84, height - 64);
        ctx.lineTo(width - 130, height - 64);
        ctx.stroke();

        // Neon Nodes
        ctx.fillStyle = "#22D3EE";
        [
          [24, 40],
          [130, 64],
          [width - 24, height - 40],
          [width - 130, height - 64],
        ].forEach(([nx, ny]) => {
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Top Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#22D3EE";
        ctx.font = "900 12px system-ui, -apple-system, sans-serif";
        ctx.letterSpacing = "1.5px";
        ctx.fillText(foilInfo.stampHeader, width / 2, 44);

        // Center Ticket Box with Corner Brackets
        const boxW = Math.min(width * 0.82, 290);
        const boxH = 92;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 8;

        // Box Glow & Background
        ctx.fillStyle = "rgba(15, 10, 40, 0.85)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner decorative neon dashed border
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
        ctx.strokeRect(boxX + 6, boxY + 6, boxW - 12, boxH - 12);
        ctx.setLineDash([]);

        // Center Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.name.toUpperCase(), width / 2, boxY + 36);

        ctx.fillStyle = "#22D3EE";
        ctx.font = "700 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        ctx.fillStyle = "#A78BFA";
        ctx.font = "600 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampSubtext, width / 2, boxY + 74);

        // Bottom Animated Action Banner
        ctx.fillStyle = "#22D3EE";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("⚡ SCRATCH TO REVEAL ⚡", width / 2, height - 34);
      } else if (isGold) {
        // ====================================================================
        // THEME: 24K ROYAL GOLD VIP PASS (Luxurious Reflective Guilloche)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#FFF3B0");
        grad.addColorStop(0.2, "#E0A926");
        grad.addColorStop(0.5, "#9A6F09");
        grad.addColorStop(0.8, "#FBE68A");
        grad.addColorStop(1, "#A17812");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Diagonal Luxury Luster Bands
        ctx.save();
        ctx.rotate((-25 * Math.PI) / 180);
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        for (let x = -width; x < width * 2; x += 44) {
          ctx.fillRect(x, -height, 16, height * 3);
        }
        ctx.restore();

        // Sparkling Gold Starlight Flecks
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        for (let i = 0; i < 45; i++) {
          const fx = (i * 47) % width;
          const fy = (i * 83) % height;
          ctx.beginPath();
          ctx.arc(fx, fy, (i % 2 === 0 ? 1.5 : 0.9), 0, Math.PI * 2);
          ctx.fill();
        }

        // Top VIP Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#5C4003";
        ctx.font = "900 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampHeader, width / 2, 44);

        // Center Gold Embossed Plate
        const boxW = Math.min(width * 0.82, 290);
        const boxH = 90;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 8;

        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "#B45309";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#78350F";
        ctx.font = "800 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.name.toUpperCase(), width / 2, boxY + 36);

        ctx.fillStyle = "#B45309";
        ctx.font = "700 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        ctx.fillStyle = "#92400E";
        ctx.font = "600 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampSubtext, width / 2, boxY + 74);

        // Bottom CTA
        ctx.fillStyle = "#78350F";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("✦ SCRATCH TO REVEAL ✦", width / 2, height - 34);
      } else if (isEmerald) {
        // ====================================================================
        // THEME: NEON EMERALD & MATRIX LASER (Mint Aurora)
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#022C22");
        grad.addColorStop(0.35, "#065F46");
        grad.addColorStop(0.7, "#047857");
        grad.addColorStop(1, "#064E3B");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Laser Wave Curves
        ctx.strokeStyle = "rgba(52, 211, 153, 0.28)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(0, height * 0.2 + i * 28);
          ctx.bezierCurveTo(
            width * 0.35,
            height * 0.15 + i * 30,
            width * 0.65,
            height * 0.35 + i * 20,
            width,
            height * 0.25 + i * 28
          );
          ctx.stroke();
        }

        // Top Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#6EE7B7";
        ctx.font = "900 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampHeader, width / 2, 44);

        // Center Box
        const boxW = Math.min(width * 0.82, 290);
        const boxH = 90;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 8;

        ctx.fillStyle = "rgba(6, 78, 59, 0.9)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "#34D399";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.name.toUpperCase(), width / 2, boxY + 36);

        ctx.fillStyle = "#6EE7B7";
        ctx.font = "700 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        ctx.fillStyle = "#A7F3D0";
        ctx.font = "600 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampSubtext, width / 2, boxY + 74);

        // Bottom CTA
        ctx.fillStyle = "#6EE7B7";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("❖ SCRATCH TO REVEAL ❖", width / 2, height - 34);
      } else if (isRuby) {
        // ====================================================================
        // THEME: VELVET RUBY RED & PASSION FLAME
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#4C0519");
        grad.addColorStop(0.3, "#9F1239");
        grad.addColorStop(0.7, "#E11D48");
        grad.addColorStop(1, "#881337");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Golden Heart Particles
        ctx.fillStyle = "rgba(254, 205, 211, 0.65)";
        for (let i = 0; i < 40; i++) {
          const fx = (i * 53) % width;
          const fy = (i * 79) % height;
          ctx.beginPath();
          ctx.arc(fx, fy, (i % 2 === 0 ? 1.5 : 0.9), 0, Math.PI * 2);
          ctx.fill();
        }

        // Top Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#FECDD3";
        ctx.font = "900 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampHeader, width / 2, 44);

        // Center Box
        const boxW = Math.min(width * 0.82, 290);
        const boxH = 90;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 8;

        ctx.fillStyle = "rgba(76, 5, 25, 0.92)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "#FB7185";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.name.toUpperCase(), width / 2, boxY + 36);

        ctx.fillStyle = "#FDA4AF";
        ctx.font = "700 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        ctx.fillStyle = "#FECDD3";
        ctx.font = "600 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampSubtext, width / 2, boxY + 74);

        // Bottom CTA
        ctx.fillStyle = "#FECDD3";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("♥ SCRATCH TO REVEAL ♥", width / 2, height - 34);
      } else if (isSilver) {
        // ====================================================================
        // THEME: PLATINUM CHROME & OBSIDIAN STEALTH
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0F172A");
        grad.addColorStop(0.35, "#334155");
        grad.addColorStop(0.7, "#64748B");
        grad.addColorStop(1, "#1E293B");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Brushed Metal Lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Top Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#E2E8F0";
        ctx.font = "900 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampHeader, width / 2, 44);

        // Center Box
        const boxW = Math.min(width * 0.82, 290);
        const boxH = 90;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 8;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.name.toUpperCase(), width / 2, boxY + 36);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "700 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        ctx.fillStyle = "#CBD5E1";
        ctx.font = "600 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampSubtext, width / 2, boxY + 74);

        // Bottom CTA
        ctx.fillStyle = "#E2E8F0";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("◈ SCRATCH TO REVEAL ◈", width / 2, height - 34);
      } else {
        // ====================================================================
        // THEME: HOLOGRAPHIC ROSE VELVET / SUNSET
        // ====================================================================
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#FF758C");
        grad.addColorStop(0.3, "#FF7EB3");
        grad.addColorStop(0.65, "#F77062");
        grad.addColorStop(1, "#8E54E9");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Iridescent Diagonal Shimmer
        ctx.save();
        ctx.rotate((-20 * Math.PI) / 180);
        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        for (let x = -width; x < width * 2; x += 36) {
          ctx.fillRect(x, -height, 12, height * 3);
        }
        ctx.restore();

        // Starlight Diamond Glints
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        for (let i = 0; i < 35; i++) {
          const sx = (i * 59) % width;
          const sy = (i * 71) % height;
          ctx.beginPath();
          ctx.arc(sx, sy, (i % 3 === 0 ? 1.6 : 0.8), 0, Math.PI * 2);
          ctx.fill();
        }

        // Top Header
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampHeader, width / 2, 44);

        // Center Box
        const boxW = Math.min(width * 0.82, 290);
        const boxH = 90;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 - 8;

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 77, 109, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#1E1B4B";
        ctx.font = "800 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.name.toUpperCase(), width / 2, boxY + 36);

        ctx.fillStyle = "#E11D48";
        ctx.font = "700 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 56);

        ctx.fillStyle = "#FF4D6D";
        ctx.font = "600 10px system-ui, -apple-system, sans-serif";
        ctx.fillText(foilInfo.stampSubtext, width / 2, boxY + 74);

        // Bottom CTA
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("✨ SCRATCH TO REVEAL ✨", width / 2, height - 34);
      }

      ctx.restore();
    },
    [coverStyle, coverText]
  );

  /**
   * Sample the alpha channel to calculate real cleared percentage
   */
  const calculateScratchPercent = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    const { width, height } = canvas;
    if (width === 0 || height === 0) return 0;

    try {
      const step = 8;
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      let transparentCount = 0;
      let totalSampled = 0;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4 + 3;
          if (pixels[index] < 128) {
            transparentCount++;
          }
          totalSampled++;
        }
      }

      const percent = totalSampled > 0 ? (transparentCount / totalSampled) * 100 : 0;
      return Math.round(percent);
    } catch {
      return 0;
    }
  }, []);

  /**
   * Trigger full reveal
   */
  const triggerReveal = React.useCallback(() => {
    if (hasRevealedRef.current) return;
    hasRevealedRef.current = true;
    setIsRevealed(true);
    setScratchPercent(100);
    soundManager.playRevealChime();
    setShowCelebration(true);

    // Haptic vibration feedback on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 100]);
      } catch { }
    }

    onReveal?.();
    onProgress?.(100);
  }, [onReveal, onProgress]);

  /**
   * Reset / Scratch Again
   */
  const handleReset = React.useCallback(() => {
    hasRevealedRef.current = false;
    setIsRevealed(false);
    setScratchPercent(0);
    setShowCelebration(false);
    isDrawingRef.current = false;
    lastPointRef.current = null;
    soundManager.stopScratch();
    onProgress?.(0);

    const { width, height } = canvasSizeRef.current;
    if (width > 0 && height > 0) {
      drawCover(width, height);
    }
  }, [drawCover, onProgress]);

  /**
   * Spark animation loop on overlay canvas
   */
  const spawnSparks = React.useCallback(
    (x: number, y: number) => {
      const colors =
        coverStyle === "cosmic-purple"
          ? ["#22D3EE", "#A855F7", "#EC4899", "#FFFFFF"]
          : coverStyle === "golden-foil"
            ? ["#FDE047", "#F59E0B", "#FEF08A", "#FFFFFF"]
            : coverStyle === "mint-fresh"
              ? ["#34D399", "#10B981", "#6EE7B7", "#FFFFFF"]
              : ["#FF4D6D", "#FF9F1C", "#C084FC", "#FFFFFF"];

      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        sparksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    },
    [coverStyle]
  );

  React.useEffect(() => {
    const sparkCanvas = sparkCanvasRef.current;
    if (!sparkCanvas) return;
    const sCtx = sparkCanvas.getContext("2d");
    if (!sCtx) return;

    let running = true;
    const renderSparks = () => {
      if (!running) return;
      sCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);

      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.05;
        p.size = Math.max(0, p.size - 0.05);

        if (p.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        sCtx.save();
        sCtx.globalAlpha = p.alpha;
        sCtx.fillStyle = p.color;
        sCtx.shadowColor = p.color;
        sCtx.shadowBlur = 6;
        sCtx.beginPath();
        sCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.restore();
      }

      animFrameRef.current = requestAnimationFrame(renderSparks);
    };

    animFrameRef.current = requestAnimationFrame(renderSparks);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Handle Resize and Canvas Setup
  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const sparkCanvas = sparkCanvasRef.current;
    if (!container || !canvas) return;

    const setupCanvas = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvasSizeRef.current = { width: rect.width, height: rect.height };

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      if (sparkCanvas) {
        sparkCanvas.width = rect.width;
        sparkCanvas.height = rect.height;
        sparkCanvas.style.width = `${rect.width}px`;
        sparkCanvas.style.height = `${rect.height}px`;
      }

      if (!hasRevealedRef.current) {
        drawCover(rect.width, rect.height);
      }
    };

    setupCanvas();

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      soundManager.stopScratch();
    };
  }, [drawCover]);

  /**
   * Pointer Event: Pointer Down
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch { }

    isDrawingRef.current = true;
    setIsScratching(true);
    soundManager.startScratch();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = { x, y };

    spawnSparks(x, y);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /**
   * Pointer Event: Pointer Move
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const last = lastPointRef.current || { x: currentX, y: currentY };
    const dpr = dprRef.current;

    spawnSparks(currentX, currentY);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = brushRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x: currentX, y: currentY };
    soundManager.pulseScratch();

    const now = performance.now();
    if (now - lastCalculatedTimeRef.current > 100) {
      lastCalculatedTimeRef.current = now;
      const pct = calculateScratchPercent();
      setScratchPercent(pct);
      onProgress?.(pct);

      if (pct >= revealThreshold * 100) {
        triggerReveal();
      }
    }
  };

  /**
   * Pointer Event: Pointer End
   */
  const handlePointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsScratching(false);
    lastPointRef.current = null;
    soundManager.stopScratch();

    try {
      if (canvasRef.current?.hasPointerCapture(e.pointerId)) {
        canvasRef.current.releasePointerCapture(e.pointerId);
      }
    } catch { }

    if (!hasRevealedRef.current) {
      const pct = calculateScratchPercent();
      setScratchPercent(pct);
      onProgress?.(pct);

      if (pct >= revealThreshold * 100) {
        triggerReveal();
      }
    }
  };

  const foilInfo = React.useMemo(() => getFoilDefinition(coverStyle), [coverStyle]);

  // Dynamic Border & Glow based on active Foil Theme
  const glowBorderClass = React.useMemo(() => {
    switch (foilInfo.shaderFamily) {
      case "gold":
        return "border-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.45),0_0_15px_rgba(251,191,36,0.3)]";
      case "cyber":
        return "border-cyan-400/90 shadow-[0_0_35px_rgba(34,211,238,0.45),0_0_15px_rgba(168,85,247,0.4)]";
      case "ruby":
        return "border-red-500/90 shadow-[0_0_35px_rgba(239,68,68,0.45),0_0_15px_rgba(244,63,94,0.3)]";
      case "emerald":
        return "border-emerald-400/90 shadow-[0_0_35px_rgba(52,211,153,0.45),0_0_15px_rgba(16,185,129,0.3)]";
      case "dark":
        return "border-slate-500/80 shadow-[0_0_35px_rgba(148,163,184,0.35),0_0_15px_rgba(71,85,105,0.4)]";
      case "silver":
        return "border-slate-300/90 shadow-[0_0_35px_rgba(226,232,240,0.45),0_0_15px_rgba(203,213,225,0.3)]";
      case "sunset":
        return "border-orange-400/90 shadow-[0_0_35px_rgba(249,115,22,0.45),0_0_15px_rgba(251,146,60,0.3)]";
      case "rose":
      default:
        return "border-pink-400/90 shadow-[0_0_35px_rgba(255,77,109,0.45),0_0_15px_rgba(192,132,252,0.3)]";
    }
  }, [foilInfo.shaderFamily]);

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* 
        ========================================================================
        THE GRAND TICKET SCRATCH CARD FRAME (Pure Surprise Showcase)
        ========================================================================
      */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[360px] aspect-[3/4] min-h-[420px] sm:min-h-[460px]",
          "rounded-[32px] p-2.5 sm:p-3 transition-all duration-500",
          "border-2 bg-stone-900/90 backdrop-blur-md",
          glowBorderClass,
          isRevealed ? "scale-[1.01]" : isScratching ? "brightness-105" : ""
        )}
      >
        {/* Ticket Notch: Left Semicircle Cutout */}
        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-950 border border-white/20 shadow-inner z-20" />
        {/* Ticket Notch: Right Semicircle Cutout */}
        <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-950 border border-white/20 shadow-inner z-20" />

        {/* Viewport for Canvas and Revealed Surprise */}
        <div
          ref={containerRef}
          className="relative w-full h-full rounded-[24px] overflow-hidden bg-white touch-none"
          role="region"
          aria-label={ariaLabel}
        >
          {/* UNDERNEATH LAYER: The Revealed Surprise (100% Surprise Focus) */}
          <div
            className={cn(
              "absolute inset-0 p-5 sm:p-7 flex flex-col justify-center items-center text-center transition-all duration-500 z-0",
              isRevealed ? "opacity-100 scale-100" : "opacity-95 scale-[0.98]"
            )}
          >
            {hiddenContent}
          </div>

          {/* TOP LAYER: Interactive Scratch Foil Canvas */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onLostPointerCapture={handlePointerEnd}
            style={{
              opacity: isRevealed ? 0 : 1,
              pointerEvents: isRevealed || disabled ? "none" : "auto",
              cursor: isRevealed ? "default" : "grab",
            }}
            className="absolute inset-0 z-10 w-full h-full transition-opacity duration-500 ease-out touch-none"
            aria-hidden="true"
          />

          {/* REAL-TIME SCRATCH SPARK PARTICLES OVERLAY */}
          <canvas
            ref={sparkCanvasRef}
            className="absolute inset-0 z-15 pointer-events-none"
            aria-hidden="true"
          />

          {/* Explosive Celebration Confetti on Reveal */}
          <CelebrationConfetti active={showCelebration} />
        </div>
      </div>

      {/* 
        ========================================================================
        BELOW-CARD STYLISH STATS DOCK (Sender, Recipient, Live %, Actions)
        ========================================================================
      */}
      {showControls && (
        <CardStatsDock
          senderName={metadata?.senderName}
          recipientName={metadata?.recipientName}
          occasionTag={metadata?.occasionTag}
          scratchPercent={scratchPercent}
          revealThreshold={revealThreshold}
          isRevealed={isRevealed}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onResetFoil={handleReset}
          onInstantReveal={triggerReveal}
          onShare={onShare}
          shareCopied={shareCopied}
          isCreatorPreview={isCreatorPreview}
        />
      )}
    </div>
  );
}
