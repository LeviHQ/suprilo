"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "pink" | "orange" | "purple" | "yellow" | "neutral";
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  badgeVariant = "pink",
  breadcrumbs = [{ label: "Control Center", href: "/profile" }],
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-3 pb-6 border-b border-brand-warm-border">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-muted">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={item.label}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-brand-muted/60" />}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-brand-dark transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-semibold text-brand-dark" : ""}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              {title}
            </h1>
            {badge && (
              <Badge variant={badgeVariant} className="text-xs font-bold uppercase tracking-wider">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-brand-muted max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 self-start sm:self-auto">{actions}</div>}
      </div>
    </div>
  );
}
