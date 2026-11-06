"use client";

import * as React from "react";
import { X, Download, Sparkles, Check } from "lucide-react";
import type { BadgeDefinition, UserBadgeRecord } from "@/types/badges";
import { Button } from "@/components/ui/Button";
import { recordCreatorShareEvent } from "@/lib/badges/service";

export interface StoryShareModalProps {
  badge: BadgeDefinition | null;
  userBadge?: UserBadgeRecord;
  creatorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryShareModal({
  badge,
  userBadge,
  creatorName = "A Suprilo Creator",
  isOpen,
  onClose,
}: StoryShareModalProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  // Render 1080x1920 Story Card to HTML5 Canvas
  React.useEffect(() => {
    if (!isOpen || !badge || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: 1080 x 1920 (Standard 9:16 vertical story format)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Background vertical gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (badge.rarity === "legendary") {
      bgGradient.addColorStop(0, "#1e112a");
      bgGradient.addColorStop(0.4, "#2d1b4e");
      bgGradient.addColorStop(0.7, "#4a1942");
      bgGradient.addColorStop(1, "#180d26");
    } else if (badge.rarity === "epic") {
      bgGradient.addColorStop(0, "#160b29");
      bgGradient.addColorStop(0.5, "#2a124d");
      bgGradient.addColorStop(1, "#110620");
    } else if (badge.rarity === "rare") {
      bgGradient.addColorStop(0, "#0b192e");
      bgGradient.addColorStop(0.5, "#142c54");
      bgGradient.addColorStop(1, "#081324");
    } else {
      bgGradient.addColorStop(0, "#181a20");
      bgGradient.addColorStop(0.5, "#232733");
      bgGradient.addColorStop(1, "#12141a");
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient decorative circles/glow
    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      width / 2,
      720,
      50,
      width / 2,
      720,
      480
    );
    if (badge.rarity === "legendary") {
      glowGradient.addColorStop(0, "rgba(245, 158, 11, 0.35)");
      glowGradient.addColorStop(1, "rgba(245, 158, 11, 0)");
    } else if (badge.rarity === "epic") {
      glowGradient.addColorStop(0, "rgba(192, 38, 211, 0.35)");
      glowGradient.addColorStop(1, "rgba(192, 38, 211, 0)");
    } else if (badge.rarity === "rare") {
      glowGradient.addColorStop(0, "rgba(59, 130, 246, 0.35)");
      glowGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    } else {
      glowGradient.addColorStop(0, "rgba(148, 163, 184, 0.25)");
      glowGradient.addColorStop(1, "rgba(148, 163, 184, 0)");
    }
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 300, width, 900);
    ctx.restore();

    // 3. Top Header: Branding
    ctx.textAlign = "center";
    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = "#ff6b8b";
    ctx.fillText("SUPRILO CREATOR BADGES", width / 2, 220);

    ctx.font = "500 24px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("OFFICIAL ACHIEVEMENT SEAL", width / 2, 265);

    // 4. Central Medallion Outer Halo
    const centerX = width / 2;
    const centerY = 700;
    const radius = 220;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    // Medallion Circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    const medalGradient = ctx.createLinearGradient(
      centerX - radius,
      centerY - radius,
      centerX + radius,
      centerY + radius
    );
    if (badge.rarity === "legendary") {
      medalGradient.addColorStop(0, "#fbbf24");
      medalGradient.addColorStop(0.5, "#d97706");
      medalGradient.addColorStop(1, "#92400e");
    } else if (badge.rarity === "epic") {
      medalGradient.addColorStop(0, "#e879f9");
      medalGradient.addColorStop(0.5, "#c026d3");
      medalGradient.addColorStop(1, "#701a75");
    } else if (badge.rarity === "rare") {
      medalGradient.addColorStop(0, "#60a5fa");
      medalGradient.addColorStop(0.5, "#2563eb");
      medalGradient.addColorStop(1, "#1e3a8a");
    } else {
      medalGradient.addColorStop(0, "#f1f5f9");
      medalGradient.addColorStop(0.5, "#94a3b8");
      medalGradient.addColorStop(1, "#475569");
    }
    ctx.fillStyle = medalGradient;
    ctx.fill();

    // Medallion Rim Border
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.stroke();

    // Inner Star / Sparkle Motif
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 130px sans-serif";
    ctx.fillText("✨", centerX, centerY + 45);
    ctx.restore();

    // 5. Rarity Pill
    ctx.save();
    const pillY = 1040;
    const rarityText = `${badge.rarity.toUpperCase()} • +${badge.xp_award ?? badge.points} XP`;
    ctx.font = "bold 26px sans-serif";
    const textWidth = ctx.measureText(rarityText).width;
    const pillWidth = textWidth + 60;
    const pillHeight = 50;

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(centerX - pillWidth / 2, pillY - 35, pillWidth, pillHeight, 25);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(rarityText, centerX, pillY);
    ctx.restore();

    // 6. Badge Title
    ctx.font = "800 68px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(badge.name, centerX, 1180);

    // 7. Lore narrative (wrapped)
    ctx.font = "400 32px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const maxLoreWidth = 840;
    const words = (badge.lore ?? badge.description).split(" ");
    let line = "";
    let lineY = 1260;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLoreWidth && i > 0) {
        ctx.fillText(line, centerX, lineY);
        line = words[i] + " ";
        lineY += 46;
        if (lineY > 1360) break; // Limit lines
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, centerX, lineY);
    }

    // 8. Creator Attribution
    ctx.font = "600 30px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(`Unlocked by ${creatorName}`, centerX, 1540);

    const unlockDate = userBadge?.unlocked_at
      ? new Date(userBadge.unlocked_at).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : new Date().toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

    ctx.font = "400 24px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(unlockDate, centerX, 1585);

    // 9. Footer: Call to action
    ctx.font = "700 26px sans-serif";
    ctx.fillStyle = "#ff6b8b";
    ctx.fillText("suprilo.com", centerX, 1780);

    ctx.font = "400 20px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("Make every moment a surprise", centerX, 1815);
  }, [isOpen, badge, userBadge, creatorName]);

  if (!isOpen || !badge) return null;

  const handleDownload = () => {
    if (!canvasRef.current || downloading) return;
    setDownloading(true);

    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `suprilo-badge-${badge.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);

      // Record creator share event
      recordCreatorShareEvent({
        targetType: "badge",
        targetId: badge.id,
        actionType: "story_card_downloaded",
      }).catch(() => {});
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[StoryShareModal] Download error:", err);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-brand-warm-border space-y-5 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-pink-light flex items-center justify-center text-brand-pink">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-extrabold text-base text-brand-dark tracking-tight">
              Export Story Card
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9:16 Canvas Preview Viewport */}
        <div className="relative mx-auto w-[240px] h-[426px] rounded-2xl overflow-hidden shadow-lg border border-slate-700 bg-slate-900">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain select-none"
          />
        </div>

        <p className="text-xs text-brand-muted">
          High-resolution 1080×1920 image perfectly optimized for Instagram, TikTok, and Snapchat stories.
        </p>

        {/* Download Action */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full gap-2 shadow-sm"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{downloading ? "Generating..." : "Download Story Image"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
