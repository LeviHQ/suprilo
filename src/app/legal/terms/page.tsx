import * as React from "react";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { OwnerReviewNotice } from "@/components/legal/OwnerReviewNotice";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

export const metadata = {
  title: "Terms of Service (Pre-Launch Draft) | Suprilo",
  description:
    "Suprilo Terms of Service draft governing accounts, card creation, scratch reveal functionality, and platform rules.",
};

const docMeta = LEGAL_DOCUMENTS.find((d) => d.slug === "terms")!;

export default function TermsOfServicePage() {
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
            { label: "Terms of Service" },
          ]}
        />

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Pre-Launch Draft Status Notice:</p>
          <p className="mt-1">
            These Terms of Service are prepared in draft format for operational review prior to public launch. This draft does not constitute an active, legally binding contract until verified and officially published. Unresolved legal determinations are marked with owner review notices.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: ACCEPTANCE                                                     */}
        {/* ========================================================================= */}
        <section id="acceptance" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            1. Acceptance of Terms & Eligibility
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            By creating an account, accessing, or using the Suprilo website and card studio, you signify that you have read, understood, and agree to be bound by these Terms of Service and our related policies, including our Privacy Policy and Acceptable Use Policy.
          </p>
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              <span className="font-bold text-[#17152A]">Age Eligibility: </span>
              You must be at least the age of majority in your jurisdiction, or have the express permission and supervision of a parent or legal guardian, to create an account on Suprilo.
            </p>
            <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Legal Age of Majority Determination]" note="Confirm whether minimum age is strictly 18+ or allows 13+ with guardian consent under Indian Law." />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: DESCRIPTION OF SERVICE                                         */}
        {/* ========================================================================= */}
        <section id="service-description" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            2. Description of the Suprilo Service
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo provides a creative digital platform that allows users to create interactive digital scratch cards. The service includes customizable metallic foil coatings, occasion-themed greeting templates, secret text reveal areas, and photo upload capabilities for celebratory sharing.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Current functionality represents our Phase 3 development milestone. Advanced features such as multi-image collages, detailed analytics histories, and automated payment checkouts are planned for subsequent releases.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: USER ACCOUNTS                                                  */}
        {/* ========================================================================= */}
        <section id="user-accounts" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            3. Creator Accounts & Google Sign-In
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To create and customize scratch cards, users authenticate using Google Sign-In powered by Firebase Authentication. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Provide authentic, accurate information associated with your Google profile.</li>
            <li>Maintain the confidentiality and security of your Google account credentials.</li>
            <li>Promptly notify us if you suspect any unauthorized access to your Suprilo session.</li>
            <li>Accept full responsibility for all activities that occur under your authenticated session.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: USER CONTENT                                                   */}
        {/* ========================================================================= */}
        <section id="user-content" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            4. User-Generated Content & Ownership
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You retain all ownership rights in the text, messages, photographs, and creative materials you input into your cards (&ldquo;User Content&rdquo;).
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Operational License: </span>
              To enable the service, you grant Suprilo a non-exclusive, worldwide, royalty-free license to host, cache, format, transmit, and display your User Content strictly for delivering the card to you and your recipients.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Your Representations: </span>
              You represent and warrant that you own or possess all necessary rights, licenses, and permissions for all User Content you upload, and that such content does not violate any third-party intellectual property, privacy, or publicity rights.
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: USER RESPONSIBILITIES                                          */}
        {/* ========================================================================= */}
        <section id="user-responsibilities" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            5. User Responsibilities & Conduct
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You agree not to use Suprilo for any unlawful, harmful, or abusive purposes. Prohibited actions include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Uploading defamatory, obscene, pornographic, hateful, or harassing material.</li>
            <li>Uploading images of individuals without their explicit authorization.</li>
            <li>Distributing malicious code, viruses, automated crawlers, or platform scrapers.</li>
            <li>Interfering with or disrupting the integrity, performance, or security of our services.</li>
            <li>Attempting unauthorized access to other user accounts or backend infrastructure.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: SHARING & RECIPIENTS                                           */}
        {/* ========================================================================= */}
        <section id="sharing-recipients" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            6. Card Sharing, Links & Recipient Access
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you generate a shareable link for a card, you acknowledge that:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Any person who possesses or receives the share URL can view and scratch the card.</li>
            <li>Recipients may forward or share the link with third parties without our knowledge.</li>
            <li>You should not include confidential financial numbers, passwords, or sensitive medical details on scratch cards.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: INTELLECTUAL PROPERTY & TEMPLATES                              */}
        {/* ========================================================================= */}
        <section id="templates-ip" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            7. Suprilo Intellectual Property & Templates
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Suprilo name, logos, original greeting card templates, 3D artwork, illustrations, software code, and interface designs are the proprietary property of Suprilo and its licensors.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are granted a personal, non-exclusive license to use these templates solely within the platform to create and send personal scratch cards. You may not copy, reverse-engineer, sell, or redistribute Suprilo template artwork outside the platform.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 8: PLANS & PRICING                                                */}
        {/* ========================================================================= */}
        <section id="plans-pricing" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            8. Free & Proposed Paid Subscription Tiers
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo operates on an early-access model with transparent terms:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Free Starter Tier: </span>
              Available to all creators at $0/month. Includes 3 cards per month, standard scratch effects, and shareable links.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Proposed Paid Tiers (Pro $5 / Advanced $10): </span>
              These tiers represent proposed early-access pricing and are currently NOT available for purchase. No active payment processing is enabled.
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 9: DRAFT FUTURE SUBSCRIPTION TERMS                                */}
        {/* ========================================================================= */}
        <section id="future-billing" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            9. Draft Future Subscription & Billing Terms
          </h2>
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
            <p className="font-bold">INACTIVE DRAFT CLAUSE FOR FUTURE COMMERCE:</p>
            <p className="leading-relaxed">
              Upon the commercial launch of paid subscriptions, billing will occur on a monthly recurring basis through a regulated payment aggregator. Creators will have the right to cancel subscriptions at any time via their Billing dashboard.
            </p>
            <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Payment Processor Selection & Billing Schedule]" note="To be finalized with payment aggregator agreements (e.g. Razorpay / Stripe India)." />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 10: AVAILABILITY & MODIFICATIONS                                  */}
        {/* ========================================================================= */}
        <section id="availability" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            10. Service Availability & Modifications
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We strive to provide reliable and delightful service, but Suprilo is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee that the service will be uninterrupted, bug-free, or entirely error-free. We reserve the right to modify or discontinue features with reasonable notice where practical.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 11: DISCLAIMERS & LIABILITY                                       */}
        {/* ========================================================================= */}
        <section id="disclaimers" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            11. Disclaimers & Limitation of Liability
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To the maximum extent permitted by applicable law, Suprilo and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or inability to use the service.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nothing in these terms seeks to exclude or limit liability that cannot be excluded under applicable consumer protection legislation, including India’s Consumer Protection Act 2019.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 12: SUSPENSION & TERMINATION                                      */}
        {/* ========================================================================= */}
        <section id="suspension-termination" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            12. Account Suspension & Termination
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We reserve the right to suspend or terminate your account if you breach these Terms, upload prohibited content, or engage in conduct that harms other users or platform security.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 13: DISPUTE RESOLUTION                                            */}
        {/* ========================================================================= */}
        <section id="dispute-resolution" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            13. Dispute Resolution & Governing Law
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            These Terms shall be governed by and construed in accordance with the substantive laws of the designated jurisdiction, without regard to conflict of law principles.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p>
              <span className="font-bold text-[#17152A]">Governing Law: </span>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Governing Law, e.g. Republic of India]" />
            </p>
            <p>
              <span className="font-bold text-[#17152A]">Jurisdiction: </span>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Exclusive Court Jurisdiction City]" />
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 14: CHANGES TO TERMS                                              */}
        {/* ========================================================================= */}
        <section id="changes-to-terms" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            14. Modifications to these Terms
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We may revise these Terms from time to time. When significant changes occur, we will update the version number and last updated date at the top of this document. Continued use of the platform following notification of updates constitutes your acceptance of the revised Terms.
          </p>
        </section>
      </div>
    </div>
  );
}
