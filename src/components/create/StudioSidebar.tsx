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
  Share2,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ParentCategoryId } from "@/data/templates";
import { cn } from "@/lib/utils";

export type StudioNavSelection = ParentCategoryId | "saved-templates";

interface StudioSidebarProps {
  activeParent: StudioNavSelection;
  onSelectParent: (parent: StudioNavSelection) => void;
  onSelectScratch: () => void;
  draftsCount?: number;
  className?: string;
}

const PARENT_NAV_ITEMS: {
  id: ParentCategoryId;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeClass?: string;
}[] = [
    {
      id: "life",
      label: "Life",
      sublabel: "Milestones & personal joys",
      icon: HeartHandshake,
      badge: "5 Themes",
      badgeClass: "bg-brand-pink-light text-brand-pink border border-brand-pink/20",
    },
    {
      id: "trending",
      label: "Trending & Calendar",
      sublabel: "Holidays, seasons & dates",
      icon: Calendar,
      badge: "HOT",
      badgeClass: "bg-amber-100 text-amber-900 border border-amber-200 font-extrabold",
    },
    {
      id: "social",
      label: "Social Media",
      sublabel: "YouTube, X, Insta & Startups",
      icon: Share2,
      badge: "CREATORS",
      badgeClass: "bg-purple-100 text-purple-900 border border-purple-200 font-extrabold",
    },
    {
      id: "surprise",
      label: "Surprise",
      sublabel: "Vouchers, games, roasts & secrets",
      icon: Gamepad2,
      badge: "FUN",
      badgeClass: "bg-rose-100 text-rose-900 border border-rose-200 font-extrabold",
    },
  ];

export function StudioSidebar({
  activeParent,
  onSelectParent,
  onSelectScratch,
  draftsCount = 0,
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

      {/* Navigation Sections: Ultra-clean 4 parent categories */}
      <nav
        aria-label="Studio Main Categories"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2 no-scrollbar scrollbar-none"
      >
        <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-muted">
          Browse Categories
        </div>

        {PARENT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeParent === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectParent(item.id)}
              className={cn(
                "group flex items-center justify-between w-full p-3 rounded-2xl text-xs font-bold transition-all text-left",
                isActive
                  ? "bg-brand-pink-light text-brand-pink shadow-xs font-extrabold border border-brand-pink/25"
                  : "text-brand-dark/80 hover:bg-brand-warm hover:text-brand-dark border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-brand-pink text-white shadow-xs"
                      : "bg-brand-warm-subtle text-brand-dark/70 group-hover:bg-white group-hover:text-brand-pink"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold tracking-tight">{item.label}</p>
                  <p className="text-[10px] text-brand-muted font-normal truncate mt-0.5">
                    {item.sublabel}
                  </p>
                </div>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 transition-colors",
                    item.badgeClass
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Saved Templates Tab (Pinned in navigation, switches in-studio view without routing away!) */}
        <div className="pt-3 mt-3 border-t border-brand-warm-border/70">
          <button
            type="button"
            onClick={() => onSelectParent("saved-templates")}
            className={cn(
              "group flex items-center justify-between w-full p-3 rounded-2xl text-xs font-bold transition-all text-left",
              activeParent === "saved-templates"
                ? "bg-purple-100 text-brand-purple shadow-xs font-extrabold border border-brand-purple/30"
                : "text-brand-purple hover:bg-purple-50/70 border border-brand-purple/15"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  activeParent === "saved-templates"
                    ? "bg-brand-purple text-white shadow-xs"
                    : "bg-purple-50 text-brand-purple group-hover:bg-brand-purple group-hover:text-white"
                )}
              >
                <FolderHeart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold tracking-tight">Saved Templates</p>
                <p className="text-[10px] text-brand-muted font-normal truncate mt-0.5">
                  Drafts & custom cards
                </p>
              </div>
            </div>

            <span className="text-[10px] bg-brand-purple/15 text-brand-purple px-2 py-0.5 rounded-md font-extrabold shrink-0">
              {draftsCount} / 3 Slots
            </span>
          </button>
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
