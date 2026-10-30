import * as React from "react";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { OwnerReviewNotice } from "@/components/legal/OwnerReviewNotice";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

export const metadata = {
  title: "Privacy Policy (Pre-Launch Draft) | Suprilo",
  description:
    "Suprilo Privacy Policy draft explaining personal data handling, Google authentication, card content, and privacy rights.",
};

const docMeta = LEGAL_DOCUMENTS.find((d) => d.slug === "privacy")!;

export default function PrivacyPolicyPage() {
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
            { label: "Privacy Policy" },
          ]}
        />

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Pre-Launch Draft Status Notice:</p>
          <p className="mt-1">
            This document is a pre-launch draft formulated for operational and legal review. It reflects current architectural facts verified from the Suprilo codebase. Unverified legal identifiers and pending operational decisions are explicitly marked with owner review notices.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: INTRODUCTION                                                   */}
        {/* ========================================================================= */}
        <section id="introduction" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            1. Introduction & Service Operator
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Welcome to Suprilo. Suprilo is an online digital greeting and surprise-card platform that enables users to create personalized digital scratch cards with custom messages, photos, and interactive scratch-off coatings, which can then be shared with friends, family, and loved ones.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            This Privacy Policy explains how personal data is collected, stored, processed, and protected when you visit the Suprilo website, create an account, design surprise cards, or interact with cards created by other users.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
            <p className="font-bold text-[#17152A]">Platform Operator Identification:</p>
            <p>
              <span className="font-semibold">Legal Operator Name: </span>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Legal Entity Name]" note="Specify legal entity or proprietor operating Suprilo." />
            </p>
            <p>
              <span className="font-semibold">Registered Office: </span>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Registered Office Address, India]" note="Official address required under the IT Act." />
            </p>
            <p>
              <span className="font-semibold">Contact Email: </span>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Official Privacy / Support Email]" note="Primary contact point for data protection inquiries." />
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: INFORMATION WE COLLECT                                         */}
        {/* ========================================================================= */}
        <section id="information-collected" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            2. Information We Collect
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We adhere to principles of data minimization. We only collect information that is strictly necessary to provide the Suprilo scratch-card experience.
          </p>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="space-y-1">
              <h3 className="font-bold text-[#17152A]">A. Information Received via Authentication</h3>
              <p className="leading-relaxed">
                Suprilo uses Google Sign-In via Firebase Authentication. When you create or access an account, we receive basic profile parameters provided by Google:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 pt-1">
                <li>Your Google Full Name / Display Name</li>
                <li>Your Google Account Email Address</li>
                <li>Your Google Profile Picture URL (used to display your avatar in the creator studio)</li>
                <li>A unique Firebase User Identifier (UID) generated for session management</li>
              </ul>
              <p className="text-xs text-slate-500 pt-1">
                We do not collect, view, or store your Google account password.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-[#17152A]">B. User-Generated Card Content</h3>
              <p className="leading-relaxed">
                When you design a surprise card, you provide creative elements:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 pt-1">
                <li>Sender Name and Recipient Name entered in the card editor</li>
                <li>Occasion tag (e.g. Birthday, Anniversary, Friendship, Milestone)</li>
                <li>Card messages, hidden secret text, and secondary reveal notes</li>
                <li>Visual preferences (metallic foil texture, background color palette, decorative stickers)</li>
                <li>
                  Secret Photos: Images you choose to upload from your local device. In the current pre-launch version, photos are processed locally on your device via client-side FileReader data streams (limited to 5MB).
                </li>
              </ul>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-[#17152A]">C. Technical and Session Information</h3>
              <p className="leading-relaxed">
                When you browse Suprilo, standard technical telemetry is generated automatically by your web browser and network infrastructure:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 pt-1">
                <li>Standard HTTP request headers (browser type, operating system, preferred language)</li>
                <li>Internet Protocol (IP) address transmitted to our hosting edge servers (Vercel) to deliver content</li>
                <li>Client-side session tokens stored via browser IndexedDB and sessionStorage to maintain your logged-in state</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-[#17152A]">What We Do NOT Collect: </span>
              Suprilo does not collect financial bank details, credit card numbers, government IDs, biometric data, precise GPS geolocation, or sensitive personal data.
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: HOW WE USE INFORMATION                                         */}
        {/* ========================================================================= */}
        <section id="how-we-use-information" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            3. How We Use Your Information
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use your personal data strictly for operational, security, and service delivery purposes:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Service Delivery: </span>
              To authenticate your creator session, render the card studio, generate scratch cards, and render the interactive HTML5 scratch canvas.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Recipient Experience: </span>
              To display the card, message, and secret photo to intended recipients when they open a shared card link.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Customer Assistance: </span>
              To respond to support inquiries, bug reports, and account-related assistance submitted through our support desk.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Platform Security & Abuse Prevention: </span>
              To protect against automated scraping, spam, denial-of-service attempts, and violations of our Acceptable Use Policy.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Legal Compliance: </span>
              To comply with obligations under India’s Information Technology Act 2000, Digital Personal Data Protection Act 2023, and applicable consumer laws.
            </li>
          </ul>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <span className="font-bold text-[#17152A]">Commitment Against Data Brokering & AI Training: </span>
            We do NOT sell, rent, or monetize your personal data. We do NOT use your private messages, memories, or photos to train commercial artificial intelligence models.
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: PHOTOS AND USER CONTENT                                        */}
        {/* ========================================================================= */}
        <section id="photos-and-content" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            4. Photos, Messages & User Content
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The core concept of Suprilo is sharing happiness through personalized memories. Because user-generated content often involves sensitive personal moments, we establish clear ground rules:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">You Retain Full Ownership: </span>
              You retain all copyright and proprietary rights to the original text and photographs you upload. Suprilo claims zero ownership over your personal creations.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Limited License to Operate: </span>
              You grant Suprilo a limited, non-exclusive, revocable license strictly necessary to store, format, transmit, and display the card to you and anyone accessing your share link.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Permission & Consent Responsibility: </span>
              You represent and warrant that you hold all necessary rights, permissions, and consents from any identifiable individuals appearing in uploaded photos or mentioned in personal messages.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Shareable Link Visibility: </span>
              Cards shared via link can generally be viewed and scratched by anyone in possession of that link. We do not require recipients to create an account. You should only share links with people you trust.
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: THIRD-PARTY SERVICE PROVIDERS                                  */}
        {/* ========================================================================= */}
        <section id="third-party-services" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            5. Third-Party Service Providers
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo engages trusted infrastructure sub-processors to host and deliver platform functionality. Each provider processes data strictly according to contractually bound instructions:
          </p>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-[#17152A]">Firebase Authentication (Google LLC)</h4>
              <p className="mt-1">
                <span className="font-semibold">Role: </span>User identity management, Google Sign-In integration, and cryptographic session verification.
              </p>
              <p className="mt-0.5">
                <span className="font-semibold">Data Shared: </span>User ID, email, display name, and auth tokens.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-[#17152A]">Vercel Inc.</h4>
              <p className="mt-1">
                <span className="font-semibold">Role: </span>Next.js web application hosting, global edge content delivery network (CDN), and serverless execution.
              </p>
              <p className="mt-0.5">
                <span className="font-semibold">Data Processed: </span>HTTP headers, IP addresses for routing and DDoS mitigation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-[#17152A]">Planned Database & Storage (Supabase)</h4>
              <p className="mt-1">
                <span className="font-semibold">Role: </span>Planned cloud database and secure object storage for cards and assets upon launch.
              </p>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Storage Region Confirmation]" note="Confirm specific hosting datacenter region (e.g. Mumbai, India / Singapore)." />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: DATA RETENTION                                                 */}
        {/* ========================================================================= */}
        <section id="data-retention" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            6. Data Retention Principles
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy or to comply with statutory legal requirements.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Account Information: </span>
              Retained for the lifetime of your active Suprilo creator account.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Cards & Uploaded Media: </span>
              Retained while your account remains active or until deleted by the creator.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Inactive Card Lifespans: </span>
              <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Inactive Card Expiration Window]" note="Determine whether public demo/free links expire after a set time (e.g. 90 days, 1 year)." />
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Support Records: </span>
              Retained for up to <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Retention Window, e.g. 180 days]" /> to resolve recurring technical issues.
            </li>
          </ul>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: DATA SECURITY                                                  */}
        {/* ========================================================================= */}
        <section id="data-security" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            7. Data Security Practices
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We implement technical and organizational security controls designed to safeguard your information against unauthorized access, loss, or alteration:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
            <li>HTTPS / TLS encryption in transit for all client-to-server communications.</li>
            <li>Firebase OAuth 2.0 token-based session verification.</li>
            <li>Scoped client-side file reading with strict image file-size ceilings (5MB).</li>
            <li>Restricted administrative access limited to verified personnel.</li>
          </ul>
          <p className="text-xs text-slate-500 italic leading-relaxed">
            Please note: While we follow industry security standards, no electronic transmission over the Internet or digital storage system can be guaranteed to be 100% secure.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 8: USER RIGHTS                                                    */}
        {/* ========================================================================= */}
        <section id="user-rights" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            8. User Rights & Privacy Requests
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In accordance with India’s Digital Personal Data Protection Act (DPDP Act 2023) and applicable international standards, you have the following rights:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li>
              <span className="font-bold text-[#17152A]">Right to Access & Summary: </span>
              You have the right to request a summary of the personal data we process about you.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Right to Correction & Updating: </span>
              You can update your creator display name directly in your Account Settings (`/profile/settings`).
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Right to Erasure / Deletion: </span>
              You may request deletion of your account and associated card records.
            </li>
            <li>
              <span className="font-bold text-[#17152A]">Right to Grievance Redressal: </span>
              You have the right to raise grievances with our designated Grievance Officer.
            </li>
          </ul>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-[#17152A]">Grievance Officer Details: </span>
            <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Grievance Officer Name, Designation & Email]" note="Mandatory appointment under Rule 3(2) of the Information Technology Rules." />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 9: ACCOUNT AND DATA DELETION                                      */}
        {/* ========================================================================= */}
        <section id="account-deletion" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            9. Account & Data Deletion Workflow
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We believe in honest transparency regarding technical capabilities:
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
            <p className="font-bold">Current Technical Status of Deletion:</p>
            <p className="leading-relaxed">
              In the current development release, an automated single-click self-service account deletion engine is scheduled for deployment in a future release. Users requesting immediate account removal may submit an email request to our privacy desk:
            </p>
            <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Deletion Request Handling Protocol & SLA, e.g. within 30 days]" />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 10: CHILDREN'S PRIVACY                                            */}
        {/* ========================================================================= */}
        <section id="childrens-privacy" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            10. Children&apos;s Privacy & Age Limits
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo is designed for general audiences and is not intended for unsupervised use by minors.
          </p>
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              In compliance with Section 9 of the DPDP Act 2023, we do not knowingly process personal data of children under the age of 18 without verifiable parental consent.
            </p>
            <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Minimum User Age & Parental Consent Mechanism Policy]" note="Owner and legal counsel must finalize the formal minimum age threshold (e.g. 13+ with consent vs 18+)." />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 11: INTERNATIONAL DATA PROCESSING                                 */}
        {/* ========================================================================= */}
        <section id="international-transfers" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            11. International Data Processing
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo is developed in India and hosted globally via cloud infrastructure partners including Google Firebase and Vercel. Consequently, your data may be processed on servers located outside your country of residence.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            We ensure all cross-border data processing complies with applicable transfer mechanisms and statutory blacklists/whitelists issued under Section 16 of the DPDP Act 2023.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 12: POLICY CHANGES & CONTACT                                      */}
        {/* ========================================================================= */}
        <section id="policy-changes" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            12. Policy Changes & Privacy Contact
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We may update this Privacy Policy periodically to reflect enhancements to our card studio, infrastructure updates, or legal changes. When material modifications occur, we will update the version number and last updated date at the top of this policy.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-[#17152A]">Privacy Officer Contact:</p>
            <p>Email: <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Official Privacy Email]" /></p>
            <p>Postal Address: <OwnerReviewNotice label="[OWNER REVIEW REQUIRED: Registered Postal Address]" /></p>
          </div>
        </section>
      </div>
    </div>
  );
}
