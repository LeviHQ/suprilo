"use client";

import * as React from "react";
import {
  Sparkles,
  Palette,
  PenTool,
  ArrowRight,
  Wand2,
  Volume2,
  VolumeX,
  RotateCcw,
  Camera,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { soundManager } from "@/lib/sound";

interface CreationFlightStageProps {
  onSelectScratch: () => void;
  onExploreTemplates: () => void;
}

export function CreationFlightStage({
  onSelectScratch,
  onExploreTemplates,
}: CreationFlightStageProps) {
  const [animationKey, setAnimationKey] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(() => soundManager.getMuted());

  // Trigger non-blocking sound effects on animation start
  React.useEffect(() => {
    // 1. Gentle mountain wind breeze as center clouds part
    soundManager.playWindBreeze();

    // 2. Playful cartoon engine purr as airplane emerges and glides to left
    const planeTimer = setTimeout(() => {
      soundManager.playAirplaneEngine();
    }, 450);

    // 3. Sparkly magical chime as balloon options settle
    const chimeTimer = setTimeout(() => {
      soundManager.playBalloonArrival();
    }, 1400);

    return () => {
      clearTimeout(planeTimer);
      clearTimeout(chimeTimer);
    };
  }, [animationKey]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = soundManager.toggleMuted();
    setIsMuted(newMuted);
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div
      key={animationKey}
      className="relative w-full max-w-4xl mx-auto px-2 sm:px-6 py-1 sm:py-4 overflow-hidden select-none"
    >
      {/* Top Utility Controls (Mute / Unmute & Replay Flight) */}
      <div className="flex items-center justify-between px-1 mb-2 sm:mb-3 z-30 relative">
        <button
          type="button"
          onClick={handleToggleMute}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/95 hover:bg-white text-brand-dark border border-brand-warm-border shadow-xs hover:border-brand-pink/30 transition-all active:scale-95"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-brand-pink" />
          )}
          <span>{isMuted ? "Sound Off" : "Sound On"}</span>
        </button>

        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/95 hover:bg-white text-brand-muted hover:text-brand-dark border border-brand-warm-border shadow-xs hover:border-brand-purple/30 transition-all active:scale-95"
          title="Replay Flight Animation"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-purple" />
          <span>Replay Flight</span>
        </button>
      </div>

      {/* Atmospheric Soft Sky Backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-brand-pink-light/35 via-brand-warm to-brand-warm-subtle/40 rounded-3xl -z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient background drifting puffy clouds (constant subtle life) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-30">
        <div className="absolute top-4 left-6 animate-pulse" style={{ animationDuration: "7s" }}>
          <svg width="100" height="36" viewBox="0 0 120 40" fill="none">
            <path
              d="M20 30 C10 30 0 25 0 18 C0 10 10 5 22 8 C28 2 40 0 52 4 C60 0 75 2 82 8 C92 6 102 12 102 20 C112 20 120 25 120 30 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
        <div className="absolute bottom-6 right-8 animate-pulse" style={{ animationDuration: "9s" }}>
          <svg width="120" height="42" viewBox="0 0 140 48" fill="none">
            <path
              d="M25 38 C12 38 0 32 0 23 C0 14 12 8 26 11 C34 3 48 0 62 5 C72 1 90 3 98 11 C110 8 122 16 122 26 C134 26 140 32 140 38 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SCENE 1: PUFFY CLOUDS PARTING DIRECTLY FROM CENTER                     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {/* Left Cloud Cluster (Starts in Center, parts to far left) */}
        <div className="absolute top-1/4 left-1/2 anim-cloud-part-left pointer-events-none">
          <svg
            className="w-64 sm:w-88 md:w-96 h-auto drop-shadow-md"
            viewBox="0 0 360 200"
            fill="none"
          >
            <g>
              {/* Soft pink underglow */}
              <circle cx="100" cy="130" r="48" fill="#FFF0F3" />
              <circle cx="170" cy="140" r="44" fill="#FFF0F3" />
              <circle cx="240" cy="130" r="40" fill="#FFF0F3" />

              {/* Main crisp white puffy cumulus lobes */}
              <circle cx="90" cy="115" r="50" fill="#FFFFFF" />
              <circle cx="150" cy="85" r="60" fill="#FFFFFF" />
              <circle cx="220" cy="90" r="52" fill="#FFFFFF" />
              <circle cx="280" cy="120" r="42" fill="#FFFFFF" />
              <rect x="80" y="115" width="220" height="55" rx="28" fill="#FFFFFF" />
            </g>
          </svg>
        </div>

        {/* Right Cloud Cluster (Starts in Center, parts to far right) */}
        <div className="absolute top-1/4 left-1/2 anim-cloud-part-right pointer-events-none">
          <svg
            className="w-64 sm:w-88 md:w-96 h-auto drop-shadow-md"
            viewBox="0 0 360 200"
            fill="none"
          >
            <g>
              {/* Soft lavender underglow */}
              <circle cx="260" cy="130" r="48" fill="#F5F3FF" />
              <circle cx="190" cy="140" r="44" fill="#F5F3FF" />
              <circle cx="120" cy="130" r="40" fill="#F5F3FF" />

              {/* Main crisp white puffy cumulus lobes */}
              <circle cx="270" cy="115" r="50" fill="#FFFFFF" />
              <circle cx="210" cy="85" r="60" fill="#FFFFFF" />
              <circle cx="140" cy="90" r="52" fill="#FFFFFF" />
              <circle cx="80" cy="120" r="42" fill="#FFFFFF" />
              <rect x="70" y="115" width="220" height="55" rx="28" fill="#FFFFFF" />
            </g>
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SCENE 2: THE CARTOON AIRPLANE (Emerges from center, glides to left)    */}
      {/* ========================================================================= */}
      <div className="relative w-full mb-1 sm:mb-2">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-4">
          {/* Airplane & Streamer: On Desktop docked on left (order-1), on Mobile sits above threads (order-2) */}
          <div className="anim-plane-stage flex items-center gap-2 sm:gap-3 shrink-0 order-2 sm:order-1 self-start sm:self-auto pl-1 sm:pl-0">
            {/* Cute Cartoon Biplane Facing LEFT (Nose on left, Tail on right) */}
            <div className="relative w-22 sm:w-26 h-14 sm:h-16">
              <svg
                viewBox="0 0 160 100"
                fill="none"
                className="w-full h-full drop-shadow-xs"
                style={{ transform: "scaleX(-1)" }} // Flips plane so it points LEFT naturally
              >
                {/* Spinning Propeller Blur */}
                <g className="anim-propeller">
                  <ellipse cx="146" cy="50" rx="2.5" ry="24" fill="#FF4D6D" opacity="0.85" />
                  <ellipse cx="146" cy="50" rx="24" ry="2.5" fill="#FF9F1C" opacity="0.65" />
                </g>
                <circle cx="146" cy="50" r="4" fill="#17152A" />

                {/* Plane Fuselage */}
                <path
                  d="M20 50 C20 40, 42 32, 82 32 C120 32, 144 42, 144 50 C144 58, 120 68, 82 68 C42 68, 20 60, 20 50 Z"
                  fill="url(#flightPlaneGrad2)"
                  stroke="#FF4D6D"
                  strokeWidth="2.5"
                />

                {/* Sky Glass Cockpit */}
                <path
                  d="M94 34 C104 34, 114 38, 117 44 L90 44 C92 37, 93 34, 94 34 Z"
                  fill="#E0F2FE"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />

                {/* Lower Wing */}
                <path
                  d="M60 48 L104 48 L90 74 L55 74 Z"
                  fill="#FF9F1C"
                  stroke="#E07A00"
                  strokeWidth="2"
                />

                {/* Upper Wing */}
                <path
                  d="M65 32 L100 32 L112 18 L77 18 Z"
                  fill="#FF4D6D"
                  stroke="#D63353"
                  strokeWidth="2"
                />

                {/* Wing Struts */}
                <line x1="84" y1="18" x2="74" y2="48" stroke="#17152A" strokeWidth="2" />
                <line x1="102" y1="18" x2="92" y2="48" stroke="#17152A" strokeWidth="2" />

                {/* Tail Fin */}
                <path
                  d="M20 50 L32 20 L46 20 L32 50 Z"
                  fill="#8B5CF6"
                  stroke="#6D28D9"
                  strokeWidth="2"
                />

                {/* Heart Decal */}
                <circle cx="65" cy="50" r="7" fill="#FFFFFF" />
                <path
                  d="M65 52 C65 52 61 49 61 47 C61 45.5 62.5 44.5 64 45.5 L65 46.5 L66 45.5 C67.5 44.5 69 45.5 69 47 C69 49 65 52 65 52 Z"
                  fill="#FF4D6D"
                />

                {/* Landing Wheel */}
                <circle cx="76" cy="78" r="5" fill="#17152A" stroke="#FF9F1C" strokeWidth="2" />
                <line x1="76" y1="68" x2="76" y2="74" stroke="#17152A" strokeWidth="2.5" />

                <defs>
                  <linearGradient id="flightPlaneGrad2" x1="20" y1="50" x2="144" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#FFF5F7" />
                    <stop offset="100%" stopColor="#FFE4E8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Trailing Delivery Streamer */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-brand-warm-border text-brand-dark shadow-xs text-xs font-bold whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-brand-orange" />
              <span>Surprise Delivery</span>
              <span className="text-xs">✈️</span>
            </div>
          </div>

          {/* Heading Description: On Desktop on right (order-2), on Mobile at top (order-1) */}
          <div className="text-center sm:text-right space-y-0.5 order-1 sm:order-2 w-full sm:w-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light border border-brand-pink/20">
              <Sparkles className="w-3 h-3 text-brand-pink" />
              <span>Select Your Journey</span>
            </span>
            <h2 className="text-base sm:text-2xl font-extrabold text-brand-dark tracking-tight">
              How Would You Like to Start?
            </h2>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. VISIBLE CONNECTING THREADS (Flows from plane tail to balloon cards)     */}
        {/* ========================================================================= */}
        {/* Desktop threads (side by side) */}
        <div className="hidden sm:block w-full h-9 relative pointer-events-none anim-threads-reveal -my-1 z-10">
          <svg className="w-full h-full" viewBox="0 0 800 36" fill="none" preserveAspectRatio="none">
            {/* Thread to Template Card (Pink Ribbons) */}
            <path
              d="M 110 2 C 160 32, 210 34, 250 36"
              stroke="#FF4D6D"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              opacity="0.85"
            />
            {/* Thread to Scratch Card (Purple Ribbons) */}
            <path
              d="M 110 2 C 300 32, 480 34, 620 36"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Mobile threads: Red thread to Card 1, Blue thread towards Card 2 behind Card 1 */}
        <div className="sm:hidden w-full h-8 relative pointer-events-none anim-threads-reveal -my-1 z-10">
          <svg className="w-full h-full" viewBox="0 0 380 32" fill="none" preserveAspectRatio="none">
            {/* Red/Pink Thread directly into Card 1's badge */}
            <path
              d="M 75 2 C 75 14, 80 22, 85 32"
              stroke="#FF4D6D"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              opacity="0.85"
            />
            {/* Blue/Purple Thread flows from plane tail towards Card 2 (slipping behind Card 1) */}
            <path
              d="M 75 2 C 110 14, 150 22, 190 32"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SCENE 3: TWO BALLOON CARDS (Floating in on threads, 100% Mobile Ready) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 anim-balloons-entrance">
        {/* ======================================================== */}
        {/* BALLOON 1: Use a Template (Curated Designs)              */}
        {/* ======================================================== */}
        <div className="anim-bob-card-1 group relative bg-white rounded-3xl p-4 sm:p-6 border-2 border-brand-pink/25 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
          {/* Warm background glow */}
          <div
            className="absolute top-0 right-0 -mr-6 -mt-6 w-40 h-40 bg-gradient-to-br from-brand-pink/20 via-brand-orange/15 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-500"
            aria-hidden="true"
          />

          <div className="relative space-y-3.5">
            {/* Header: Balloon Icon & Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-pink bg-brand-pink-light border border-brand-pink/25 shadow-2xs">
                <span className="text-sm">🎈</span>
                <span>16 Ready Designs</span>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-pink bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                <Sparkles className="w-3 h-3 text-brand-orange" />
                <span>Ready in 30s</span>
              </div>
            </div>

            {/* Visual Showcase: Layered 3D Card Stack Preview */}
            <div className="h-44 sm:h-48 rounded-2xl p-3 bg-gradient-to-br from-rose-50/70 via-amber-50/30 to-pink-50/70 border border-brand-warm-border/80 shadow-inner relative overflow-hidden flex items-center justify-center">
              {/* Soft decorative background glow circles */}
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

            {/* Text Description */}
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-brand-dark tracking-tight group-hover:text-brand-pink transition-colors">
                Use a Template
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Choose from 16 curated themes with music, metallic foils, and animations ready to go. Just customize the names & send!
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
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
          </div>
        </div>

        {/* ======================================================== */}
        {/* BALLOON 2: Start from Scratch (Creative Studio)          */}
        {/* ======================================================== */}
        <div className="anim-bob-card-2 group relative bg-white rounded-3xl p-4 sm:p-6 border-2 border-brand-purple/25 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
          {/* Mobile: Purple ribbon emerging from behind Card 1 directly into Card 2's balloon badge */}
          <div className="sm:hidden absolute -top-7 left-0 right-0 h-7 pointer-events-none z-10 anim-threads-reveal">
            <svg className="w-full h-full" viewBox="0 0 380 28" fill="none" preserveAspectRatio="none">
              <path
                d="M 190 0 C 170 14, 120 22, 85 28"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Purple background glow */}
          <div
            className="absolute top-0 right-0 -mr-6 -mt-6 w-40 h-40 bg-gradient-to-br from-brand-purple/20 via-indigo-500/15 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-500"
            aria-hidden="true"
          />

          <div className="relative space-y-3.5">
            {/* Header: Balloon Icon & Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-purple bg-brand-purple-light border border-brand-purple/25 shadow-2xs">
                <span className="text-sm">🎈</span>
                <span>100% Custom Freedom</span>
              </div>

              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-purple bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                <Palette className="w-3 h-3 text-brand-purple" />
                <span>Full Studio</span>
              </div>
            </div>

            {/* Visual Showcase: Creative Studio Workshop Preview */}
            <div className="h-44 sm:h-48 rounded-2xl p-3 bg-gradient-to-br from-purple-50/70 via-slate-50 to-indigo-50/50 border border-brand-warm-border/80 shadow-inner relative overflow-hidden flex flex-col justify-between">
              {/* Studio Canvas Workbench */}
              <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
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

            {/* Text Description */}
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-brand-dark tracking-tight group-hover:text-brand-purple transition-colors">
                Start from Scratch
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Total creative freedom. Paint with metallic foils, hide your own secret photos, and write a unique heartfelt message.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
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
