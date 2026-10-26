"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, LogOut, ArrowLeft, PlusCircle } from "lucide-react";
import { DASHBOARD_NAV_ITEMS } from "./navigation";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const prevPathnameRef = React.useRef(pathname);

  // Close only if route actually changes
  React.useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

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

  const handleSignOut = async () => {
    onClose();
    await signOutUser();
    router.push("/");
  };

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
        <div className="h-16 px-4 flex items-center justify-between border-b border-brand-warm-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-22">
              <Image src="/brand/logo.png" alt="Suprilo" fill priority className="object-contain" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink bg-brand-pink-light px-2 py-0.5 rounded-full border border-brand-pink/20">
              Studio
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action */}
        <div className="p-4 border-b border-brand-warm-border/60">
          <Link
            href="/create"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-pink to-brand-orange text-white text-xs font-bold shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Surprise Card</span>
          </Link>
        </div>

        {/* Nav list in EXACT order */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-brand-pink-light text-brand-pink shadow-sm"
                    : "text-brand-dark/70 hover:bg-brand-warm hover:text-brand-dark"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-brand-pink" : "text-brand-muted"
                    )}
                  />
                  <span>{item.label}</span>
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

        {/* Bottom User Area */}
        <div className="p-4 border-t border-brand-warm-border bg-brand-warm/30 space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="md" className="ring-2 ring-brand-warm-border" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-dark truncate">
                {user?.displayName || "Suprilo Creator"}
              </p>
              <p className="text-[10px] text-brand-muted truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-warm-border/60">
            <Link
              href="/"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-dark"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Main Site</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
