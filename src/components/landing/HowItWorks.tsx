import * as React from "react";
import { PenTool, Sparkles, Send, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Create your card",
      description:
        "Add a personal message and an image. Write something that brings a smile, a warm memory, or an inside joke.",
      icon: PenTool,
      accentColor: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
      badgeColor: "bg-brand-pink text-white",
    },
    {
      step: "02",
      title: "Add the surprise",
      description:
        "Choose a cover and make the reveal feel special. Pick a vibrant foil, festive sparkles, and customize the hidden message.",
      icon: Sparkles,
      accentColor: "bg-brand-orange-light text-brand-orange border-[#FED7AA]",
      badgeColor: "bg-brand-orange text-white",
    },
    {
      step: "03",
      title: "Share the moment",
      description:
        "Send a unique link and let someone discover it. They can scratch away the cover on their phone or desktop with zero app installs.",
      icon: Send,
      accentColor: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
      badgeColor: "bg-brand-purple text-white",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-brand-warm-subtle/60 relative overflow-hidden overflow-x-clip w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <Badge variant="purple">Simple & Delightful</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            How Suprilo Works
          </h2>
          <p className="text-base sm:text-lg text-brand-muted">
            Three simple steps to craft an interactive memory that feels personal, exciting, and unforgettable.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-white rounded-3xl p-8 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step number badge & icon */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${item.badgeColor} shadow-sm`}
                    >
                      Step {item.step}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.accentColor} transition-transform group-hover:scale-110 duration-200`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-brand-dark group-hover:text-brand-pink transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom visual hint */}
                <div className="mt-6 pt-4 border-t border-brand-warm-border/60 flex items-center text-xs font-semibold text-brand-muted group-hover:text-brand-pink transition-colors">
                  <span>Step {idx + 1} of 3</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Clarity note */}
        <p className="text-center text-xs text-brand-muted mt-10">
          Planned workflow for Phase 2. Designed to take less than 2 minutes to create and share.
        </p>
      </div>
    </section>
  );
}
