"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, RotateCcw, Heart } from "lucide-react";
import { soundManager } from "@/lib/sound";
import { CelebrationConfetti } from "@/components/scratch/CelebrationConfetti";
import { useAuth } from "@/context/AuthContext";

export function HowItWorks() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [scratchPercent, setScratchPercent] = React.useState(25); // Initial state matches reference's partially scratched view
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [demoKey, setDemoKey] = React.useState(0);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const cardContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isDrawingRef = React.useRef(false);
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const dprRef = React.useRef(1);

  // Initialize and paint the metallic foil scratch canvas
  const initCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const container = cardContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // 1. Draw metallic foil gradient (silver-lavender sheen matching reference)
    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#E2E8F0");
    grad.addColorStop(0.25, "#DDD6FE"); // Soft lavender-silver sheen
    grad.addColorStop(0.5, "#F1F5F9");
    grad.addColorStop(0.75, "#C4B5FD");
    grad.addColorStop(1, "#CBD5E1");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Add subtle metallic sparkle flecks for realistic foil texture
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    const fleckCount = Math.floor((width * height) / 350);
    for (let i = 0; i < fleckCount; i++) {
      const fx = Math.random() * width;
      const fy = Math.random() * height;
      const r = Math.random() * 1.6 + 0.4;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Pre-carve initial organic heart scratch hole (matching reference illustration state)
    // Center heart area: center is revealed, edges have rough brush stroke texture
    ctx.globalCompositeOperation = "destination-out";
    const centerX = width * 0.53;
    const centerY = height * 0.51;
    const heartRadius = Math.min(width, height) * 0.32;

    // Organic jagged scratch cutout simulating rough silver brush strokes
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, heartRadius * 1.15, heartRadius * 0.9, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Additional rough organic strokes around the edge of the opening
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const jitter = Math.sin(angle * 7) * 12 + Math.cos(angle * 13) * 8;
      const sx = centerX + Math.cos(angle) * (heartRadius * 1.05 + jitter);
      const sy = centerY + Math.sin(angle) * (heartRadius * 0.85 + jitter);
      ctx.beginPath();
      ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    setIsRevealed(false);
    setScratchPercent(30);
  }, []);

  React.useEffect(() => {
    initCanvas();
    const handleResize = () => {
      initCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas, demoKey]);

  // Scratch progress calculation
  const checkProgress = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    try {
      const step = 24; // Sample every 24th pixel for 60FPS performance
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let transparent = 0;
      let total = 0;

      for (let i = 3; i < data.length; i += step * 4) {
        total++;
        if (data[i] < 45) {
          transparent++;
        }
      }

      const percent = Math.round((transparent / total) * 100);
      setScratchPercent(percent);

      if (percent >= 60 && !isRevealed) {
        setIsRevealed(true);
        setShowConfetti(true);
        soundManager.playRevealChime();

        // Clear entire canvas on full reveal
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } catch {}
  }, [isRevealed]);

  // Pointer event handlers for real scratching
  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.x;
    const y = clientY - rect.y;
    const dpr = dprRef.current;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 42;

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    lastPointRef.current = { x, y };

    soundManager.pulseScratch();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDrawingRef.current = true;
    lastPointRef.current = null;
    setHasInteracted(true);
    soundManager.startScratch();
    scratchAt(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    scratchAt(e.clientX, e.clientY);
    checkProgress();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    soundManager.stopScratch();
    checkProgress();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfetti(false);
    setHasInteracted(false);
    setDemoKey((k) => k + 1);
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("/create");
    } else {
      router.push("/create");
    }
  };

  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 bg-[#FFFDFB] relative overflow-hidden overflow-x-clip w-full max-w-full select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. SECTION HEADER (Exact reference layout & typography)                   */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20">
          {/* Eyebrow badge: ✨ A LITTLE MAGIC, IN 3 STEPS ✨ */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-purple-200/80 bg-purple-50/70 text-brand-purple text-[11px] sm:text-xs font-bold tracking-wider uppercase shadow-xs">
            <span className="text-amber-500">✦</span>
            <span>A LITTLE MAGIC, IN 3 STEPS</span>
            <span className="text-amber-500">✦</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#17152A] tracking-tight leading-[1.15]">
            Turn a happy moment{" "}
            <span className="block sm:inline sm:mt-0">
              <span className="bg-gradient-to-r from-[#FF4D6D] via-[#FF9F1C] to-[#8B5CF6] bg-clip-text text-transparent">
                into a{" "}
              </span>
              <span className="relative inline-block text-[#8B5CF6]">
                surprise.
                {/* Decorative subtle curved underline stroke under surprise */}
                <svg
                  className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3.5 overflow-visible pointer-events-none"
                  viewBox="0 0 160 14"
                  fill="none"
                >
                  <path
                    d="M 3 8 C 45 13, 115 13, 157 5"
                    stroke="#8B5CF6"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
                {/* 3 Radiating warm accent strokes next to period */}
                <svg
                  className="absolute -right-5 sm:-right-6 -top-1 w-5 sm:w-6 h-5 sm:h-6 overflow-visible text-[#FF9F1C] pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <line x1="3" y1="9" x2="13" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="3" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 font-medium">
            Create something personal. Let them scratch. Make their day.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. THREE SCENES (Exact visual scenes & connecting paths)                  */}
        {/* ========================================================================= */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8 items-start">
          {/* ----------------------------------------------------------------------- */}
          {/* CONNECTING PATH 1 -> 2: Curved Pink Dotted Arrow (Desktop only)         */}
          {/* ----------------------------------------------------------------------- */}
          <div
            className="hidden lg:block absolute left-[31%] top-[24%] w-24 h-12 pointer-events-none z-10"
            aria-hidden="true"
          >
            <svg viewBox="0 0 96 48" fill="none" className="w-full h-full">
              <path
                d="M 5 38 C 35 12, 65 14, 88 28"
                stroke="#FF4D6D"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
              <path d="M 88 28 L 78 26 L 84 18 Z" fill="#FF4D6D" />
            </svg>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CONNECTING PATH 2 -> 3: Curved Purple Loop-de-loop with Paper Airplane */}
          {/* ----------------------------------------------------------------------- */}
          <div
            className="hidden lg:block absolute left-[64%] top-[20%] w-28 h-18 pointer-events-none z-10"
            aria-hidden="true"
          >
            <svg viewBox="0 0 110 64" fill="none" className="w-full h-full">
              <path
                d="M 5 46 C 30 58, 48 54, 52 38 C 55 20, 36 12, 28 24 C 20 38, 38 56, 68 44 C 85 36, 96 26, 105 18"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            </svg>
            {/* Paper Airplane at the end of the loop */}
            <div className="absolute right-0 top-1 w-8 h-8 -rotate-12 animate-pulse" style={{ animationDuration: "3.5s" }}>
              <Image
                src="/landing/how-it-works/paper-plane.png"
                alt="Paper Airplane"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SCENE 1: MAKE IT PERSONAL                                               */}
          {/* ======================================================================= */}
          <div className="flex flex-col items-center text-center lg:text-left space-y-5">
            {/* Visual Illustration Area: Message Editor + Birthday Card */}
            <div className="relative w-full max-w-[340px] h-[240px] flex items-center justify-center">
              <Image
                src="/landing/how-it-works/scene1-illustration.png"
                alt="Make it personal - Message editor and greeting card"
                width={340}
                height={240}
                priority
                className="w-full h-full object-contain filter drop-shadow-sm hover:scale-[1.02] transition-transform duration-300"
              />
            </div>

            {/* Step Label & Text Description */}
            <div className="w-full max-w-[340px] space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#FF4D6D] text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  01
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  Make it personal
                </h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Add a message, a photo, and your unique touch. Create a card that truly feels yours.
              </p>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SCENE 2: HIDE THE HAPPINESS (REAL INTERACTIVE SCRATCH DEMO)             */}
          {/* ======================================================================= */}
          <div
            id="scratch-demo-card"
            className="flex flex-col items-center text-center lg:text-left space-y-5"
          >
            {/* Interactive Scratch Card Stage */}
            <div className="relative w-full max-w-[340px] h-[240px] flex items-center justify-center">
              {/* Confetti celebration burst on full reveal */}
              <div className="absolute inset-0 pointer-events-none z-40">
                <CelebrationConfetti active={showConfetti} />
              </div>

              {/* Tilted Card Wrapper (-3.5deg matching reference image) */}
              <div
                ref={cardContainerRef}
                aria-label={`Interactive scratch card: ${scratchPercent}% revealed`}
                className="relative w-[270px] sm:w-[285px] h-[190px] sm:h-[195px] rounded-2xl overflow-hidden shadow-lg border border-pink-200/80 transition-all duration-300 cursor-crosshair hover:shadow-xl"
                style={{
                  transform: "rotate(-3.5deg)",
                  touchAction: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                {/* Underneath Revealed Card (Base Layer with Floral Card Art & Text) */}
                <Image
                  src="/landing/how-it-works/scene2-card.png"
                  alt="You make life brighter surprise card"
                  fill
                  sizes="300px"
                  priority
                  className="object-cover pointer-events-none select-none"
                />

                {/* Interactive Scratch Canvas Overlay (Metallic Silver Foil) */}
                <canvas
                  key={demoKey}
                  ref={canvasRef}
                  className="absolute inset-0 z-20 pointer-events-auto touch-none"
                />

                {/* Hand Cursor Pointer (bounces invitingly until user scratches) */}
                {!hasInteracted && !isRevealed && (
                  <div
                    className="absolute bottom-3 right-8 z-30 pointer-events-none animate-bounce"
                    style={{ animationDuration: "1.8s" }}
                  >
                    <Image
                      src="/landing/how-it-works/hand-cursor.png"
                      alt="Scratch hand cursor"
                      width={38}
                      height={46}
                      className="drop-shadow-md select-none"
                    />
                  </div>
                )}

                {/* Replay / Reset Button (appears in top corner) */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200/80 hover:text-brand-pink transition-all active:scale-90"
                  title="Reset Scratch Demo"
                  aria-label="Reset Scratch Demo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Celebration Badge when card is 60%+ scratched */}
                {isRevealed && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-25 pointer-events-none animate-in fade-in zoom-in-95 duration-300">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-pink-200 text-brand-pink font-extrabold text-xs shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                      <span>Surprise Revealed! 🎉</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Ambient Floating Hearts & Sparkles around Scene 2 */}
              <div className="absolute top-2 left-4 text-pink-400 pointer-events-none -rotate-12 animate-pulse" style={{ animationDuration: "4s" }}>
                <Heart className="w-5 h-5 fill-pink-400 text-pink-400" />
              </div>
              <div className="absolute bottom-2 right-4 text-amber-400 pointer-events-none rotate-12">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Step Label & Text Description */}
            <div className="w-full max-w-[340px] space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#FF9F1C] text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  02
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  Hide the happiness
                </h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Choose a beautiful cover and add a scratch effect to hide your special message.
              </p>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SCENE 3: SHARE THE SMILE                                                */}
          {/* ======================================================================= */}
          <div className="flex flex-col items-center text-center lg:text-left space-y-5">
            {/* Visual Illustration Area: Smartphone + Joyful Characters + Share Pill */}
            <div className="relative w-full max-w-[345px] h-[240px] flex items-center justify-center">
              <Image
                src="/landing/how-it-works/scene3-illustration.png"
                alt="Share the smile - Smartphone mockup with happy characters"
                width={345}
                height={240}
                priority
                className="w-full h-full object-contain filter drop-shadow-sm hover:scale-[1.02] transition-transform duration-300"
              />
            </div>

            {/* Step Label & Text Description */}
            <div className="w-full max-w-[340px] space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#8B5CF6] text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  03
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  Share the smile
                </h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Send a unique link and let someone discover it. They can scratch away the cover and enjoy your surprise anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM CTA BUTTON (Wide pink pill with radiant yellow accent marks)     */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center gap-3 mt-14 sm:mt-20">
          {/* Left radiating yellow rays */}
          <svg
            className="w-5 sm:w-6 h-5 sm:h-6 text-[#FF9F1C] -scale-x-100 hidden sm:block pointer-events-none select-none"
            viewBox="0 0 24 24"
            fill="none"
          >
            <line x1="6" y1="6" x2="18" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="6" y1="18" x2="18" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* Create Surprise Card Button */}
          <button
            type="button"
            onClick={handleCreateClick}
            className="group inline-flex items-center justify-center gap-2 sm:gap-2.5 px-7 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#FF4D6D] to-[#F43F5E] text-white font-extrabold text-sm sm:text-base md:text-lg shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.03] active:scale-95 transition-all text-center cursor-pointer"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            <span>Create a Surprise Card</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Right radiating yellow rays */}
          <svg
            className="w-5 sm:w-6 h-5 sm:h-6 text-[#FF9F1C] hidden sm:block pointer-events-none select-none"
            viewBox="0 0 24 24"
            fill="none"
          >
            <line x1="6" y1="6" x2="18" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="6" y1="18" x2="18" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
