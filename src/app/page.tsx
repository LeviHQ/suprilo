"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { UseCases } from "@/components/landing/UseCases";
import { TestimonialsMarquee } from "@/components/landing/TestimonialsMarquee";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/layout/Footer";
import { ComingSoonModal } from "@/components/ui/Modal";
import { PricingModal } from "@/components/ui/PricingModal";

export default function Home() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [pricingModalOpen, setPricingModalOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);

  const openCtaModal = React.useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeCtaModal = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSelectPlan = React.useCallback((planName: string) => {
    setSelectedPlan(planName);
    setPricingModalOpen(true);
  }, []);

  const closePricingModal = React.useCallback(() => {
    setPricingModalOpen(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenCtaModal={openCtaModal} />
      <main className="flex-1">
        <Hero onOpenCtaModal={openCtaModal} />
        <HowItWorks />
        <Features />
        <UseCases />
        <Pricing onSelectPlan={handleSelectPlan} />
        <TestimonialsMarquee />
        <FinalCta onOpenCtaModal={openCtaModal} />
      </main>
      <Footer />
      <ComingSoonModal isOpen={modalOpen} onClose={closeCtaModal} />
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={closePricingModal}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
