"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ArrowLeft, PlusCircle } from "lucide-react";
import { DASHBOARD_NAV_ITEMS } from "./navigation";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 fixed inset-y-0 left-0 z-30 bg-white border-r border-brand-warm-border">
      {/* Top Header / Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-brand-warm-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-8 w-24">
            <Image
              src="/brand/logo.png"
              alt="Suprilo"
              fill
              priority
              className="object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2 py-0.5 rounded-full border border-brand-pink/20">
            Studio
          </span>
        </Link>
      </div>

      {/* Quick Action: Back to Home & Create Card */}
      <div className="p-4 space-y-2 border-b border-brand-warm-border/60">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-pink via-brand-pink-hover to-brand-orange text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Surprise Card</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Dashboard Sidebar" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                isActive
                  ? "bg-brand-pink-light text-brand-pink shadow-sm"
                  : "text-brand-dark/70 hover:bg-brand-warm hover:text-brand-dark"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-brand-pink" : "text-brand-muted group-hover:text-brand-dark"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    isActive
                      ? "bg-brand-pink text-white"
                      : "bg-brand-warm-border text-brand-muted"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Card & Sign Out at Bottom */}
      <div className="p-3 border-t border-brand-warm-border bg-brand-warm/30">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white transition-colors">
          <Link href="/profile/settings" className="flex items-center gap-2.5 min-w-0 flex-1">
            <UserAvatar user={user} size="sm" className="ring-2 ring-brand-warm-border shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-dark truncate">
                {user?.displayName || "Suprilo Creator"}
              </p>
              <p className="text-[10px] text-brand-muted truncate">
                {user?.email || "Signed In"}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-brand-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-brand-warm-border/50 px-2 flex items-center justify-between text-[11px] text-brand-muted">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-brand-dark">
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Site</span>
          </Link>
          <span className="text-[10px] text-brand-muted/70">v0.3.0</span>
        </div>
      </div>
    </aside>
  );
}
