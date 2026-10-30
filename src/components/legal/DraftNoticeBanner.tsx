"use client";

import * as React from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export function DraftNoticeBanner() {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded-md bg-amber-200/80 text-amber-900 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div className="space-y-0.5">
            <p className="font-bold flex items-center gap-2">
              <span>PRE-LAUNCH DRAFT — NOT YET EFFECTIVE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-200/60 rounded border border-amber-300">
                v{LEGAL_CONFIG.version}
              </span>
            </p>
            <p className="text-amber-800 leading-snug">
              Suprilo is currently in pre-launch development. These policies are prepared for internal owner and legal review before public launch. They do not constitute an active or binding legal agreement until officially verified and published.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200/60">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
          <span>Publication Status: Disabled</span>
        </div>
      </div>
    </div>
  );
}

