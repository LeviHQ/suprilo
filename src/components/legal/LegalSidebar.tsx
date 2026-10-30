"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Shield,
  BookOpen,
  Cookie,
  AlertTriangle,
  Receipt,
  Scale,
  Compass,
} from "lucide-react";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

interface LegalSidebarProps {
  sections?: { id: string; title: string }[];
  activeSection?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  privacy: Shield,
  terms: BookOpen,
  cookies: Cookie,
  "acceptable-use": AlertTriangle,
  "refund-policy": Receipt,
  "intellectual-property": Scale,
};

export function LegalSidebar({ sections = [] }: LegalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="space-y-6">
      {/* 1. Legal Documents Navigation Menu */}
      <div className="bg-white rounded-3xl p-5 border border-brand-warm-border shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-brand-warm-border/60">
          <Compass className="w-4 h-4 text-brand-pink" />
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
            Legal Directory
          </h3>
        </div>

        <nav className="space-y-1">
          <Link
            href="/legal"
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/legal"
                ? "bg-[#FFE4E8] text-[#FF4D6D] font-bold shadow-2xs"
                : "text-slate-600 hover:text-brand-dark hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Legal Center Overview</span>
            </div>
          </Link>

          {LEGAL_DOCUMENTS.map((doc) => {
            const Icon = ICON_MAP[doc.slug] || FileText;
            const isActive = pathname === doc.href;

            return (
              <Link
                key={doc.slug}
                href={doc.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#FFE4E8] text-[#FF4D6D] font-bold shadow-2xs"
                    : "text-slate-600 hover:text-brand-dark hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{doc.shortTitle}</span>
                </div>
                {doc.slug === "refund-policy" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Draft
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 2. In-Page Table of Contents (Sticky on Desktop) */}
      {sections.length > 0 && (
        <div className="hidden lg:block bg-white rounded-3xl p-5 border border-brand-warm-border shadow-xs space-y-3 sticky top-24">
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-warm-border/60">
            Table of Contents
          </h3>

          <nav className="space-y-1 text-xs max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="block py-1.5 px-2 rounded-lg text-slate-600 hover:text-[#FF4D6D] hover:bg-pink-50/60 transition-colors leading-snug"
              >
                {sec.title}
              </a>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}

