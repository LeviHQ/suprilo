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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Gamepad2,
  HeartHandshake,
} from "lucide-react";
import { ScratchCard, CoverStyle } from "@/components/scratch/ScratchCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StudioSidebar } from "@/components/create/StudioSidebar";
import { StudioMobileNav } from "@/components/create/StudioMobileNav";
import { TemplateStudioCard } from "@/components/create/TemplateStudioCard";
import {
  SU_PRILO_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getCuratedGeneralTemplates,
  getTemplateById,
  TemplateCategory,
  TemplateDefinition,
} from "@/data/templates";
import { Menu, Search, X, Paintbrush } from "lucide-react";
import { useCardEditor } from "@/hooks/useCardEditor";
import { useCardDraftSync } from "@/hooks/useCardDraftSync";
import { useCardAutosave } from "@/hooks/useCardAutosave";
import { useCardPhotoUpload } from "@/hooks/useCardPhotoUpload";
import { useCardPublish } from "@/hooks/useCardPublish";
import { recordStudioVisit } from "@/lib/badges/service";
import { BgPaletteId, StickerId } from "@/types/card";
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
const BG_PALETTES: {
  id: BgPaletteId;
  name: string;
  gradient: string;
  textColor: string;
  border: string;
}[] = [
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
const STICKERS: { id: StickerId; label: string; icon: React.ElementType }[] = [
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
  const { user, loading, isSigningIn, signInWithGoogle, openAuthModal } = useAuth();

  const templateParam = searchParams.get("template");
  const modeParam = searchParams.get("mode");

  // Determine user first name for default sender assignment
  const userFirstName = user?.displayName ? user.displayName.split(" ")[0] : "Alex";

  // Flow State: 'choices' (with animated intro) or 'editor'
  const [viewState, setViewState] = React.useState<"choices" | "editor">(() => {
    if (templateParam || modeParam) return "editor";
    return "choices";
  });

  const [activeCategory, setActiveCategory] = React.useState<TemplateCategory>("general");
  const [smartTab, setSmartTab] = React.useState<SmartTab>("life");
  const [quickFilter, setQuickFilter] = React.useState<QuickFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [shuffleSeed, setShuffleSeed] = React.useState(42);

  // Canonical reducer-backed card editor hook
  const {
    state,
    cardKey,
    characterCounts,
    limits,
    setField,
    setPhotoUrl,
    setFoilStyle,
    setBgPalette,
    setSticker,
    applyTemplate,
    initScratch,
    remountCanvas,
    clearDraft,
  } = useCardEditor({
    templateParam,
    modeParam,
    defaultSender: userFirstName,
  });

  // Supabase Draft Synchronization (Task 2C-5.3.1)
  const {
    draftId,
    syncStatus,
    syncError,
    isLimitReached,
    retryCreateDraft,
    clearActiveDraft,
  } = useCardDraftSync({
    user,
    isActive: viewState === "editor",
    editorState: state,
    templateParam,
  });

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [isPublished, setIsPublished] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset published status when draft or account switches
  React.useEffect(() => {
    setIsPublished(false);
  }, [draftId, user?.id]);

  // Record Studio visit for Badge #1 ('first-step': Welcome Creator)
  React.useEffect(() => {
    if (user?.id) {
      recordStudioVisit(user.id).catch(() => {});
    }
  }, [user?.id]);

  // Supabase Draft Autosave (Task 2C-5.3.2)
  const {
    saveStatus,
    saveError,
    retryAutosave,
    flushAutosave,
    savePhotoPath,
  } = useCardAutosave({
    draftId,
    isDraftReady: syncStatus === "created" && !isPublished,
    user,
    isActive: viewState === "editor",
    editorState: state,
    isPublished,
  });

  // Supabase Photo Upload Integration (Task 2C-5.3.3)
  const {
    uploadStatus,
    uploadError,
    handleFileSelect,
    retryUpload,
    removePhoto,
    clearUploadError,
  } = useCardPhotoUpload({
    draftId,
    isDraftReady: syncStatus === "created" && !isPublished,
    user,
    isActive: viewState === "editor",
    currentPhotoPath: state.photoPath,
    savePhotoPath,
    onPhotoUploaded: (uploadedPath) => {
      setField("photoPath", uploadedPath);
    },
    onPhotoRemoved: () => {
      setField("photoPath", null);
      setPhotoUrl(null);
    },
    onPreviewReady: (previewUrl) => {
      setPhotoUrl(previewUrl);
    },
  });

  // Supabase Card Publish Integration (Task 2C-5.3.4)
  const {
    publishStatus,
    publishError,
    publishedCard,
    publishedUrl,
    isPublishing,
    publishCard,
    clearPublishError,
  } = useCardPublish({
    draftId,
    isDraftReady: syncStatus === "created",
    user,
    isActive: viewState === "editor",
    saveStatus,
    saveError,
    flushAutosave,
    uploadStatus,
    uploadError,
    onPublished: () => {
      setIsPublished(true);
      setIsShareModalOpen(true);
    },
  });

  // Sync viewState when search parameters change externally
  React.useEffect(() => {
    if (templateParam || modeParam) {
      setViewState("editor");
    }
  }, [templateParam, modeParam]);

  // Handle Photo selection from file input
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    await removePhoto();
  };

  const handleBack = () => {
    if (viewState === "editor") {
      setViewState("choices");
      router.push("/create");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleResetCard = () => {
    remountCanvas();
  };

  const handleSelectTemplate = (template: TemplateDefinition) => {
    if (!user) {
      openAuthModal(`/create?template=${template.id}`);
    } else {
      applyTemplate(template);
      setViewState("editor");
      router.push(`/create?template=${template.id}`);
    }
  };

  const handleStartFromScratch = () => {
    if (!user) {
      openAuthModal("/create?mode=scratch");
    } else {
      initScratch();
      setViewState("editor");
      router.push("/create?mode=scratch");
    }
  };

  const displayedTemplates = React.useMemo(() => {
    let list: TemplateDefinition[];
    if (activeCategory === "general") {
      list = getCuratedGeneralTemplates(shuffleSeed);
    } else {
      list = SU_PRILO_TEMPLATES.filter((t) => t.category === activeCategory);
    }

    // Apply Quick Filter chips
    if (quickFilter === "trending") {
      list = list.filter(
        (t) =>
          t.category === "holidays" ||
          t.category === "celebrations" ||
          /diwali|christmas|new year|valentine|halloween|thanksgiving|easter/i.test(
            t.title + t.tag + t.categoryLabel
          )
      );
    } else if (quickFilter === "emotional") {
      list = list.filter(
        (t) =>
          ["heartfelt", "love", "friendship"].includes(t.category) ||
          /hug|love|thank|grateful|comfort|sister|miss|sanctuary/i.test(t.message + t.title)
      );
    } else if (quickFilter === "funny") {
      list = list.filter(
        (t) =>
          t.category === "funny" ||
          /roast|joke|sarcas|laugh|damage|burn|scam|adult/i.test(
            t.title + t.description + t.tag
          )
      );
    } else if (quickFilter === "vouchers") {
      list = list.filter(
        (t) =>
          t.category === "reveals" ||
          /voucher|coupon|treat|coffee|pass|flight|concert|spa|dinner|keys/i.test(
            t.title + t.message + t.tag
          )
      );
    } else if (quickFilter === "minimalist") {
      list = list.filter(
        (t) =>
          t.coverStyle === "golden-foil" ||
          t.bgGradient.includes("stone") ||
          /minimal|chic|vintage|toast|sanctuary/i.test(t.title + t.description)
      );
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        t.recipient.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q)
    );
  }, [activeCategory, shuffleSeed, quickFilter, searchQuery]);

  const currentCategoryMeta = React.useMemo(() => {
    return (
      TEMPLATE_CATEGORIES.find((c) => c.id === activeCategory) ||
      TEMPLATE_CATEGORIES[0]
    );
  }, [activeCategory]);

  const handleChooseAnotherMode = () => {
    clearDraft();
    clearActiveDraft();
    setViewState("choices");
    router.replace("/create");
  };

  // Loading Screen only when entering active editor studio
  if (loading && viewState === "editor") {
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

  // Auth Gate: Require sign in when entering the active card editor studio
  if (viewState === "editor" && !user) {
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
            <BrandLogo href="/" size="sm" priority />
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
    BG_PALETTES.find((p) => p.id === state.bgPalette) || BG_PALETTES[0];

  // Sticker Component renderer
  const renderStickerIcon = () => {
    switch (state.sticker) {
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

  // Hidden Content revealed when scratched (Pure Surprise Showcase)
  const hiddenContent = (
    <div
      className={cn(
        "flex flex-col justify-center items-center h-full w-full text-center px-3 py-5 rounded-[20px] transition-all duration-300 space-y-3.5 sm:space-y-4",
        activePalette.textColor
      )}
    >
      {/* 1. HERO VISUAL: Secret Memory Photo OR Celebratory Sticker */}
      {state.photoUrl ? (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl overflow-hidden shadow-xl border-3 border-white ring-4 ring-brand-pink/25 transform rotate-[-2deg] hover:rotate-0 transition-transform">
          <Image
            src={state.photoUrl}
            alt="Secret memory photo"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-white/95 border border-white flex items-center justify-center shadow-lg shadow-brand-pink/15">
          {renderStickerIcon()}
        </div>
      )}

      {/* 2. THE BIG SURPRISE MESSAGE (Emotional, Bold, Dramatic Typography) */}
      <div className="space-y-1.5 max-w-[280px] mx-auto">
        <h4
          className={cn(
            "font-black tracking-tight leading-snug px-1 break-words drop-shadow-xs",
            state.primaryMessage.length > 80
              ? "text-sm sm:text-base"
              : state.primaryMessage.length > 40
              ? "text-base sm:text-lg"
              : "text-lg sm:text-xl"
          )}
        >
          {state.primaryMessage || "Your secret surprise will appear here! ✨"}
        </h4>

        {/* 3. OPTIONAL SECONDARY SECRET NOTE */}
        {state.secondaryMessage && (
          <div className="px-2.5 py-1.5 rounded-xl border border-black/5 bg-white/60 text-[11px] sm:text-xs font-medium leading-relaxed break-words shadow-xs">
            {state.secondaryMessage}
          </div>
        )}
      </div>

      {/* 4. Atmospheric floating decorative spark */}
      <div className="flex items-center justify-center gap-1.5 opacity-60 text-[10px] font-semibold tracking-wider uppercase">
        <Sparkles className="w-3 h-3 text-brand-orange" />
        <span>Secret Surprise</span>
        <Sparkles className="w-3 h-3 text-brand-orange" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-warm text-brand-dark flex flex-col selection:bg-brand-pink/15 selection:text-brand-pink w-full max-w-full overflow-x-clip min-w-0">
      {viewState === "choices" ? (
        <>
          {/* Left Sidebar for Desktop */}
          <StudioSidebar
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectScratch={handleStartFromScratch}
          />

          {/* Slide-over Mobile Navigation Drawer */}
          <StudioMobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onSelectScratch={handleStartFromScratch}
          />

          {/* Main Studio Area */}
          <div className="lg:pl-64 xl:pl-72 flex-1 flex flex-col min-h-screen w-full max-w-full min-w-0 overflow-visible">
            {/* Studio Header */}
            <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-brand-warm-border px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full max-w-full overflow-visible">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="lg:hidden p-2 -ml-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors shrink-0"
                  aria-label="Open categories menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 lg:hidden min-w-0">
                  <BrandLogo href="/" size="sm" priority />
                </div>

                <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-brand-muted">
                  <Link href="/" className="hover:text-brand-dark transition-colors">
                    Suprilo
                  </Link>
                  <span className="text-brand-warm-border">/</span>
                  <span className="text-brand-dark font-bold">Creation Studio</span>
                  <span className="text-brand-warm-border">/</span>
                  <span className="text-brand-pink font-bold flex items-center gap-1.5">
                    <span>{currentCategoryMeta.icon}</span>
                    <span>{currentCategoryMeta.label}</span>
                  </span>
                </div>
              </div>

              {/* Right: Search Box & Profile */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative hidden sm:block w-60 md:w-72">
                  <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 100 templates..."
                    className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-xs text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-pink focus:border-brand-pink transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2 p-0.5 rounded-full text-brand-muted hover:text-brand-dark"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {user ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal("/create")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:text-brand-pink px-3 py-1.5 rounded-full bg-brand-warm-subtle border border-brand-warm-border/80 hover:bg-brand-warm-border transition-colors"
                  >
                    <UserAvatar user={null} size="sm" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
              </div>
            </header>

            {/* Main Showcase Feed */}
            <main className="flex-1 w-full max-w-7xl min-w-0 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-clip">
              {/* Mobile search bar */}
              <div className="relative block sm:hidden w-full">
                <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 100 templates..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-brand-warm-border bg-white text-xs text-brand-dark placeholder:text-brand-muted shadow-xs focus:outline-none focus:ring-1 focus:ring-brand-pink focus:border-brand-pink"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 p-0.5 text-brand-muted hover:text-brand-dark"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 1. THE 3 SMART TOP TABS (Modular Category Architecture) */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-brand-warm-border shadow-xs overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setSmartTab("life");
                    setActiveCategory("general");
                    setQuickFilter("all");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    smartTab === "life"
                      ? "bg-brand-pink text-white shadow-xs"
                      : "text-brand-dark/70 hover:bg-brand-warm hover:text-brand-dark"
                  )}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Life & Milestones</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSmartTab("trending");
                    setActiveCategory("holidays");
                    setQuickFilter("all");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    smartTab === "trending"
                      ? "bg-brand-pink text-white shadow-xs"
                      : "text-brand-dark/70 hover:bg-brand-warm hover:text-brand-dark"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Trending & Calendar</span>
                  <span className="text-[10px] bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded-md font-black">
                    HOT
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSmartTab("mystery");
                    setActiveCategory("funny");
                    setQuickFilter("all");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    smartTab === "mystery"
                      ? "bg-brand-pink text-white shadow-xs"
                      : "text-brand-dark/70 hover:bg-brand-warm hover:text-brand-dark"
                  )}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Mystery & Fun</span>
                </button>
              </div>

              {/* 2. DYNAMIC "HAPPENING THIS WEEK" FESTIVE BANNER (Active on Trending / Holidays) */}
              {(smartTab === "trending" || activeCategory === "holidays") && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-brand-pink text-white shadow-lg space-y-3 relative overflow-hidden animate-in fade-in duration-300">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs">
                        <Sparkles className="w-3 h-3" />
                        Happening This Week
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                        Festival & Holiday Scratch Magic 🪔✨
                      </h3>
                      <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                        Diwali Lights, Christmas Cheer, and New Year Celebrations are trending! Choose a festive card to reveal your greetings with golden foil.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const festive =
                            SU_PRILO_TEMPLATES.find((t) => t.id === "holiday-diwali-lights") ||
                            SU_PRILO_TEMPLATES.find((t) => t.category === "holidays");
                          if (festive) handleSelectTemplate(festive);
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-white text-brand-dark text-xs font-black shadow-md hover:bg-stone-50 active:scale-95 transition-all"
                      >
                        Use Festive Card 🪔
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. QUICK-FILTER HORIZONTAL CHIPS */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] font-bold text-brand-muted shrink-0 mr-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  Quick Filter:
                </span>
                {QUICK_FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setQuickFilter(chip.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                      quickFilter === chip.id
                        ? "bg-brand-pink text-white border-brand-pink shadow-xs font-bold"
                        : "bg-white hover:bg-brand-warm-subtle text-brand-dark border-brand-warm-border hover:border-brand-pink/40"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Category Hero Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-pink-light text-brand-pink border border-brand-pink/20">
                    <span className="text-base">{currentCategoryMeta.icon}</span>
                    <span>{currentCategoryMeta.label}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                    {activeCategory === "general"
                      ? "Curated Inspiration Showcase"
                      : currentCategoryMeta.label}
                  </h1>
                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {currentCategoryMeta.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                  {activeCategory === "general" && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setShuffleSeed((s) => s + 1)}
                      className="gap-2 text-xs font-bold border-brand-warm-border hover:border-brand-pink shadow-2xs"
                      title="Randomize templates mix"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-brand-pink" />
                      <span>Shuffle Mix</span>
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleStartFromScratch}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-pink to-brand-orange text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>Blank Canvas</span>
                  </button>
                </div>
              </div>

              {/* Counter info */}
              <div className="flex items-center justify-between text-xs text-brand-muted px-1">
                <span>
                  Showing <strong className="text-brand-dark font-bold">{displayedTemplates.length}</strong> design{displayedTemplates.length === 1 ? "" : "s"}
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-brand-pink font-semibold hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {/* Template Cards Grid */}
              {displayedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                  {displayedTemplates.map((template) => (
                    <TemplateStudioCard
                      key={template.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-brand-warm-border p-8 space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-warm-subtle flex items-center justify-center text-brand-muted">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-brand-dark">No matching templates found</h3>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    We couldn&apos;t find any designs matching &ldquo;{searchQuery}&rdquo;. Try another keyword or reset your filter.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="text-xs"
                  >
                    Reset Search
                  </Button>
                </div>
              )}
            </main>
          </div>
        </>
      ) : (
        <>
          {/* Top Navigation for Editor */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-warm-border w-full max-w-full overflow-visible">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-brand-warm-subtle text-brand-dark hover:text-brand-pink border border-brand-warm-border shadow-xs active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink shrink-0 text-xs font-bold"
                  aria-label="Back to templates"
                  title="Back to templates"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Templates</span>
                </button>

                <BrandLogo href="/" size="sm" priority />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-pink hover:bg-brand-pink-light px-3 py-1.5 rounded-full border border-brand-pink/20 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Explore Designs</span>
                </button>

                {user ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal("/create")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:text-brand-pink px-3 py-1.5 rounded-full bg-brand-warm-subtle border border-brand-warm-border/80 hover:bg-brand-warm-border transition-colors"
                  >
                    <UserAvatar user={null} size="sm" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Main Studio Editor Body */}
          <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-8 overflow-hidden">
            <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-brand-warm-border shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-pink-light text-brand-pink flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-brand-dark">
                      {state.templateId
                        ? `Editing: ${getTemplateById(state.templateId)?.title || "Template"}`
                        : "Custom Scratch Creation"}
                    </h2>
                    {publishStatus === "published" ? (
                      <Badge variant="neutral" className="text-[10px] py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="pink" className="text-[10px] py-0">
                        Live Studio
                      </Badge>
                    )}
                    {syncStatus === "creating" && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-brand-muted animate-pulse font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin text-brand-pink" />
                        <span>Initializing draft...</span>
                      </span>
                    )}
                    {syncStatus === "created" && draftId && (
                      <>
                        {saveStatus === "saving" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-brand-muted animate-pulse font-medium">
                            <RefreshCw className="w-3 h-3 animate-spin text-brand-pink" />
                            <span>Saving...</span>
                          </span>
                        )}
                        {(saveStatus === "saved" || saveStatus === "idle") && (
                          <Badge variant="neutral" className="text-[10px] py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                            Saved
                          </Badge>
                        )}
                        {saveStatus === "error" && (
                          <span className="inline-flex items-center gap-1.5">
                            <Badge
                              variant="neutral"
                              className="text-[10px] py-0 bg-rose-50 text-rose-700 border-rose-200"
                              title={saveError || "Autosave failed"}
                            >
                              Save failed
                            </Badge>
                            <button
                              type="button"
                              onClick={() => void retryAutosave()}
                              className="text-[11px] font-semibold text-brand-pink hover:text-brand-pink-dark underline cursor-pointer"
                            >
                              Retry
                            </button>
                          </span>
                        )}
                      </>
                    )}
                    {syncStatus === "error" && (
                      <Badge variant="neutral" className="text-[10px] py-0 bg-rose-50 text-rose-700 border-rose-200">
                        {isLimitReached ? "Draft Limit Reached" : "Sync Offline"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted">
                    Preview your card live on the right. Scratch with your finger or mouse!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleChooseAnotherMode}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark px-3 py-1.5 rounded-xl border border-brand-warm-border hover:bg-brand-warm-subtle transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Another Mode</span>
                </button>
              </div>
            </div>

            {/* Draft Sync Error Alert Banner */}
            {syncStatus === "error" && syncError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                    !
                  </div>
                  <div>
                    <span className="font-semibold">{syncError}</span>
                    {isLimitReached && (
                      <span className="block sm:inline sm:ml-1 text-rose-600">
                        You can manage your existing cards in your{" "}
                        <Link href="/profile" className="font-bold underline hover:text-rose-900">
                          Profile Dashboard
                        </Link>
                        .
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void retryCreateDraft()}
                    className="text-xs px-3 py-1 bg-white hover:bg-rose-100 text-rose-800 border-rose-300"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Publish Error Alert Banner (Task 2C-5.3.4) */}
            {publishError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                    !
                  </div>
                  <div>
                    <span className="font-semibold">{publishError}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void publishCard()}
                    className="text-xs px-3 py-1 bg-white hover:bg-rose-100 text-rose-800 border-rose-300"
                  >
                    Retry Publish
                  </Button>
                  <button
                    type="button"
                    onClick={clearPublishError}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 text-sm leading-none cursor-pointer"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Split Grid: Left Editor Controls (7 cols) + Right Live Preview (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Recipient & Occasion Details */}
                <div className="bg-white rounded-3xl p-6 border border-brand-warm-border shadow-card space-y-5">
                  <h3 className="text-base font-bold text-brand-dark">1. Card Header & Names</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="recipient" className="font-semibold text-brand-dark">
                          Recipient Name
                        </label>
                        <span className="text-[10px] text-brand-muted font-mono">
                          {characterCounts.recipient.current}/{limits.RECIPIENT_MAX}
                        </span>
                      </div>
                      <input
                        id="recipient"
                        type="text"
                        maxLength={limits.RECIPIENT_MAX}
                        value={state.recipientName}
                        onChange={(e) => setField("recipientName", e.target.value)}
                        placeholder="e.g. Maya"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="tag" className="font-semibold text-brand-dark">
                          Occasion Tag
                        </label>
                        <span className="text-[10px] text-brand-muted font-mono">
                          {characterCounts.tag.current}/{limits.TAG_MAX}
                        </span>
                      </div>
                      <input
                        id="tag"
                        type="text"
                        maxLength={limits.TAG_MAX}
                        value={state.occasionTag}
                        onChange={(e) => setField("occasionTag", e.target.value)}
                        placeholder="e.g. Happy Birthday!"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <label htmlFor="sender" className="font-semibold text-brand-dark">
                        Your Name / Sender Signature
                      </label>
                      <span className="text-[10px] text-brand-muted font-mono">
                        {characterCounts.sender.current}/{limits.SENDER_MAX}
                      </span>
                    </div>
                    <input
                      id="sender"
                      type="text"
                      maxLength={limits.SENDER_MAX}
                      value={state.senderName}
                      onChange={(e) => setField("senderName", e.target.value)}
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
                      <div className="flex items-center justify-between">
                        <label htmlFor="message" className="font-semibold text-brand-dark">
                          Primary Surprise Text (Revealed upon scratch)
                        </label>
                        <span className="text-[10px] text-brand-muted font-mono">
                          {characterCounts.primaryMessage.current}/{limits.PRIMARY_MESSAGE_MAX}
                        </span>
                      </div>
                      <textarea
                        id="message"
                        rows={3}
                        maxLength={limits.PRIMARY_MESSAGE_MAX}
                        value={state.primaryMessage}
                        onChange={(e) => setField("primaryMessage", e.target.value)}
                        placeholder="Type your heartfelt secret or exciting reveal..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm-subtle/50 text-brand-dark focus:outline-none focus:border-brand-pink focus:ring-1 focus:ring-brand-pink text-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="secondary" className="font-semibold text-brand-dark">
                          Secondary Message / Hint (Optional)
                        </label>
                        <span className="text-[10px] text-brand-muted font-mono">
                          {characterCounts.secondaryMessage.current}/{limits.SECONDARY_MESSAGE_MAX}
                        </span>
                      </div>
                      <input
                        id="secondary"
                        type="text"
                        maxLength={limits.SECONDARY_MESSAGE_MAX}
                        value={state.secondaryMessage}
                        onChange={(e) => setField("secondaryMessage", e.target.value)}
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
                      const isSelected = state.foilStyle === foil.id;
                      return (
                        <button
                          key={foil.id}
                          type="button"
                          onClick={() => setFoilStyle(foil.id)}
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
                    <div className="flex items-center justify-between">
                      <label htmlFor="coverText" className="font-semibold text-brand-dark">
                        Foil Overlay Instructions
                      </label>
                      <span className="text-[10px] text-brand-muted font-mono">
                        {characterCounts.coverText.current}/{limits.COVER_TEXT_MAX}
                      </span>
                    </div>
                    <input
                      id="coverText"
                      type="text"
                      maxLength={limits.COVER_TEXT_MAX}
                      value={state.coverText}
                      onChange={(e) => setField("coverText", e.target.value)}
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
                        const isSelected = state.bgPalette === palette.id;
                        return (
                          <button
                            key={palette.id}
                            type="button"
                            onClick={() => setBgPalette(palette.id)}
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
                        const isSelected = state.sticker === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSticker(item.id)}
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
                      {state.photoUrl && (
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
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload-input"
                    />

                    {uploadError && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                          <span className="truncate">{uploadError}</span>
                          {uploadStatus === "error" && (
                            <button
                              type="button"
                              onClick={() => void retryUpload()}
                              className="text-xs font-bold underline hover:text-rose-900 shrink-0 cursor-pointer"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={clearUploadError}
                          className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-sm leading-none cursor-pointer"
                          aria-label="Dismiss error"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {state.photoUrl ? (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <Image src={state.photoUrl} alt="Preview" fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-brand-dark truncate">Custom Photo Attached</p>
                            {uploadStatus === "uploading" && (
                              <span className="text-[10px] text-brand-pink animate-pulse font-semibold flex items-center gap-1">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                <span>Uploading...</span>
                              </span>
                            )}
                            {uploadStatus === "uploaded" && (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Photo uploaded</span>
                              </span>
                            )}
                            {uploadStatus === "error" && (
                              <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>Upload failed</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-brand-muted">Appears beneath the scratch foil</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {uploadStatus === "error" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void retryUpload()}
                              className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                            >
                              Retry
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (fileInputRef.current) fileInputRef.current.value = "";
                              fileInputRef.current?.click();
                            }}
                            className="text-xs"
                            disabled={uploadStatus === "uploading"}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) fileInputRef.current.value = "";
                          fileInputRef.current?.click();
                        }}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-brand-warm-border hover:border-brand-pink/40 bg-brand-warm-subtle/40 flex items-center justify-center gap-2 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors"
                      >
                        <Camera className="w-4 h-4 text-brand-pink" />
                        <span>Upload a secret photo from device (JPG, PNG, WebP • max 2MB)</span>
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

                  {/* Real Canvas Scratch Component & Docked Live Stats */}
                  <div className="flex justify-center py-2">
                    <div className="w-full max-w-[360px]">
                      <ScratchCard
                        key={cardKey}
                        hiddenContent={hiddenContent}
                        coverStyle={state.foilStyle}
                        coverText={state.coverText}
                        revealThreshold={0.65}
                        brushRadius={28}
                        metadata={{
                          senderName: state.senderName || "You",
                          recipientName: state.recipientName || "Someone Special",
                          occasionTag: state.occasionTag || "Surprise",
                        }}
                        isCreatorPreview={true}
                        showControls={true}
                        className="mx-auto"
                      />
                    </div>
                  </div>

                  {/* Publish / Share CTA button (Task 2C-5.3.4) */}
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    disabled={isPublishing}
                    onClick={async () => {
                      if (!user) {
                        openAuthModal("/create");
                        return;
                      }
                      if (publishStatus === "published") {
                        setIsShareModalOpen(true);
                        return;
                      }
                      await publishCard();
                    }}
                    className="w-full justify-center gap-2 font-bold shadow-md hover:shadow-brand-pink/25"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing Card...</span>
                      </>
                    ) : publishStatus === "published" ? (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>View Share Link</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Publish & Share Card</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </main>
        </>
      )}

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
              <span className="truncate flex-1 text-brand-dark select-all">
                {publishedUrl || (publishedCard ? `https://suprilo.com/s/${publishedCard.slug}` : "")}
              </span>
              <button
                type="button"
                onClick={() => {
                  const linkToCopy =
                    publishedUrl ||
                    (publishedCard ? `https://suprilo.com/s/${publishedCard.slug}` : "");
                  if (linkToCopy) {
                    navigator.clipboard?.writeText(linkToCopy);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-brand-warm-border text-brand-pink font-sans font-bold hover:bg-brand-pink-light transition-colors shrink-0 cursor-pointer"
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

type SmartTab = "life" | "trending" | "mystery";
type QuickFilter = "all" | "trending" | "emotional" | "funny" | "vouchers" | "minimalist";

const QUICK_FILTER_CHIPS: { id: QuickFilter; label: string }[] = [
  { id: "all", label: "All Templates" },
  { id: "trending", label: "🔥 Trending Today" },
  { id: "emotional", label: "💖 Emotional & Love" },
  { id: "funny", label: "😂 Funny & Memes" },
  { id: "vouchers", label: "🎁 Vouchers & Treats" },
  { id: "minimalist", label: "✨ Minimalist & Gold" },
];

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
