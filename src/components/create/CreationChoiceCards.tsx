"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Palette,
  PenTool,
  ArrowRight,
  Layers,
  Wand2,
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
        {/* CARD A: Use a Template (Subtle V-Shape Offset Left) */}
        {/* ======================================================== */}
        <div
          className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-6 lg:translate-y-0 lg:-rotate-1 lg:hover:rotate-0 hover:-translate-y-2"
        >
          {/* Subtle warm glow background */}
          <div
            className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"
            aria-hidden="true"
          />

          <div className="relative space-y-5">
            {/* Header / Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-brand-pink bg-brand-pink-light border border-brand-pink/20">
                <Wand2 className="w-3.5 h-3.5" />
                <span>16 Ready Designs</span>
              </span>

              <div className="flex items-center gap-1 text-xs text-brand-muted">
                <Heart className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              </div>
            </div>

            {/* Mini Visual Preview: Tasteful Scratch Card Mockup */}
            <div className="h-36 sm:h-40 rounded-2xl bg-gradient-to-br from-[#FED7AA] via-[#FF4D6D] to-[#C084FC] p-3 text-white flex flex-col justify-between shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
              {/* Foil Shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"
                aria-hidden="true"
              />

              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Birthday / Love / Celebration
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Foil Finished
                </span>
              </div>

              {/* Scratched Center Peak Simulation */}
              <div className="my-auto text-center space-y-1">
                <div className="inline-flex items-center gap-1 bg-white/95 text-brand-dark px-3 py-1.5 rounded-xl shadow-sm font-bold text-xs">
                  <span>✨ Happy 25th, Maya! ✨</span>
                </div>
                <p className="text-[10px] text-white/90 font-medium">
                  Scratch with finger or mouse to reveal
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/80">
                <span>16 Pre-made Themes</span>
                <span>Instant Preload</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-pink transition-colors">
                Use a Template
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Start with a beautiful design. Choose from curated themes for birthdays, anniversaries, love notes, and milestones.
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
                className="w-full justify-center gap-2 text-sm font-bold shadow-md hover:shadow-brand-pink/25"
              >
                <span>Explore Templates</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Link href="/templates" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center gap-2 text-sm font-bold shadow-md hover:shadow-brand-pink/25"
                >
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
          className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-6 lg:translate-y-6 lg:rotate-1 lg:hover:rotate-0 hover:-translate-y-2"
        >
          {/* Subtle purple glow background */}
          <div
            className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gradient-to-br from-brand-purple/15 via-brand-yellow/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform"
            aria-hidden="true"
          />

          <div className="relative space-y-5">
            {/* Header / Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-brand-purple bg-brand-purple-light border border-brand-purple/20">
                <PenTool className="w-3.5 h-3.5" />
                <span>100% Custom Freedom</span>
              </span>

              <div className="flex items-center gap-1 text-xs text-brand-muted">
                <Palette className="w-3.5 h-3.5 text-brand-purple" />
                <Layers className="w-3.5 h-3.5 text-brand-pink" />
              </div>
            </div>

            {/* Mini Visual Preview: Minimal Blank Card Illustration */}
            <div className="h-36 sm:h-40 rounded-2xl bg-brand-warm-subtle/80 border-2 border-dashed border-brand-warm-border p-3 text-brand-dark flex flex-col justify-between relative group-hover:border-brand-purple/40 transition-colors">
              <div className="flex items-center justify-between text-[10px] font-semibold text-brand-muted">
                <span>Your Blank Canvas</span>
                <span className="text-brand-purple font-bold">Full Palette Control</span>
              </div>

              {/* Minimalist central pencil & card graphic */}
              <div className="my-auto text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-white shadow-sm border border-brand-warm-border flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                  <PenTool className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-brand-muted font-medium">
                  Type your own wording & select foil color
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-brand-muted">
                <span>Custom Foil Finish</span>
                <span>Photo Upload</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-purple transition-colors">
                Create from Scratch
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Make it personal, from the very beginning. Write a custom message, attach a personal photo, and choose your favorite foil finish.
              </p>
            </div>
          </div>

          {/* CTA Action */}
          <div className="relative pt-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={onSelectScratch}
              className="w-full justify-center gap-2 text-sm font-bold hover:bg-brand-purple-light hover:text-brand-purple hover:border-brand-purple/30 transition-colors"
            >
              <span>Start Creating</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
