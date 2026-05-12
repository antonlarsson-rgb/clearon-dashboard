"use client";

import { useState } from "react";
import { SignalProvider } from "@/components/landing-v2/SignalProvider";
import { SiteNav } from "@/components/landing-v2/SiteNav";
import { Hero } from "@/components/landing-v2/Hero";
import { HowItWorks } from "@/components/landing-v2/HowItWorks";
import { GamesSection } from "@/components/landing-v2/GamesSection";
import { SmsDemo } from "@/components/landing-v2/SmsDemo";
import { WhatsInItForYou } from "@/components/landing-v2/WhatsInItForYou";
import { Cases } from "@/components/landing-v2/Cases";
import { WhenToUse } from "@/components/landing-v2/WhenToUse";
import { StoreFinder } from "@/components/landing-v2/StoreFinder";
import { Testimonials } from "@/components/landing-v2/Testimonials";
import { CtaFooter } from "@/components/landing-v2/CtaFooter";
import { SmartIdentifyPopup } from "@/components/landing-v2/SmartIdentifyPopup";

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
        <SiteNav />
        <Hero role={role} setRole={setRole} />
        <HowItWorks />
        <GamesSection />
        <SmsDemo />
        <WhatsInItForYou />
        <Cases />
        <WhenToUse />
        <Testimonials />
        <StoreFinder />
        <CtaFooter />
        <SmartIdentifyPopup />
      </div>
    </SignalProvider>
  );
}
