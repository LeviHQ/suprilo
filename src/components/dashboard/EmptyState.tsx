"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconBgColor = "bg-brand-pink-light",
  iconColor = "text-brand-pink",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-8 sm:p-12 border-2 border-dashed border-brand-warm-border bg-white text-center flex flex-col items-center justify-center space-y-4",
        className
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
          iconBgColor,
          iconColor
        )}
      >
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base sm:text-lg font-bold text-brand-dark tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">{description}</p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
