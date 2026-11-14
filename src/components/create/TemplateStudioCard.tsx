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
  // Birthday Foils
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

  // Love Foils
  const isGlowingHeartbeat =
    foilId.includes("glowing-heartbeat") || foilId.includes("heartbeat");
  const isSunsetSoulmate =
    foilId.includes("sunset-soulmate") || (foilId.includes("sunset") && foilId.includes("love"));
  const isRoseGoldChronicles =
    foilId.includes("rose-gold-chronicles") || foilId.includes("rose-gold");
  const isPastelCupidsDream =
    foilId.includes("cupids-dream") || foilId.includes("cupid");
  const isSavageRomance =
    foilId.includes("savage-romance") || (foilId.includes("savage") && foilId.includes("love"));

  // Anniversary Foils
  const isForeverGold =
    foilId.includes("forever-gold") || (foilId.includes("gold") && foilId.includes("anniv"));
  const isHoloUniverse =
    foilId.includes("holographic-universe") || (foilId.includes("holo") && foilId.includes("anniv"));
  const isMidnightStars =
    foilId.includes("midnight-stars") || foilId.includes("stars-love");
  const isEmeraldBond =
    foilId.includes("emerald-bond") || (foilId.includes("emerald") && foilId.includes("anniv"));
  const isCinematicMemories =
    foilId.includes("cinematic-memories") || foilId.includes("cinematic");

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

      {/* Tactile Scratch Card Visual Preview: Proper Vertical Rectangle (portrait card) */}
      <div
        onClick={() => onSelect(template)}
        className="cursor-pointer relative rounded-3xl w-full aspect-[4/5] min-h-[360px] sm:min-h-[390px] border border-brand-warm-border/80 shadow-md overflow-hidden transition-transform group-hover:scale-[1.01]"
      >
        {/* VIEW A: TACTILE SCRATCH FOIL FINISH (Exact matches to reference picture) */}
        {!showUnderneath ? (
          <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between relative select-none">
            {/* 1. 24K CHAMPAGNE GOLD */}
            {isChampagneGold && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7C2] via-[#F59E0B] to-[#92400E]" />
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Stars border frame */}
                <div className="relative z-10 border-2 border-amber-200/70 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-amber-950/20 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[4px] text-amber-100 uppercase flex items-center gap-1.5 drop-shadow">
                    <span>★ ★ ★</span>
                    <span>24K GOLD WISH</span>
                    <span>★ ★ ★</span>
                  </div>

                  {/* Center Luxury Embossed Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-white/95 rounded-2xl border-2 border-amber-300 shadow-lg w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 leading-tight">
                      ✦ SCRATCH FOR YOUR GOLDEN WISH ✦
                    </div>
                    <div className="my-2 border-t border-amber-200/80 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600 block">
                        HONORING
                      </span>
                      <span className="text-sm font-black text-amber-950 truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-amber-700 italic">
                      Champagne & Gold Leaf Pass
                    </div>
                  </div>

                  {/* Corner scratch peel illustration */}
                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-amber-100/95 pt-2 border-t border-amber-200/40">
                    <span className="flex items-center gap-1">
                      <span>✨</span>
                      <span>Gold Leaf Flakes</span>
                    </span>
                    <span className="bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded-md border border-amber-300/40 shadow-xs">
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
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-400/45 via-transparent to-cyan-500/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-cyan-300/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-black/35 backdrop-blur-[1px] shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                  <div className="text-[10px] font-black tracking-[3px] text-cyan-200 uppercase flex items-center gap-2 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]">
                    <span>⚡ ♫</span>
                    <span>NIGHT-CLUB PRISM</span>
                    <span>♫ ⚡</span>
                  </div>

                  {/* Center Glowing Neon Sign */}
                  <div className="my-auto text-center px-3 py-3 bg-black/85 rounded-2xl border-2 border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.6)] w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.9)] leading-tight">
                      ⚡ SWIPE TO UNLOCK THE PARTY ⚡
                    </div>
                    <div className="my-2 border-t border-fuchsia-500/40 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-fuchsia-400 block">
                        VIP PASS
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-fuchsia-300">
                      Nightclub VIP Birthday 2026
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-cyan-100/95 pt-2 border-t border-cyan-400/40">
                    <span className="flex items-center gap-1">
                      <span>⚡</span>
                      <span>Neon Hologram</span>
                    </span>
                    <span className="bg-fuchsia-950/90 text-fuchsia-200 px-2 py-0.5 rounded-md border border-fuchsia-400/50 shadow-xs">
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
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#FFFFFF_2px,transparent_2px)] [background-size:18px_18px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-white/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-white/25 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-white uppercase flex items-center gap-2 drop-shadow-md">
                    <span>🎈 🎂</span>
                    <span>3D BALLOON DROP</span>
                    <span>🎂 🎈</span>
                  </div>

                  {/* Center 3D Puffed Candy Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-white/95 rounded-2xl border-2 border-orange-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-xs font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-rose-500 to-amber-500 leading-snug">
                      TAP & SCRATCH THE CELEBRATION
                    </div>
                    <div className="my-2 border-t border-orange-200 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">
                        SPECIAL FOR
                      </span>
                      <span className="text-sm font-black text-slate-900 truncate block">
                        {template.recipient} 🎈
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-amber-700">
                      3D Balloons, Candles & Ribbons
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-white drop-shadow pt-2 border-t border-white/40">
                    <span className="flex items-center gap-1">
                      <span>🎈</span>
                      <span>3D Balloons</span>
                    </span>
                    <span className="bg-rose-500/90 text-white px-2 py-0.5 rounded-md shadow-xs">
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
                <div className="absolute inset-0 opacity-35 bg-[radial-gradient(#A7F3D0_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-emerald-300/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-emerald-950/25 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-emerald-100 uppercase flex items-center gap-2 drop-shadow">
                    <span>✦ 🎁</span>
                    <span>MINT GLITTER PASS</span>
                    <span>🎁 ✦</span>
                  </div>

                  {/* Satin Mint Emerald Ribbon across the card */}
                  <div className="my-auto text-center px-3 py-3 bg-emerald-900/95 rounded-2xl border-2 border-emerald-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-emerald-100 leading-tight">
                      🎁 SCRATCH TO CLAIM YOUR SURPRISE 🎁
                    </div>
                    <div className="my-2 border-t border-emerald-700/80 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                        VOUCHER ENTITLED TO
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-emerald-300">
                      Official Birthday Voucher Ribbon
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-emerald-100 pt-2 border-t border-emerald-300/40">
                    <span className="flex items-center gap-1">
                      <span>🎁</span>
                      <span>Satin Ribbon Foil</span>
                    </span>
                    <span className="bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-400/40 shadow-xs">
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
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-yellow-300/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-black/30 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-yellow-200 uppercase flex items-center gap-2 drop-shadow">
                    <span>💀 🔥</span>
                    <span>SAVAGE ROAST & REVELRY</span>
                    <span>🔥 💀</span>
                  </div>

                  {/* Comic warning box & hazard bar */}
                  <div className="my-auto text-center px-3 py-3 bg-black/90 rounded-2xl border-2 border-yellow-400 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-yellow-300 leading-tight">
                      🔥 WARNING: NOSTALGIA AHEAD 🔥
                    </div>
                    <div className="my-2 border-t border-yellow-500/40 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400 block">
                        ROAST TARGET
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="mt-1 px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black tracking-widest rounded-md uppercase">
                      ⚠️ AGING ALERT ⚠️
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-yellow-100 pt-2 border-t border-yellow-400/40">
                    <span className="flex items-center gap-1">
                      <span>🔥</span>
                      <span>Comic Hazard Tape</span>
                    </span>
                    <span className="bg-red-950 text-yellow-300 px-2 py-0.5 rounded-md border border-yellow-400/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ================================================================= */}
            {/* LOVE FOILS (Exact Reference Image Pic 3 Row 1) */}
            {/* ================================================================= */}
            {/* 6. THE GLOWING HEARTBEAT */}
            {isGlowingHeartbeat && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#E11D48] via-[#881337] to-[#4C0519]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#FDA4AF_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Silver foil ripped peel corners */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-400 clip-path-polygon shadow-md z-10 opacity-90 rounded-br-xl border-b border-r border-white/60" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-slate-200 to-slate-400 clip-path-polygon shadow-md z-10 opacity-90 rounded-tl-xl border-t border-l border-white/60" />

                <div className="relative z-10 border-2 border-rose-400/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-rose-950/30 backdrop-blur-[1px] shadow-[0_0_25px_rgba(225,29,72,0.4)]">
                  <div className="text-[10px] font-black tracking-[3px] text-rose-200 uppercase flex items-center gap-2 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                    <span>💖 ✦</span>
                    <span>GLOWING HEARTBEAT</span>
                    <span>✦ 💖</span>
                  </div>

                  {/* Concentric Neon Heart Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-rose-950/85 rounded-2xl border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-rose-200 drop-shadow-[0_0_8px_rgba(251,113,133,0.9)] leading-tight">
                      ✦ SCRATCH TO FEEL THE LOVE ✦
                    </div>
                    <div className="my-2 border-t border-rose-500/50 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-rose-400 block">
                        INTIMATE SURPRISE FOR
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient} 💓
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-rose-300">
                      Pulsing Neon Ruby Heart
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-rose-100 pt-2 border-t border-rose-400/40">
                    <span className="flex items-center gap-1">
                      <span>💖</span>
                      <span>Neon Ruby Rings</span>
                    </span>
                    <span className="bg-rose-950/90 text-rose-200 px-2 py-0.5 rounded-md border border-rose-400/50 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 7. THE SUNSET SOULMATE */}
            {isSunsetSoulmate && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#2E1065] via-[#BE185D] to-[#FBBF24]" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-amber-300/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-purple-950/30 backdrop-blur-[1px]">
                  {/* Upper Hand Heart Silhouette */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">🫶</div>
                    <div className="text-[9px] font-black tracking-[3px] text-amber-200 uppercase drop-shadow">
                      STARS & SUNSET
                    </div>
                  </div>

                  {/* Center Sunset Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-purple-950/90 rounded-2xl border-2 border-amber-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-200 drop-shadow leading-tight">
                      ♡ TAP & UNLOCK OUR STORY ♡
                    </div>
                    <div className="my-2 border-t border-pink-400/40 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-pink-300 block">
                        DEDICATED TO
                      </span>
                      <span className="text-sm font-black text-amber-100 truncate block">
                        {template.recipient} 🌅
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-pink-200">
                      Twilight Sunset & Golden Starlight
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-amber-100 pt-2 border-t border-amber-300/40">
                    <span className="flex items-center gap-1">
                      <span>🌅</span>
                      <span>Hand Heart Sunset</span>
                    </span>
                    <span className="bg-purple-950/90 text-amber-200 px-2 py-0.5 rounded-md border border-amber-300/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 8. THE ROSE GOLD CHRONICLES */}
            {isRoseGoldChronicles && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4E6] via-[#FDA4AF] to-[#E11D48]" />
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-rose-200/90 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-rose-950/20 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-rose-950 uppercase flex items-center gap-1.5 drop-shadow-xs">
                    <span>🌹 💌</span>
                    <span>ROSE GOLD CHRONICLES</span>
                    <span>💌 🌹</span>
                  </div>

                  {/* Luxury Embossed Envelope Stamp Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-white/95 rounded-2xl border-2 border-rose-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-xs font-black italic tracking-wide text-rose-950 leading-tight">
                      Scratch For A Love Note 💌
                    </div>
                    <div className="my-2 border-t border-rose-200 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-rose-500 block">
                        WRITTEN FOR
                      </span>
                      <span className="text-sm font-black text-rose-950 truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-rose-700">
                      Embossed Floral Filigree & Seal
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-rose-950 pt-2 border-t border-rose-300/60">
                    <span className="flex items-center gap-1">
                      <span>🌹</span>
                      <span>Metallic Filigree</span>
                    </span>
                    <span className="bg-rose-900 text-rose-100 px-2 py-0.5 rounded-md shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 9. THE PASTEL CUPID'S DREAM */}
            {isPastelCupidsDream && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-[#BAE6FD] via-[#FBCFE8] to-[#FFF1F2]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#FFFFFF_2px,transparent_2px)] [background-size:16px_16px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-white/90 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-white/30 backdrop-blur-[1px]">
                  <div className="text-[10px] font-black tracking-[3px] text-pink-700 uppercase flex items-center gap-2 drop-shadow-xs">
                    <span>🏹 ☁️</span>
                    <span>CUPID&apos;S DREAM</span>
                    <span>☁️ 🏹</span>
                  </div>

                  {/* Center Puffed 3D Candy Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-white/95 rounded-2xl border-2 border-pink-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-sky-500 leading-snug">
                      SCRATCH FOR A CUTE SURPRISE
                    </div>
                    <div className="my-2 border-t border-pink-200 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">
                        SWEETHEART
                      </span>
                      <span className="text-sm font-black text-slate-900 truncate block">
                        {template.recipient} 💕
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-pink-600">
                      Cotton-Candy Clouds & Golden Arrows
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-pink-800 pt-2 border-t border-white/60">
                    <span className="flex items-center gap-1">
                      <span>🏹</span>
                      <span>Flying Cherub Cupids</span>
                    </span>
                    <span className="bg-pink-500 text-white px-2 py-0.5 rounded-md shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 10. THE SAVAGE ROMANCE */}
            {isSavageRomance && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-[#991B1B] via-[#EA580C] to-[#18181B]" />
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#000000_2px,transparent_2px)] [background-size:14px_14px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-red-500/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-black/40 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-yellow-300 uppercase flex items-center gap-2 drop-shadow">
                    <span>🔥 💀</span>
                    <span>SAVAGE ROMANCE</span>
                    <span>💀 🔥</span>
                  </div>

                  {/* Comic warning box */}
                  <div className="my-auto text-center px-3 py-3 bg-black/95 rounded-2xl border-2 border-red-500 shadow-xl w-full max-w-[240px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-red-400 leading-tight">
                      🔥 WARNING: NO CHEESY STUFF 🔥
                    </div>
                    <div className="my-2 border-t border-red-500/40 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400 block">
                        PARTNER IN CRIME
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="mt-1 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black tracking-widest rounded-md uppercase">
                      ⚠️ ZERO CHEESE ALERT ⚠️
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-yellow-200 pt-2 border-t border-red-500/40">
                    <span className="flex items-center gap-1">
                      <span>🔥</span>
                      <span>Fiery Comic Banter</span>
                    </span>
                    <span className="bg-red-950 text-yellow-300 px-2 py-0.5 rounded-md border border-red-500/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ================================================================= */}
            {/* ANNIVERSARY FOILS (Exact Reference Image Pic 3 Row 2) */}
            {/* ================================================================= */}
            {/* 11. THE FOREVER GOLD 24K */}
            {isForeverGold && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFFBEB] via-[#F59E0B] to-[#78350F]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Silver torn peel corner */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-400 shadow-md z-10 opacity-90 rounded-br-xl border-b border-r border-white/60" />

                <div className="relative z-10 border-2 border-amber-300/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-amber-950/25 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-amber-200 uppercase flex items-center gap-2 drop-shadow">
                    <span>👑 ✦</span>
                    <span>24K FOREVER GOLD</span>
                    <span>✦ 👑</span>
                  </div>

                  {/* Center Golden Plaque with Royal Crown */}
                  <div className="my-auto text-center px-3 py-3 bg-white/95 rounded-2xl border-2 border-amber-400 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 leading-tight">
                      👑 CELEBRATING OUR GOLDEN YEARS 👑
                    </div>
                    <div className="my-2 border-t border-amber-200 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600 block">
                        HONORING
                      </span>
                      <span className="text-sm font-black text-amber-950 truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-amber-800">
                      24K Luxury Gold Foil Flakes & Crown
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-amber-100 pt-2 border-t border-amber-300/40">
                    <span className="flex items-center gap-1">
                      <span>👑</span>
                      <span>Gold Leaf Flakes</span>
                    </span>
                    <span className="bg-amber-950/90 text-amber-200 px-2 py-0.5 rounded-md border border-amber-300/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 12. THE HOLOGRAPHIC UNIVERSE */}
            {isHoloUniverse && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#C7D2FE] via-[#DDD6FE] to-[#FBCFE8]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-purple-400/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-indigo-200/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-white/30 backdrop-blur-[1px] shadow-sm">
                  <div className="text-[10px] font-black tracking-[3px] text-indigo-900 uppercase flex items-center gap-2 drop-shadow-xs">
                    <span>🌌 ✨</span>
                    <span>HOLOGRAPHIC UNIVERSE</span>
                    <span>✨ 🌌</span>
                  </div>

                  {/* Prismatic Holo Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-white/90 rounded-2xl border-2 border-indigo-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-indigo-950 leading-tight">
                      SCRATCH FOR A FOREVER MEMORY
                    </div>
                    <div className="my-2 border-t border-purple-200 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                        COSMIC BOND WITH
                      </span>
                      <span className="text-sm font-black text-indigo-950 truncate block">
                        {template.recipient} 🌌
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-purple-700">
                      Silver Stellar Constellations Sheen
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-indigo-900 pt-2 border-t border-indigo-200/60">
                    <span className="flex items-center gap-1">
                      <span>🌌</span>
                      <span>Star Constellations</span>
                    </span>
                    <span className="bg-indigo-900 text-indigo-100 px-2 py-0.5 rounded-md shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 13. THE MIDNIGHT STARS */}
            {isMidnightStars && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#312E81]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Silver foil ripped peel corners */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-400 shadow-md z-10 opacity-90 rounded-br-xl border-b border-r border-white/60" />
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-slate-200 to-slate-400 shadow-md z-10 opacity-90 rounded-tl-xl border-t border-l border-white/60" />

                <div className="relative z-10 border-2 border-indigo-300/80 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-black/35 backdrop-blur-[1px] shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  <div className="text-[10px] font-black tracking-[3px] text-indigo-200 uppercase flex items-center gap-2 drop-shadow">
                    <span>✨ 🪐</span>
                    <span>MIDNIGHT STARS</span>
                    <span>🪐 ✨</span>
                  </div>

                  {/* Center Starburst Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-black/85 rounded-2xl border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-indigo-200 leading-tight">
                      ✨ OUR LOVE IS IN THE STARS ✨
                    </div>
                    <div className="my-2 border-t border-indigo-500/40 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300 block">
                        CONSTELLATION
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-indigo-300">
                      Deep Cosmic Sapphire Starbursts
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-indigo-100 pt-2 border-t border-indigo-400/40">
                    <span className="flex items-center gap-1">
                      <span>✨</span>
                      <span>Cosmic Starfield</span>
                    </span>
                    <span className="bg-indigo-950 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 14. THE EMERALD BOND */}
            {isEmeraldBond && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#022C22]" />
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#A7F3D0_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-amber-300/90 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-emerald-950/40 backdrop-blur-[1px] shadow-inner">
                  {/* Art-Deco Geometric Header */}
                  <div className="text-[10px] font-black tracking-[3px] text-amber-200 uppercase flex items-center gap-2 drop-shadow">
                    <span>🥂 ❖</span>
                    <span>THE EMERALD BOND</span>
                    <span>❖ 🥂</span>
                  </div>

                  {/* Center Art-Deco Gold Box */}
                  <div className="my-auto text-center px-3 py-3 bg-emerald-950/90 rounded-2xl border-2 border-amber-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-200 leading-tight">
                      🥂 SCRATCH TO TOAST OUR JOURNEY 🥂
                    </div>
                    <div className="my-2 border-t border-amber-300/40 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300 block">
                        ETERNAL TOAST TO
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-amber-300">
                      Art-Deco Geometric Filigree & Flutes
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-amber-100 pt-2 border-t border-amber-300/40">
                    <span className="flex items-center gap-1">
                      <span>🥂</span>
                      <span>Art-Deco Filigree</span>
                    </span>
                    <span className="bg-emerald-900 text-amber-200 px-2 py-0.5 rounded-md border border-amber-300/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 15. THE CINEMATIC MEMORIES */}
            {isCinematicMemories && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* 35mm filmstrip side sprocket borders */}
                <div className="absolute top-0 bottom-0 left-1 w-3 flex flex-col justify-between py-2 pointer-events-none opacity-40 z-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-2 h-3.5 bg-white/70 rounded-xs" />
                  ))}
                </div>
                <div className="absolute top-0 bottom-0 right-1 w-3 flex flex-col justify-between py-2 pointer-events-none opacity-40 z-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-2 h-3.5 bg-white/70 rounded-xs" />
                  ))}
                </div>

                {/* Silver torn peel corner */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-400 shadow-md z-10 opacity-90 rounded-br-xl border-b border-r border-white/60" />

                <div className="relative z-10 border-2 border-slate-400/80 rounded-2xl p-3 mx-2 flex flex-col items-center justify-between h-full bg-black/40 backdrop-blur-[1px] shadow-inner">
                  <div className="text-[10px] font-black tracking-[3px] text-slate-200 uppercase flex items-center gap-2 drop-shadow">
                    <span>🎬 🎞️</span>
                    <span>CINEMATIC REEL</span>
                    <span>🎞️ 🎬</span>
                  </div>

                  {/* Brushed Silver Plaque */}
                  <div className="my-auto text-center px-3 py-3 bg-slate-900/90 rounded-2xl border-2 border-slate-300 shadow-xl w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-100 leading-tight">
                      REVEAL OUR STORY SO FAR 🎬
                    </div>
                    <div className="my-2 border-t border-slate-600 pt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">
                        STARRING
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {template.recipient}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-300">
                      35mm Filmstrip & Silver Camera Luster
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-200 pt-2 border-t border-slate-500/40">
                    <span className="flex items-center gap-1">
                      <span>🎬</span>
                      <span>35mm Film Strip</span>
                    </span>
                    <span className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded-md border border-slate-400/40 shadow-xs">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* FALLBACK FOR OTHER CATEGORIES */}
            {!isChampagneGold &&
              !isHoloParty &&
              !isBalloonPop &&
              !isMintShimmer &&
              !isRoastRevelry &&
              !isGlowingHeartbeat &&
              !isSunsetSoulmate &&
              !isRoseGoldChronicles &&
              !isPastelCupidsDream &&
              !isSavageRomance &&
              !isForeverGold &&
              !isHoloUniverse &&
              !isMidnightStars &&
              !isEmeraldBond &&
              !isCinematicMemories && (
              <>
                <div className={cn("absolute inset-0 bg-gradient-to-br", foilInfo.previewGradient)} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                <div className="relative z-10 border-2 border-white/70 rounded-2xl p-3 flex flex-col items-center justify-between h-full bg-black/25 backdrop-blur-[1px]">
                  <div className="text-[10px] font-black tracking-widest text-white uppercase truncate max-w-[200px]">
                    ✦ {foilInfo.label} ✦
                  </div>

                  <div className="my-auto text-center px-3 py-3 bg-white/95 rounded-2xl shadow-md w-full max-w-[240px]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-brand-dark">
                      ✦ SCRATCH TO REVEAL ✦
                    </div>
                    <div className="my-2 border-t border-brand-warm-border pt-1.5">
                      <span className="text-sm font-black text-brand-dark truncate block">
                        To: {template.recipient}
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase text-white/95 pt-2 border-t border-white/40">
                    <span>Suprilo Scratch Finish</span>
                    <span className="bg-black/50 text-white px-2 py-0.5 rounded-md">
                      Scratch to reveal
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* VIEW B: INNER SURPRISE MESSAGE PREVIEW (Vertical Greeting Card Inside) */
          <div
            className={cn(
              "w-full h-full p-5 sm:p-6 flex flex-col justify-between relative",
              `bg-gradient-to-br ${template.bgGradient}`
            )}
          >
            <div className="flex items-start justify-between gap-2 relative z-10">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-brand-dark/80 bg-white/90 px-2.5 py-1 rounded-full border border-brand-warm-border/60 shadow-xs">
                {template.tag}
              </span>
              <span className="text-xs font-bold text-brand-dark/70 truncate max-w-[120px]">
                To: {template.recipient}
              </span>
            </div>

            <div className="my-auto space-y-2 relative z-10 text-center px-2 py-3 bg-white/80 rounded-2xl border border-brand-warm-border/50 shadow-xs">
              <p className="text-sm sm:text-base font-extrabold text-brand-dark leading-snug line-clamp-4">
                &ldquo;{template.message}&rdquo;
              </p>
              {template.secondary && (
                <p className="text-xs text-brand-muted leading-relaxed line-clamp-2 italic pt-1 border-t border-brand-warm-border/40">
                  {template.secondary}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-brand-dark/70 pt-3 border-t border-brand-warm-border/50 relative z-10">
              <span className="font-bold text-brand-pink text-xs capitalize flex items-center gap-1">
                <span>🎁</span>
                <span>Revealed Surprise</span>
              </span>
              <span className="font-mono text-xs text-brand-muted font-bold">
                From: {template.sender}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Title & Description */}
      <div className="mt-4 mb-4 space-y-1 shrink-0">
        <h3 className="text-base font-extrabold text-brand-dark group-hover:text-brand-pink transition-colors truncate">
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
        className="w-full py-3 px-4 rounded-2xl bg-brand-warm hover:bg-brand-pink text-brand-dark hover:text-white border border-brand-warm-border hover:border-brand-pink font-bold text-xs shadow-2xs hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 group-hover:bg-brand-pink group-hover:text-white group-hover:border-brand-pink"
      >
        <span>Use This Template</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
