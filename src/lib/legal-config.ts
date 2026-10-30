/**
 * Centralized Legal Configuration & Policy Metadata
 *
 * CRITICAL NOTICE:
 * Suprilo is currently under active development and has NOT publicly launched.
 * All legal documents are pre-launch DRAFTS prepared for owner and legal review.
 * Publication is disabled by default (`publicationEnabled: false`).
 * No legal facts or entity details are fabricated; unverified items use [OWNER REVIEW REQUIRED].
 */

export interface LegalConfig {
  status: "draft" | "review" | "published";
  publicationEnabled: boolean;
  version: string;
  lastUpdated: string;
  effectiveDate: string | null;
  operator: {
    legalName: string;
    tradeName: string;
    registeredAddress: string;
    contactEmail: string;
    privacyEmail: string;
    grievanceEmail: string;
    governingLaw: string;
    jurisdiction: string;
  };
}

export const LEGAL_CONFIG: LegalConfig = {
  status: "draft",
  publicationEnabled: false,
  version: "0.1-prelaunch-draft",
  lastUpdated: "October 30, 2026",
  effectiveDate: null, // Explicitly null: drafts are NOT yet in effect
  operator: {
    legalName: "[OWNER REVIEW REQUIRED: Legal Entity / Company / Proprietor Name]",
    tradeName: "Suprilo",
    registeredAddress: "[OWNER REVIEW REQUIRED: Registered Office / Physical Address, India]",
    contactEmail: "[OWNER REVIEW REQUIRED: Official Support Email, e.g. support@suprilo.com]",
    privacyEmail: "[OWNER REVIEW REQUIRED: Privacy & Data Protection Email, e.g. privacy@suprilo.com]",
    grievanceEmail: "[OWNER REVIEW REQUIRED: Grievance Officer Contact Email as required by India IT Rules]",
    governingLaw: "[OWNER REVIEW REQUIRED: Governing Law, e.g. Laws of the Republic of India]",
    jurisdiction: "[OWNER REVIEW REQUIRED: Exclusive Jurisdiction, e.g. Courts of competent jurisdiction in New Delhi / Bengaluru, India]",
  },
};

export interface LegalDocumentMeta {
  slug: string;
  href: string;
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
  badgeVariant: "neutral" | "pink" | "purple" | "amber";
  status: string;
  sections: { id: string; title: string }[];
}

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  {
    slug: "privacy",
    href: "/legal/privacy",
    title: "Privacy Policy",
    shortTitle: "Privacy",
    description:
      "Details how Suprilo handles personal information, Google Sign-In data, user-uploaded card content, and your privacy rights under applicable data protection laws.",
    badge: "Core Policy",
    badgeVariant: "pink",
    status: "Pre-Launch Draft",
    sections: [
      { id: "introduction", title: "1. Introduction & Service Operator" },
      { id: "information-collected", title: "2. Information We Collect" },
      { id: "how-we-use-information", title: "3. How We Use Your Information" },
      { id: "photos-and-content", title: "4. Photos, Messages & User Content" },
      { id: "third-party-services", title: "5. Third-Party Service Providers" },
      { id: "data-retention", title: "6. Data Retention Principles" },
      { id: "data-security", title: "7. Data Security Practices" },
      { id: "user-rights", title: "8. User Rights & Privacy Requests" },
      { id: "account-deletion", title: "9. Account & Data Deletion Workflow" },
      { id: "childrens-privacy", title: "10. Children's Privacy & Age Limits" },
      { id: "international-transfers", title: "11. International Data Processing" },
      { id: "policy-changes", title: "12. Policy Changes & Privacy Contact" },
    ],
  },
  {
    slug: "terms",
    href: "/legal/terms",
    title: "Terms of Service",
    shortTitle: "Terms",
    description:
      "Defines the rules, responsibilities, and conditions governing the use of Suprilo’s scratch-card creation platform, accounts, and sharing tools.",
    badge: "Core Agreement",
    badgeVariant: "purple",
    status: "Pre-Launch Draft",
    sections: [
      { id: "acceptance", title: "1. Acceptance of Terms & Eligibility" },
      { id: "service-description", title: "2. Description of the Suprilo Service" },
      { id: "user-accounts", title: "3. Creator Accounts & Google Sign-In" },
      { id: "user-content", title: "4. User-Generated Content & Ownership" },
      { id: "user-responsibilities", title: "5. User Responsibilities & Conduct" },
      { id: "sharing-recipients", title: "6. Card Sharing, Links & Recipient Access" },
      { id: "templates-ip", title: "7. Suprilo Intellectual Property & Templates" },
      { id: "plans-pricing", title: "8. Free & Proposed Paid Subscription Tiers" },
      { id: "future-billing", title: "9. Draft Future Subscription & Billing Terms" },
      { id: "availability", title: "10. Service Availability & Modifications" },
      { id: "disclaimers", title: "11. Disclaimers & Limitation of Liability" },
      { id: "suspension-termination", title: "12. Account Suspension & Termination" },
      { id: "dispute-resolution", title: "13. Dispute Resolution & Governing Law" },
      { id: "changes-to-terms", title: "14. Modifications to these Terms" },
    ],
  },
  {
    slug: "cookies",
    href: "/legal/cookies",
    title: "Cookie Policy",
    shortTitle: "Cookies",
    description:
      "Explains Suprilo’s minimal use of essential local storage and session tokens for authentication, with zero third-party advertising or tracking cookies.",
    badge: "Technical Transparency",
    badgeVariant: "neutral",
    status: "Pre-Launch Draft",
    sections: [
      { id: "what-are-cookies", title: "1. What Are Cookies & Local Storage?" },
      { id: "technologies-used", title: "2. Technologies Currently in Use" },
      { id: "essential-sessions", title: "3. Essential Authentication Storage" },
      { id: "analytics-advertising", title: "4. Analytics & Advertising Disclosure" },
      { id: "managing-cookies", title: "5. Managing Browser Storage & Preferences" },
      { id: "policy-updates", title: "6. Updates to this Cookie Policy" },
    ],
  },
  {
    slug: "acceptable-use",
    href: "/legal/acceptable-use",
    title: "Acceptable Use Policy",
    shortTitle: "Acceptable Use",
    description:
      "Sets clear community standards and prohibited behaviors to keep surprise cards wholesome, safe, and free from harassment or malicious misuse.",
    badge: "Safety & Standards",
    badgeVariant: "amber",
    status: "Pre-Launch Draft",
    sections: [
      { id: "purpose", title: "1. Purpose & Guiding Principles" },
      { id: "prohibited-content", title: "2. Prohibited Content Categories" },
      { id: "prohibited-conduct", title: "3. Prohibited Technical & Platform Conduct" },
      { id: "sharing-safeguards", title: "4. Safeguards for Card Sharing Links" },
      { id: "reporting-abuse", title: "5. Reporting Abuse or Inappropriate Content" },
      { id: "enforcement-actions", title: "6. Investigation & Enforcement Actions" },
    ],
  },
  {
    slug: "refund-policy",
    href: "/legal/refund-policy",
    title: "Refund & Cancellation Policy",
    shortTitle: "Refunds",
    description:
      "Draft commercial terms outlining future billing, cancellation rights, and refund procedures once paid subscriptions are launched.",
    badge: "Draft — Paid Tiers Inactive",
    badgeVariant: "amber",
    status: "Pre-Launch Draft (Inactive)",
    sections: [
      { id: "current-status", title: "1. Current Status: Paid Plans Inactive" },
      { id: "free-plan-guarantee", title: "2. Free Starter Tier Guarantee" },
      { id: "future-subscriptions", title: "3. Future Paid Subscription Architecture" },
      { id: "cancellation-rights", title: "4. Subscription Cancellation Principles" },
      { id: "refund-eligibility", title: "5. Draft Refund Eligibility Standards" },
      { id: "billing-errors", title: "6. Billing Errors & Unauthorized Charges" },
      { id: "statutory-rights", title: "7. Statutory Consumer Rights" },
    ],
  },
  {
    slug: "intellectual-property",
    href: "/legal/intellectual-property",
    title: "Copyright & Intellectual Property Policy",
    shortTitle: "IP & Copyright",
    description:
      "Clarifies ownership of original Suprilo card designs, illustrations, brand assets, user-generated memories, and copyright notice procedures.",
    badge: "Rights & Ownership",
    badgeVariant: "purple",
    status: "Pre-Launch Draft",
    sections: [
      { id: "suprilo-ip", title: "1. Suprilo Platform & Brand Ownership" },
      { id: "templates-illustrations", title: "2. Original Templates & Illustration Assets" },
      { id: "user-content-rights", title: "3. User Content Ownership & Limited License" },
      { id: "infringement-reporting", title: "4. Notice of Copyright Infringement" },
      { id: "counter-notice", title: "5. Counter-Notification Procedure" },
      { id: "repeat-infringers", title: "6. Repeat Infringer Policy" },
    ],
  },
];

