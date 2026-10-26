"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Lock,
  PlusCircle,
  X,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type TicketStatusFilter = "all" | "open" | "in_progress" | "waiting" | "resolved";

export default function SupportTicketsPage() {
  const [activeFilter, setActiveFilter] = React.useState<TicketStatusFilter>("all");
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = React.useState(false);

  const filters: { id: TicketStatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All Tickets", count: 0 },
    { id: "open", label: "Open", count: 0 },
    { id: "in_progress", label: "In Progress", count: 0 },
    { id: "waiting", label: "Waiting for User", count: 0 },
    { id: "resolved", label: "Resolved", count: 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Support Tickets"
        description="View past support inquiries, track status updates from Suprilo care, and submit new technical assistance requests."
        badge="Care Hub"
        badgeVariant="pink"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Support Tickets" },
        ]}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewTicketModalOpen(true)}
            className="gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Ticket</span>
          </Button>
        }
      />

      {/* Status Filter Tabs */}
      <div className="border-b border-brand-warm-border overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-brand-dark text-white shadow-sm"
                    : "text-brand-muted hover:text-brand-dark hover:bg-white"
                )}
              >
                <span>{filter.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-brand-warm-border text-brand-muted"
                  )}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Honest Empty State (No fabricated tickets) */}
      <EmptyState
        icon={LifeBuoy}
        title="No Support Tickets Found"
        description="You don't have any support tickets yet. When you submit a technical question, feature suggestion, or billing inquiry, your ticket ID and replies will appear here."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewTicketModalOpen(true)}
              className="gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit a Ticket</span>
            </Button>

            <Link href="/#contact">
              <Button variant="secondary" size="md" className="gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Us Form</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Architecture & Future Workflow Explanation */}
      <ComingSoonPanel
        title="Automated Support & Help Desk Workflow"
        description="Our end-to-end support desk is scheduled for Phase 4 integration. Here is how your future inquiries will be handled securely:"
        features={[
          "Unique ticket ID generation (e.g. SUP-2026-XXXX) linked to your Google identity",
          "Automated email notifications when a care specialist replies",
          "Categorized assistance: Card Delivery, Scratch Engine Issues, Billing & Refunds, Feature Requests",
          "Encrypted attachment sharing for screenshots and bug reports",
          "Real-time ticket status tracking: Open, In Progress, Waiting for User, Resolved",
        ]}
      />

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => setIsNewTicketModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-brand-warm-border space-y-5 z-10 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsNewTicketModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-pink-light text-brand-pink flex items-center justify-center shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-dark">Create Support Request</h3>
                <p className="text-xs text-brand-muted">Phase 4 Help Desk Preview</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Ticket Backend Under Development</span>
              </div>
              <p className="leading-relaxed">
                Automated in-app ticketing is launching soon. For urgent inquiries or bug reports right now, please reach out to the Suprilo team via our Contact page or email.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
                  Subject
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="e.g. Issue customizing metallic foil texture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm/30 text-brand-dark text-xs cursor-not-allowed opacity-80"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
                  Category
                </label>
                <select
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm/30 text-brand-dark text-xs cursor-not-allowed opacity-80"
                >
                  <option>Card Creation & Studio</option>
                  <option>Scratch & Reveal Experience</option>
                  <option>Account & Badges</option>
                  <option>Billing & Vouchers</option>
                  <option>General Inquiry</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
                  Description
                </label>
                <textarea
                  rows={3}
                  disabled
                  placeholder="Explain what happened or what assistance you need..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-warm-border bg-brand-warm/30 text-brand-dark text-xs cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsNewTicketModalOpen(false)}
                className="w-full justify-center text-xs"
              >
                Close
              </Button>
              <Link href="/#contact" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center text-xs gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Go to Contact Form</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
