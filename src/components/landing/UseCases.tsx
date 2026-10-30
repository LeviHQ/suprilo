"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Gift,
  Heart,
  Smile,
  Trophy,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface OccasionItem {
  id: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  sampleMessage: string;
  badgeStyle: string;
  bgCard: string;
  illustration: string;
  foilGradient: string;
  progressPercent: number;
}

export function UseCases() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [selectedOccasion, setSelectedOccasion] = React.useState<OccasionItem | null>(null);

  // Mini Scratch State inside Preview Modal
  const [modalScratched, setModalScratched] = React.useState(false);
  const [scratchPercent, setScratchPercent] = React.useState(35);
  const modalCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isScratchingRef = React.useRef(false);

  const occasions: OccasionItem[] = [
    {
      id: "birthday",
      category: "Birthday Surprises",
      icon: Gift,
      heading: "The birthday card they won't forget",
      sampleMessage: "“Pack your bags, we're going to Lisbon this weekend! Happy Birthday!” ❤️",
      badgeStyle: "bg-[#FFE4E8]/90 text-[#FF4D6D] border-[#FECDD3]",
      bgCard: "bg-[#FFF5F5] border-[#FFE4E6]",
      illustration: "/landing/occasions/occ1-birthday-clean.png",
      foilGradient: "from-[#FF4D6D] to-[#FF9F1C]",
      progressPercent: 78,
    },
    {
      id: "romance",
      category: "Anniversaries & Romance",
      icon: Heart,
      heading: "Little reminders of big love",
      sampleMessage: "“3 years together today. Dinner reservation is booked for 8 PM at our spot.” ❤️",
      badgeStyle: "bg-[#FFE4E8]/90 text-[#E11D48] border-[#FECDD3]",
      bgCard: "bg-[#FFF6F6] border-[#FFE4E8]",
      illustration: "/landing/occasions/occ2-romance-clean.png",
      foilGradient: "from-[#F43F5E] to-[#FF4D6D]",
      progressPercent: 82,
    },
    {
      id: "friendship",
      category: "Friendship Appreciation",
      icon: Smile,
      heading: "Celebrate your favorite people",
      sampleMessage: "“Thank you for always answering my late night calls. Coffees on me today!” ❤️",
      badgeStyle: "bg-[#FEF3C7]/90 text-[#D97706] border-[#FDE68A]",
      bgCard: "bg-[#FFFDF5] border-[#FEF3C7]",
      illustration: "/landing/occasions/occ3-friendship-clean.png",
      foilGradient: "from-[#F59E0B] to-[#FCD34D]",
      progressPercent: 80,
    },
    {
      id: "milestones",
      category: "Good News & Milestones",
      icon: Trophy,
      heading: "Share exciting life announcements",
      sampleMessage: "“You passed the exam with flying colors! So endlessly proud of you!” ❤️",
      badgeStyle: "bg-[#DCFCE7]/90 text-[#16A34A] border-[#BBF7D0]",
      bgCard: "bg-[#F0FDF4] border-[#DCFCE7]",
      illustration: "/landing/occasions/occ4-milestone-clean.png",
      foilGradient: "from-[#10B981] to-[#14B8A6]",
      progressPercent: 72,
    },
    {
      id: "just-because",
      category: "Just-Because Moments",
      icon: Sparkles,
      heading: "Brighten someone's random Tuesday",
      sampleMessage: "“Just thinking of you today. Check your front porch for a little treat.” ❤️",
      badgeStyle: "bg-[#EDE9FE]/90 text-[#7C3AED] border-[#DDD6FE]",
      bgCard: "bg-[#FAF7FF] border-[#EDE9FE]",
      illustration: "/landing/occasions/occ5-justbecause-clean.png",
      foilGradient: "from-[#8B5CF6] to-[#6366F1]",
      progressPercent: 76,
    },
  ];

  const handleStartCreation = (targetUrl: string = "/create") => {
    if (!user) {
      openAuthModal(targetUrl);
    } else {
      router.push(targetUrl);
    }
  };

  // Init Mini Canvas Scratch inside Modal
  React.useEffect(() => {
    if (!selectedOccasion || !modalCanvasRef.current) return;
    const canvas = modalCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 240;
    canvas.height = 140;

    // Paint metallic silver-gold foil
    const grad = ctx.createLinearGradient(0, 0, 240, 140);
    grad.addColorStop(0, "#E2E8F0");
    grad.addColorStop(0.3, "#DDD6FE");
    grad.addColorStop(0.7, "#FEF08A");
    grad.addColorStop(1, "#CBD5E1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 140);

    // Initial pre-scratched circle in the center
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(120, 70, 32, 0, Math.PI * 2);
    ctx.fill();

    setModalScratched(false);
    setScratchPercent(35);
  }, [selectedOccasion]);

  const handleModalScratchMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current || !modalCanvasRef.current) return;
    const canvas = modalCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    setScratchPercent((prev) => {
      const next = Math.min(100, prev + 3);
      if (next >= 65) setModalScratched(true);
      return next;
    });
  };

  return (
    <section
      id="use-cases"
      className="py-16 sm:py-24 bg-[#FFFDFB] relative overflow-hidden overflow-x-clip w-full max-w-full select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* SECTION HEADER WITH PLAYFUL ANNOTATIONS & HAND-DRAWN ARROWS               */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20 relative">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#EDE9FE]/90 text-[#7C3AED] text-xs font-black tracking-wider uppercase border border-[#DDD6FE]/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#7C3AED] text-[#7C3AED]" />
              <span>Endless Possibilities</span>
              <Sparkles className="w-3.5 h-3.5 fill-[#7C3AED] text-[#7C3AED]" />
            </span>
          </div>

          {/* Floating Hand-Drawn Annotation on Left: "Different Moments, Same Happiness" */}
          <div
            className="hidden lg:flex flex-col items-center absolute -top-3 -left-8 xl:-left-16 -rotate-6 pointer-events-none select-none text-left"
            aria-hidden="true"
          >
            <span className="font-extrabold text-[#FF4D6D] text-sm tracking-tight leading-tight">
              Different Moments
            </span>
            <span className="font-bold text-pink-400 text-xs">
              Same Happiness
            </span>
            {/* Curved pink arrow pointing towards title */}
            <svg className="w-12 h-8 text-[#FF4D6D] mt-1 overflow-visible" viewBox="0 0 50 35" fill="none">
              <path
                d="M8 6C24 10 40 20 40 30M40 30L33 26M40 30L44 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Heart className="w-3.5 h-3.5 fill-[#FF4D6D] text-[#FF4D6D] -mt-10 -ml-16" />
          </div>

          {/* Floating Hand-Drawn Annotation on Right: "Turn Every Occasion into a Surprise" */}
          <div
            className="hidden lg:flex flex-col items-center absolute -top-3 -right-8 xl:-right-16 rotate-6 pointer-events-none select-none text-right"
            aria-hidden="true"
          >
            <span className="font-extrabold text-[#FF4D6D] text-sm tracking-tight leading-tight">
              Turn Every Occasion
            </span>
            <span className="font-bold text-pink-400 text-xs">
              into a Surprise
            </span>
            {/* Curved pink arrow pointing towards title */}
            <svg className="w-12 h-8 text-[#FF4D6D] mt-1 overflow-visible" viewBox="0 0 50 35" fill="none">
              <path
                d="M42 6C26 10 10 20 10 30M10 30L17 26M10 30L6 22"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Heart className="w-3.5 h-3.5 fill-[#FF4D6D] text-[#FF4D6D] -mt-10 -mr-16" />
          </div>

          {/* Main Heading with radiating rays, gradient word, and outline heart */}
          <div className="relative inline-block px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-[#17152A] tracking-tight leading-[1.14]">
              Every Moment Worth{" "}
              <span className="relative inline-flex items-center gap-2">
                {/* 3 Radiating Yellow Rays on the left of Celebrating */}
                <svg
                  className="w-5 sm:w-6 h-5 sm:h-6 text-[#FF9F1C] -scale-x-100 hidden sm:inline-block pointer-events-none select-none"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <line x1="4" y1="18" x2="16" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="20" x2="22" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="2" y1="12" x2="14" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>

                <span className="bg-gradient-to-r from-[#FF9F1C] via-[#FF4D6D] to-[#8B5CF6] bg-clip-text text-transparent">
                  Celebrating
                </span>

                {/* Hand-drawn pink heart outline beside Celebrating */}
                <span className="inline-block text-[#FF4D6D] text-2xl sm:text-3xl font-normal ml-0.5 -mt-1 animate-pulse">
                  ♡
                </span>
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-normal">
            From milestones to spontaneous midday smiles, Suprilo brings magic to any occasion.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SIX OCCASION CARDS GRID (3 Columns x 2 Rows)                              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          {/* CARDS 01 to 05: OCCASION DISCOVERY CARDS */}
          {occasions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedOccasion(item)}
                className={`${item.bgCard} rounded-[30px] border p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer`}
              >
                {/* Top Section: Badge, Title & Sample Message Bubble */}
                <div className="space-y-4 z-10">
                  {/* Category Pill Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${item.badgeStyle}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.category}</span>
                    </span>
                  </div>

                  {/* Heading */}
                  <h3 className="text-lg sm:text-xl font-black text-[#17152A] tracking-tight group-hover:text-brand-pink transition-colors max-w-[180px] sm:max-w-[195px] leading-snug">
                    {item.heading}
                  </h3>

                  {/* Sample Message Bubble */}
                  <div className="bg-white/85 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-white/90 shadow-xs max-w-[185px] sm:max-w-[200px] text-xs text-slate-600 font-medium leading-relaxed italic">
                    {item.sampleMessage}
                  </div>
                </div>

                {/* Right Illustration: Occasion Greeting Card Art */}
                <div className="absolute right-1 sm:right-2 top-10 sm:top-12 w-[140px] sm:w-[155px] h-[180px] pointer-events-none select-none z-0 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300">
                  <Image
                    src={item.illustration}
                    alt={`${item.category} illustration`}
                    width={155}
                    height={180}
                    priority
                    className="w-full h-full object-contain filter drop-shadow-sm"
                  />
                </div>

                {/* Bottom Bar: Scratch Reveal Effect Indicator */}
                <div className="mt-8 pt-3 border-t border-slate-200/50 flex items-center justify-between z-10">
                  <span className="text-xs font-semibold text-slate-500">
                    Scratch reveal effect
                  </span>
                  {/* Colorful Gradient Progress Bar */}
                  <div className="w-24 sm:w-28 h-2.5 rounded-full bg-slate-200/70 overflow-hidden p-0.5 shadow-inner">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.foilGradient} transition-all duration-500 group-hover:brightness-110`}
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* ===================================================================== */}
          {/* CARD 06: YOUR OWN CUSTOM SURPRISE (FINAL CTA INVITATION CARD)         */}
          {/* ===================================================================== */}
          <div className="bg-[#FFF5F7] rounded-[30px] border border-[#FCE7F3] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            {/* Top Content */}
            <div className="space-y-4 z-10">
              {/* Category Badge */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs bg-[#FFE4E8]/90 text-[#FF4D6D] border-[#FECDD3]">
                  <Sparkles className="w-3.5 h-3.5 fill-[#FF4D6D] text-[#FF4D6D]" />
                  <span>Your Own Custom Surprise</span>
                </span>
              </div>

              {/* Heading */}
              <h3 className="text-lg sm:text-xl font-black text-[#17152A] tracking-tight group-hover:text-brand-pink transition-colors max-w-[185px] sm:max-w-[195px] leading-snug">
                Endless occasions, endless possibilities
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-[185px] sm:max-w-[200px]">
                Have a secret proposal, gender reveal, game night clue, or a sweet gratitude note? Suprilo is your blank canvas for joy.
              </p>
            </div>

            {/* Right Illustration: Magical Gift Box with Emerging Icons */}
            <div className="absolute right-0 sm:right-1 top-8 sm:top-10 w-[145px] sm:w-[160px] h-[190px] pointer-events-none select-none z-0 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/landing/occasions/occ6-custombox-clean.png"
                alt="Magical surprise gift box with occasion icons"
                width={160}
                height={190}
                priority
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>

            {/* Bottom CTA Button: Wide Pink Pill */}
            <div className="mt-8 pt-3 border-t border-pink-200/50 z-10">
              <button
                type="button"
                onClick={() => handleStartCreation("/create")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF4D6D] to-[#F43F5E] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.03] active:scale-95 transition-all text-center cursor-pointer"
              >
                <span>Create Your First Card</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OCCASION PREVIEW & MINI SCRATCH INTERACTION MODAL                         */}
      {/* ========================================================================= */}
      {selectedOccasion && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedOccasion(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedOccasion(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${selectedOccasion.badgeStyle}`}
              >
                <selectedOccasion.icon className="w-3.5 h-3.5" />
                <span>{selectedOccasion.category}</span>
              </span>
              <h3 className="text-2xl font-black text-[#17152A]">
                {selectedOccasion.heading}
              </h3>
            </div>

            {/* Card Content & Interactive Scratch Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              {/* Left: Card Artwork */}
              <div className="w-[130px] h-[155px] shrink-0">
                <Image
                  src={selectedOccasion.illustration}
                  alt={selectedOccasion.heading}
                  width={130}
                  height={155}
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>

              {/* Right: Message & Mini Scratch Preview */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                  {selectedOccasion.sampleMessage}
                </p>

                {/* Mini Scratch Foil Canvas */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Try scratching foil:</span>
                    <span className="text-brand-pink">{scratchPercent}%</span>
                  </div>

                  <div className="relative w-[240px] h-[100px] mx-auto sm:mx-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                    {/* Underlying secret text */}
                    <div className="text-center p-2 z-0 select-none">
                      <span className="text-xs font-black text-[#17152A] block">
                        🎉 Surprise Revealed!
                      </span>
                      <span className="text-[10px] text-pink-600 font-bold">
                        {modalScratched ? "Ready to make yours?" : "Keep scratching..."}
                      </span>
                    </div>

                    {/* Canvas Scratch Foil Layer */}
                    <canvas
                      ref={modalCanvasRef}
                      onPointerDown={() => {
                        isScratchingRef.current = true;
                      }}
                      onPointerMove={handleModalScratchMove}
                      onPointerUp={() => {
                        isScratchingRef.current = false;
                      }}
                      onPointerLeave={() => {
                        isScratchingRef.current = false;
                      }}
                      className="absolute inset-0 z-10 cursor-crosshair touch-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStartCreation(`/create?occasion=${selectedOccasion.id}`)}
                className="w-full sm:flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-[#FF4D6D] to-[#F43F5E] text-white font-extrabold text-sm shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Creating for this Occasion</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedOccasion(null)}
                className="w-full sm:w-auto py-3 px-5 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
