import * as React from "react";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { OwnerReviewNotice } from "@/components/legal/OwnerReviewNotice";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

export const metadata = {
  title: "Acceptable Use Policy (Pre-Launch Draft) | Suprilo",
  description:
    "Suprilo Acceptable Use Policy draft defining prohibited content, community safety standards, and abuse reporting procedures.",
};

const docMeta = LEGAL_DOCUMENTS.find((d) => d.slug === "acceptable-use")!;

export default function AcceptableUsePolicyPage() {
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
            { label: "Acceptable Use" },
          ]}
        />

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Pre-Launch Draft Status Notice:</p>
          <p className="mt-1">
            This Acceptable Use Policy sets forth the content standards and safety rules designed to govern Suprilo upon public launch. It is currently under operational review.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: PURPOSE                                                        */}
        {/* ========================================================================= */}
        <section id="purpose" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            1. Purpose & Guiding Principles
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo is designed to spread genuine joy, heartfelt celebrations, and delightful surprises. To ensure our platform remains safe, welcoming, and uplifting for creators and recipients alike, all users must adhere to this Acceptable Use Policy.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: PROHIBITED CONTENT                                             */}
        {/* ========================================================================= */}
        <section id="prohibited-content" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            2. Prohibited Content Categories
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You must not create, upload, reveal, or share any scratch card containing content that falls into any of the following categories:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Harassment, Stalking & Bullying: </span>
              Content intended to intimidate, demean, humiliate, or menace any individual.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Non-Consensual Imagery: </span>
              Photographs or videos of any person uploaded without their explicit permission or knowledge.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Sexually Explicit & Obscene Material: </span>
              Pornography, sexually suggestive depictions, or content harmful to minors.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Child Sexual Exploitation and Abuse (CSAM): </span>
              Zero tolerance. Any such material will result in immediate termination, blacklisting, and reporting to law enforcement authorities.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Hate Speech & Discrimination: </span>
              Attacking, vilifying, or dehumanizing individuals based on race, religion, gender, sexual orientation, disability, caste, or nationality.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Defamatory & Deceptive Claims: </span>
              False statements designed to harm someone&apos;s reputation or perpetrate scams, impersonation, or financial fraud.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Violence & Self-Harm: </span>
              Content depicting gratuitous violence, glorifying terrorism, or encouraging suicide or self-harm.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Intellectual Property Infringement: </span>
              Content that violates another party&apos;s copyright, trademark, or trade secret rights.
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: PROHIBITED TECHNICAL CONDUCT                                   */}
        {/* ========================================================================= */}
        <section id="prohibited-conduct" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            3. Prohibited Technical & Platform Conduct
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You agree not to engage in technical misuse of our platform, including:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Deploying automated scrapers, bots, spiders, or scripts to bulk-generate scratch cards.</li>
            <li>Circumventing quota restrictions, monthly card limits, or security filters.</li>
            <li>Probing, scanning, or testing vulnerabilities in Suprilo&apos;s infrastructure without authorization.</li>
            <li>Launching denial-of-service (DoS/DDoS) attacks or burdening server resources.</li>
            <li>Attempting to decompile, reverse-engineer, or disassemble any part of the service.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: SHARING SAFEGUARDS                                             */}
        {/* ========================================================================= */}
        <section id="sharing-safeguards" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            4. Safeguards for Card Sharing Links
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo cards are distributed via shareable web links. You must not:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Send unsolicited spam links across messaging apps, forums, or SMS.</li>
            <li>Disguise malicious destinations or phishing attempts behind Suprilo card previews.</li>
            <li>Use surprise reveal coatings to bait or deceive recipients with malicious or shocking imagery.</li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: REPORTING ABUSE                                                */}
        {/* ========================================================================= */}
        <section id="reporting-abuse" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            5. Reporting Abuse or Inappropriate Content
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you receive a Suprilo card or encounter content that violates this Acceptable Use Policy, please report it immediately:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p className="font-bold text-[#17152A]">Abuse Reporting Protocol:</p>
            <p>
              Send an email to: <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Abuse & Safety Contact Email, e.g. abuse@suprilo.com]" />
            </p>
            <p className="text-slate-500">
              Please include the card link URL, a description of the violation, and any screenshots if available. Our moderation team reviews reports promptly.
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: INVESTIGATION & ENFORCEMENT                                    */}
        {/* ========================================================================= */}
        <section id="enforcement-actions" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            6. Investigation & Enforcement Actions
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Upon receiving an abuse notice or detecting non-compliant activity, we reserve the right to take proportionate enforcement action:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Immediate disabling of public access to the offending scratch card link.</li>
            <li>Issuance of formal warnings to the creator account.</li>
            <li>Temporary or permanent termination of creator accounts.</li>
            <li>Cooperation with relevant statutory bodies and law enforcement in cases of criminal misuse.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

