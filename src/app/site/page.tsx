"use client";

import { useState } from "react";
import { SignalProvider } from "@/components/landing-v2/SignalProvider";
import { ColdTrafficFilter } from "@/components/landing-v2/ColdTrafficFilter";
import { SiteNav } from "@/components/landing-v2/SiteNav";
import { Hero } from "@/components/landing-v2/Hero";
import { PackagesHub } from "@/components/landing-v2/PackagesHub";
import { MixItUp } from "@/components/landing-v2/MixItUp";
import { GamesSection } from "@/components/landing-v2/GamesSection";
import { UseCases } from "@/components/landing-v2/UseCases";
import { FitQuiz } from "@/components/landing-v2/FitQuiz";
import { SmsDemo } from "@/components/landing-v2/SmsDemo";
import { HowItWorks } from "@/components/landing-v2/HowItWorks";
import { ProductExplorer } from "@/components/landing-v2/ProductExplorer";
import { RoiCalculator } from "@/components/landing-v2/RoiCalculator";
import { StoreFinder } from "@/components/landing-v2/StoreFinder";
import { Testimonials } from "@/components/landing-v2/Testimonials";
import { CtaFooter } from "@/components/landing-v2/CtaFooter";

export default function SiteLandingPage() {
  const [role, setRole] = useState("default");

  return (
    <SignalProvider>
      <div
        style={{
          background: "var(--clr-beige)",
          minHeight: "100vh",
        }}
      >
        <ColdTrafficFilter />
        <SiteNav />
        <Hero role={role} setRole={setRole} />
        <PackagesHub />
        <MixItUp />
        <GamesSection />
        <UseCases />
        <FitQuiz />
        <SmsDemo />
        <HowItWorks />
        <ProductExplorer />
        <RoiCalculator />
        <StoreFinder />
        <Testimonials />
        <CtaFooter />
      </div>
    </SignalProvider>
  );
}
