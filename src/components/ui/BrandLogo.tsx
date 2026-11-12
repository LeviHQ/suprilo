import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  taglineText?: string;
  href?: string | null;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeConfig = {
  sm: {
    container: "gap-2",
    iconBox: "w-7 h-7 sm:w-8 sm:h-8",
    iconSize: 32,
    text: "text-lg sm:text-xl",
    tagline: "text-[9px] sm:text-[10px]",
  },
  md: {
    container: "gap-2 sm:gap-2.5",
    iconBox: "w-8 h-8 sm:w-9 sm:h-9",
    iconSize: 36,
    text: "text-xl sm:text-2xl",
    tagline: "text-[10px] sm:text-xs",
  },
  lg: {
    container: "gap-2.5 sm:gap-3",
    iconBox: "w-10 h-10 sm:w-12 sm:h-12",
    iconSize: 48,
    text: "text-2xl sm:text-3xl",
    tagline: "text-xs sm:text-sm",
  },
};

export function BrandLogo({
  size = "md",
  withTagline = false,
  taglineText = "Make Every Moment a Surprise",
  href,
  priority = false,
  className,
  iconClassName,
  textClassName,
}: BrandLogoProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div
      className={cn(
        "inline-flex items-center select-none group transition-transform focus:outline-none",
        cfg.container,
        className
      )}
    >
      {/* Brand Icon Mark */}
      <div className={cn("relative shrink-0 aspect-square", cfg.iconBox, iconClassName)}>
        <Image
          src="/brand/logo.png"
          alt="Suprilo Mark"
          width={cfg.iconSize}
          height={cfg.iconSize}
          priority={priority}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Brand Name Typography */}
      {withTagline ? (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              "font-heading font-extrabold tracking-tight text-brand-dark leading-none",
              cfg.text,
              textClassName
            )}
          >
            Suprilo
          </span>
          <span
            className={cn(
              "font-body font-medium text-brand-muted tracking-normal mt-1 leading-tight",
              cfg.tagline
            )}
          >
            {taglineText}
          </span>
        </div>
      ) : (
        <span
          className={cn(
            "font-heading font-extrabold tracking-tight text-brand-dark leading-none",
            cfg.text,
            textClassName
          )}
        >
          Suprilo
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2 rounded-xl"
        aria-label="Suprilo Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}

