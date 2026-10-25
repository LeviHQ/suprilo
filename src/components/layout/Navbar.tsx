"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavbarProps {
  onOpenCtaModal: () => void;
}

export function Navbar({ onOpenCtaModal }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

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

  const navLinks = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Preview Demo", href: "#preview" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
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
            className="flex items-center gap-2 group transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-lg"
            aria-label="Suprilo Home"
          >
            <div className="relative h-12 w-36 sm:w-44 overflow-hidden">
              <Image
                src="/brand/logo.png"
                alt="Suprilo - Make Every Moment a Surprise"
                fill
                priority
                sizes="(max-width: 640px) 144px, 176px"
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

          {/* Desktop Primary CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={onOpenCtaModal}
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-brand-warm-border shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 pb-6 space-y-3">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-medium text-brand-dark hover:bg-brand-pink-light hover:text-brand-pink transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>
            <div className="pt-2 px-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCtaModal();
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your First Card</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
