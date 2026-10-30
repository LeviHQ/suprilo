import * as React from "react";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { OwnerReviewNotice } from "@/components/legal/OwnerReviewNotice";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

export const metadata = {
  title: "Copyright & Intellectual Property Policy (Pre-Launch Draft) | Suprilo",
  description:
    "Suprilo Copyright and Intellectual Property Policy draft covering brand assets, template licensing, and copyright notice procedures.",
};

const docMeta = LEGAL_DOCUMENTS.find((d) => d.slug === "intellectual-property")!;

export default function IntellectualPropertyPolicyPage() {
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
            { label: "Intellectual Property" },
          ]}
        />

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Pre-Launch Draft Status Notice:</p>
          <p className="mt-1">
            This Intellectual Property Policy defines the ownership of Suprilo platform assets and establishes clear reporting procedures for copyright holders. It is prepared for pre-launch operational review.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: SUPRILO PLATFORM & BRAND                                       */}
        {/* ========================================================================= */}
        <section id="suprilo-ip" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            1. Suprilo Platform & Brand Ownership
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            All elements of the Suprilo service—including the Suprilo name, trademark, visual brand identity, logo, user interface designs, custom icons, source code, algorithms, and interactive HTML5 canvas scratch routines—are the exclusive intellectual property of Suprilo and its licensors.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            You may not reproduce, reverse-engineer, distribute, mirror, or create derivative works from our software or brand assets without prior written consent.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: TEMPLATES & ILLUSTRATIONS                                      */}
        {/* ========================================================================= */}
        <section id="templates-illustrations" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            2. Original Templates & Illustration Assets
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo provides curated greeting templates, 3D celebratory artwork, metallic foil textures (Lavender Pink, Golden Foil, Cosmic Purple, Mint Fresh), and decorative stickers designed to make digital surprise cards magical.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Permitted Use: </span>
              We grant active users a limited, revocable, non-exclusive license to use these assets exclusively within the Suprilo card studio to assemble personal greeting cards.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Prohibited Exploitation: </span>
              You may not extract, scrape, resell, or license Suprilo illustrations or card templates as standalone digital assets, print-on-demand stock, or NFT assets.
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: USER CONTENT RIGHTS                                            */}
        {/* ========================================================================= */}
        <section id="user-content-rights" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            3. User Content Ownership & Limited License
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We respect the creative and personal rights of our creators:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>You retain complete ownership and copyright in the messages, text, and personal photographs you upload to your cards.</li>
            <li>Suprilo does not claim any proprietary interest in your personal memories or photographs.</li>
            <li>You grant Suprilo only the minimal technical license needed to store, process, and transmit the card content to display it to your designated recipients.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: INFRINGEMENT REPORTING                                         */}
        {/* ========================================================================= */}
        <section id="infringement-reporting" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            4. Notice of Copyright Infringement
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you believe in good faith that any content hosted on a Suprilo card infringes your copyright or intellectual property rights, please submit a formal takedown notice to our designated Copyright Agent:
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-[#17152A]">Designated Copyright & Grievance Contact:</p>
            <p>
              Email: <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Copyright / DMCA Contact Email, e.g. copyright@suprilo.com]" />
            </p>
            <p className="text-slate-500">
              Your notice should include:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>The exact URL of the Suprilo card containing the allegedly infringing material.</li>
              <li>Your contact information (name, address, telephone number, email).</li>
              <li>A statement that you have a good faith belief that use of the material is not authorized.</li>
              <li>A statement under penalty of perjury that the information provided is accurate and that you are authorized to act on behalf of the owner.</li>
            </ol>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: COUNTER-NOTICE                                                 */}
        {/* ========================================================================= */}
        <section id="counter-notice" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            5. Counter-Notification Procedure
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If your card was disabled due to an infringement notice and you believe the removal was the result of a mistake or misidentification, you may submit a counter-notice explaining why the material is authorized. Upon receipt of a valid counter-notice, we will notify the complainant and may restore the card in accordance with applicable law unless legal action is initiated.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: REPEAT INFRINGERS                                              */}
        {/* ========================================================================= */}
        <section id="repeat-infringers" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            6. Repeat Infringer Policy
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In appropriate circumstances, Suprilo will terminate the accounts of users who are determined to be repeat infringers of third-party intellectual property rights.
          </p>
        </section>
      </div>
    </div>
  );
}

