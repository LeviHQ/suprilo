import * as React from "react";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { LEGAL_DOCUMENTS } from "@/lib/legal-config";

export const metadata = {
  title: "Cookie Policy (Pre-Launch Draft) | Suprilo",
  description:
    "Suprilo Cookie Policy draft explaining essential browser storage, Firebase sessions, and absence of advertising tracking.",
};

const docMeta = LEGAL_DOCUMENTS.find((d) => d.slug === "cookies")!;

export default function CookiePolicyPage() {
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
            { label: "Cookie Policy" },
          ]}
        />

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Pre-Launch Draft Status Notice:</p>
          <p className="mt-1">
            This Cookie Policy describes the technical storage mechanisms currently verified in the Suprilo codebase. It is prepared for pre-launch operational review and confirms our zero-advertising cookie commitment.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: WHAT ARE COOKIES                                               */}
        {/* ========================================================================= */}
        <section id="what-are-cookies" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            1. What Are Cookies & Local Storage?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Cookies and web storage technologies (such as HTML5 `localStorage`, `sessionStorage`, and `IndexedDB`) are small files or data keys stored on your computer or mobile device when you access a web application. They are widely used to maintain secure user sessions and remember client preferences.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: TECHNOLOGIES CURRENTLY IN USE                                  */}
        {/* ========================================================================= */}
        <section id="technologies-used" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            2. Technologies Currently in Use
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Suprilo takes an ultra-minimal approach to client storage. We do not use third-party behavioral tracking cookies, ad networks, or commercial fingerprinting scripts.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Storage Key / Tech</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Purpose & Lifespan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-mono text-[11px] text-brand-dark">firebase:authUser:*</td>
                  <td className="p-3">Strictly Essential</td>
                  <td className="p-3">Firebase / Google</td>
                  <td className="p-3">Maintains authenticated creator login session in browser IndexedDB. Persists until sign-out.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-[11px] text-brand-dark">suprilo_auth_return_url</td>
                  <td className="p-3">Functional / Routing</td>
                  <td className="p-3">Suprilo (First-party)</td>
                  <td className="p-3">Stored in `sessionStorage` during mobile Google redirect to return you to `/create`. Cleared immediately on login.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: ESSENTIAL AUTHENTICATION STORAGE                               */}
        {/* ========================================================================= */}
        <section id="essential-sessions" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            3. Essential Authentication Storage
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Firebase authentication tokens stored in your browser are strictly necessary for the operation of the creator studio. Without them, you would be forced to sign into Google every single time you navigate between pages or customize a card. Because these items are strictly essential to provide the service requested by you, they do not require optional cookie consent banners under applicable data protection frameworks.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: ANALYTICS & ADVERTISING DISCLOSURE                             */}
        {/* ========================================================================= */}
        <section id="analytics-advertising" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            4. Analytics & Advertising Disclosure
          </h2>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <span>Zero Advertising Cookies Guarantee:</span>
            </p>
            <p className="leading-relaxed">
              Suprilo does not display third-party advertisements and does not deploy tracking cookies from advertising networks (such as Meta Pixel, TikTok Pixel, or Google Ads Remarketing). We do not engage in behavioral cross-site profiling.
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            If privacy-respecting product telemetry or aggregated performance monitoring is introduced in a future release, this policy will be updated with explicit preference controls and opt-in mechanisms where required by law.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: MANAGING COOKIES                                               */}
        {/* ========================================================================= */}
        <section id="managing-cookies" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            5. Managing Browser Storage & Preferences
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Most modern web browsers allow you to control cookie and local storage settings through their options or preferences menus. You can delete existing session storage or configure your browser to block storage altogether.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please be aware that disabling local storage will prevent you from signing into your Suprilo account and designing surprise cards.
          </p>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: POLICY UPDATES                                                 */}
        {/* ========================================================================= */}
        <section id="policy-updates" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-black text-[#17152A] tracking-tight border-b border-slate-100 pb-2">
            6. Updates to this Cookie Policy
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We will update this Cookie Policy whenever modifications occur in our technical architecture. The version number and update date will be noted at the top of this page.
          </p>
        </section>
      </div>
    </div>
  );
}

