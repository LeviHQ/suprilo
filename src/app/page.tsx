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
import { PricingModal } from "@/components/ui/PricingModal";

export default function Home() {
  const [pricingModalOpen, setPricingModalOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);

  const handleSelectPlan = React.useCallback((planName: string) => {
    setSelectedPlan(planName);
    setPricingModalOpen(true);
  }, []);

  const closePricingModal = React.useCallback(() => {
    setPricingModalOpen(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-clip">
        <Hero />
        <HowItWorks />
        <Features />
        <UseCases />
        <Pricing onSelectPlan={handleSelectPlan} />
        <TestimonialsMarquee />
        <FinalCta />
      </main>
      <Footer />
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={closePricingModal}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
