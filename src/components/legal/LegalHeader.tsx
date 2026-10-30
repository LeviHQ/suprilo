"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Clock, FileText, AlertOctagon } from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

interface LegalHeaderProps {
  title: string;
  description: string;
  badgeText?: string;
  badgeVariant?: "neutral" | "pink" | "purple" | "amber";
  statusText?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function LegalHeader({
  title,
  description,
  badgeText = "Policy Document",
  statusText = "Pre-Launch Draft",
  breadcrumbs = [{ label: "Legal Center", href: "/legal" }],
}: LegalHeaderProps) {
  return (
    <div className="space-y-4 pb-6 border-b border-brand-warm-border">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          className="flex items-center gap-1.5 text-xs text-brand-muted"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-brand-dark transition-colors font-medium"
          >
            Home
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-brand-dark transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-brand-dark">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Badges & Status Meta */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
          <FileText className="w-3.5 h-3.5" />
          <span>{badgeText}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-700" />
          <span>Status: {statusText}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Updated: {LEGAL_CONFIG.lastUpdated}</span>
        </span>

        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
          v{LEGAL_CONFIG.version}
        </span>
      </div>

      {/* Document Headline */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#17152A] tracking-tight">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

