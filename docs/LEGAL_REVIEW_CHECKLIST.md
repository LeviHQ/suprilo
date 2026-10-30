# SUPRILO — Internal Legal & Operational Review Checklist
**Document Classification:** Internal / Pre-Launch Owner Review (Confidential)  
**Target Brand:** Suprilo (*Make Every Moment a Surprise*)  
**Version:** 0.1-prelaunch-review  
**Status:** In Review — Not For Public Distribution  

---

## 📌 Purpose of this Document
This checklist is an internal operational tool for the **Suprilo Founder, Product Owner, and Legal Counsel**. It maps every factual implementation in the codebase against legal, privacy, and regulatory requirements (including India's **Digital Personal Data Protection Act 2023**, **Information Technology Act 2000 & IT Rules 2021**, and consumer regulations) before the platform is officially launched to the public.

---

## 🔍 Section 1: Verified Codebase Facts vs. Pending Decisions

| Operational Area | Verified Codebase Status (Phase 3) | Pending Legal / Owner Decision | Status |
| :--- | :--- | :--- | :--- |
| **1. Authentication** | Firebase Auth with Google Sign-In only (`src/lib/firebase.ts`). Collects `uid`, `email`, `displayName`, `photoURL`. | Decide whether to add email/password or SMS auth later. Verify if Google OAuth consent screen brand verification is initiated. | ⏳ In Review |
| **2. Database & Tables** | Client-side state in Next.js. Supabase integration planned but not currently storing live production cards. | Finalize Supabase PostgreSQL schema, Row-Level Security (RLS) policies, and server-side card persistence. | ⏳ Pending Integration |
| **3. Media Storage** | Local in-memory Data URLs via HTML5 FileReader (5MB limit). Supabase Storage bucket not accepting public uploads. | Select storage region (e.g. AWS Mumbai / Supabase Asia-South). Define bucket access policies (signed URLs vs public CDN). | ⏳ Pending Setup |
| **4. Account Deletion** | In `/profile/settings`, deletion modal informs users that direct automated deletion is coming in a future release. | Finalize automated backend cascade deletion engine (deleting user record, cards, photos, auth tokens). Define SLA (e.g., 30 days). | ⏳ Required Pre-Launch |
| **5. Card Sharing Links** | Current UI creates preview links (`suprilo.com/s/demo-*`). No backend card endpoint currently serving arbitrary links. | Decide whether cards are accessible via unguessable UUIDs without authentication, or if password protection/PINs will be added. | ⏳ Decision Needed |
| **6. Billing & Payments** | Zero active payment gateways. Free Starter Tier ($0/mo) active. Pro ($5) and Advanced ($10) plans are informational with Coming Soon modals. | Choose payment aggregator (Razorpay, Cashfree, or Stripe India). Establish merchant entity, GSTIN, and automated invoicing. | ⏳ Inactive (Draft Policy Prepared) |
| **7. Cookies & Tracking** | Zero advertising cookies. No Google Analytics, Meta Pixel, or PostHog scripts installed. Local session tokens in IndexedDB. | Confirm whether privacy-first product telemetry (e.g. PostHog EU cloud or Plausible) will be added with consent management. | ⏳ Verified Zero Trackers |
| **8. Support & Grievances** | In `/profile/support`, in-app ticket form is disabled with notice directing users to contact email. | Appoint statutory Grievance Officer and publish designated email as required by Rule 3(2) of the IT Rules. | ⏳ Legal Requirement |

---

## 📝 Section 2: Owner Action Items Checklist

### 🏛️ A. Entity & Operator Identity
- [ ] **Legal Operator Name**: Define exact registered entity (e.g., *Suprilo Technologies Private Limited*, LLP, or Proprietorship).
- [ ] **Registered Office Address**: Provide complete physical registered address in India.
- [ ] **Corporate Identification / GSTIN**: Record CIN, LLPIN, or GST number if applicable.
- [ ] **Official Support Email**: Set up dedicated mailbox (e.g., `support@suprilo.com`).
- [ ] **Privacy & Grievance Email**: Set up dedicated mailbox (e.g., `privacy@suprilo.com` / `grievance@suprilo.com`).

### 🛡️ B. Data Protection & Privacy (DPDP Act 2023)
- [ ] **Notice & Consent Language**: Review Google Sign-In consent notice on `/create` and signup modal.
- [ ] **Children's Privacy Threshold**: Formally decide whether Suprilo permits users under 18 with parental consent or strictly restricts access to 18+.
- [ ] **Data Retention Periods**:
  - [ ] Set inactive card expiration window (e.g., 90 days, 180 days, or permanent until deleted).
  - [ ] Set technical error log retention window (e.g., 30 days).
  - [ ] Set support ticket record retention window (e.g., 180 days).
- [ ] **Manual Deletion Protocol**: Define standard operating procedure for handling user erasure requests before automated deletion goes live.
- [ ] **Grievance Officer Appointment**: Formally name the Grievance Officer, designate title, and specify working hours for dispute resolution.

### 💳 C. Commercial & Payment Setup (Future Phase)
- [ ] **Payment Partner Agreement**: Execute merchant agreement with RBI-authorized payment aggregator (e.g. Razorpay).
- [ ] **Refund Window Policy**: Approve formal refund grace period (e.g., 7-day or 14-day refund window for unused card quotas).
- [ ] **Currency & Pricing Model**: Confirm whether billing will be localized in INR (e.g., ₹199/mo, ₹499/mo) alongside USD ($5/mo, $10/mo) for international creators.
- [ ] **Subscription Renewal Disclosures**: Configure automated pre-debit notifications as mandated by RBI e-mandate guidelines.

### ⚖️ D. Legal Review & Jurisdiction
- [ ] **Governing Law**: Confirm jurisdiction (e.g., *Laws of the Republic of India*).
- [ ] **Courts of Competent Jurisdiction**: Specify forum city (e.g., *Courts in New Delhi / Bengaluru, India*).
- [ ] **Legal Counsel Review**: Have qualified corporate and technology legal counsel review all draft policies in `/legal/*`.
- [ ] **Enable Publication**: Once reviewed and approved, update `publicationEnabled: true` and set the `effectiveDate` in `src/lib/legal-config.ts`.

---

## 🔒 Section 3: Summary of Published Policy Routes

All policy drafts are accessible in the application for pre-launch evaluation:

1. **Legal Center Hub**: [`/legal`](file:///d:/My%20Projects/suprilo/src/app/legal/page.tsx)
2. **Privacy Policy**: [`/legal/privacy`](file:///d:/My%20Projects/suprilo/src/app/legal/privacy/page.tsx)
3. **Terms of Service**: [`/legal/terms`](file:///d:/My%20Projects/suprilo/src/app/legal/terms/page.tsx)
4. **Cookie Policy**: [`/legal/cookies`](file:///d:/My%20Projects/suprilo/src/app/legal/cookies/page.tsx)
5. **Acceptable Use Policy**: [`/legal/acceptable-use`](file:///d:/My%20Projects/suprilo/src/app/legal/acceptable-use/page.tsx)
6. **Refund & Cancellation Policy**: [`/legal/refund-policy`](file:///d:/My%20Projects/suprilo/src/app/legal/refund-policy/page.tsx) *(Marked Draft Inactive)*
7. **Copyright & Intellectual Property**: [`/legal/intellectual-property`](file:///d:/My%20Projects/suprilo/src/app/legal/intellectual-property/page.tsx)

