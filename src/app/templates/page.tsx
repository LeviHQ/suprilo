"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Sparkles,
  PlusCircle,
  X,
  ArrowRight,
} from "lucide-react";
import {
  SU_PRILO_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TemplateCategory,
  TemplateDefinition,
} from "@/data/templates";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function TemplatesGalleryPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<TemplateCategory | "all">("all");

  const filteredTemplates = React.useMemo(() => {
    return SU_PRILO_TEMPLATES.filter((template) => {
      // Category match
      if (selectedCategory !== "all" && template.category !== selectedCategory) {
        return false;
      }
      // Search query match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        template.title.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q) ||
        template.message.toLowerCase().includes(q) ||
        template.recipient.toLowerCase().includes(q) ||
        template.tag.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectTemplate = (template: TemplateDefinition) => {
    if (!user) {
      openAuthModal(`/create?template=${template.id}`);
    } else {
      router.push(`/create?template=${template.id}`);
    }
  };

  const handleScratchClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("/create?mode=scratch");
    } else {
      router.push("/create?mode=scratch");
    }
  };

  return (
    <div className="min-h-screen bg-brand-warm text-brand-dark flex flex-col selection:bg-brand-pink/15 selection:text-brand-pink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-warm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark bg-brand-warm-subtle hover:bg-brand-warm-border px-3 py-1.5 rounded-full border border-brand-warm-border transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Choices</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-24">
                <Image src="/brand/logo.png" alt="Suprilo" fill priority className="object-contain" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScratchClick}
              className="gap-1.5 text-xs"
            >
              <span>Blank Canvas</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleScratchClick}
              className="gap-1.5 text-xs shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start from Scratch</span>
              <span className="sm:hidden">Scratch</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Gallery Hero Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light border border-brand-pink/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Design Collection</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Find Your Perfect Surprise
          </h1>
          <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
            Choose from our curated collection of interactive scratch card designs for every celebration, milestone, and heartfelt memory.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-brand-muted absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by occasion, message, or keyword (e.g. Birthday, Love, Paris, Coffee)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-brand-warm-border bg-white text-brand-dark text-sm placeholder:text-brand-muted/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 p-1 rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-brand-dark text-white shadow-sm"
                      : "bg-white text-brand-muted hover:text-brand-dark hover:bg-brand-warm-subtle border border-brand-warm-border/80"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-brand-muted max-w-7xl mx-auto">
          <span>
            Showing <strong className="text-brand-dark">{filteredTemplates.length}</strong> design
            {filteredTemplates.length === 1 ? "" : "s"}
          </span>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="font-semibold text-brand-pink hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Template Grid (16 Templates) */}
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => {
              return (
                <div
                  key={template.id}
                  className="group bg-white rounded-3xl p-5 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1"
                >
                  {/* Card Visual Header Preview */}
                  <div
                    className={cn(
                      "h-44 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-inner border border-brand-warm-border/60 bg-gradient-to-br",
                      template.bgGradient
                    )}
                  >
                    {/* Top Row: Tag & Recipient */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <Badge variant={template.badgeColor} className="text-[10px] py-0.5">
                        {template.tag}
                      </Badge>
                      <span className="text-brand-muted/80">To: {template.recipient}</span>
                    </div>

                    {/* Secret Message Preview Note */}
                    <div className="my-auto text-center space-y-1 px-1">
                      <p className="text-xs sm:text-sm font-extrabold text-brand-dark leading-snug line-clamp-2">
                        {template.message}
                      </p>
                      {template.secondary && (
                        <p className="text-[10px] text-brand-muted line-clamp-1 font-medium">
                          {template.secondary}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Foil Cover Style Badge */}
                    <div className="flex items-center justify-between text-[10px] text-brand-muted pt-2 border-t border-brand-warm-border/40">
                      <span className="font-semibold capitalize text-brand-dark/70">
                        ✨ {template.coverStyle.replace("-", " ")}
                      </span>
                      <span>From: {template.sender}</span>
                    </div>
                  </div>

                  {/* Details & Wording */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-brand-dark group-hover:text-brand-pink transition-colors">
                        {template.title}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-warm-subtle text-brand-muted border border-brand-warm-border font-medium">
                        {template.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full justify-center gap-1.5 text-xs font-bold shadow-sm group-hover:shadow-md"
                    >
                      <span>Use This Template</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="text-center py-16 px-4 max-w-md mx-auto space-y-4 rounded-3xl border-2 border-dashed border-brand-warm-border bg-white">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink-light text-brand-pink flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-brand-dark">No Templates Found</h3>
              <p className="text-xs text-brand-muted">
                No designs matched &ldquo;{searchQuery}&rdquo;. Try another keyword or create a custom card from scratch.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs"
              >
                Clear Search
              </Button>
              <Link href="/create?mode=scratch">
                <Button variant="primary" size="sm" className="text-xs">
                  Create from Scratch
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
