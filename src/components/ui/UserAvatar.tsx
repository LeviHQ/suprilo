"use client";

import * as React from "react";
import Image from "next/image";

interface UserAvatarProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ user, size = "md", className = "" }: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl font-bold",
  };

  const initial =
    user?.displayName?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    "U";

  if (user?.photoURL && !imageError) {
    const pixelSizes = { sm: 32, md: 36, lg: 48, xl: 80 };
    return (
      <div
        className={`relative rounded-full overflow-hidden ring-2 ring-brand-pink/20 shrink-0 bg-brand-warm-subtle ${sizeClasses[size]} ${className}`}
      >
        <Image
          src={user.photoURL}
          alt={user.displayName || "User avatar"}
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          unoptimized
          onError={() => setImageError(true)}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  // Fallback avatar with user initial
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-brand-pink via-brand-orange to-brand-purple shadow-sm ring-2 ring-white shrink-0 select-none ${sizeClasses[size]} ${className}`}
      aria-label={user?.displayName || user?.email || "User profile"}
    >
      <span>{initial}</span>
    </div>
  );
}
