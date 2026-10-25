"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { UseCases } from "@/components/landing/UseCases";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/layout/Footer";
import { ComingSoonModal } from "@/components/ui/Modal";

export default function Home() {
  const [modalOpen, setModalOpen] = React.useState(false);

  const openCtaModal = React.useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeCtaModal = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenCtaModal={openCtaModal} />
      <main className="flex-1">
        <Hero onOpenCtaModal={openCtaModal} />
        <HowItWorks />
        <Features />
        <UseCases />
        <FinalCta onOpenCtaModal={openCtaModal} />
      </main>
      <Footer />
      <ComingSoonModal isOpen={modalOpen} onClose={closeCtaModal} />
    </div>
  );
}
