"use client";

import * as React from "react";
import {
  Sparkles,
  Heart,
  Palette,
  PenTool,
  ArrowRight,
  Layers,
  Wand2,
  Volume2,
  VolumeX,
  RotateCcw,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6 anim-balloons-entrance">
        {/* ======================================================== */}
        {/* BALLOON 1: Use a Template (Warm Rose & Peach Theme)      */}
        {/* ======================================================== */}
        <div className="anim-bob-card-1 group relative bg-white rounded-3xl p-3.5 sm:p-6 border-2 border-brand-pink/25 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-3 hover:-translate-y-1">
          {/* Warm background glow */}
          <div
            className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-transparent rounded-full blur-lg pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative space-y-2.5 sm:space-y-3">
            {/* Header: Balloon Icon & Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-brand-pink bg-brand-pink-light border border-brand-pink/20">
                <span className="text-sm">🎈</span>
                <span>16 Ready Designs</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-brand-muted">
                <Heart className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              </div>
            </div>

            {/* Compact Visual Preview Mockup */}
            <div className="h-20 sm:h-28 rounded-2xl bg-gradient-to-br from-[#FED7AA] via-[#FF4D6D] to-[#C084FC] p-2.5 sm:p-3 text-white flex flex-col justify-between shadow-xs relative overflow-hidden group-hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Birthday • Love • Party
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  Foil Finish
                </span>
              </div>

              <div className="my-auto text-center space-y-0.5">
                <div className="inline-flex items-center gap-1 bg-white/95 text-brand-dark px-2.5 py-1 rounded-xl shadow-xs font-bold text-xs">
                  <span>✨ Happy Birthday, Maya! ✨</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/80">
                <span>Ready templates</span>
                <span>Instant preview</span>
              </div>
            </div>

            {/* Text Description */}
            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="text-base sm:text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-pink transition-colors">
                Use a Template
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Pick a ready-made interactive design for birthdays, anniversaries, love notes, and milestones.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={onExploreTemplates}
              className="w-full justify-center gap-2 text-sm font-bold shadow-md hover:shadow-brand-pink/25 py-2.5"
            >
              <Wand2 className="w-4 h-4" />
              <span>Explore Templates</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BALLOON 2: Start from Scratch (Purple & Yellow Theme)     */}
        {/* ======================================================== */}
        <div className="anim-bob-card-2 group relative bg-white rounded-3xl p-3.5 sm:p-6 border-2 border-brand-purple/25 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-3 hover:-translate-y-1">
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
            className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-gradient-to-br from-brand-purple/15 via-brand-yellow/10 to-transparent rounded-full blur-lg pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative space-y-2.5 sm:space-y-3">
            {/* Header: Balloon Icon & Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-brand-purple bg-brand-purple-light border border-brand-purple/20">
                <span className="text-sm">🎈</span>
                <span>100% Custom Freedom</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-brand-muted">
                <Palette className="w-3.5 h-3.5 text-brand-purple" />
                <Layers className="w-3.5 h-3.5 text-brand-pink" />
              </div>
            </div>

            {/* Compact Blank Canvas Mockup */}
            <div className="h-20 sm:h-28 rounded-2xl bg-brand-warm-subtle/80 border-2 border-dashed border-brand-warm-border p-2.5 sm:p-3 text-brand-dark flex flex-col justify-between relative group-hover:border-brand-purple/40 transition-colors">
              <div className="flex items-center justify-between text-[10px] font-semibold text-brand-muted">
                <span>Blank Canvas Studio</span>
                <span className="text-brand-purple font-bold">Custom Palette</span>
              </div>

              <div className="my-auto text-center space-y-0.5">
                <div className="w-6 h-6 mx-auto rounded-lg bg-white shadow-xs border border-brand-warm-border flex items-center justify-center text-brand-purple">
                  <PenTool className="w-3 h-3" />
                </div>
                <p className="text-[10px] text-brand-muted font-medium">
                  Custom message, photo & foil colors
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-brand-muted">
                <span>Custom foil finish</span>
                <span>Photo upload</span>
              </div>
            </div>

            {/* Text Description */}
            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="text-base sm:text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-purple transition-colors">
                Start from Scratch
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Build your card from scratch with custom messages, secret photos, and personalized foil coatings.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <Button
              variant="secondary"
              size="lg"
              onClick={onSelectScratch}
              className="w-full justify-center gap-2 text-sm font-bold hover:bg-brand-purple-light hover:text-brand-purple hover:border-brand-purple/30 transition-colors py-2.5"
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
