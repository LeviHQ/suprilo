"use client";

import * as React from "react";
import {
  RefreshCw,
  Eye,
  Volume2,
  VolumeX,
  Hand,
  CheckCircle2,
} from "lucide-react";
import { soundManager } from "@/lib/sound";
import { CelebrationConfetti } from "./CelebrationConfetti";

export type CoverStyle = "lavender-pink" | "golden-foil" | "cosmic-purple" | "mint-fresh";

export interface ScratchCardProps {
  hiddenContent: React.ReactNode;
  coverText?: string;
  coverStyle?: CoverStyle;
  revealThreshold?: number; // 0 to 1, default 0.65
  brushRadius?: number; // px, default 26
  onReveal?: () => void;
  onProgress?: (percent: number) => void;
  className?: string;
  disabled?: boolean;
  showControls?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
  ariaLabel?: string;
}

export function ScratchCard({
  hiddenContent,
  coverText = "Scratch to reveal your surprise ✨",
  coverStyle = "lavender-pink",
  revealThreshold = 0.65,
  brushRadius = 26,
  onReveal,
  onProgress,
  className = "",
  disabled = false,
  showControls = true,
  ariaLabel = "Interactive scratch card",
}: ScratchCardProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

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

  // Sound toggle handler
  const handleToggleSound = React.useCallback(() => {
    const next = soundManager.toggleMuted();
    setIsMuted(next);
  }, []);

  /**
   * Draw the initial foil overlay onto the canvas
   */
  const drawCover = React.useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = dprRef.current;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform for clean clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      ctx.globalCompositeOperation = "source-over";

      // 1. Base metallic pastel gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (coverStyle === "golden-foil") {
        grad.addColorStop(0, "#FDE68A");
        grad.addColorStop(0.3, "#F59E0B");
        grad.addColorStop(0.7, "#FEF3C7");
        grad.addColorStop(1, "#D97706");
      } else if (coverStyle === "cosmic-purple") {
        grad.addColorStop(0, "#DDD6FE");
        grad.addColorStop(0.3, "#8B5CF6");
        grad.addColorStop(0.7, "#C4B5FD");
        grad.addColorStop(1, "#6D28D9");
      } else if (coverStyle === "mint-fresh") {
        grad.addColorStop(0, "#A7F3D0");
        grad.addColorStop(0.35, "#10B981");
        grad.addColorStop(0.75, "#D1FAE5");
        grad.addColorStop(1, "#059669");
      } else {
        // lavender-pink signature
        grad.addColorStop(0, "#FED7AA"); // warm peach
        grad.addColorStop(0.3, "#FDA4AF"); // pastel rose
        grad.addColorStop(0.65, "#FF4D6D"); // brand pink
        grad.addColorStop(1, "#C084FC"); // soft lavender
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle metallic foil sheen / glitter speckles
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      const speckleCount = Math.floor((width * height) / 1200);
      for (let i = 0; i < speckleCount; i++) {
        const sx = ((i * 37) % width);
        const sy = ((i * 73) % height);
        const r = (i % 3) === 0 ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Subtle diagonal foil luster stripes
      ctx.save();
      ctx.rotate((-20 * Math.PI) / 180);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      for (let x = -width; x < width * 2; x += 36) {
        ctx.fillRect(x, -height, 12, height * 3);
      }
      ctx.restore();

      // 4. Center instruction pill badge
      const badgeW = Math.min(width * 0.84, 280);
      const badgeH = 54;
      const badgeX = (width - badgeW) / 2;
      const badgeY = (height - badgeH) / 2;
      const badgeRadius = 18;

      // Soft pill shadow
      ctx.save();
      ctx.shadowColor = "rgba(23, 21, 42, 0.18)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;

      // Pill background
      ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
      ctx.fill();
      ctx.restore();

      // Pill border
      ctx.strokeStyle = "rgba(255, 77, 109, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
      ctx.stroke();

      // Instruction icon & text
      ctx.fillStyle = "#17152A";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(coverText, width / 2, height / 2 - 4);

      // Subtitle
      ctx.fillStyle = "#6B7280";
      ctx.font = "500 11px system-ui, -apple-system, sans-serif";
      ctx.fillText("Swipe or drag across the card", width / 2, height / 2 + 14);

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
      // Sample every 8th pixel on X and Y to remain ultra-fast
      const step = 8;
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      let transparentCount = 0;
      let totalSampled = 0;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4 + 3; // alpha channel
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

  // Handle Resize and Canvas Setup
  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
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

    // Erase a circular spot on down
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

    // Throttle percentage calculation to every 120ms to keep 60fps
    const now = performance.now();
    if (now - lastCalculatedTimeRef.current > 120) {
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
   * Pointer Event: Pointer Up / Cancel / Lost Capture
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

    // Final calculation on stroke finish
    if (!hasRevealedRef.current) {
      const pct = calculateScratchPercent();
      setScratchPercent(pct);
      onProgress?.(pct);

      if (pct >= revealThreshold * 100) {
        triggerReveal();
      }
    }
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Outer Card Wrapper */}
      <div className="relative rounded-3xl bg-white border border-brand-warm-border/90 shadow-card hover:shadow-card-hover transition-all duration-300 p-4 sm:p-6 overflow-hidden">
        {/* Card Header Status Row */}
        <div className="flex items-center justify-between pb-3.5 border-b border-brand-warm-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRevealed
                  ? "bg-emerald-500 animate-pulse"
                  : isScratching
                  ? "bg-brand-orange animate-ping"
                  : "bg-brand-pink"
              }`}
            />
            <span className="font-semibold text-brand-dark tracking-wide uppercase text-[11px]">
              {isRevealed ? "Surprise Uncovered! 🎉" : "Interactive Scratch Card"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink transition-colors"
              aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
              title={isMuted ? "Turn sound on" : "Turn sound off"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-brand-muted" />
              ) : (
                <Volume2 className="w-4 h-4 text-brand-pink" />
              )}
            </button>

            {/* Progress pill */}
            <span className="text-[11px] font-semibold text-brand-muted bg-brand-warm-subtle px-2.5 py-0.5 rounded-full border border-brand-warm-border">
              {scratchPercent}% scratched
            </span>
          </div>
        </div>

        {/* Scratch Surface Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative mt-4 aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-inner border border-brand-warm-border/70 bg-gradient-to-br from-[#FFF5F7] via-[#FFFDFB] to-[#F5EFFF] touch-none"
          role="region"
          aria-label={ariaLabel}
        >
          {/* UNDERNEATH LAYER: The Revealed Surprise */}
          <div
            className={`absolute inset-0 p-5 sm:p-7 flex flex-col justify-between transition-opacity duration-300 z-0 ${
              isRevealed ? "opacity-100" : "opacity-95"
            }`}
          >
            {hiddenContent}
          </div>

          {/* TOP LAYER: Canvas Scratch Foil */}
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

          {/* Celebration Particle Canvas */}
          <CelebrationConfetti active={showCelebration} />
        </div>

        {/* Progress Bar under card canvas */}
        {!isRevealed && scratchPercent > 0 && (
          <div className="mt-3 w-full bg-brand-warm-subtle rounded-full h-1.5 overflow-hidden border border-brand-warm-border/50">
            <div
              className="bg-gradient-to-r from-brand-orange to-brand-pink h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, (scratchPercent / (revealThreshold * 100)) * 100)}%` }}
            />
          </div>
        )}

        {/* Card Controls & Helper */}
        {showControls && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-brand-muted">
              {isRevealed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-700 font-medium">Revealed successfully</span>
                </>
              ) : (
                <>
                  <Hand className="w-3.5 h-3.5 text-brand-pink animate-pulse" />
                  <span>Scratch 65% to reveal fully</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isRevealed ? (
                <button
                  type="button"
                  onClick={triggerReveal}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-pink hover:text-brand-pink-hover underline underline-offset-2 py-1 px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal now</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark bg-brand-warm-subtle hover:bg-brand-warm-border px-3 py-1.5 rounded-full border border-brand-warm-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scratch Again</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
