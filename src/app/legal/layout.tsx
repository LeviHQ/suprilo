import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DraftNoticeBanner } from "@/components/legal/DraftNoticeBanner";

export const metadata = {
  title: "Legal Center & Pre-Launch Drafts | Suprilo",
  description:
    "Suprilo Legal Center — Pre-launch policy drafts, terms of service, privacy practices, and intellectual property guidelines.",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFDFB] text-[#17152A] w-full max-w-full overflow-x-clip">
      {/* Top Standard Navbar */}
      <Navbar />

      {/* Prominent Pre-Launch Draft Notice Banner */}
      <DraftNoticeBanner />

      {/* Main Body */}
      <main className="flex-1 w-full max-w-full py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Standard Footer */}
      <Footer />
    </div>
  );
}

