"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, PlusCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface DashboardHeaderProps {
  onOpenMobileNav: () => void;
}

export function DashboardHeader({ onOpenMobileNav }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-brand-warm-border px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full max-w-full">
      {/* Left: Mobile hamburger & Brand/Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <BrandLogo href="/" size="sm" priority />
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-brand-muted">
          <span>Suprilo Control Center</span>
          <span className="text-brand-warm-border">/</span>
          <span className="text-brand-dark font-bold">Studio Hub</span>
        </div>
      </div>

      {/* Right: Quick CTA & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/create">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-sm text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create a Card</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </Link>

        {/* Notifications Bell */}
        {user && <NotificationBell />}

        <Link
          href="/profile/settings"
          className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-pink/20 transition-all"
          title="Account Settings"
        >
          <UserAvatar user={user} size="sm" className="ring-2 ring-brand-warm-border" />
        </Link>
      </div>
    </header>
  );
}
