"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Paintbrush,
  ArrowLeft,
  FolderHeart,
  Calendar,
  Gamepad2,
  HeartHandshake,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { TEMPLATE_CATEGORIES, TemplateCategory } from "@/data/templates";
import { cn } from "@/lib/utils";

interface StudioSidebarProps {
  activeCategory: TemplateCategory;
  onSelectCategory: (category: TemplateCategory) => void;
  onSelectScratch: () => void;
  className?: string;
}

// 3 Smart Parent Category Groups (Modular Template Architecture)
const SMART_GROUPS: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: TemplateCategory[];
}[] = [
  {
    title: "Life & Milestones",
    icon: HeartHandshake,
    categories: ["birthday", "love", "friendship", "celebrations", "workplace", "heartfelt"],
  },
  {
    title: "Trending & Calendar",
    icon: Calendar,
    categories: ["general", "holidays"],
  },
  {
    title: "Mystery & Fun",
    icon: Gamepad2,
    categories: ["funny", "reveals", "games"],
  },
];

export function StudioSidebar({
  activeCategory,
  onSelectCategory,
  onSelectScratch,
  className,
}: StudioSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-64 xl:w-72 fixed inset-y-0 left-0 z-30 bg-white border-r border-brand-warm-border selection:bg-brand-pink/15",
        className
      )}
    >
      {/* Top Header / Logo */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-brand-warm-border shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-xl"
        >
          <BrandLogo size="sm" priority />
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2 py-0.5 rounded-full border border-brand-pink/20">
            Studio Hub
          </span>
        </Link>
      </div>

      {/* Primary Pinned Action: Start from Scratch (Blank Canvas) */}
      <div className="p-3.5 border-b border-brand-warm-border/60 shrink-0">
        <button
          type="button"
          onClick={onSelectScratch}
          className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-brand-pink via-brand-pink-hover to-brand-orange text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
              <Paintbrush className="w-3 h-3" />
              100% Freedom
            </span>
            <Sparkles className="w-4 h-4 text-white/80 group-hover:rotate-12 transition-transform" />
          </div>
          <p className="text-xs font-black tracking-tight text-white drop-shadow-xs">
            Start from Scratch
          </p>
          <p className="text-[11px] text-white/85 leading-snug line-clamp-1 mt-0.5">
            Blank canvas with your custom words
          </p>
        </button>
      </div>

      {/* Scrollable Categories List Grouped into 3 Smart Themes */}
      <nav
        aria-label="Studio Template Categories"
        className="flex-1 overflow-y-auto px-3 py-2 space-y-4 no-scrollbar scrollbar-none"
      >
        {SMART_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.title} className="space-y-1">
              <div className="px-2 pt-1 pb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                <div className="flex items-center gap-1.5">
                  <GroupIcon className="w-3.5 h-3.5 text-brand-pink" />
                  <span>{group.title}</span>
                </div>
              </div>

              {group.categories.map((catId) => {
                const category = TEMPLATE_CATEGORIES.find((c) => c.id === catId);
                if (!category) return null;
                const isActive = activeCategory === category.id;
                const isGeneral = category.id === "general";

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    className={cn(
                      "group flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left",
                      isActive
                        ? "bg-brand-pink-light text-brand-pink shadow-xs font-bold border border-brand-pink/20"
                        : "text-brand-dark/75 hover:bg-brand-warm hover:text-brand-dark border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">
                        {category.icon}
                      </span>
                      <span className="truncate">{category.label}</span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 transition-colors",
                        isActive
                          ? "bg-brand-pink text-white"
                          : isGeneral
                          ? "bg-brand-pink-light text-brand-pink font-extrabold"
                          : "bg-brand-warm-border/70 text-brand-muted group-hover:text-brand-dark"
                      )}
                    >
                      {isGeneral ? "Mix" : category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Saved / My Drafts Quick Tab */}
        <div className="pt-2 border-t border-brand-warm-border/60">
          <Link
            href="/profile"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-brand-purple hover:bg-brand-purple/10 border border-brand-purple/15 transition-all"
          >
            <div className="flex items-center gap-2">
              <FolderHeart className="w-3.5 h-3.5 text-brand-pink" />
              <span>Saved / My Drafts</span>
            </div>
            <span className="text-[10px] bg-brand-purple/15 text-brand-purple px-1.5 py-0.5 rounded-md font-extrabold">
              3 Slots
            </span>
          </Link>
        </div>
      </nav>

      {/* Bottom Footer / Back Link */}
      <div className="p-3 border-t border-brand-warm-border shrink-0 bg-brand-warm-subtle/50">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-brand-muted hover:text-brand-dark hover:bg-white border border-transparent hover:border-brand-warm-border transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Suprilo Home</span>
        </Link>
      </div>
    </aside>
  );
}
