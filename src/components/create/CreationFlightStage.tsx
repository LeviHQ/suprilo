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

type AnimationPhase = "clouds" | "plane-flying" | "balloons-arriving" | "settled";

export function CreationFlightStage({
  onSelectScratch,
  onExploreTemplates,
}: CreationFlightStageProps) {
  const [phase, setPhase] = React.useState<AnimationPhase>("clouds");
  const [isMuted, setIsMuted] = React.useState(() => soundManager.getMuted());
  const hasTriggeredAudio = React.useRef(false);

  // Play audio safely once animation mounts
  React.useEffect(() => {
    if (hasTriggeredAudio.current) return;
    hasTriggeredAudio.current = true;

    // Phase 1: Wind breeze as clouds part (0ms)
    soundManager.playWindBreeze();

    // Phase 2: Airplane engine as it flies through clouds (700ms)
    const planeTimer = setTimeout(() => {
      soundManager.playAirplaneEngine();
      setPhase("plane-flying");
    }, 700);

    // Phase 3: Balloon arrival chime as options float into view (2200ms)
    const balloonTimer = setTimeout(() => {
      soundManager.playBalloonArrival();
      setPhase("balloons-arriving");
    }, 2200);

    // Phase 4: Settle down to peaceful hovering stage (3600ms)
    const settleTimer = setTimeout(() => {
      setPhase("settled");
    }, 3600);

    return () => {
      clearTimeout(planeTimer);
      clearTimeout(balloonTimer);
      clearTimeout(settleTimer);
    };
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = soundManager.toggleMuted();
    setIsMuted(newMuted);
  };

  const handleSkipAnimation = () => {
    setPhase("settled");
  };

  const handleReplay = () => {
    setPhase("clouds");
    soundManager.playWindBreeze();
    setTimeout(() => {
      soundManager.playAirplaneEngine();
      setPhase("plane-flying");
    }, 700);
    setTimeout(() => {
      soundManager.playBalloonArrival();
      setPhase("balloons-arriving");
    }, 2200);
    setTimeout(() => {
      setPhase("settled");
    }, 3600);
  };

  const isCloudsParted = phase !== "clouds";
  const isOptionsVisible = phase === "balloons-arriving" || phase === "settled";

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-6 overflow-hidden select-none">
      {/* Top Controls Bar (Mute Toggle & Skip/Replay) */}
      <div className="flex items-center justify-between px-2 mb-4">
        <button
          type="button"
          onClick={handleToggleMute}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 hover:bg-white text-brand-muted hover:text-brand-dark border border-brand-warm-border shadow-xs transition-colors"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-brand-pink" />}
          <span>{isMuted ? "Sound Off" : "Sound On"}</span>
        </button>

        {phase !== "settled" ? (
          <button
            type="button"
            onClick={handleSkipAnimation}
            className="text-xs font-semibold text-brand-muted hover:text-brand-pink transition-colors bg-white/80 px-3 py-1 rounded-full border border-brand-warm-border"
          >
            Skip Animation →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors bg-white/80 px-3 py-1 rounded-full border border-brand-warm-border"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay Flying Intro</span>
          </button>
        )}
      </div>

      {/* Atmospheric Soft Sky Glow */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-brand-pink-light/30 via-brand-warm to-brand-warm-subtle/40 rounded-3xl -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* 1. CLOUD GATEWAY: Center clouds that part horizontally in slow motion     */}
      {/* ========================================================================= */}
      <div className="relative pointer-events-none">
        {/* Left Parting Cloud */}
        <div
          className={`absolute z-30 transition-all duration-1000 ease-out pointer-events-none ${
            isCloudsParted
              ? "-translate-x-full opacity-0 scale-95"
              : "left-1/2 -translate-x-[90%] top-6 opacity-95 scale-100"
          }`}
          style={{ transitionDuration: "1400ms" }}
        >
          <svg className="w-56 sm:w-80 h-36 text-white drop-shadow-xl" viewBox="0 0 240 120" fill="currentColor">
            <path d="M40,90 Q20,90 20,70 Q20,50 40,50 Q45,30 65,30 Q80,10 110,10 Q140,10 155,30 Q180,25 195,45 Q215,50 215,70 Q215,90 195,90 Z" />
          </svg>
        </div>

        {/* Right Parting Cloud */}
        <div
          className={`absolute z-30 transition-all duration-1000 ease-out pointer-events-none ${
            isCloudsParted
              ? "translate-x-full opacity-0 scale-95"
              : "left-1/2 -translate-x-[10%] top-10 opacity-95 scale-100"
          }`}
          style={{ transitionDuration: "1400ms" }}
        >
          <svg className="w-60 sm:w-88 h-40 text-white/95 drop-shadow-xl" viewBox="0 0 240 120" fill="currentColor">
            <path d="M40,90 Q20,90 20,70 Q20,50 40,50 Q50,25 75,25 Q90,5 125,5 Q155,5 170,25 Q195,20 210,40 Q230,45 230,70 Q230,90 200,90 Z" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE AIRPLANE: Flies from center clouds, stops & hovers on the left     */}
      {/* ========================================================================= */}
      <div className="relative w-full h-28 sm:h-36 mb-2 flex items-center">
        <div
          className={`absolute z-20 transition-all ease-out ${
            phase === "clouds"
              ? "left-1/2 -translate-x-1/2 scale-50 opacity-0"
              : phase === "plane-flying"
              ? "left-[10%] sm:left-[5%] scale-105 opacity-100"
              : "left-2 sm:left-6 scale-100 opacity-100"
          }`}
          style={{
            transitionDuration: phase === "plane-flying" ? "1800ms" : "1200ms",
            transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {/* Airplane Body with Hovering Animation */}
          <div className="relative flex items-center animation-hover-bob">
            {/* Cartoon Propeller Airplane SVG */}
            <div className="relative w-28 sm:w-36 h-20 sm:h-24 filter drop-shadow-lg">
              <svg viewBox="0 0 160 100" fill="none" className="w-full h-full">
                {/* Propeller Spinner */}
                <ellipse cx="148" cy="50" rx="3" ry="24" fill="#FF4D6D" className="animate-spin origin-[148px_50px]" style={{ animationDuration: "0.2s" }} />
                <circle cx="148" cy="50" r="5" fill="#17152A" />

                {/* Main Airplane Fuselage */}
                <path
                  d="M20 50 C20 40, 40 32, 80 32 C120 32, 145 42, 145 50 C145 58, 120 68, 80 68 C40 68, 20 60, 20 50 Z"
                  fill="url(#planeBodyGrad)"
                  stroke="#FF4D6D"
                  strokeWidth="2.5"
                />

                {/* Cockpit Window */}
                <path
                  d="M95 34 C105 34, 115 38, 118 44 L90 44 C92 37, 94 34, 95 34 Z"
                  fill="#E0F2FE"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />

                {/* Main Wing (Angled down) */}
                <path
                  d="M60 48 L105 48 L90 74 L55 74 Z"
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
                {/* Strut connecting wings */}
                <line x1="85" y1="18" x2="75" y2="48" stroke="#17152A" strokeWidth="2" />
                <line x1="102" y1="18" x2="92" y2="48" stroke="#17152A" strokeWidth="2" />

                {/* Tail Fin */}
                <path
                  d="M20 50 L32 20 L46 20 L32 50 Z"
                  fill="#8B5CF6"
                  stroke="#6D28D9"
                  strokeWidth="2"
                />

                {/* Decorative Heart Logo on Fuselage */}
                <circle cx="65" cy="50" r="8" fill="#FFFDFB" />
                <path
                  d="M65 52 C65 52 61 49 61 47 C61 45.5 62.5 44.5 64 45.5 L65 46.5 L66 45.5 C67.5 44.5 69 45.5 69 47 C69 49 65 52 65 52 Z"
                  fill="#FF4D6D"
                />

                {/* Wheels */}
                <rect x="75" y="68" width="3" height="10" fill="#17152A" />
                <circle cx="76.5" cy="80" r="5" fill="#17152A" stroke="#FF9F1C" strokeWidth="2" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="planeBodyGrad" x1="20" y1="50" x2="145" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#FFF5F7" />
                    <stop offset="100%" stopColor="#FFE4E8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Little Cloud Puffs trailing the plane */}
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-75">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" style={{ animationDuration: "1.2s" }} />
              <span className="w-3.5 h-3.5 rounded-full bg-white/80 shadow-xs" />
              <span className="w-2 h-2 rounded-full bg-white/60" />
            </div>

            {/* Floating Banner Message attached to plane */}
            <div className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 border border-brand-warm-border text-brand-dark shadow-sm text-xs font-bold -ml-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange animate-spin" style={{ animationDuration: "4s" }} />
              <span>Surprise Delivery Flight</span>
            </div>
          </div>
        </div>

        {/* Floating Heading in Sky when options are shown */}
        <div
          className={`mx-auto text-center space-y-1 transition-all duration-700 max-w-md ${
            isOptionsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light border border-brand-pink/20">
            <Sparkles className="w-3 h-3 text-brand-pink" />
            <span>Select Your Creation Journey</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
            How Would You Like to Start?
          </h2>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONNECTING THREADS / RIBBONS: From plane to both balloons              */}
      {/* ========================================================================= */}
      {isOptionsVisible && (
        <div className="hidden lg:block relative w-full h-10 pointer-events-none -mt-4 mb-2 z-10">
          <svg className="w-full h-full" viewBox="0 0 1000 40" fill="none">
            {/* Thread 1: Plane to Left Balloon */}
            <path
              d="M 120 0 Q 180 35, 270 40"
              stroke="#FF4D6D"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              className="opacity-80"
            />
            {/* Thread 2: Plane to Right Balloon */}
            <path
              d="M 120 0 Q 450 35, 750 40"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              className="opacity-80"
            />
          </svg>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. THE TWO BALLOON CHOICE CARDS: Arrive in slow motion from the threads   */}
      {/* ========================================================================= */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start pt-2 transition-all duration-1000 ${
          isOptionsVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-12 scale-95 pointer-events-none"
        }`}
        style={{
          transitionDuration: "1200ms",
          transitionTimingFunction: "cubic-bezier(0.34, 1.3, 0.64, 1)",
        }}
      >
        {/* ======================================================================= */}
        {/* BALLOON OPTION 1: Use a Template (Warm Rose & Peach Theme)              */}
        {/* ======================================================================= */}
        <div className="relative group flex flex-col items-center">
          {/* Hot-Air Balloon Canopy Header */}
          <div className="relative w-28 h-20 -mb-3 z-10 filter drop-shadow-md group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 120 90" fill="none" className="w-full h-full">
              {/* Balloon striped envelope */}
              <path
                d="M15 45 C15 15, 35 0, 60 0 C85 0, 105 15, 105 45 C105 65, 75 80, 75 85 L45 85 C45 80, 15 65, 15 45 Z"
                fill="url(#balloon1Grad)"
                stroke="#FF4D6D"
                strokeWidth="2"
              />
              {/* Vertical Balloon Stripes */}
              <path d="M42 2 C32 15, 30 50, 46 85" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.7" />
              <path d="M78 2 C88 15, 90 50, 74 85" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.7" />
              {/* Rigging ropes to card */}
              <line x1="45" y1="85" x2="35" y2="92" stroke="#FF4D6D" strokeWidth="2" />
              <line x1="75" y1="85" x2="85" y2="92" stroke="#FF4D6D" strokeWidth="2" />
              <defs>
                <linearGradient id="balloon1Grad" x1="15" y1="0" x2="105" y2="85" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFAA80" />
                  <stop offset="50%" stopColor="#FF4D6D" />
                  <stop offset="100%" stopColor="#FF758F" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-x-0 top-6 text-center text-[10px] font-black text-white tracking-widest drop-shadow-sm">
              READY
            </span>
          </div>

          {/* Balloon Basket Card */}
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-pink/20 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-5 hover:-translate-y-1.5 relative overflow-hidden">
            {/* Warm glow background */}
            <div
              className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 bg-gradient-to-br from-brand-pink/15 via-brand-orange/10 to-transparent rounded-full blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative space-y-4">
              {/* Header Badge */}
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

              {/* Mini Card Preview */}
              <div className="h-32 sm:h-36 rounded-2xl bg-gradient-to-br from-[#FED7AA] via-[#FF4D6D] to-[#C084FC] p-3 text-white flex flex-col justify-between shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Birthday • Love • Celebration
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Foil Finish
                  </span>
                </div>

                <div className="my-auto text-center space-y-1">
                  <div className="inline-flex items-center gap-1 bg-white/95 text-brand-dark px-3 py-1 rounded-xl shadow-sm font-bold text-xs">
                    <span>✨ Happy 25th, Maya! ✨</span>
                  </div>
                  <p className="text-[10px] text-white/90 font-medium">
                    Scratch with finger or mouse to reveal
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/80">
                  <span>Pre-made themes</span>
                  <span>Instant preview</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-pink transition-colors">
                  Use a Template
                </h3>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Start with a beautiful design. Choose from curated themes for birthdays, anniversaries, love notes, and milestones.
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onExploreTemplates}
                className="w-full justify-center gap-2 text-sm font-bold shadow-md hover:shadow-brand-pink/25"
              >
                <span>Explore Templates</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* BALLOON OPTION 2: Create from Scratch (Purple & Yellow Theme)           */}
        {/* ======================================================================= */}
        <div className="relative group flex flex-col items-center">
          {/* Hot-Air Balloon Canopy Header */}
          <div className="relative w-28 h-20 -mb-3 z-10 filter drop-shadow-md group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 120 90" fill="none" className="w-full h-full">
              {/* Balloon striped envelope */}
              <path
                d="M15 45 C15 15, 35 0, 60 0 C85 0, 105 15, 105 45 C105 65, 75 80, 75 85 L45 85 C45 80, 15 65, 15 45 Z"
                fill="url(#balloon2Grad)"
                stroke="#8B5CF6"
                strokeWidth="2"
              />
              {/* Vertical Balloon Stripes */}
              <path d="M42 2 C32 15, 30 50, 46 85" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.7" />
              <path d="M78 2 C88 15, 90 50, 74 85" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.7" />
              {/* Rigging ropes to card */}
              <line x1="45" y1="85" x2="35" y2="92" stroke="#8B5CF6" strokeWidth="2" />
              <line x1="75" y1="85" x2="85" y2="92" stroke="#8B5CF6" strokeWidth="2" />
              <defs>
                <linearGradient id="balloon2Grad" x1="15" y1="0" x2="105" y2="85" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-x-0 top-6 text-center text-[10px] font-black text-white tracking-widest drop-shadow-sm">
              CUSTOM
            </span>
          </div>

          {/* Balloon Basket Card */}
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-purple/20 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-5 hover:-translate-y-1.5 relative overflow-hidden">
            {/* Purple glow background */}
            <div
              className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 bg-gradient-to-br from-brand-purple/15 via-brand-yellow/10 to-transparent rounded-full blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative space-y-4">
              {/* Header Badge */}
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

              {/* Mini Card Preview */}
              <div className="h-32 sm:h-36 rounded-2xl bg-brand-warm-subtle/80 border-2 border-dashed border-brand-warm-border p-3 text-brand-dark flex flex-col justify-between relative group-hover:border-brand-purple/40 transition-colors">
                <div className="flex items-center justify-between text-[10px] font-semibold text-brand-muted">
                  <span>Your Blank Canvas</span>
                  <span className="text-brand-purple font-bold">Full Palette Control</span>
                </div>

                <div className="my-auto text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-white shadow-sm border border-brand-warm-border flex items-center justify-center text-brand-purple">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] text-brand-muted font-medium">
                    Type your custom secret message & select colors
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-brand-muted">
                  <span>Custom Foil Finish</span>
                  <span>Photo Upload</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-brand-dark tracking-tight group-hover:text-brand-purple transition-colors">
                  Start from Scratch
                </h3>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Make it personal, from the very beginning. Write a custom message, attach a personal photo, and choose your favorite foil finish.
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
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

      {/* Scoped CSS Animations for Hovering & Bobbing */}
      <style jsx>{`
        @keyframes hoverBob {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-1.5deg);
          }
        }
        .animation-hover-bob {
          animation: hoverBob 3.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
