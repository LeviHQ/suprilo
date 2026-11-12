"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Palette,
  PenTool,
  ArrowRight,
  Wand2,
  Camera,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CreationChoiceCardsProps {
  onSelectScratch: () => void;
  onExploreTemplates?: () => void;
}

export function CreationChoiceCards({
  onSelectScratch,
  onExploreTemplates,
}: CreationChoiceCardsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 space-y-8">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light border border-brand-pink/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>How Would You Like to Start?</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
          Create an Unforgettable Surprise
        </h2>
        <p className="text-xs sm:text-sm text-brand-muted">
          Pick a curated starter template or build a customized scratch card completely from scratch.
        </p>
      </div>

      {/* V-Shaped Choice Cards Layout on Desktop, Vertical Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start pt-2">
        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* CARD A: Use a Template (Subtle V-Shape Offset Left) */}
        {/* ======================================================== */}
        <div
          className="group relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-pink/25 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-6 lg:translate-y-0 lg:-rotate-1 lg:hover:rotate-0 hover:-translate-y-2 overflow-hidden"
        >
          {/* Subtle warm glow background */}
          <div
            className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gradient-to-br from-brand-pink/20 via-brand-orange/15 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500"
            aria-hidden="true"
          />

          <div className="relative space-y-4">
            {/* Header / Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-pink bg-brand-pink-light border border-brand-pink/25 shadow-2xs">
                <span className="text-sm">🎈</span>
                <span>16 Ready Designs</span>
              </span>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-pink bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                <Sparkles className="w-3 h-3 text-brand-orange" />
                <span>Ready in 30s</span>
              </div>
            </div>

            {/* Visual Showcase: Layered 3D Card Stack Preview */}
            <div className="h-44 sm:h-48 rounded-2xl p-3 bg-gradient-to-br from-rose-50/70 via-amber-50/30 to-pink-50/70 border border-brand-warm-border/80 shadow-inner relative overflow-hidden flex items-center justify-center">
              {/* Soft decorative background circles */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-pink/10 rounded-full blur-md pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-brand-orange/10 rounded-full blur-md pointer-events-none" />

              {/* Tilted Background Card (Gallery Peek) */}
              <div className="absolute w-48 sm:w-56 h-28 sm:h-32 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-brand-purple shadow-md -rotate-6 -translate-x-3 sm:-translate-x-5 -translate-y-2 opacity-90 group-hover:-rotate-12 group-hover:-translate-x-7 group-hover:-translate-y-4 transition-all duration-500 ease-out border border-white/30 p-2.5 text-white flex flex-col justify-between pointer-events-none">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-xs">Romance 💝</span>
                  <span className="text-white/80">Amethyst Foil</span>
                </div>
                <div className="text-center font-bold text-xs drop-shadow-xs">
                  “You&apos;re My Favorite Person ✨”
                </div>
                <div className="text-[9px] text-white/70 text-right">Instant Preview</div>
              </div>

              {/* Foreground Hero Scratch Card */}
              <div className="relative w-56 sm:w-64 h-32 sm:h-36 rounded-2xl bg-white shadow-xl border border-brand-pink/25 p-3 flex flex-col justify-between group-hover:scale-[1.03] group-hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                {/* Metallic Shimmer Sweep overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-10"
                  aria-hidden="true"
                />

                {/* Card Top: Scratch Foil Tag */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-brand-pink to-brand-orange px-2.5 py-0.5 rounded-full shadow-2xs">
                    <span>🎂</span> Birthday Sparkle
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ✨ Gold Foil
                  </span>
                </div>

                {/* Scratched Center Area (Peek of Surprise) */}
                <div className="my-auto py-1 text-center relative">
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-50 via-white to-orange-50 text-brand-dark px-3 py-1.5 rounded-xl border border-amber-200/80 shadow-xs font-bold text-xs">
                    <span className="text-sm">🎉</span>
                    <span className="font-extrabold tracking-tight">Happy Birthday, Maya!</span>
                    <Sparkles className="w-3.5 h-3.5 text-brand-orange shrink-0 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-brand-muted font-medium mt-1">
                    Scratch to reveal hidden message & photo
                  </p>
                </div>

                {/* Bottom card footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Interactive Scratch
                  </span>
                  <span className="text-brand-pink font-semibold">🎵 Audio Enabled</span>
                </div>
              </div>
            </div>

            {/* Occasion Tags (Pill Chips) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>🎂</span> Birthdays
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>💖</span> Romance
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>🎉</span> Party
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>🥂</span> Milestones
              </span>
            </div>

            {/* Content Details */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-pink transition-colors">
                Use a Template
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Choose from 16 curated themes with music, metallic foils, and animations ready to go. Just customize the names & send!
              </p>
            </div>
          </div>

          {/* CTA Action */}
          <div className="relative pt-2">
            {onExploreTemplates ? (
              <Button
                variant="primary"
                size="lg"
                onClick={onExploreTemplates}
                className="w-full justify-center gap-2 text-sm font-bold shadow-md shadow-brand-pink/20 hover:shadow-brand-pink/35 py-3 rounded-2xl bg-gradient-to-r from-brand-pink via-rose-500 to-brand-orange hover:opacity-95 transition-all"
              >
                <Wand2 className="w-4 h-4" />
                <span>Explore Templates</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Link href="/templates" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center gap-2 text-sm font-bold shadow-md shadow-brand-pink/20 hover:shadow-brand-pink/35 py-3 rounded-2xl bg-gradient-to-r from-brand-pink via-rose-500 to-brand-orange hover:opacity-95 transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Explore Templates</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD B: Create from Scratch (Subtle V-Shape Offset Right) */}
        {/* ======================================================== */}
        <div
          className="group relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-purple/25 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-6 lg:translate-y-6 lg:rotate-1 lg:hover:rotate-0 hover:-translate-y-2 overflow-hidden"
        >
          {/* Subtle purple glow background */}
          <div
            className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gradient-to-br from-brand-purple/20 via-indigo-500/15 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500"
            aria-hidden="true"
          />

          <div className="relative space-y-4">
            {/* Header / Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-purple bg-brand-purple-light border border-brand-purple/25 shadow-2xs">
                <span className="text-sm">🎈</span>
                <span>100% Custom Freedom</span>
              </span>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-purple bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                <Palette className="w-3 h-3 text-brand-purple" />
                <span>Full Studio</span>
              </div>
            </div>

            {/* Visual Showcase: Creative Studio Workshop Preview */}
            <div className="h-44 sm:h-48 rounded-2xl p-3 bg-gradient-to-br from-purple-50/70 via-slate-50 to-indigo-50/50 border border-brand-warm-border/80 shadow-inner relative overflow-hidden flex flex-col justify-between">
              {/* Studio Canvas Workbench */}
              <div className="flex items-center justify-between">
                {/* Swatch Picker Simulation */}
                <div className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-full border border-purple-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">Palette:</span>
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 ring-2 ring-amber-500/40 shadow-xs flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 hover:scale-110 transition-transform" />
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 hover:scale-110 transition-transform" />
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 hover:scale-110 transition-transform" />
                  <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 hover:scale-110 transition-transform" />
                </div>

                <span className="text-[10px] font-bold text-brand-purple bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                  ✨ 4 Metallic Foils
                </span>
              </div>

              {/* Center Workbench: Polaroid Photo & Custom Note in Progress */}
              <div className="flex items-center justify-center gap-3 my-auto py-1">
                {/* Mini Polaroid Photo Card */}
                <div className="w-20 sm:w-24 bg-white p-1.5 rounded-xl shadow-md border border-slate-200 -rotate-6 group-hover:-rotate-12 transition-transform duration-300 relative">
                  {/* Pin */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-2xs" />
                  <div className="h-12 sm:h-14 rounded-lg bg-gradient-to-br from-pink-100 via-purple-50 to-amber-100 flex flex-col items-center justify-center text-center p-1">
                    <Camera className="w-4 h-4 text-brand-pink mb-0.5" />
                    <span className="text-[8px] font-bold text-slate-700 leading-tight">Secret Photo</span>
                  </div>
                  <div className="text-[7px] text-slate-400 font-semibold text-center mt-1 truncate">
                    hidden memory 💖
                  </div>
                </div>

                {/* Mini Custom Scratch Foil Card */}
                <div className="flex-1 max-w-[130px] sm:max-w-[150px] bg-white p-2 rounded-xl shadow-md border border-brand-purple/25 flex flex-col justify-between rotate-2 group-hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center justify-between text-[9px] font-bold text-brand-purple mb-1">
                    <span>Drafting Note</span>
                    <PenTool className="w-2.5 h-2.5 text-brand-purple" />
                  </div>
                  <div className="h-7 rounded-md bg-purple-50/80 border border-dashed border-purple-200 p-1 flex items-center justify-center text-[9px] text-purple-900 font-medium italic">
                    “Your custom words...”
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold mt-1">
                    <span>Scratch Foil</span>
                    <span className="text-brand-purple font-extrabold">+ Audio</span>
                  </div>
                </div>

                {/* Floating Craft Tool */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-indigo-500 shadow-md text-white flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shrink-0">
                  <PenTool className="w-4 h-4" />
                </div>
              </div>

              {/* Studio Bottom Bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-brand-purple font-bold">
                  <Music className="w-3 h-3 text-brand-purple" />
                  Custom Audio Sound
                </span>
                <span className="text-slate-600 font-semibold">📸 Personal Photos</span>
              </div>
            </div>

            {/* Feature Tags (Pill Chips) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>🎨</span> 4 Foil Finishes
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>📸</span> Secret Photo
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>🎵</span> Sound Effects
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-brand-warm-subtle px-2.5 py-1 rounded-lg border border-brand-warm-border shadow-2xs">
                <span>✍️</span> Your Words
              </span>
            </div>

            {/* Content Details */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-purple transition-colors">
                Start from Scratch
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Total creative freedom. Paint with metallic foils, hide your own secret photos, and write a unique heartfelt message.
              </p>
            </div>
          </div>

          {/* CTA Action */}
          <div className="relative pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={onSelectScratch}
              className="w-full justify-center gap-2 text-sm font-bold shadow-md shadow-brand-purple/20 hover:shadow-brand-purple/35 py-3 rounded-2xl bg-gradient-to-r from-brand-purple via-indigo-600 to-brand-purple text-white hover:opacity-95 transition-all border-0"
            >
              <PenTool className="w-4 h-4" />
              <span>Start Creating</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
