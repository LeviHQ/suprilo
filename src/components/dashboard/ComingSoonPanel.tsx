"use client";

import * as React from "react";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComingSoonPanelProps {
  title: string;
  description: string;
  features?: string[];
  badge?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ComingSoonPanel({
  title,
  description,
  features,
  badge = "Under Development",
  icon,
  className,
}: ComingSoonPanelProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-white to-brand-warm-subtle border border-brand-warm-border shadow-card overflow-hidden",
        className
      )}
    >
      <div
        className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 bg-gradient-to-br from-brand-pink/10 via-brand-orange/5 to-brand-purple/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-sm shrink-0">
              {icon || <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-dark tracking-tight">{title}</h3>
              <p className="text-xs text-brand-muted">Phase Roadmap Item</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{badge}</span>
          </span>
        </div>

        <p className="text-sm text-brand-muted leading-relaxed max-w-2xl">{description}</p>

        {features && features.length > 0 && (
          <div className="pt-3 border-t border-brand-warm-border/60 space-y-2.5">
            <p className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Upcoming Capabilities
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-brand-dark/80">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
