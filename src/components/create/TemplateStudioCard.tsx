"use client";

import * as React from "react";
import {
  Sparkles,
  ArrowRight,
  Heart,
  Cake,
  Flower2,
  Gift,
  PartyPopper,
  Trophy,
  Star,
} from "lucide-react";
import type { TemplateDefinition } from "@/data/templates";
import { CoverStyle } from "@/types/card";
import { cn } from "@/lib/utils";

interface TemplateStudioCardProps {
  template: TemplateDefinition;
  onSelect: (template: TemplateDefinition) => void;
}

const FOIL_BADGES: Record<
  CoverStyle,
  { label: string; dotClass: string; borderClass: string; bgClass: string }
> = {
  "golden-foil": {
    label: "24K Gold Foil",
    dotClass: "bg-amber-400 ring-amber-300",
    borderClass: "border-amber-200/80",
    bgClass: "bg-amber-50/80 text-amber-900",
  },
  "lavender-pink": {
    label: "Lavender Pink",
    dotClass: "bg-rose-400 ring-rose-300",
    borderClass: "border-rose-200/80",
    bgClass: "bg-rose-50/80 text-rose-900",
  },
  "cosmic-purple": {
    label: "Cosmic Purple",
    dotClass: "bg-purple-500 ring-purple-300",
    borderClass: "border-purple-200/80",
    bgClass: "bg-purple-50/80 text-purple-900",
  },
  "mint-fresh": {
    label: "Mint Emerald",
    dotClass: "bg-emerald-400 ring-emerald-300",
    borderClass: "border-emerald-200/80",
    bgClass: "bg-emerald-50/80 text-emerald-900",
  },
};

function StickerIcon({ sticker, className }: { sticker: string; className?: string }) {
  switch (sticker) {
    case "heart":
      return <Heart className={className} />;
    case "cake":
      return <Cake className={className} />;
    case "flower":
      return <Flower2 className={className} />;
    case "gift":
      return <Gift className={className} />;
    case "confetti":
      return <PartyPopper className={className} />;
    case "trophy":
      return <Trophy className={className} />;
    case "star":
      return <Star className={className} />;
    case "sparkles":
    default:
      return <Sparkles className={className} />;
  }
}

export function TemplateStudioCard({ template, onSelect }: TemplateStudioCardProps) {
  const foilInfo = FOIL_BADGES[template.coverStyle] || FOIL_BADGES["golden-foil"];

  return (
    <div className="group bg-white rounded-3xl p-4 sm:p-5 border border-brand-warm-border shadow-xs hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      {/* Top Foil Pill & Occasion Tag */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <span
          className={cn(
            "relative overflow-hidden inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition-transform group-hover:scale-105",
            foilInfo.bgClass,
            foilInfo.borderClass
          )}
        >
          {/* Tactile Holographic Shimmer Ray on Hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
          <span
            className={cn("w-1.5 h-1.5 rounded-full ring-2 shrink-0 animate-pulse", foilInfo.dotClass)}
          />
          <span className="truncate max-w-[110px]">{foilInfo.label}</span>
        </span>

        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted bg-brand-warm-subtle px-2 py-0.5 rounded-md border border-brand-warm-border/60 truncate max-w-[120px]">
          {template.categoryLabel}
        </span>
      </div>

      {/* Tactile Scratch Card Visual Preview */}
      <div
        onClick={() => onSelect(template)}
        className={cn(
          "cursor-pointer relative rounded-2xl p-4 sm:p-4.5 border border-brand-warm-border/70 shadow-inner flex flex-col justify-between min-h-[176px] transition-transform group-hover:scale-[1.01] overflow-hidden",
          `bg-gradient-to-br ${template.bgGradient}`
        )}
      >
        {/* Subtle decorative shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Card Header in Preview */}
        <div className="flex items-start justify-between gap-2 relative z-10">
          <span className="inline-block text-[9px] font-black uppercase tracking-wider text-brand-dark/70 bg-white/80 px-2 py-0.5 rounded-full border border-brand-warm-border/50 backdrop-blur-xs truncate max-w-[150px]">
            {template.tag}
          </span>
          <span className="text-[10px] font-semibold text-brand-dark/60 truncate max-w-[90px]">
            To: {template.recipient}
          </span>
        </div>

        {/* Message & Sticker in Preview */}
        <div className="my-2.5 space-y-1 relative z-10 text-center px-1">
          <p className="text-xs sm:text-[13px] font-bold text-brand-dark leading-snug line-clamp-2">
            &ldquo;{template.message}&rdquo;
          </p>
          <p className="text-[10px] text-brand-muted leading-tight line-clamp-1 italic">
            {template.secondary}
          </p>
        </div>

        {/* Card Bottom in Preview */}
        <div className="flex items-center justify-between text-[10px] text-brand-dark/60 pt-2 border-t border-brand-warm-border/40 relative z-10">
          <div className="flex items-center gap-1.5 text-brand-pink font-semibold text-[10px]">
            <StickerIcon sticker={template.sticker} className="w-3 h-3 text-brand-pink shrink-0" />
            <span className="capitalize">{template.sticker}</span>
          </div>
          <span className="font-mono text-[9px] text-brand-muted">
            From: {template.sender}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mt-3.5 mb-4 space-y-1 shrink-0">
        <h3 className="text-sm font-extrabold text-brand-dark group-hover:text-brand-pink transition-colors truncate">
          {template.title}
        </h3>
        <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={() => onSelect(template)}
        className="w-full py-2.5 px-4 rounded-xl bg-brand-warm hover:bg-brand-pink text-brand-dark hover:text-white border border-brand-warm-border hover:border-brand-pink font-bold text-xs shadow-2xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 group-hover:bg-brand-pink group-hover:text-white group-hover:border-brand-pink"
      >
        <span>Use This Template</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

