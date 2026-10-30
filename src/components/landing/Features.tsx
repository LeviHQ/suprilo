"use client";

import * as React from "react";
import Image from "next/image";
import {
  MessageSquareHeart,
  Camera,
  Sparkles,
  Link2,
  Smartphone,
  PartyPopper,
  Heart,
  Image as ImageIcon,
  Type,
  Flower,
  Check,
  Send,
} from "lucide-react";

export function Features() {
  // Card 1: Interactive Editor state
  const [activeColor, setActiveColor] = React.useState("#FF4D6D");
  const [activeTool, setActiveTool] = React.useState<"img" | "heart" | "flower" | "text">("heart");
  const [messageText, setMessageText] = React.useState("Happy Birthday!\nYou're amazing! ❤️");

  // Card 4: Interactive Copy Link state
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://suprilo.com/card/happy-birthday-surprise");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  // Card 3: Interactive scratch hover state
  const [isScratching, setIsScratching] = React.useState(false);

  const colorPalette = [
    { name: "Pink", color: "#FF4D6D" },
    { name: "Purple", color: "#8B5CF6" },
    { name: "Orange", color: "#FF9F1C" },
    { name: "Cream", color: "#FEF3C7" },
    { name: "Slate", color: "#E2E8F0" },
  ];

  return (
    <section
      id="features"
      className="py-16 sm:py-24 bg-[#FFFDFB] relative overflow-hidden overflow-x-clip w-full max-w-full"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* SECTION HEADER                                                            */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20 relative">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFE4E8]/90 text-[#FF4D6D] text-xs font-black tracking-wider uppercase border border-[#FECDD3]/80 shadow-xs">
              <Heart className="w-3.5 h-3.5 fill-[#FF4D6D] text-[#FF4D6D]" />
              <span>Crafted for Genuine Smiles</span>
            </span>
          </div>

          {/* Main Headline with curved underline and decorative floating hearts */}
          <div className="relative inline-block px-4">
            {/* Floating decorative hearts around headline */}
            <div
              className="absolute -left-6 sm:-left-10 top-0 text-[#FF4D6D] pointer-events-none -rotate-12 animate-pulse"
              style={{ animationDuration: "3s" }}
              aria-hidden="true"
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-[#FF4D6D]" />
            </div>
            <div
              className="absolute -left-3 sm:-left-6 top-8 text-pink-400 pointer-events-none rotate-12"
              aria-hidden="true"
            >
              <Heart className="w-3.5 h-3.5 fill-pink-400" />
            </div>
            <div
              className="absolute -right-6 sm:-right-10 top-2 text-[#FF4D6D] pointer-events-none rotate-12 animate-pulse"
              style={{ animationDuration: "3.5s" }}
              aria-hidden="true"
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-[#FF4D6D]" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-[#17152A] tracking-tight leading-[1.14]">
              More than a card.{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#FF4D6D] via-[#FF9F1C] to-[#8B5CF6] bg-clip-text text-transparent">
                  A feeling.
                </span>
                {/* Curved decorative underline */}
                <svg
                  className="absolute -bottom-3 left-0 w-full h-3.5 text-[#8B5CF6] overflow-visible pointer-events-none select-none"
                  viewBox="0 0 100 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9C32 14 68 14 98 5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                {/* 3 Radiating Yellow Rays on the right */}
                <svg
                  className="absolute -top-3 -right-7 sm:-right-8 w-6 h-6 text-[#FF9F1C] pointer-events-none select-none"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <line x1="4" y1="18" x2="16" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="10" y1="20" x2="22" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="2" y1="12" x2="14" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-normal">
            Everything you need to turn simple greetings into little unforgettable surprises.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* ASYMMETRIC BENTO GRID                                                     */}
        {/* ========================================================================= */}

        {/* --- TOP SECTION (2 Columns: Large Left Block + 2 Stacked Right Blocks) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
          {/* ===================================================================== */}
          {/* FEATURE 01: YOUR WORDS, YOUR WAY (Tall Left Feature Block)            */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 bg-[#FFF5F7] rounded-[30px] border border-[#FFE4E8] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
            {/* Ambient Background Glow & Hearts */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/25 rounded-full blur-3xl pointer-events-none -z-0" />
            <div className="absolute top-6 right-6 text-pink-300 pointer-events-none -rotate-12" aria-hidden="true">
              <Sparkles className="w-5 h-5" />
            </div>

            {/* Top Text Content */}
            <div className="relative z-10 space-y-3 max-w-[420px]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-[#FF4D6D] border border-[#FECDD3] flex items-center justify-center shadow-xs">
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  Your words, your way
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Express exactly what&apos;s on your mind. From heartfelt love letters to goofy inside jokes, make your words the ultimate reveal.
              </p>
            </div>

            {/* Visual Composition: Birthday Card + Floating Live Message Editor */}
            <div className="relative z-10 mt-8 sm:mt-10 min-h-[290px] sm:min-h-[310px] flex items-center justify-center">
              {/* Background Birthday Card with photo & floral frame */}
              <div className="absolute right-0 sm:right-2 top-0 sm:top-1 w-[200px] sm:w-[230px] aspect-[223/275] rounded-2xl overflow-hidden shadow-lg border border-pink-200/90 rotate-2 group-hover:rotate-1 group-hover:scale-[1.02] transition-transform duration-300">
                <Image
                  src="/landing/features/feature1-card.png"
                  alt="Floral Happy Birthday greeting card with photo"
                  width={230}
                  height={285}
                  priority
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>

              {/* Foreground Floating Message Editor Panel (Real UI Experience) */}
              <div className="relative -left-2 sm:-left-4 top-4 sm:top-6 w-[230px] sm:w-[260px] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-pink-200/80 shadow-xl space-y-2.5 -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                {/* Editor Header */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="text-slate-700 font-extrabold">Your Message</span>
                  <span className="text-[10px] text-pink-500 font-semibold">Live Preview</span>
                </div>

                {/* Message Input Field (Interactive) */}
                <div className="bg-[#FAF9FD] rounded-xl p-2 sm:p-2.5 border border-purple-100/80 text-xs text-slate-800 font-medium relative focus-within:ring-2 focus-within:ring-pink-300 transition-all">
                  <textarea
                    rows={2}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    aria-label="Your custom card message"
                    className="w-full bg-transparent resize-none border-none outline-none leading-relaxed text-xs text-slate-800 font-medium p-0"
                  />
                </div>

                {/* Font Selector & Color Swatches */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[10px] font-bold text-slate-700">
                    <span>Plus Jakarta Sans</span>
                    <span className="text-slate-400 text-[8px]">▼</span>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5">
                    {colorPalette.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setActiveColor(p.color)}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          activeColor === p.color ? "scale-125 ring-2 ring-offset-1 ring-slate-400" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                        aria-label={`Select color ${p.name}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Editor Toolbar */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTool("img")}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-pink-600 transition-colors ${
                      activeTool === "img" ? "bg-pink-50 text-pink-600" : "hover:bg-slate-50"
                    }`}
                    title="Add photo"
                    aria-label="Add photo"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool("heart")}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-pink-600 transition-colors ${
                      activeTool === "heart" ? "bg-pink-50 text-pink-600" : "hover:bg-slate-50"
                    }`}
                    title="Add heart"
                    aria-label="Add heart"
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-500/20 text-pink-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool("flower")}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-pink-600 transition-colors ${
                      activeTool === "flower" ? "bg-pink-50 text-pink-600" : "hover:bg-slate-50"
                    }`}
                    title="Add flower"
                    aria-label="Add flower"
                  >
                    <Flower className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool("text")}
                    className={`p-1.5 rounded-lg text-slate-500 hover:text-pink-600 transition-colors ${
                      activeTool === "text" ? "bg-pink-50 text-pink-600" : "hover:bg-slate-50"
                    }`}
                    title="Text formatting"
                    aria-label="Text formatting"
                  >
                    <Type className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN (2 Stacked Feature Blocks)                               */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 flex flex-col gap-6 sm:gap-7 justify-between">
            {/* ------------------------------------------------------------------- */}
            {/* FEATURE 02: MEMORIES INSIDE                                         */}
            {/* ------------------------------------------------------------------- */}
            <div className="bg-[#FFFBF5] rounded-[30px] border border-[#FED7AA]/80 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex-1">
              <div className="space-y-3 max-w-[280px] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white text-[#D97706] border border-[#FDE68A] flex items-center justify-center shadow-xs">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                    Memories inside
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Hide a favorite memory, travel snapshot, or secret photo under the foil for a nostalgic, unforgettable smile.
                </p>
              </div>

              {/* Visual: Two tilted Polaroids */}
              <div className="relative z-10 shrink-0 w-[230px] sm:w-[245px] h-[150px] flex items-center justify-center">
                <Image
                  src="/landing/features/feature2-polaroids.png"
                  alt="Polaroid memories: sunset beach and happy golden retriever"
                  width={245}
                  height={150}
                  priority
                  className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300 select-none pointer-events-none"
                />
              </div>

              {/* Decorative sparkles */}
              <div className="absolute top-4 right-4 text-amber-300 pointer-events-none" aria-hidden="true">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* FEATURE 03: THE MAGIC OF SCRATCHING                                 */}
            {/* ------------------------------------------------------------------- */}
            <div
              onMouseEnter={() => setIsScratching(true)}
              onMouseLeave={() => setIsScratching(false)}
              className="bg-[#FAF7FF] rounded-[30px] border border-[#E9D5FF] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex-1 cursor-pointer"
            >
              <div className="space-y-3 max-w-[280px] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                    The magic of scratching
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Feel the anticipation. Swiping, scratching, and peeling away the foil creates that joyful rush of real-world scratch-offs.
                </p>
              </div>

              {/* Visual: Tilted scratch card with hand cursor */}
              <div className="relative z-10 shrink-0 w-[220px] sm:w-[240px] h-[150px] flex items-center justify-center">
                <Image
                  src="/landing/features/feature3-scratch.png"
                  alt="Interactive scratch card with silver foil and hand pointer"
                  width={240}
                  height={150}
                  priority
                  className={`w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 select-none pointer-events-none ${
                    isScratching ? "scale-105 -rotate-1" : "group-hover:scale-102"
                  }`}
                />
              </div>

              {/* Foil Shimmer effect on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none transition-opacity duration-500 ${
                  isScratching ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* --- BOTTOM SECTION (3 Equal Feature Blocks Across Bottom) ---            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-6 sm:mt-7">
          {/* ===================================================================== */}
          {/* FEATURE 04: SHARE THE HAPPINESS                                       */}
          {/* ===================================================================== */}
          <div className="bg-[#F0FDF4] rounded-[30px] border border-[#DCFCE7] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center shadow-xs">
                  <Link2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  Share the happiness
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Generate a private link that you can text on WhatsApp, iMessage, Messenger, or email in seconds.
              </p>
            </div>

            {/* Visual: Smartphone Mockup + Interactive Share Pill */}
            <div className="relative z-10 mt-6 min-h-[175px] flex items-center justify-between">
              {/* Interactive Share Link Pill */}
              <div className="w-[170px] sm:w-[190px] bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-emerald-200/80 shadow-md space-y-2 -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium truncate">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Link2 className="w-3 h-3" />
                  </div>
                  <span className="truncate font-semibold">suprilo.com/...</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`w-full py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                  }`}
                  aria-label="Copy share link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied! ✨</span>
                    </>
                  ) : (
                    <>
                      <span>Copy Link</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Smartphone mockup on the right */}
              <div className="relative w-[85px] sm:w-[95px] h-[175px] shrink-0 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300">
                <Image
                  src="/landing/features/feature4-phone.png"
                  alt="Recipient mobile card preview"
                  width={95}
                  height={175}
                  priority
                  className="w-full h-full object-contain filter drop-shadow-sm select-none pointer-events-none"
                />
              </div>

              {/* Floating WhatsApp badge */}
              <div
                className="absolute top-2 right-12 w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md animate-bounce"
                style={{ animationDuration: "2.5s" }}
                aria-hidden="true"
              >
                <Send className="w-3 h-3 text-white -rotate-12" />
              </div>

              {/* Floating purple paper airplane */}
              <div
                className="absolute -top-3 right-1 text-purple-500 pointer-events-none animate-pulse"
                style={{ animationDuration: "3s" }}
                aria-hidden="true"
              >
                <Sparkles className="w-5 h-5 fill-purple-400" />
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* FEATURE 05: A SURPRISE ON ANY SCREEN                                  */}
          {/* ===================================================================== */}
          <div className="bg-[#F0F9FF] rounded-[30px] border border-[#BAE6FD] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group">
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-[#0284C7] border border-[#BAE6FD] flex items-center justify-center shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  A surprise on any screen
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Your recipient doesn&apos;t need an account or app download. One tap on mobile and the scratching excitement begins immediately.
              </p>
            </div>

            {/* Visual: Multi-device Lineup (Smartphone, Tablet, Laptop) */}
            <div className="relative z-10 mt-6 min-h-[150px] flex items-center justify-center">
              <Image
                src="/landing/features/feature5-devices-clean.png"
                alt="Multi-device preview: smartphone, tablet, and laptop"
                width={290}
                height={140}
                priority
                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
              />
            </div>

            {/* Ambient decorative hearts and rays */}
            <div className="absolute top-4 right-4 text-sky-300 pointer-events-none" aria-hidden="true">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* ===================================================================== */}
          {/* FEATURE 06: EVERY MOMENT DESERVES A CELEBRATION                       */}
          {/* ===================================================================== */}
          <div className="bg-[#FFF5F7] rounded-[30px] border border-[#FCE7F3] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group md:col-span-2 lg:col-span-1">
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white text-[#E11D48] border border-[#FECDD3] flex items-center justify-center shadow-xs">
                  <PartyPopper className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
                  Every moment deserves a celebration
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Birthdays, anniversaries, promotions, graduations, or just reminding someone they matter—every day has a reason to celebrate.
              </p>
            </div>

            {/* Visual: 5 Celebration Cards Fanned Out */}
            <div className="relative z-10 mt-6 min-h-[150px] flex items-center justify-center">
              <Image
                src="/landing/features/feature6-celebrations-clean.png"
                alt="Fanned collection of cards: Birthday, Love, Best Friends, Thank You, Congrats"
                width={295}
                height={140}
                priority
                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 select-none pointer-events-none"
              />
            </div>

            {/* Ambient celebration sparkles */}
            <div className="absolute top-4 right-4 text-pink-300 pointer-events-none" aria-hidden="true">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
