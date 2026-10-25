"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScratchCardDemo } from "./ScratchCardDemo";

export function Hero() {
  return (
    <section className="relative overflow-hidden overflow-x-clip pt-8 pb-16 md:pt-14 md:pb-24 w-full max-w-full">
      {/* Decorative background glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[360px] bg-gradient-to-tr from-brand-pink/10 via-brand-orange/10 to-brand-purple/10 blur-3xl pointer-events-none -z-10 rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex">
              <Badge variant="pink" className="shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-pink fill-brand-pink/20" />
                <span>A Little Surprise Goes a Long Way</span>
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-dark tracking-tight leading-[1.12]">
              Make Every Moment{" "}
              <span className="bg-gradient-to-r from-brand-pink via-brand-orange to-brand-purple bg-clip-text text-transparent">
                a Surprise.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-xl text-brand-muted max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Turn your favorite memories, heartfelt messages, and happy moments into
              interactive scratch cards. Share a link and let someone discover the surprise.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/create" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-brand-pink/30 hover:-translate-y-0.5 transition-transform"
                >
                  <span>Create a Surprise Card</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  <PlayCircle className="w-4 h-4 text-brand-purple" />
                  <span>See How It Works</span>
                </Button>
              </a>
            </div>

            {/* Trust & Product status note */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-brand-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>No app download needed for recipients</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-orange" />
                <span>Works beautifully on any smartphone</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Card Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <ScratchCardDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
