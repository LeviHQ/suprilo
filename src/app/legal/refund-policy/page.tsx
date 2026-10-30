import * as React from "react";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { OwnerReviewNotice } from "@/components/legal/OwnerReviewNotice";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

export const metadata = {
  title: "Refund & Cancellation Policy (Draft - Inactive) | Suprilo",
  description:
    "Suprilo draft Refund & Cancellation Policy. Inactive draft: paid subscriptions are not currently available for purchase.",
};

const docMeta = LEGAL_DOCUMENTS.find((d) => d.slug === "refund-policy")!;

export default function RefundPolicyPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      {/* Sidebar: Navigation & Table of Contents */}
      <div className="lg:col-span-1">
        <LegalSidebar sections={docMeta.sections} />
      </div>

      {/* Main Document Content */}
      <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-10">
        <LegalHeader
          title={docMeta.title}
          description={docMeta.description}
          badgeText={docMeta.badge}
          statusText={docMeta.status}
          breadcrumbs={[
            { label: "Legal Center", href: "/legal" },
            { label: "Refund Policy" },
          ]}
        />

        {/* Prominent INACTIVE Status Warning Banner */}
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 space-y-2">
          <p className="text-sm font-black text-amber-900 tracking-tight uppercase">
            ⚠️ DRAFT — PAID SUBSCRIPTIONS ARE NOT YET AVAILABLE FOR PURCHASE
          </p>
          <p className="leading-relaxed">
            Suprilo is currently in pre-launch development. All creator tools are accessible under the <strong>Free Creator Starter Plan ($0/month)</strong>. Paid subscriptions (Pro and Advanced) represent proposed early-access features and cannot be purchased at this time. No billing transactions or charges are being processed.
          </p>
          <p className="text-amber-800 italic">
            This draft outlines the proposed commercial terms that will take effect once payment processing is integrated.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: CURRENT STATUS                                                 */}
        {/* ========================================================================= */}
        <section id="current-status" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            1. Current Status: Paid Plans Inactive
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Because Suprilo does not currently accept monetary payments, no user has been or can be billed. You do not need to submit cancellation requests or refund applications for any current use of the platform.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: FREE STARTER GUARANTEE                                         */}
        {/* ========================================================================= */}
        <section id="free-plan-guarantee" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            2. Free Starter Tier Guarantee
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our Free Creator Starter Plan requires no payment card details, has no hidden trial fees, and will not automatically convert into a paid subscription without your explicit affirmative consent.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: FUTURE PAID SUBSCRIPTIONS                                      */}
        {/* ========================================================================= */}
        <section id="future-subscriptions" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            3. Future Paid Subscription Architecture
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            When paid tiers (such as the proposed $5/mo Pro plan and $10/mo Advanced plan) launch commercially, the following structure is planned:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Payments will be processed via RBI-authorized payment aggregators (e.g. Razorpay, Stripe India).</li>
            <li>Invoices and tax receipts will be generated automatically and accessible in your account.</li>
            <li>Subscriptions will renew on a month-to-month basis unless cancelled prior to the renewal date.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: CANCELLATION RIGHTS                                            */}
        {/* ========================================================================= */}
        <section id="cancellation-rights" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            4. Subscription Cancellation Principles
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Once paid plans are live, creators will be able to cancel recurring subscriptions at any time directly through their account Billing settings (`/profile/billing`) with immediate effect:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Cancellation will prevent all future automated renewals.</li>
            <li>You will retain access to your paid card creation quotas through the end of your prepaid billing period.</li>
            <li>At the conclusion of the billing cycle, your account will smoothly transition to the Free Starter tier.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: REFUND ELIGIBILITY                                             */}
        {/* ========================================================================= */}
        <section id="refund-eligibility" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            5. Draft Refund Eligibility Standards
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The platform operator will evaluate refund requests according to fair commercial criteria:
          </p>
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              Proposed Refund Grace Period: <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Refund Window, e.g. 7-day or 14-day cooling-off period]" note="Confirm commercial policy for first-time paid upgrades." />
            </p>
            <p>
              Technical Malfunction Refunds: If a major technical failure prevents the delivery or scratching of cards and our team cannot resolve it within a reasonable timeframe, a full or pro-rata refund will be issued.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: BILLING ERRORS                                                 */}
        {/* ========================================================================= */}
        <section id="billing-errors" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            6. Billing Errors & Unauthorized Charges
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In the event of duplicate charges, incorrect tier billing, or unauthorized transactions once checkout is live, users may contact our billing team at <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Dedicated Billing Email]" />. Verified billing errors will be refunded in full to the original payment method within <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Refund Processing SLA, e.g. 5-7 business days]" />.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: STATUTORY RIGHTS                                               */}
        {/* ========================================================================= */}
        <section id="statutory-rights" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            7. Statutory Consumer Rights
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Nothing in this policy limits or excludes your non-waivable statutory rights under applicable consumer protection legislation in India or your local jurisdiction.
          </p>
        </section>
      </div>
    </div>
  );
}

