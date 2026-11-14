"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Check,
  Archive,
  ExternalLink,
  Search,
  X,
  Layers,
  Heart,
  Cake,
  PartyPopper,
  Trophy,
  Star,
  Gift,
  Flower2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  LucideIcon,
} from "lucide-react";
import type { CardRecord, StickerId } from "@/types/card";
import { archiveCard, deleteCardDraft, buildCardShareUrl } from "@/lib/cards";
import {
  ACTIVE_DRAFT_ID_KEY,
  saveActiveDraftSession,
  clearActiveDraftSession,
} from "@/hooks/useCardDraftSync";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import { getFoilBadge } from "@/data/templates";
import { getFoilAvatarTheme } from "@/components/create/FoilAvatar";

// Map sticker ID to Lucide icon
const STICKER_ICONS: Record<StickerId, LucideIcon> = {
  heart: Heart,
  sparkles: Sparkles,
  cake: Cake,
  flower: Flower2,
  gift: Gift,
  confetti: PartyPopper,
  trophy: Trophy,
  star: Star,
};

export type CardFilterType = "all" | "published" | "draft" | "archived";

interface MySurpriseCardsProps {
  cards: CardRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onCardArchived?: (cardId: string) => void;
  onCardDeleted?: (cardId: string) => void;
  activeFilter?: CardFilterType;
  onFilterChange?: (filter: CardFilterType) => void;
}

export function MySurpriseCards({
  cards,
  isLoading,
  error,
  onRetry,
  onCardArchived,
  onCardDeleted,
  activeFilter: controlledFilter,
  onFilterChange: controlledOnFilterChange,
}: MySurpriseCardsProps) {
  const router = useRouter();

  // Filter state
  const [internalFilter, setInternalFilter] = React.useState<CardFilterType>("all");
  const activeFilter = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setFilter = controlledOnFilterChange !== undefined ? controlledOnFilterChange : setInternalFilter;

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Action in-flight state
  const [inFlightAction, setInFlightAction] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<{ cardId: string; message: string } | null>(null);

  // Copied share link toast tracker
  const [copiedSlug, setCopiedSlug] = React.useState<string | null>(null);

  // Confirmation modals state
  const [cardToArchive, setCardToArchive] = React.useState<CardRecord | null>(null);
  const [cardToDelete, setCardToDelete] = React.useState<CardRecord | null>(null);
  const [previewCard, setPreviewCard] = React.useState<CardRecord | null>(null);

  // Compute category counts from actual fetched cards
  const counts = React.useMemo(() => {
    let published = 0;
    let draft = 0;
    let archived = 0;

    for (const card of cards) {
      if (card.status === "published") published++;
      else if (card.status === "draft") draft++;
      else if (card.status === "archived") archived++;
    }

    return {
      all: cards.length,
      published,
      draft,
      archived,
    };
  }, [cards]);

  // Filter and search cards
  const filteredCards = React.useMemo(() => {
    return cards.filter((card) => {
      // 1. Status filter
      if (activeFilter === "published" && card.status !== "published") return false;
      if (activeFilter === "draft" && card.status !== "draft") return false;
      if (activeFilter === "archived" && card.status !== "archived") return false;

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const recipient = card.recipient_name?.toLowerCase() || "";
        const sender = card.sender_name?.toLowerCase() || "";
        const occasion = card.occasion_tag?.toLowerCase() || "";
        const message = card.primary_message?.toLowerCase() || "";
        const cover = card.cover_text?.toLowerCase() || "";

        return (
          recipient.includes(query) ||
          sender.includes(query) ||
          occasion.includes(query) ||
          message.includes(query) ||
          cover.includes(query)
        );
      }

      return true;
    });
  }, [cards, activeFilter, searchQuery]);

  // Handle continuing editing a draft
  const handleContinueEditing = React.useCallback(
    (card: CardRecord) => {
      if (typeof window !== "undefined") {
        try {
          // 1. Save active draft keys so useCardDraftSync binds to this exact draft
          saveActiveDraftSession(card.id, card.slug);

          // 2. Save editor state so useCardEditor restores draft content
          const draftPayload = {
            version: 1,
            savedAt: Date.now(),
            recipientName: card.recipient_name,
            senderName: card.sender_name,
            occasionTag: card.occasion_tag,
            primaryMessage: card.primary_message,
            secondaryMessage: card.secondary_message,
            foilStyle: card.foil_style,
            coverText: card.cover_text,
            bgPalette: card.bg_palette,
            sticker: card.sticker,
            fontFamily: card.font_family,
            soundEnabled: card.sound_enabled,
            creationMode: card.creation_mode,
            templateId: card.template_id,
          };
          sessionStorage.setItem("suprilo_card_draft_v1", JSON.stringify(draftPayload));
        } catch (storageErr) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Failed to set draft session storage:", storageErr);
          }
        }
      }

      // Navigate to card editor with appropriate route query
      if (card.creation_mode === "template" && card.template_id) {
        router.push(`/create?template=${encodeURIComponent(card.template_id)}`);
      } else {
        router.push("/create?mode=scratch");
      }
    },
    [router]
  );

  // Handle copying card share URL
  const handleCopyLink = React.useCallback((card: CardRecord) => {
    try {
      const url = buildCardShareUrl(card.slug);
      navigator.clipboard.writeText(url);
      setCopiedSlug(card.slug);
      setTimeout(() => {
        setCopiedSlug((current) => (current === card.slug ? null : current));
      }, 2000);
    } catch {
      // Fallback
    }
  }, []);

  // Handle executing archive action
  const handleExecuteArchive = React.useCallback(async () => {
    if (!cardToArchive || inFlightAction) return;

    const targetId = cardToArchive.id;
    setInFlightAction(`archive-${targetId}`);
    setActionError(null);

    try {
      await archiveCard(targetId);
      if (onCardArchived) {
        onCardArchived(targetId);
      }
      setCardToArchive(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive card. Please try again.";
      setActionError({ cardId: targetId, message: msg });
    } finally {
      setInFlightAction(null);
    }
  }, [cardToArchive, inFlightAction, onCardArchived]);

  // Handle executing delete draft action
  const handleExecuteDelete = React.useCallback(async () => {
    if (!cardToDelete || inFlightAction) return;

    const targetId = cardToDelete.id;
    setInFlightAction(`delete-${targetId}`);
    setActionError(null);

    try {
      await deleteCardDraft(targetId);

      // If active session holds this draft, clear it
      if (typeof window !== "undefined") {
        try {
          if (sessionStorage.getItem(ACTIVE_DRAFT_ID_KEY) === targetId) {
            clearActiveDraftSession();
            sessionStorage.removeItem("suprilo_card_draft_v1");
          }
        } catch {}
      }

      if (onCardDeleted) {
        onCardDeleted(targetId);
      }
      setCardToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete draft. Please try again.";
      setActionError({ cardId: targetId, message: msg });
    } finally {
      setInFlightAction(null);
    }
  }, [cardToDelete, inFlightAction, onCardDeleted]);

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Recently";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div id="my-cards" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-brand-dark tracking-tight">
            My Surprise Cards
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted">
            Manage your drafts, live scratch cards, and archived surprises
          </p>
        </div>

        <Link href="/create">
          <Button variant="primary" size="sm" className="gap-2 shadow-sm text-xs self-start sm:self-auto">
            <PlusCircle className="w-4 h-4" />
            <span>Create New Card</span>
          </Button>
        </Link>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg transition-colors text-rose-600"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        {/* Category Filters */}
        <div
          className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-brand-warm-border shadow-xs overflow-x-auto no-scrollbar scrollbar-none w-full md:w-auto min-w-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeFilter === "all"
                ? "bg-brand-dark text-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark hover:bg-brand-warm"
            )}
          >
            <span>All Cards</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                activeFilter === "all" ? "bg-white/20 text-white" : "bg-brand-warm text-brand-muted"
              )}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("published")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeFilter === "published"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark hover:bg-brand-warm"
            )}
          >
            <span>Published</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                activeFilter === "published" ? "bg-white/20 text-white" : "bg-brand-warm text-brand-muted"
              )}
            >
              {counts.published}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("draft")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeFilter === "draft"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark hover:bg-brand-warm"
            )}
          >
            <span>Drafts</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                activeFilter === "draft" ? "bg-white/20 text-white" : "bg-brand-warm text-brand-muted"
              )}
            >
              {counts.draft}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("archived")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
              activeFilter === "archived"
                ? "bg-slate-700 text-white shadow-xs"
                : "text-brand-muted hover:text-brand-dark hover:bg-brand-warm"
            )}
          >
            <span>Archived</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                activeFilter === "archived" ? "bg-white/20 text-white" : "bg-brand-warm text-brand-muted"
              )}
            >
              {counts.archived}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white border border-brand-warm-border focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink text-brand-dark placeholder:text-brand-muted shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-brand-muted hover:text-brand-dark"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        // Loading Skeleton Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-brand-warm-border shadow-card overflow-hidden flex flex-col justify-between"
            >
              <div className="h-40 bg-brand-warm-border/50" />
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-brand-warm-border/60 rounded" />
                  <div className="h-6 w-48 bg-brand-warm-border/80 rounded" />
                  <div className="h-3 w-40 bg-brand-warm-border/50 rounded" />
                </div>
                <div className="pt-4 border-t border-brand-warm-border/60 flex justify-between">
                  <div className="h-8 w-24 bg-brand-warm-border/60 rounded-xl" />
                  <div className="h-8 w-20 bg-brand-warm-border/60 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Fetch Error State
        <div className="rounded-3xl p-8 bg-white border border-rose-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-brand-dark">Unable to Load Cards</h4>
            <p className="text-xs text-brand-muted max-w-sm mx-auto">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : cards.length === 0 ? (
        // Case A: User has no cards at all
        <EmptyState
          icon={Layers}
          title="No Cards Created Yet"
          description="You haven't created any surprise scratch cards yet. Head over to the Card Studio and create your first surprise!"
          action={
            <Link href="/create">
              <Button variant="primary" size="md" className="gap-2 shadow-md">
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Card</span>
              </Button>
            </Link>
          }
        />
      ) : filteredCards.length === 0 ? (
        // Filter-specific empty states
        searchQuery ? (
          // Case F: Search returns no results
          <EmptyState
            icon={Search}
            title="No Matching Cards"
            description="No surprise cards match your search criteria. Try a different query or reset your search."
            action={
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            }
          />
        ) : activeFilter === "published" ? (
          // Case C: Published filter has no results
          <EmptyState
            icon={Eye}
            title="No Published Cards Yet"
            description="Your published surprise cards will appear here once shared with recipients."
            action={
              <Link href="/create">
                <Button variant="primary" size="md" className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Create or Publish a Card</span>
                </Button>
              </Link>
            }
          />
        ) : activeFilter === "draft" ? (
          // Case D: Draft filter has no results
          <EmptyState
            icon={Pencil}
            title="No Drafts Yet"
            description="You have no drafts in progress. You can maintain up to 3 drafts simultaneously."
            action={
              <Link href="/create">
                <Button variant="primary" size="md" className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Draft</span>
                </Button>
              </Link>
            }
          />
        ) : (
          // Case E: Archived filter has no results
          <EmptyState
            icon={Archive}
            title="No Archived Cards"
            description="Archived cards will appear here when you archive them from your published collection."
          />
        )
      ) : (
        // Cards Grid (Case B & normal list)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const StickerIcon = STICKER_ICONS[card.sticker] || Sparkles;
            const foilTheme = getFoilAvatarTheme(card.foil_style);
            const foilBadge = getFoilBadge(card.foil_style);
            const isCardInFlight = inFlightAction?.endsWith(card.id);

            return (
              <div
                key={card.id}
                className={cn(
                  "bg-white rounded-3xl border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between overflow-hidden group",
                  isCardInFlight && "opacity-60 pointer-events-none"
                )}
              >
                {/* Visual Tactile Foil Card Banner / Preview */}
                <div
                  style={{
                    background: foilTheme.background,
                    borderColor: foilTheme.borderColor,
                  }}
                  className="relative h-56 sm:h-60 p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden border-b transition-transform group-hover:scale-[1.005]"
                >
                  {/* Subtle Shimmer Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                  {/* Top Bar: Status Badge, Foil Pill & Occasion Tag */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {card.status === "published" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/95 text-emerald-700 shadow-xs backdrop-blur-xs">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Published</span>
                        </span>
                      ) : card.status === "draft" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/95 text-amber-700 shadow-xs backdrop-blur-xs">
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>Draft #{card.draft_slot || 1}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/95 text-slate-700 shadow-xs backdrop-blur-xs">
                          <Archive className="w-3 h-3 text-slate-500" />
                          <span>Archived</span>
                        </span>
                      )}

                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs border border-white/20">
                        <span>{foilTheme.icon}</span>
                        <span className="truncate max-w-[80px]">{foilBadge.label}</span>
                      </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-xs border border-white/20 truncate max-w-[120px]">
                      {card.occasion_tag}
                    </span>
                  </div>

                  {/* Center Luxury Embossed Card Plaque */}
                  <div className="my-auto relative z-10 text-center px-3.5 py-3 bg-white/95 rounded-2xl border-2 border-white/90 shadow-lg mx-auto w-full max-w-[260px] space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wider text-brand-pink leading-tight truncate">
                      ✦ {card.cover_text || "SCRATCH TO REVEAL"} ✦
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-brand-dark truncate flex items-center justify-center gap-1.5">
                      <StickerIcon className="w-3.5 h-3.5 text-brand-pink shrink-0" />
                      <span className="truncate">For {card.recipient_name}</span>
                    </div>
                    <p className="text-[10px] text-brand-muted line-clamp-1 italic">
                      &ldquo;{card.primary_message}&rdquo;
                    </p>
                  </div>

                  {/* Bottom Bar: Sender & Scratch to reveal */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] font-extrabold uppercase text-white/95 pt-1.5 border-t border-white/30">
                    <span className="truncate max-w-[120px]">By {card.sender_name}</span>
                    <span className="bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/30">
                      Scratch to reveal
                    </span>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-extrabold text-brand-dark tracking-tight truncate">
                        For {card.recipient_name}
                      </h4>
                      <span className="text-[11px] text-brand-muted shrink-0 font-medium">
                        By {card.sender_name}
                      </span>
                    </div>

                    <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                      {card.primary_message}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-3 border-t border-brand-warm-border/60 flex items-center justify-between text-xs text-brand-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-muted" />
                      <span>{formatDate(card.published_at || card.updated_at || card.created_at)}</span>
                    </div>

                    {card.status === "published" ? (
                      <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Eye className="w-3 h-3 text-emerald-600" />
                        <span>{card.reveals_count || 0} reveals</span>
                      </div>
                    ) : card.status === "draft" ? (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Slot {card.draft_slot || 1} of 3
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium">
                        {card.reveals_count || 0} total reveals
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-2 flex items-center gap-2">
                    {card.status === "draft" ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleContinueEditing(card)}
                          className="flex-1 text-xs gap-1.5 shadow-sm"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Continue Editing</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCardToDelete(card)}
                          className="text-xs p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete draft"
                          aria-label={`Delete draft for ${card.recipient_name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : card.status === "published" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(buildCardShareUrl(card.slug), "_blank", "noopener,noreferrer")}
                          className="flex-1 text-xs gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Card</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(card)}
                          className={cn(
                            "text-xs gap-1 transition-colors",
                            copiedSlug === card.slug && "border-emerald-500 text-emerald-700 bg-emerald-50"
                          )}
                          title="Copy shareable link"
                        >
                          {copiedSlug === card.slug ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCardToArchive(card)}
                          className="text-xs p-2 text-brand-muted hover:text-brand-dark hover:bg-brand-warm"
                          title="Archive card"
                          aria-label={`Archive card for ${card.recipient_name}`}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      // Archived Card Actions
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPreviewCard(card)}
                        className="w-full text-xs gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Archived Details</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Archive Card */}
      {cardToArchive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              if (!inFlightAction) setCardToArchive(null);
            }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Archive className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 id="archive-dialog-title" className="text-lg font-bold text-brand-dark">
                  Archive Scratch Card?
                </h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Archiving will permanently freeze card &ldquo;For {cardToArchive.recipient_name}&rdquo;. Recipients will no longer be able to scratch or view this card.
                </p>
              </div>
            </div>

            <div className="p-3 bg-brand-warm-subtle rounded-xl border border-brand-warm-border text-xs text-brand-dark/80">
              <p>
                <strong>Note:</strong> Archived cards cannot be edited or republished. This action cannot be reversed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCardToArchive(null)}
                disabled={Boolean(inFlightAction)}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteArchive}
                disabled={Boolean(inFlightAction)}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm"
              >
                {inFlightAction === `archive-${cardToArchive.id}` ? (
                  <span>Archiving...</span>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Confirm Archive</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Draft */}
      {cardToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              if (!inFlightAction) setCardToDelete(null);
            }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 id="delete-dialog-title" className="text-lg font-bold text-brand-dark">
                  Delete Card Draft?
                </h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Are you sure you want to delete your draft for &ldquo;{cardToDelete.recipient_name}&rdquo;? This will immediately free up draft slot #{cardToDelete.draft_slot || 1}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCardToDelete(null)}
                disabled={Boolean(inFlightAction)}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteDelete}
                disabled={Boolean(inFlightAction)}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm"
              >
                {inFlightAction === `delete-${cardToDelete.id}` ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Draft</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Details Modal: Archived Card */}
      {previewCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewCard(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-warm-border p-6 sm:p-7 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-brand-warm-border">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">Archived Record</Badge>
                <span className="text-xs text-brand-muted">Slug: {previewCard.slug}</span>
              </div>

              <button
                type="button"
                onClick={() => setPreviewCard(null)}
                className="p-1.5 rounded-xl hover:bg-brand-warm text-brand-muted hover:text-brand-dark transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 id="preview-dialog-title" className="text-xl font-extrabold text-brand-dark">
                  For {previewCard.recipient_name}
                </h4>
                <p className="text-xs text-brand-muted">From {previewCard.sender_name} &bull; {previewCard.occasion_tag}</p>
              </div>

              <div className="p-4 rounded-2xl bg-brand-warm-subtle border border-brand-warm-border space-y-2">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Primary Message</p>
                <p className="text-sm text-brand-dark font-medium leading-relaxed">&ldquo;{previewCard.primary_message}&rdquo;</p>
                {previewCard.secondary_message && (
                  <p className="text-xs text-brand-muted pt-1 border-t border-brand-warm-border/60">
                    {previewCard.secondary_message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-brand-warm-border space-y-0.5">
                  <span className="text-brand-muted">Foil Finish</span>
                  <p className="font-bold text-brand-dark capitalize">{previewCard.foil_style.replace("-", " ")}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-brand-warm-border space-y-0.5">
                  <span className="text-brand-muted">Lifetime Reveals</span>
                  <p className="font-bold text-brand-dark">{previewCard.reveals_count || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPreviewCard(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
