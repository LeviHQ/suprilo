"use client";

import * as React from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { TemplateDefinition, getFoilBadge } from "@/data/templates";
import { cn } from "@/lib/utils";

interface TemplateStudioCardProps {
  template: TemplateDefinition;
  onSelect: (template: TemplateDefinition) => void;
}

export function TemplateStudioCard({ template, onSelect }: TemplateStudioCardProps) {
  const foilInfo = getFoilBadge(template.coverStyle);
  const [showUnderneath, setShowUnderneath] = React.useState(false);

  const foilId = template.coverStyle.toLowerCase();
  const isChampagneGold =
    foilId.includes("champagne-gold") || foilId === "gold-confetti" || foilId === "birthday-champagne-gold";
  const isHoloParty =
    foilId.includes("holo-party") || foilId.includes("night-club") || foilId === "birthday-holo-party-prism";
  const isBalloonPop =
    foilId.includes("balloon-pop") || foilId === "birthday-balloon-pop" || foilId === "pastel-candy-pop";
  const isMintShimmer =
    foilId.includes("mint-shimmer") || foilId === "birthday-mint-shimmer";
  const isRoastRevelry =
    foilId.includes("roast-revelry") || foilId.includes("aging-alert") || foilId === "birthday-roast-revelry";

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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowUnderneath((prev) => !prev);
            }}
            className="text-[10px] font-bold text-brand-muted hover:text-brand-pink flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-brand-warm transition-colors"
            title={showUnderneath ? "Show scratch foil finish" : "Peek surprise message inside"}
          >
            {showUnderneath ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Foil View</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Peek Inside</span>
              </>
            )}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted bg-brand-warm-subtle px-2 py-0.5 rounded-md border border-brand-warm-border/60 truncate max-w-[100px]">
            {template.categoryLabel}
          </span>
        </div>
      </div>

      {/* Tactile Scratch Card Visual Preview */}
      <div
        onClick={() => onSelect(template)}
        className="cursor-pointer relative rounded-2xl min-h-[190px] border border-brand-warm-border/80 shadow-inner overflow-hidden transition-transform group-hover:scale-[1.01]"
      >
        {/* VIEW A: TACTILE SCRATCH FOIL FINISH (Exact matches to reference picture) */}
        {!showUnderneath ? (
          <div className="w-full h-full min-h-[190px] p-4 flex flex-col justify-between relative select-none">
            {/* 1. 24K CHAMPAGNE GOLD */}
            {isChampagneGold && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7C2] via-[#F59E0B] to-[#92400E]" />
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Stars border frame */}
                <div className="relative z-10 border border-amber-200/60 rounded-xl p-2.5 flex flex-col items-center justify-between h-full bg-amber-950/15 backdrop-blur-[1px]">
                  <div className="text-[9px] font-black tracking-[3px] text-amber-100 uppercase flex items-center gap-1">
                    <span>★ ★ ★</span>
                    <span>24K GOLD WISH</span>
                    <span>★ ★ ★</span>
                  </div>

                  <div className="my-auto text-center px-2 py-1 bg-white/95 rounded-xl border border-amber-300 shadow-sm w-full max-w-[230px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                      ✦ SCRATCH FOR YOUR GOLDEN WISH ✦
                    </div>
                    <div className="text-[9px] font-bold text-amber-700 mt-0.5 truncate">
                      To: {template.recipient}
                    </div>
                  </div>

                  {/* Corner scratch peel illustration */}
                  <div className="w-full flex items-center justify-between text-[8px] font-extrabold uppercase text-amber-100/90 pt-1 border-t border-amber-200/30">
                    <span>✨ Gold Leaf Finish</span>
                    <span className="bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 2. HOLO PARTY PRISM */}
            {isHoloParty && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#E879F9] via-[#6366F1] to-[#06B6D4]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-400/40 via-transparent to-cyan-500/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border border-cyan-300/70 rounded-xl p-2.5 flex flex-col items-center justify-between h-full bg-black/25 backdrop-blur-[1px] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <div className="text-[9px] font-black tracking-[2px] text-cyan-200 uppercase flex items-center gap-1.5">
                    <span>⚡ ♫</span>
                    <span>NIGHT-CLUB PRISM</span>
                    <span>♫ ⚡</span>
                  </div>

                  <div className="my-auto text-center px-2 py-1.5 bg-black/75 rounded-xl border-2 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)] w-full max-w-[240px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                      ⚡ SWIPE TO UNLOCK THE PARTY ⚡
                    </div>
                    <div className="text-[9px] font-bold text-fuchsia-300 mt-0.5 truncate">
                      Nightclub VIP Pass • {template.recipient}
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[8px] font-extrabold uppercase text-cyan-100/90 pt-1 border-t border-cyan-400/30">
                    <span>⚡ Neon Hologram</span>
                    <span className="bg-fuchsia-950/80 text-fuchsia-300 px-1.5 py-0.5 rounded border border-fuchsia-500/40">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 3. CELEBRATION BALLOON POP */}
            {isBalloonPop && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#38BDF8] via-[#FB7185] to-[#FBBF24]" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFFFFF_2px,transparent_2px)] [background-size:16px_16px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border border-white/70 rounded-xl p-2.5 flex flex-col items-center justify-between h-full bg-white/20 backdrop-blur-[1px]">
                  <div className="text-[9px] font-black tracking-[2px] text-white uppercase flex items-center gap-1.5 drop-shadow">
                    <span>🎈 🎂</span>
                    <span>3D BALLOON DROP</span>
                    <span>🎂 🎈</span>
                  </div>

                  <div className="my-auto text-center px-2 py-1.5 bg-white/95 rounded-xl border border-orange-300 shadow-md w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-rose-500 to-amber-500">
                      TAP & SCRATCH THE CELEBRATION
                    </div>
                    <div className="text-[9px] font-bold text-slate-700 mt-0.5 truncate">
                      Special for: {template.recipient} 🎈
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[8px] font-extrabold uppercase text-white drop-shadow pt-1 border-t border-white/40">
                    <span>🎈 3D Balloons & Confetti</span>
                    <span className="bg-rose-500/80 text-white px-1.5 py-0.5 rounded">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 4. MINT EMERALD SHIMMER */}
            {isMintShimmer && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#34D399] via-[#0D9488] to-[#064E3B]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#A7F3D0_1px,transparent_1px)] [background-size:10px_10px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border border-emerald-300/70 rounded-xl p-2.5 flex flex-col items-center justify-between h-full bg-emerald-950/20 backdrop-blur-[1px]">
                  <div className="text-[9px] font-black tracking-[2px] text-emerald-100 uppercase flex items-center gap-1.5">
                    <span>✦ 🎁</span>
                    <span>MINT GLITTER PASS</span>
                    <span>🎁 ✦</span>
                  </div>

                  {/* Satin Mint Emerald Ribbon across the card */}
                  <div className="my-auto text-center px-2 py-1.5 bg-emerald-900/90 rounded-xl border border-emerald-300 shadow-md w-full max-w-[240px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                      🎁 SCRATCH TO CLAIM YOUR SURPRISE 🎁
                    </div>
                    <div className="text-[9px] font-bold text-emerald-300 mt-0.5 truncate">
                      Voucher Gift • {template.recipient}
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[8px] font-extrabold uppercase text-emerald-100 pt-1 border-t border-emerald-300/30">
                    <span>🎁 Emerald Ribbon Foil</span>
                    <span className="bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 5. ROAST & REVELRY */}
            {isRoastRevelry && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] via-[#EA580C] to-[#DC2626]" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border border-yellow-300/70 rounded-xl p-2.5 flex flex-col items-center justify-between h-full bg-black/25 backdrop-blur-[1px]">
                  <div className="text-[9px] font-black tracking-[2px] text-yellow-200 uppercase flex items-center gap-1.5">
                    <span>💀 🔥</span>
                    <span>SAVAGE ROAST & REVELRY</span>
                    <span>🔥 💀</span>
                  </div>

                  {/* Comic warning box & hazard bar */}
                  <div className="my-auto text-center px-2 py-1.5 bg-black/85 rounded-xl border border-yellow-400 shadow-md w-full max-w-[240px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                      🔥 WARNING: NOSTALGIA AHEAD 🔥
                    </div>
                    <div className="mt-1 px-1 py-0.5 bg-yellow-400 text-black text-[9px] font-black tracking-widest rounded uppercase">
                      ⚠️ AGING ALERT ⚠️
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[8px] font-extrabold uppercase text-yellow-100 pt-1 border-t border-yellow-400/30">
                    <span>🔥 Comic Hazard Tape</span>
                    <span className="bg-red-950 text-yellow-300 px-1.5 py-0.5 rounded">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* FALLBACK FOR OTHER CATEGORIES */}
            {!isChampagneGold && !isHoloParty && !isBalloonPop && !isMintShimmer && !isRoastRevelry && (
              <>
                <div className={cn("absolute inset-0 bg-gradient-to-br", foilInfo.previewGradient)} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border border-white/60 rounded-xl p-2.5 flex flex-col items-center justify-between h-full bg-black/20 backdrop-blur-[1px]">
                  <div className="text-[9px] font-black tracking-widest text-white uppercase truncate max-w-[200px]">
                    ✦ {foilInfo.label} ✦
                  </div>

                  <div className="my-auto text-center px-3 py-1.5 bg-white/90 rounded-xl shadow-sm w-full max-w-[230px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-brand-dark">
                      ✦ SCRATCH TO REVEAL ✦
                    </div>
                    <div className="text-[9px] font-semibold text-brand-muted mt-0.5 truncate">
                      To: {template.recipient}
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[8px] font-extrabold uppercase text-white/90 pt-1 border-t border-white/30">
                    <span>Suprilo Scratch Finish</span>
                    <span className="bg-black/40 text-white px-1.5 py-0.5 rounded">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* VIEW B: INNER SURPRISE MESSAGE PREVIEW */
          <div
            className={cn(
              "w-full h-full min-h-[190px] p-4 flex flex-col justify-between relative",
              `bg-gradient-to-br ${template.bgGradient}`
            )}
          >
            <div className="flex items-start justify-between gap-2 relative z-10">
              <span className="inline-block text-[9px] font-black uppercase tracking-wider text-brand-dark/70 bg-white/80 px-2 py-0.5 rounded-full border border-brand-warm-border/50">
                {template.tag}
              </span>
              <span className="text-[10px] font-semibold text-brand-dark/60 truncate max-w-[90px]">
                To: {template.recipient}
              </span>
            </div>

            <div className="my-2 space-y-1 relative z-10 text-center px-1">
              <p className="text-xs sm:text-[13px] font-bold text-brand-dark leading-snug line-clamp-2">
                &ldquo;{template.message}&rdquo;
              </p>
              <p className="text-[10px] text-brand-muted leading-tight line-clamp-1 italic">
                {template.secondary}
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] text-brand-dark/60 pt-2 border-t border-brand-warm-border/40 relative z-10">
              <span className="font-semibold text-brand-pink text-[10px] capitalize">
                Under the Foil 🎁
              </span>
              <span className="font-mono text-[9px] text-brand-muted">
                From: {template.sender}
              </span>
            </div>
          </div>
        )}
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
