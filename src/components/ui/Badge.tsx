import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "pink" | "orange" | "purple" | "yellow" | "neutral";
}

export function Badge({
  className,
  variant = "pink",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    pink: "bg-brand-pink-light text-brand-pink border-brand-pink-subtle",
    orange: "bg-brand-orange-light text-[#D97706] border-[#FED7AA]",
    purple: "bg-brand-purple-light text-brand-purple border-[#DDD6FE]",
    yellow: "bg-brand-yellow-light text-[#B45309] border-[#FDE68A]",
    neutral: "bg-brand-warm-subtle text-brand-muted border-brand-warm-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
