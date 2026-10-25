"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowLeft,
  Heart,
  PartyPopper,
  Share2,
  RefreshCw,
  Sliders,
  Check,
  Info,
  Gift,
  Smile,
} from "lucide-react";
import { ScratchCard, CoverStyle } from "@/components/scratch/ScratchCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface CardPreset {
  id: string;
  name: string;
  icon: React.ElementType;
  tag: string;
  recipient: string;
  message: string;
  secondary: string;
  sender: string;
  coverStyle: CoverStyle;
  coverText: string;
}

const PRESETS: CardPreset[] = [
  {
    id: "magic",
    name: "Magic & Appreciation",
    icon: Sparkles,
    tag: "A Little Joy",
    recipient: "Friend",
    message: "“You're someone else's little bit of magic 💖”",
    secondary: "Thanks for making ordinary moments special.",
    sender: "Alex",
    coverStyle: "lavender-pink",
    coverText: "Scratch to reveal your surprise ✨",
  },
  {
    id: "birthday",
    name: "Birthday Celebration",
    icon: PartyPopper,
    tag: "Happy Birthday!",
    recipient: "Maya",
    message: "“Happy 25th, Maya! ✨”",
    secondary: "Every single day is brighter with your laugh. Can't wait to celebrate tonight!",
    sender: "Alex",
    coverStyle: "golden-foil",
    coverText: "Scratch to reveal your birthday surprise 🎂",
  },
  {
    id: "love",
    name: "Love & Romance",
    icon: Heart,
    tag: "With All My Heart",
    recipient: "My Love",
    message: "“Every day with you is my favorite adventure 💌”",
    secondary: "Dinner reservation is booked for 8 PM tonight at our secret spot.",
    sender: "Sam",
    coverStyle: "lavender-pink",
    coverText: "Scratch to uncover our surprise ❤️",
  },
  {
    id: "just-because",
    name: "Just Because",
    icon: Smile,
    tag: "Midday Smile",
    recipient: "Mom",
    message: "“Just thinking of you today and sending love ☕”",
    secondary: "Check your front porch later for a little sweet treat!",
    sender: "Adarsh",
    coverStyle: "mint-fresh",
    coverText: "Scratch for a little moment of joy 🌿",
  },
  {
    id: "celebration",
    name: "Big Milestone",
    icon: Gift,
    tag: "You Did It!",
    recipient: "Champion",
    message: "“So endlessly proud of you! You aced it! 🚀”",
    secondary: "Hard work always pays off. The sky is the limit!",
    sender: "Your Fan Club",
    coverStyle: "cosmic-purple",
    coverText: "Scratch to open your celebratory note 🎉",
  },
];

const FOIL_OPTIONS: { id: CoverStyle; name: string; previewColor: string; desc: string }[] = [
  {
    id: "lavender-pink",
    name: "Lavender Pink",
    previewColor: "from-[#FED7AA] via-[#FF4D6D] to-[#C084FC]",
    desc: "Suprilo signature warm foil",
  },
  {
    id: "golden-foil",
    name: "Golden Foil",
    previewColor: "from-[#FDE68A] via-[#F59E0B] to-[#D97706]",
    desc: "Radiant metallic celebration gold",
  },
  {
    id: "cosmic-purple",
    name: "Cosmic Purple",
    previewColor: "from-[#DDD6FE] via-[#8B5CF6] to-[#6D28D9]",
    desc: "Vibrant royal amethyst luster",
  },
  {
    id: "mint-fresh",
    name: "Mint Emerald",
    previewColor: "from-[#A7F3D0] via-[#10B981] to-[#059669]",
    desc: "Fresh, playful pastel sheen",
  },
];

export default function CreateCardPage() {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("magic");
  const [tag, setTag] = React.useState("A Little Joy");
  const [recipient, setRecipient] = React.useState("Friend");
  const [message, setMessage] = React.useState("“You're someone else's little bit of magic 💖”");
  const [secondary, setSecondary] = React.useState("Thanks for making ordinary moments special.");
  const [sender, setSender] = React.useState("Alex");
  const [coverStyle, setCoverStyle] = React.useState<CoverStyle>("lavender-pink");
  const [coverText, setCoverText] = React.useState("Scratch to reveal your surprise ✨");

  // Scratch card instance key to force clean canvas remount on preset change
  const [cardKey, setCardKey] = React.useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // Apply preset
  const handleSelectPreset = (preset: CardPreset) => {
    setSelectedPreset(preset.id);
    setTag(preset.tag);
    setRecipient(preset.recipient);
    setMessage(preset.message);
    setSecondary(preset.secondary);
    setSender(preset.sender);
    setCoverStyle(preset.coverStyle);
    setCoverText(preset.coverText);
    setCardKey((prev) => prev + 1);
  };

  const handleResetCard = () => {
    setCardKey((prev) => prev + 1);
  };

  const hiddenContent = (
    <div className="flex flex-col justify-between h-full text-center">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-pink text-white shadow-sm">
          <Sparkles className="w-3 h-3" />
          <span>{tag || "Surprise"}</span>
        </span>
        <span className="text-[11px] font-bold text-brand-purple">
          From {sender || "Someone"} with ❤️
        </span>
      </div>

      {/* Main Message Note */}
      <div className="my-auto py-2 space-y-2">
        <div className="w-11 h-11 mx-auto rounded-full bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-sm">
          <Heart className="w-5 h-5 fill-brand-pink text-brand-pink animate-pulse" />
        </div>
        <h4 className="text-lg sm:text-xl font-extrabold text-brand-dark leading-snug px-2">
          {message || "Your secret message will appear here!"}
        </h4>
        {secondary && (
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-[280px] mx-auto font-medium">
            {secondary}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-brand-muted/80 pt-2 border-t border-brand-warm-border/50">
        <span>To: {recipient || "Someone special"}</span>
        <span>suprilo.com/s/preview</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-warm text-brand-dark flex flex-col selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-warm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark bg-brand-warm-subtle hover:bg-brand-warm-border px-3 py-1.5 rounded-full border border-brand-warm-border transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-9 w-28 aspect-[800/285]">
                <Image
                  src="/brand/logo.png"
                  alt="Suprilo"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="purple" className="hidden sm:inline-flex shadow-sm">
              <Sparkles className="w-3 h-3 text-brand-purple" />
              <span>Card Studio • Phase 2A</span>
            </Badge>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="gap-1.5 shadow-md hover:shadow-brand-pink/25 text-xs font-semibold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Card</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Studio Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Phase 2A Notice Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-brand-orange-light/80 border border-[#FED7AA] flex items-start gap-3 text-xs text-brand-dark">
          <Info className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900">
              Card Studio Interactive Starter (Phase 2A)
            </p>
            <p className="text-brand-muted leading-relaxed">
              Customize your secret message and foil finish below. You can test and scratch the card right in the live preview. Cloud publishing and unique public links will arrive in Phase 2B.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Controls & Presets (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Occasion Presets */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-brand-dark">Choose an Occasion Preset</h2>
                  <p className="text-xs text-brand-muted">Pick a preset to instantly load beautiful wording and colors</p>
                </div>
                <Sliders className="w-4 h-4 text-brand-muted" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                        isActive
                          ? "bg-brand-pink-light border-brand-pink text-brand-pink shadow-sm ring-2 ring-brand-pink/20"
                          : "bg-brand-warm-subtle/70 border-brand-warm-border text-brand-muted hover:border-brand-pink/40 hover:text-brand-dark"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-brand-pink" : "text-brand-muted"}`} />
                        {isActive && <Check className="w-3.5 h-3.5 text-brand-pink" />}
                      </div>
                      <span className="text-xs font-bold text-brand-dark">{preset.name}</span>
                      <span className="text-[10px] text-brand-muted truncate max-w-full">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Message & Details Form */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-5">
              <h2 className="text-base font-bold text-brand-dark">Personalize Your Card Details</h2>

              <div className="space-y-4 text-xs">
                {/* Recipient & Tag in row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="recipient" className="font-semibold text-brand-dark">
                      Recipient Name
                    </label>
                    <input
                      id="recipient"
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. Maya"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark placeholder-brand-muted/60 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tag" className="font-semibold text-brand-dark">
                      Occasion Tag
                    </label>
                    <input
                      id="tag"
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="e.g. Happy Birthday!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark placeholder-brand-muted/60 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                    />
                  </div>
                </div>

                {/* Secret Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="message" className="font-semibold text-brand-dark">
                      Hidden Surprise Message
                    </label>
                    <span className="text-[10px] text-brand-muted">This is revealed under the scratch foil</span>
                  </div>
                  <textarea
                    id="message"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write the big surprise headline..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark placeholder-brand-muted/60 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink resize-none"
                  />
                </div>

                {/* Secondary Note & Sender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="secondary" className="font-semibold text-brand-dark">
                      Secondary Note / Details
                    </label>
                    <input
                      id="secondary"
                      type="text"
                      value={secondary}
                      onChange={(e) => setSecondary(e.target.value)}
                      placeholder="e.g. Can't wait to celebrate tonight!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark placeholder-brand-muted/60 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sender" className="font-semibold text-brand-dark">
                      From (Your Name / Sign-off)
                    </label>
                    <input
                      id="sender"
                      type="text"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark placeholder-brand-muted/60 focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Scratch Foil Cover Finish */}
            <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
              <div>
                <h2 className="text-base font-bold text-brand-dark">Scratch Foil Style</h2>
                <p className="text-xs text-brand-muted">Select the metallic texture and color for the scratch-off surface</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FOIL_OPTIONS.map((foil) => {
                  const isActive = coverStyle === foil.id;
                  return (
                    <button
                      key={foil.id}
                      type="button"
                      onClick={() => {
                        setCoverStyle(foil.id);
                        setCardKey((prev) => prev + 1);
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isActive
                          ? "border-brand-pink bg-brand-pink-light/40 shadow-sm ring-2 ring-brand-pink/20"
                          : "border-brand-warm-border bg-brand-warm-subtle/60 hover:border-brand-pink/30"
                      }`}
                    >
                      <div className={`w-full h-8 rounded-xl bg-gradient-to-r ${foil.previewColor} mb-2 shadow-inner`} />
                      <div>
                        <p className="text-xs font-bold text-brand-dark">{foil.name}</p>
                        <p className="text-[10px] text-brand-muted leading-tight mt-0.5">{foil.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cover Instruction Text */}
              <div className="pt-2 text-xs space-y-1.5">
                <label htmlFor="coverText" className="font-semibold text-brand-dark">
                  Scratch Overlay Text
                </label>
                <input
                  id="coverText"
                  type="text"
                  value={coverText}
                  onChange={(e) => {
                    setCoverText(e.target.value);
                    setCardKey((prev) => prev + 1);
                  }}
                  placeholder="e.g. Scratch to reveal your surprise ✨"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Scratch Card Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                  Live Scratch Preview
                </h3>
              </div>

              <button
                type="button"
                onClick={handleResetCard}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark bg-white hover:bg-brand-warm-subtle px-3 py-1.5 rounded-full border border-brand-warm-border transition-colors shadow-sm"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-cover Card</span>
              </button>
            </div>

            {/* The Real Canvas Scratch Card Instance */}
            <div className="relative">
              <div
                className="absolute inset-0 bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple rounded-3xl opacity-20 blur-xl pointer-events-none"
                aria-hidden="true"
              />
              <ScratchCard
                key={cardKey}
                hiddenContent={hiddenContent}
                coverText={coverText || "Scratch to reveal your surprise ✨"}
                coverStyle={coverStyle}
                revealThreshold={0.65}
                brushRadius={26}
                ariaLabel="Live scratch card preview in studio"
              />
            </div>

            {/* Quick Helper Note */}
            <p className="text-center text-[11px] text-brand-muted">
              ✨ Scratch with your mouse or finger right on the preview to test how your recipient will experience it!
            </p>
          </div>
        </div>
      </main>

      {/* Share / Save Modal Info */}
      {isShareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsShareModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-orange-light text-[#D97706]">
                Phase 2A Active Preview
              </span>
              <h3 id="share-dialog-title" className="text-xl font-extrabold text-brand-dark">
                Your Card is Ready in Preview!
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                You can test and scratch your card in the studio preview right now. Public cloud link generation (for WhatsApp, iMessage, and Messenger) will go live in the Phase 2B update!
              </p>
            </div>

            <div className="p-3.5 bg-brand-warm-subtle rounded-2xl border border-brand-warm-border text-left space-y-2 text-xs">
              <p className="font-bold text-brand-dark">Current Card Summary:</p>
              <ul className="text-brand-muted space-y-1">
                <li>• <strong>Recipient:</strong> {recipient || "Someone special"}</li>
                <li>• <strong>Tag:</strong> {tag || "Surprise"}</li>
                <li>• <strong>Foil Style:</strong> {coverStyle}</li>
                <li>• <strong>Sender:</strong> {sender || "Anonymous"}</li>
              </ul>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => setIsShareModalOpen(false)}
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
