"use client";

import * as React from "react";
import { soundManager } from "@/lib/sound";
import { CelebrationConfetti } from "./CelebrationConfetti";
import { CardStatsDock } from "./CardStatsDock";
import { cn } from "@/lib/utils";

export type CoverStyle = "lavender-pink" | "golden-foil" | "cosmic-purple" | "mint-fresh";

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

      if (coverStyle === "cosmic-purple") {
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

        // Top Header: "FUTURE SCRATCH"
        ctx.textAlign = "center";
        ctx.fillStyle = "#22D3EE";
        ctx.font = "900 12px system-ui, -apple-system, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText("⚡ FUTURE SCRATCH ⚡", width / 2, 44);

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
        ctx.font = "800 15px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "JACKPOT REVEAL!", width / 2, boxY + 40);

        ctx.fillStyle = "#A78BFA";
        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("SECRET CODE VERIFIED", width / 2, boxY + 62);

        // Bottom Animated Action Banner
        ctx.fillStyle = "#22D3EE";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("⚡ SCRATCH TO REVEAL ⚡", width / 2, height - 34);
      } else if (coverStyle === "golden-foil") {
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
        ctx.fillText("★ 24K GOLDEN VIP PASS ★", width / 2, 44);

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
        ctx.font = "800 15px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 38);

        ctx.fillStyle = "#92400E";
        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("SCRATCH WITH FINGER OR MOUSE", width / 2, boxY + 60);

        // Bottom CTA
        ctx.fillStyle = "#78350F";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("✦ SCRATCH TO REVEAL ✦", width / 2, height - 34);
      } else if (coverStyle === "mint-fresh") {
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
        ctx.fillText("❖ LUCKY EMERALD PASS ❖", width / 2, 44);

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
        ctx.font = "800 15px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 38);

        ctx.fillStyle = "#A7F3D0";
        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("SURPRISE INSIDE", width / 2, boxY + 60);

        // Bottom CTA
        ctx.fillStyle = "#6EE7B7";
        ctx.font = "800 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("❖ SCRATCH TO REVEAL ❖", width / 2, height - 34);
      } else {
        // ====================================================================
        // THEME: HOLOGRAPHIC ROSE VELVET (Iridescent Pastel Pink & Violet)
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
        ctx.fillText("♡ SECRET SURPRISE PASS ♡", width / 2, 44);

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
        ctx.font = "800 15px system-ui, -apple-system, sans-serif";
        ctx.fillText(coverText || "SCRATCH TO REVEAL ✨", width / 2, boxY + 38);

        ctx.fillStyle = "#FF4D6D";
        ctx.font = "600 11px system-ui, -apple-system, sans-serif";
        ctx.fillText("PERSONAL SURPRISE MESSAGE", width / 2, boxY + 60);

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
      } catch {}
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
    } catch {}

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
    } catch {}

    if (!hasRevealedRef.current) {
      const pct = calculateScratchPercent();
      setScratchPercent(pct);
      onProgress?.(pct);

      if (pct >= revealThreshold * 100) {
        triggerReveal();
      }
    }
  };

  // Border & Glow Class based on active Foil Style
  const glowBorderClass =
    coverStyle === "cosmic-purple"
      ? "border-cyan-400/80 shadow-[0_0_35px_rgba(34,211,238,0.35),0_0_15px_rgba(168,85,247,0.4)]"
      : coverStyle === "golden-foil"
      ? "border-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.35),0_0_15px_rgba(251,191,36,0.3)]"
      : coverStyle === "mint-fresh"
      ? "border-emerald-400/80 shadow-[0_0_35px_rgba(52,211,153,0.35),0_0_15px_rgba(16,185,129,0.3)]"
      : "border-pink-400/80 shadow-[0_0_35px_rgba(255,77,109,0.35),0_0_15px_rgba(192,132,252,0.3)]";

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
