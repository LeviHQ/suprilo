"use client";

import * as React from "react";
import Link from "next/link";
import { LucideIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "muted" | "error";
  className?: string;
  onClick?: () => void;
  href?: string;
  isLoading?: boolean;
  error?: string | null;
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
  onClick,
  href,
  isLoading = false,
  error,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white rounded-2xl p-5 border border-brand-warm-border shadow-card flex flex-col justify-between animate-pulse min-h-[120px]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-brand-warm-border/60 rounded" />
            <div className="h-7 w-16 bg-brand-warm-border/80 rounded" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-warm-border/50 shrink-0" />
        </div>
        <div className="pt-3 mt-3 border-t border-brand-warm-border/40 flex items-center justify-between">
          <div className="h-3 w-24 bg-brand-warm-border/50 rounded" />
          <div className="h-4 w-12 bg-brand-warm-border/50 rounded-full" />
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            {error ? (
              <span className="text-sm font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Unavailable</span>
              </span>
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                {value}
              </span>
            )}
          </div>
        </div>

        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBgColor, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || badge || error) && (
        <div className="pt-3 mt-3 border-t border-brand-warm-border/60 flex items-center justify-between text-xs text-brand-muted">
          {error ? (
            <span className="text-rose-600/80 text-[11px] truncate">{error}</span>
          ) : (
            subtext && <span className="truncate">{subtext}</span>
          )}
          {badge && !error && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full font-semibold text-[10px] tracking-wide ml-auto shrink-0",
                badgeVariant === "success" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                badgeVariant === "warning" && "bg-amber-50 text-amber-700 border border-amber-200",
                badgeVariant === "muted" && "bg-slate-100 text-slate-600 border border-slate-200",
                badgeVariant === "error" && "bg-rose-50 text-rose-700 border border-rose-200",
                badgeVariant === "default" && "bg-brand-pink-light text-brand-pink border border-brand-pink/20"
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </>
  );

  const containerClasses = cn(
    "bg-white rounded-2xl p-5 border border-brand-warm-border shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between text-left",
    (onClick || href) && "cursor-pointer group active:scale-[0.99]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={containerClasses}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  );
}
