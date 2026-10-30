"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface OwnerReviewNoticeProps {
  label: string;
  note?: string;
  className?: string;
}

export function OwnerReviewNotice({
  label,
  note,
  className = "",
}: OwnerReviewNoticeProps) {
  return (
    <span
      className={`inline-flex flex-col my-1 p-2 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 text-xs font-mono select-text ${className}`}
    >
      <span className="flex items-center gap-1.5 font-bold text-amber-900">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>{label}</span>
      </span>
      {note && (
        <span className="font-sans text-[11px] text-amber-800/90 mt-0.5 ml-5">
          {note}
        </span>
      )}
    </span>
  );
}

