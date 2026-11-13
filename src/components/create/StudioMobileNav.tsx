"use client";

import * as React from "react";
import Link from "next/link";
import { X, Sparkles, Paintbrush, ArrowLeft, Compass } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { TEMPLATE_CATEGORIES, TemplateCategory } from "@/data/templates";
import { cn } from "@/lib/utils";

interface StudioMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: TemplateCategory;
  onSelectCategory: (category: TemplateCategory) => void;
  onSelectScratch: () => void;
}

export function StudioMobileNav({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  onSelectScratch,
}: StudioMobileNavProps) {
  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div
        className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-brand-warm-border shrink-0">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" priority />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2 py-0.5 rounded-full border border-brand-pink/20">
              Studio
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: Start from Scratch */}
        <div className="p-4 border-b border-brand-warm-border/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelectScratch();
              onClose();
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-brand-pink via-brand-pink-hover to-brand-orange text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                <Paintbrush className="w-3 h-3" />
                100% Freedom
              </span>
              <Sparkles className="w-4 h-4 text-white/80" />
            </div>
            <p className="text-xs font-black tracking-tight text-white drop-shadow-xs">
              Start from Scratch
            </p>
            <p className="text-[11px] text-white/85 leading-snug line-clamp-1 mt-0.5">
              Blank canvas with your custom words
            </p>
          </button>
        </div>

        {/* Section Header */}
        <div className="px-4 pt-4 pb-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
            <Compass className="w-3.5 h-3.5 text-brand-pink" />
            <span>Curated Categories</span>
          </div>
          <span className="text-[10px] font-bold text-brand-muted bg-brand-warm-subtle px-1.5 py-0.5 rounded-md">
            100 designs
          </span>
        </div>

        {/* Scrollable Categories List */}
        <nav
          aria-label="Studio Mobile Categories"
          className="flex-1 overflow-y-auto px-3 py-2 space-y-1"
        >
          {TEMPLATE_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            const isGeneral = category.id === "general";

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onSelectCategory(category.id);
                  onClose();
                }}
                className={cn(
                  "group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left",
                  isActive
                    ? "bg-brand-pink-light text-brand-pink shadow-xs font-bold border border-brand-pink/20"
                    : "text-brand-dark/75 hover:bg-brand-warm hover:text-brand-dark border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{category.icon}</span>
                  <span className="truncate">{category.label}</span>
                </div>

                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5",
                    isActive
                      ? "bg-brand-pink text-white"
                      : isGeneral
                      ? "bg-brand-pink-light text-brand-pink font-extrabold"
                      : "bg-brand-warm-border/70 text-brand-muted"
                  )}
                >
                  {isGeneral ? "Mix" : category.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Footer / Back Link */}
        <div className="p-4 border-t border-brand-warm-border shrink-0 bg-brand-warm-subtle/50">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-dark hover:bg-white border border-transparent hover:border-brand-warm-border transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Suprilo Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

