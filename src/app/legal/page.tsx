import * as React from "react";
import Link from "next/link";
import {
  Shield,
  BookOpen,
  Cookie,
  AlertTriangle,
  Receipt,
  Scale,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { OwnerReviewNotice } from "@/components/legal/OwnerReviewNotice";

export const metadata = {
  title: "Legal Center & Pre-Launch Policies | Suprilo",
  description:
    "Review Suprilo’s pre-launch policy drafts, privacy standards, terms of service, and intellectual property terms.",
};

const ICONS = {
  privacy: Shield,
  terms: BookOpen,
  cookies: Cookie,
  "acceptable-use": AlertTriangle,
  "refund-policy": Receipt,
  "intellectual-property": Scale,
};

export default function LegalHubPage() {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <LegalHeader
        title="Suprilo Legal Center"
        description="Welcome to the central repository for Suprilo's pre-launch legal documents, privacy standards, and platform terms. These drafts are prepared for internal review prior to our public launch."
        badgeText="Pre-Launch Policy Hub"
        statusText="Drafts Pending Review"
        breadcrumbs={[]}
      />

      {/* Pre-Launch Context & Transparency Card */}
      <div className="bg-amber-50/60 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm uppercase tracking-wider">
          <Info className="w-4 h-4 text-amber-700" />
          <span>Important Pre-Launch Notice</span>
        </div>

        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          Suprilo is currently under active engineering and design development. The policies linked below represent our comprehensive privacy and contractual framework drafted for pre-launch operational and legal review. None of these documents are legally effective or binding until officially reviewed, completed with verified entity information, and publicly published by the platform operator.
        </p>

        <div className="pt-2 border-t border-amber-200/70 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-950">
          <div>
            <span className="font-bold text-amber-900">Legal Operator: </span>
            <OwnerReviewNotice
              label="[OWNER REVIEW REQUIRED: Legal Entity Name]"
              note="Please enter registered company name, LLP, or proprietor trade identity."
            />
          </div>
          <div>
            <span className="font-bold text-amber-900">Registered Office: </span>
            <OwnerReviewNotice
              label="[OWNER REVIEW REQUIRED: Registered Address]"
              note="Official physical address in India as required by the IT Rules."
            />
          </div>
        </div>
      </div>

      {/* Grid of Legal Documents */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-brand-warm-border">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight">
              Policy Documents
            </h2>
            <p className="text-xs text-slate-500">
              Select any document below to inspect its complete draft sections and review notes.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {LEGAL_DOCUMENTS.length} Documents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LEGAL_DOCUMENTS.map((doc) => {
            const Icon = ICONS[doc.slug as keyof typeof ICONS] || Shield;

            return (
              <div
                key={doc.slug}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF0F2] text-[#FF4D6D] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <span>{doc.badge}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-[#17152A] group-hover:text-brand-pink transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {doc.description}
                    </p>
                  </div>

                  {/* Key Sections Preview */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Key Topics Covered:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {doc.sections.slice(0, 3).map((sec, idx) => (
                        <li key={idx} className="truncate">
                          • {sec.title}
                        </li>
                      ))}
                      {doc.sections.length > 3 && (
                        <li className="text-[11px] font-medium text-slate-400 italic">
                          + {doc.sections.length - 3} more sections
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="pt-6">
                  <Link
                    href={doc.href}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-[#FFE4E8] text-[#17152A] hover:text-[#FF4D6D] border border-slate-200 hover:border-[#FECDD3] font-bold text-xs flex items-center justify-between transition-all group-hover:translate-x-0.5"
                  >
                    <span>Read Draft Policy</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Summary Grid for Legal Reviewer */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="space-y-1 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="text-lg font-black text-[#17152A]">
              Architecture & Current Data Practice Summary
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Factual summary of Suprilo’s current codebase architecture for legal and compliance reviewers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-black text-[#17152A]">1. Authentication</h4>
            <p className="leading-relaxed">
              Firebase Authentication via Google Sign-In only. Collects basic profile info (Google Display Name, Google Email, Profile Picture URL, Firebase UID). No email/password database or SMS phone auth.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-black text-[#17152A]">2. User Content & Images</h4>
            <p className="leading-relaxed">
              Secret photos uploaded during card creation are handled locally via client-side FileReader Data URLs (5MB limit). Remote storage buckets in Supabase Storage are not yet wired for public production uploads.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-black text-[#17152A]">3. Billing & Payments</h4>
            <p className="leading-relaxed">
              Zero payment gateways (Stripe/Razorpay) currently active. All users access the Free Starter Tier ($0/month). Proposed Pro ($5) and Advanced ($10) tiers are informational only with honest Coming Soon modals.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-black text-[#17152A]">4. Cookies & Analytics</h4>
            <p className="leading-relaxed">
              No advertising, remarketing, or behavioral profiling cookies. No third-party tracking scripts (Google Analytics, PostHog, Meta Pixel) installed. Client state is managed via Firebase IndexedDB and sessionStorage.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-black text-[#17152A]">5. Account Deletion</h4>
            <p className="leading-relaxed">
              Self-service automated account deletion is not implemented in the current release. Account settings UI honestly directs deletion requests to manual support workflows pending backend engine deployment.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-black text-[#17152A]">6. Governing Framework</h4>
            <p className="leading-relaxed">
              Intended to comply with India’s Digital Personal Data Protection Act (DPDP Act 2023), Information Technology Act 2000, and consumer protection guidelines upon official launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
