import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShieldCheck, Scale } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-warm-border bg-white pt-14 pb-8 w-full max-w-full overflow-x-clip select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-brand-warm-border/60">
          {/* Col 1: Logo and Tagline (5 cols) */}
          <div className="md:col-span-5 text-center md:text-left space-y-4 max-w-sm mx-auto md:mx-0">
            <Link
              href="/"
              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-lg"
              aria-label="Suprilo Home"
            >
              <div className="relative h-16 sm:h-18 w-52 sm:w-60 mx-auto md:mx-0 aspect-[800/285]">
                <Image
                  src="/brand/logo.png"
                  alt="Suprilo - Make Every Moment a Surprise"
                  fill
                  sizes="(max-width: 640px) 208px, 240px"
                  className="object-contain object-center md:object-left"
                />
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Digital scratch cards for real smiles, heartfelt memories, and unexpected celebrations. Hide a personal note and photo behind metallic foil.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Pre-Launch Development Phase</span>
              </span>
            </div>
          </div>

          {/* Col 2: Product & Exploration (3 cols) */}
          <div className="md:col-span-3 text-center md:text-left space-y-3">
            <h4 className="text-xs font-black text-[#17152A] uppercase tracking-wider">
              Product & Explore
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-brand-pink transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="hover:text-brand-pink transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#use-cases"
                  className="hover:text-brand-pink transition-colors"
                >
                  Occasion Explorer
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="hover:text-brand-pink transition-colors"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="hover:text-brand-pink transition-colors"
                >
                  Card Studio
                </Link>
              </li>
              <li>
                <Link
                  href="/templates"
                  className="hover:text-brand-pink transition-colors"
                >
                  Browse Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal Center & Policies (4 cols) */}
          <div className="md:col-span-4 text-center md:text-left space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#7C3AED]" />
              <h4 className="text-xs font-black text-[#17152A] uppercase tracking-wider">
                Legal & Governance (Drafts)
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-brand-pink transition-colors flex items-center justify-center md:justify-start gap-1.5"
                >
                  <span>Privacy Policy</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Draft
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-brand-pink transition-colors flex items-center justify-center md:justify-start gap-1.5"
                >
                  <span>Terms of Service</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Draft
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="hover:text-brand-pink transition-colors flex items-center justify-center md:justify-start gap-1.5"
                >
                  <span>Cookie Policy</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Draft
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/acceptable-use"
                  className="hover:text-brand-pink transition-colors flex items-center justify-center md:justify-start gap-1.5"
                >
                  <span>Acceptable Use Policy</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Draft
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/refund-policy"
                  className="hover:text-brand-pink transition-colors flex items-center justify-center md:justify-start gap-1.5"
                >
                  <span>Refund & Cancellation</span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    Inactive
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/intellectual-property"
                  className="hover:text-brand-pink transition-colors flex items-center justify-center md:justify-start gap-1.5"
                >
                  <span>Copyright & IP Policy</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Draft
                  </span>
                </Link>
              </li>
              <li className="pt-1">
                <Link
                  href="/legal"
                  className="text-xs font-bold text-[#FF4D6D] hover:underline"
                >
                  Visit Legal Center Hub →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {currentYear} Suprilo. All rights reserved. (Pre-launch development)</p>
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
