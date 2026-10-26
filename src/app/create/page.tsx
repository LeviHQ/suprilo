"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Heart,
  PartyPopper,
  Share2,
  RefreshCw,
  Sliders,
  Gift,
  Cake,
  Flower2,
  Trophy,
  Star,
  Camera,
  Trash2,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { ScratchCard, CoverStyle } from "@/components/scratch/ScratchCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CreationIntroAnimation } from "@/components/create/CreationIntroAnimation";
import { CreationChoiceCards } from "@/components/create/CreationChoiceCards";
import {
  getTemplateById,
  DEFAULT_SCRATCH_TEMPLATE,
} from "@/data/templates";
import { cn } from "@/lib/utils";

// Foil Finishes
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

// Interior Card Background Palettes
const BG_PALETTES = [
  {
    id: "soft-pink",
    name: "Soft Pink",
    gradient: "from-pink-50 via-white to-rose-50",
    textColor: "text-rose-950",
    border: "border-pink-200",
  },
  {
    id: "warm-sunshine",
    name: "Sunshine",
    gradient: "from-amber-50 via-white to-orange-50",
    textColor: "text-amber-950",
    border: "border-amber-200",
  },
  {
    id: "royal-amethyst",
    name: "Amethyst",
    gradient: "from-purple-50 via-white to-indigo-50",
    textColor: "text-indigo-950",
    border: "border-purple-200",
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    gradient: "from-emerald-50 via-white to-teal-50",
    textColor: "text-emerald-950",
    border: "border-emerald-200",
  },
  {
    id: "pure-ivory",
    name: "Pure Ivory",
    gradient: "from-brand-warm-subtle via-white to-brand-warm",
    textColor: "text-brand-dark",
    border: "border-brand-warm-border",
  },
];

// Decorative Stickers
const STICKERS = [
  { id: "heart", label: "Heart", icon: Heart },
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "cake", label: "Cake", icon: Cake },
  { id: "flower", label: "Flower", icon: Flower2 },
  { id: "gift", label: "Gift", icon: Gift },
  { id: "confetti", label: "Party", icon: PartyPopper },
  { id: "trophy", label: "Trophy", icon: Trophy },
  { id: "star", label: "Star", icon: Star },
];

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function CreateCardStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isSigningIn, signInWithGoogle } = useAuth();

  const templateParam = searchParams.get("template");
  const modeParam = searchParams.get("mode");

  // Flow State: 'choices' (with animated intro) or 'editor'
  const [viewState, setViewState] = React.useState<"choices" | "editor">(() => {
    if (templateParam || modeParam) return "editor";
    return "choices";
  });

  const [hasIntroCompleted, setHasIntroCompleted] = React.useState(false);

  // Card Content State
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(templateParam);
  const [tag, setTag] = React.useState("Special Surprise");
  const [recipient, setRecipient] = React.useState("Maya");
  const [message, setMessage] = React.useState("“You're someone else's little bit of magic 💖”");
  const [secondary, setSecondary] = React.useState("Thanks for making ordinary moments special.");
  const [sender, setSender] = React.useState("Alex");
  const [coverStyle, setCoverStyle] = React.useState<CoverStyle>("lavender-pink");
  const [coverText, setCoverText] = React.useState("Scratch to reveal your surprise ✨");
  const [selectedBgPalette, setSelectedBgPalette] = React.useState("soft-pink");
  const [selectedSticker, setSelectedSticker] = React.useState("heart");
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);

  // Scratch card instance key to force clean canvas remount
  const [cardKey, setCardKey] = React.useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Set sender initial name from authenticated user if available
  React.useEffect(() => {
    if (user?.displayName && sender === "Alex") {
      const firstName = user.displayName.split(" ")[0];
      if (firstName) setSender(firstName);
    }
  }, [user, sender]);

  // Load configuration whenever template query param changes
  React.useEffect(() => {
    if (templateParam) {
      const template = getTemplateById(templateParam);
      if (template) {
        setSelectedTemplateId(template.id);
        setTag(template.tag);
        setRecipient(template.recipient);
        setMessage(template.message);
        setSecondary(template.secondary);
        setCoverStyle(template.coverStyle);
        setCoverText(template.coverText);
        setSender(user?.displayName ? user.displayName.split(" ")[0] : template.sender);
        setViewState("editor");
        setCardKey((prev) => prev + 1);
      }
    } else if (modeParam === "scratch") {
      setSelectedTemplateId(null);
      setTag(DEFAULT_SCRATCH_TEMPLATE.tag);
      setRecipient(DEFAULT_SCRATCH_TEMPLATE.recipient);
      setMessage(DEFAULT_SCRATCH_TEMPLATE.message);
      setSecondary(DEFAULT_SCRATCH_TEMPLATE.secondary);
      setCoverStyle(DEFAULT_SCRATCH_TEMPLATE.coverStyle);
      setCoverText(DEFAULT_SCRATCH_TEMPLATE.coverText);
      setSender(user?.displayName ? user.displayName.split(" ")[0] : DEFAULT_SCRATCH_TEMPLATE.sender);
      setViewState("editor");
      setCardKey((prev) => prev + 1);
    }
  }, [templateParam, modeParam, user]);

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
        setCardKey((prev) => prev + 1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCardKey((prev) => prev + 1);
  };

  const handleBack = () => {
    if (viewState === "editor" && !templateParam && !modeParam) {
      setViewState("choices");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleResetCard = () => {
    setCardKey((prev) => prev + 1);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-warm flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-brand-dark">Loading your Card Studio...</p>
        </div>
      </div>
    );
  }

  // Auth Gate: Require sign in to create cards
  if (!user) {
    return (
      <div className="min-h-screen bg-brand-warm flex flex-col">
        <header className="h-16 border-b border-brand-warm-border bg-white px-4">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-brand-warm-subtle text-brand-dark hover:text-brand-pink border border-brand-warm-border shadow-xs active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink shrink-0"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="relative h-8 w-24">
              <Image src="/brand/logo.png" alt="Suprilo" fill className="object-contain" priority />
            </div>
            <div className="w-9" />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-brand-warm-border shadow-card text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <Badge variant="purple">Authentication Required</Badge>
              <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                Sign in to Create Your Card
              </h1>
              <p className="text-sm text-brand-muted leading-relaxed">
                Connect your Google account to craft, customize, and preview your interactive scratch-card surprises.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => signInWithGoogle("/create")}
                disabled={isSigningIn}
                className="w-full justify-center gap-2.5 shadow-md"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{isSigningIn ? "Signing in..." : "Continue with Google"}</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/");
                  }
                }}
                className="w-full justify-center text-xs"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Background Palette config
  const activePalette =
    BG_PALETTES.find((p) => p.id === selectedBgPalette) || BG_PALETTES[0];

  // Sticker Component renderer
  const renderStickerIcon = () => {
    switch (selectedSticker) {
      case "heart":
        return <Heart className="w-6 h-6 fill-brand-pink text-brand-pink animate-pulse" />;
      case "sparkles":
        return <Sparkles className="w-6 h-6 text-brand-orange animate-spin" style={{ animationDuration: "5s" }} />;
      case "cake":
        return <Cake className="w-6 h-6 text-amber-500" />;
      case "flower":
        return <Flower2 className="w-6 h-6 text-pink-500" />;
      case "gift":
        return <Gift className="w-6 h-6 text-purple-600" />;
      case "confetti":
        return <PartyPopper className="w-6 h-6 text-orange-500" />;
      case "trophy":
        return <Trophy className="w-6 h-6 text-amber-500" />;
      case "star":
        return <Star className="w-6 h-6 text-yellow-500 fill-yellow-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-brand-pink" />;
    }
  };

  // Hidden Content revealed when scratched
  const hiddenContent = (
    <div
      className={cn(
        "flex flex-col justify-between h-full text-center p-2 rounded-xl transition-colors duration-300",
        activePalette.textColor
      )}
    >
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

      {/* Main Message Note + Optional Photo */}
      <div className="my-auto py-2 space-y-2.5">
        {photoUrl ? (
          <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-white ring-2 ring-brand-pink/30">
            <Image
              src={photoUrl}
              alt="Secret memory photo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-sm border border-brand-warm-border flex items-center justify-center">
            {renderStickerIcon()}
          </div>
        )}

        <h4 className="text-lg sm:text-xl font-extrabold leading-snug px-2 tracking-tight">
          {message || "Your secret message will appear here!"}
        </h4>

        {secondary && (
          <p className="text-xs sm:text-sm opacity-80 leading-relaxed max-w-[280px] mx-auto font-medium">
            {secondary}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] opacity-75 pt-2 border-t border-brand-warm-border/40">
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
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:bg-brand-warm-subtle text-brand-dark hover:text-brand-pink border border-brand-warm-border shadow-xs active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink shrink-0"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 sm:h-9 w-24 sm:w-28 aspect-[800/285]">
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

          <div className="flex items-center gap-2.5">
            {viewState === "editor" && (
              <Link href="/templates">
                <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                  <Wand2 className="w-3.5 h-3.5 text-brand-pink" />
                  <span className="hidden sm:inline">Browse Templates</span>
                  <span className="sm:hidden">Templates</span>
                </Button>
              </Link>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-brand-warm-subtle border border-brand-warm-border transition-colors"
              title="View Profile Dashboard"
            >
              <UserAvatar user={user} size="sm" />
              <span className="hidden sm:inline text-xs font-semibold text-brand-dark">
                {user.displayName?.split(" ")[0] || "Profile"}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ======================================================== */}
        {/* VIEW 1: CREATION CHOICE SCREEN WITH DELIGHTFUL INTRO */}
        {/* ======================================================== */}
        {viewState === "choices" ? (
          <div className="space-y-6">
            {!hasIntroCompleted && (
              <CreationIntroAnimation onComplete={() => setHasIntroCompleted(true)} />
            )}

            <CreationChoiceCards
              onSelectScratch={() => {
                setViewState("editor");
                router.push("/create?mode=scratch");
              }}
              onExploreTemplates={() => {
                router.push("/templates");
              }}
            />
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: SHARED CARD STUDIO EDITOR */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-brand-warm-border shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-pink-light text-brand-pink flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-brand-dark">
                      {selectedTemplateId
                        ? `Editing: ${getTemplateById(selectedTemplateId)?.title || "Template"}`
                        : "Custom Scratch Creation"}
                    </h2>
                    <Badge variant="pink" className="text-[10px] py-0">
                      Live Studio
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-muted">
                    Preview your card live on the right. Scratch with your finger or mouse!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewState("choices")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark px-3 py-1.5 rounded-xl border border-brand-warm-border hover:bg-brand-warm-subtle transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another Mode</span>
                </button>
              </div>
            </div>

            {/* Split Grid: Left Editor Controls (7 cols) + Right Live Preview (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Recipient & Occasion Details */}
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-5">
                  <h3 className="text-base font-bold text-brand-dark">1. Card Header & Names</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label htmlFor="sender" className="font-semibold text-brand-dark">
                      Your Name / Sender Signature
                    </label>
                    <input
                      id="sender"
                      type="text"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm"
                    />
                  </div>
                </div>

                {/* 2. Hidden Message & Secret Note */}
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-5">
                  <h3 className="text-base font-bold text-brand-dark">2. Secret Hidden Message</h3>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label htmlFor="message" className="font-semibold text-brand-dark">
                        Primary Surprise Text (Revealed upon scratch)
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your heartfelt secret or exciting reveal..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="secondary" className="font-semibold text-brand-dark">
                        Secondary Message / Hint (Optional)
                      </label>
                      <input
                        id="secondary"
                        type="text"
                        value={secondary}
                        onChange={(e) => setSecondary(e.target.value)}
                        placeholder="e.g. Dinner reservation at 8 PM tonight!"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Scratch Foil Finish Selection */}
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-brand-dark">3. Scratch Foil Texture</h3>
                    <p className="text-xs text-brand-muted">Choose the metallic sheen that coats your card</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {FOIL_OPTIONS.map((foil) => {
                      const isSelected = coverStyle === foil.id;
                      return (
                        <button
                          key={foil.id}
                          type="button"
                          onClick={() => {
                            setCoverStyle(foil.id);
                            setCardKey((prev) => prev + 1);
                          }}
                          className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                            isSelected
                              ? "bg-brand-pink-light/60 border-brand-pink ring-2 ring-brand-pink/20 shadow-sm"
                              : "border-brand-warm-border bg-brand-warm-subtle/40 hover:border-brand-pink/30 hover:bg-white"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${foil.previewColor} shadow-inner shrink-0 mt-0.5 border border-white/50`}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-brand-dark block truncate">
                              {foil.name}
                            </span>
                            <span className="text-[10px] text-brand-muted line-clamp-1">
                              {foil.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Foil Prompt Text */}
                  <div className="pt-2 space-y-1.5 text-xs">
                    <label htmlFor="coverText" className="font-semibold text-brand-dark">
                      Foil Overlay Instructions
                    </label>
                    <input
                      id="coverText"
                      type="text"
                      value={coverText}
                      onChange={(e) => setCoverText(e.target.value)}
                      placeholder="e.g. Scratch to reveal your surprise ✨"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark text-xs focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink"
                    />
                  </div>
                </div>

                {/* 4. Background Palette & Sticker Styling */}
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-brand-dark">4. Interior Styling & Stickers</h3>
                    <p className="text-xs text-brand-muted">Customize the revealed backdrop and decorative icon</p>
                  </div>

                  {/* Palette Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-brand-dark">Card Background Theme</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {BG_PALETTES.map((palette) => {
                        const isSelected = selectedBgPalette === palette.id;
                        return (
                          <button
                            key={palette.id}
                            type="button"
                            onClick={() => {
                              setSelectedBgPalette(palette.id);
                              setCardKey((k) => k + 1);
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-center transition-all text-xs font-semibold bg-gradient-to-br",
                              palette.gradient,
                              isSelected
                                ? "ring-2 ring-brand-pink border-brand-pink shadow-sm scale-105"
                                : "border-brand-warm-border opacity-85 hover:opacity-100"
                            )}
                          >
                            <span className={palette.textColor}>{palette.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sticker Selector */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-brand-dark">Decorative Sticker</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {STICKERS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = selectedSticker === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedSticker(item.id);
                              setCardKey((k) => k + 1);
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border flex items-center justify-center shrink-0 transition-all",
                              isSelected
                                ? "bg-brand-pink-light border-brand-pink text-brand-pink ring-2 ring-brand-pink/20 shadow-sm"
                                : "bg-white border-brand-warm-border text-brand-muted hover:text-brand-dark"
                            )}
                            title={item.label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Photo Memory Attachment */}
                  <div className="space-y-2 pt-2 border-t border-brand-warm-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand-dark">
                        Personal Hidden Photo (Optional)
                      </span>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload-input"
                    />

                    {photoUrl ? (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <Image src={photoUrl} alt="Preview" fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="font-bold text-brand-dark truncate">Custom Photo Attached</p>
                          <p className="text-[10px] text-brand-muted">Appears beneath the scratch foil</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs shrink-0"
                        >
                          Replace
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-brand-warm-border hover:border-brand-pink/40 bg-brand-warm-subtle/40 flex items-center justify-center gap-2 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors"
                      >
                        <Camera className="w-4 h-4 text-brand-pink" />
                        <span>Upload a secret photo from device (JPG, PNG)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Interactive Live Scratch Preview (5 cols) */}
              <div className="lg:col-span-5 sticky top-24 space-y-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-warm-border shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-brand-dark">Interactive Live Preview</h3>
                      <p className="text-[11px] text-brand-muted">Scratch the card to test your surprise</p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResetCard}
                      className="gap-1 text-xs px-2.5 py-1"
                      title="Reset foil"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Foil</span>
                    </Button>
                  </div>

                  {/* Real Canvas Scratch Component */}
                  <div className="flex justify-center py-2">
                    <div className="w-full max-w-[340px]">
                      <ScratchCard
                        key={cardKey}
                        hiddenContent={hiddenContent}
                        coverStyle={coverStyle}
                        coverText={coverText}
                        revealThreshold={0.65}
                        brushRadius={26}
                        className="shadow-lg mx-auto"
                      />
                    </div>
                  </div>

                  {/* Share CTA button */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full justify-center gap-2 font-bold shadow-md hover:shadow-brand-pink/25"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share This Surprise Card</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Share / Publish Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => setIsShareModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-brand-warm-border space-y-5 z-10 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink-light text-brand-pink flex items-center justify-center mx-auto shadow-inner">
              <Share2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-extrabold text-brand-dark">Your Surprise is Ready!</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                Copy the link below or send it directly to your recipient. When they open it, they can scratch off the foil to discover your secret note!
              </p>
            </div>

            {/* Link Box */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-warm border border-brand-warm-border text-xs font-mono">
              <span className="truncate flex-1 text-brand-dark">
                suprilo.com/s/demo-{coverStyle}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `https://suprilo.com/s/demo-${coverStyle}`
                  );
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-brand-warm-border text-brand-pink font-sans font-bold hover:bg-brand-pink-light transition-colors shrink-0"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsShareModalOpen(false)}
              className="w-full justify-center text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateCardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-brand-warm flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-pink-light flex items-center justify-center text-brand-pink animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-brand-dark">Loading your Card Studio...</p>
          </div>
        </div>
      }
    >
      <CreateCardStudio />
    </React.Suspense>
  );
}
