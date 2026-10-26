"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "muted";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconBgColor = "bg-brand-pink/10",
  iconColor = "text-brand-pink",
  badge,
  badgeVariant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              {value}
            </span>
          </div>
        </div>

        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBgColor, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || badge) && (
        <div className="pt-3 mt-3 border-t border-brand-warm-border/60 flex items-center justify-between text-xs text-brand-muted">
          {subtext && <span>{subtext}</span>}
          {badge && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full font-semibold text-[10px] tracking-wide ml-auto",
                badgeVariant === "success" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                badgeVariant === "warning" && "bg-amber-50 text-amber-700 border border-amber-200",
                badgeVariant === "muted" && "bg-slate-100 text-slate-600 border border-slate-200",
                badgeVariant === "default" && "bg-brand-pink-light text-brand-pink border border-brand-pink/20"
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
