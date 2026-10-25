import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-warm-border bg-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 pb-8 border-b border-brand-warm-border/60">
          {/* Logo and Tagline */}
          <div className="text-center md:text-left space-y-3 max-w-sm">
            <Link
              href="/"
              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-lg"
              aria-label="Suprilo Home"
            >
              <div className="relative h-12 w-44">
                <Image
                  src="/brand/logo.png"
                  alt="Suprilo - Make Every Moment a Surprise"
                  fill
                  sizes="176px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="text-sm text-brand-muted font-medium">
              Make Every Moment a Surprise.
            </p>
            <p className="text-xs text-brand-muted/80 leading-relaxed">
              Digital scratch cards for real smiles, heartfelt memories, and unexpected celebrations.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-brand-muted">
            <a
              href="#how-it-works"
              className="hover:text-brand-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="hover:text-brand-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
            >
              Features
            </a>
            <a
              href="#use-cases"
              className="hover:text-brand-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
            >
              Use Cases
            </a>
            <a
              href="#preview"
              className="hover:text-brand-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
            >
              Interactive Demo
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
          <p>© {currentYear} Suprilo. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
            <span>for heartfelt moments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
