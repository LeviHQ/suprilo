"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Sparkles, LogOut, User as UserIcon, PlusCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { UserAvatar } from "@/components/ui/UserAvatar";

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

export function Navbar() {
  const router = useRouter();
  const { user, loading, isSigningIn, signInWithGoogle, openAuthModal, signOutUser } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close profile dropdown on outside click or ESC key
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileDropdownOpen(false);
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const navLinks = [
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Features", href: "/#features" },
    { name: "Use Cases", href: "/#use-cases" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Preview Demo", href: "/#preview" },
  ];

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("/create");
    } else {
      router.push("/create");
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-full overflow-x-clip transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-brand-warm-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo brand */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-lg py-1"
            aria-label="Suprilo Home"
          >
            <div className="relative h-12 sm:h-14 md:h-16 w-40 sm:w-48 md:w-56 aspect-[800/285]">
              <Image
                src="/brand/logo.png"
                alt="Suprilo - Make Every Moment a Surprise"
                fill
                priority
                sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 208px"
                className="object-contain object-left group-hover:scale-[1.02] transition-transform duration-200"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-brand-muted hover:text-brand-pink transition-colors relative py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Right Actions Area (Auth + CTA) */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              // Reserved skeleton prevents layout shifts while checking initial auth
              <div className="w-24 h-9 rounded-xl bg-brand-warm-subtle/80 animate-pulse border border-brand-warm-border/60" />
            ) : user ? (
              // Authenticated User Avatar & Dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-brand-warm-subtle border border-brand-warm-border/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink transition-colors"
                  aria-label="Open user profile menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="text-xs font-semibold text-brand-dark max-w-[100px] truncate">
                    {user.displayName?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-brand-warm-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-brand-warm-border/60">
                      <p className="text-xs font-bold text-brand-dark truncate">
                        {user.displayName || "Suprilo Creator"}
                      </p>
                      <p className="text-[11px] text-brand-muted truncate">
                        {user.email || ""}
                      </p>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-brand-dark hover:bg-brand-pink-light hover:text-brand-pink transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-brand-pink" />
                        <span>Profile Dashboard</span>
                      </Link>

                      <Link
                        href="/create"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-brand-dark hover:bg-brand-pink-light hover:text-brand-pink transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-brand-orange" />
                        <span>Create Surprise Card</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-brand-warm-border/60">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOutUser();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Logged-out Sign In button (stays on current page after signing in)
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-dark hover:text-brand-pink px-3.5 py-2 rounded-xl hover:bg-brand-warm-subtle border border-brand-warm-border/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink disabled:opacity-60"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>{isSigningIn ? "Signing in..." : "Sign In"}</span>
              </button>
            )}

            {/* Primary Action Button (Create Card) */}
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateClick}
              className="gap-2 shadow-md hover:shadow-brand-pink/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your First Card</span>
            </Button>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-brand-dark hover:bg-brand-warm-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-brand-warm-border shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 pb-6 space-y-4">
            {/* Mobile Auth Header */}
            {user ? (
              <div className="p-3 bg-brand-warm-subtle rounded-2xl border border-brand-warm-border flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar user={user} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-dark truncate">
                      {user.displayName || "Suprilo Creator"}
                    </p>
                    <p className="text-[10px] text-brand-muted truncate">{user.email || ""}</p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-brand-pink bg-white px-2.5 py-1 rounded-full border border-brand-warm-border"
                >
                  Profile
                </Link>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signInWithGoogle();
                  }}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-warm-subtle border border-brand-warm-border text-xs font-bold text-brand-dark hover:bg-brand-warm-border transition-colors disabled:opacity-60"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>{isSigningIn ? "Signing in..." : "Sign In with Google"}</span>
                </button>
              </div>
            )}

            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-dark hover:bg-brand-pink-light hover:text-brand-pink transition-colors"
                >
                  {link.name}
                </a>
              ))}
              {user && (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-dark hover:bg-brand-pink-light hover:text-brand-pink transition-colors"
                >
                  My Profile Dashboard
                </Link>
              )}
            </nav>

            {/* Mobile Create Card Action */}
            <div className="pt-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-md"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleCreateClick(e);
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your First Card</span>
              </Button>
            </div>

            {/* Mobile Sign Out button if logged in */}
            {user && (
              <div className="pt-2 border-t border-brand-warm-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOutUser();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
