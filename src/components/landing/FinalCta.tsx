"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="py-20 relative overflow-hidden overflow-x-clip w-full max-w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1E1B38] via-[#2D1B36] to-[#1F172E] text-white p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl border border-white/10">
          {/* Subtle colorful decorative gradients */}
          <div
            className="absolute top-0 right-0 max-w-[50%] w-80 h-80 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 max-w-[50%] w-80 h-80 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
              <span>Make Everyday Magical</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Someone in your life deserves a little surprise.
            </h2>

            <p className="text-base sm:text-lg text-white/75 font-normal max-w-lg mx-auto">
              Make an ordinary moment unforgettable.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/create" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-gradient-to-r from-brand-pink to-brand-orange hover:from-brand-pink-hover hover:to-brand-orange text-white shadow-xl hover:shadow-brand-pink/30 hover:scale-[1.02] transition-all"
                >
                  <span>Create Your First Card</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-white/50 pt-2 flex items-center justify-center gap-1.5">
              <span>Interactive cards made with care</span>
              <Heart className="w-3 h-3 text-brand-pink fill-brand-pink" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
