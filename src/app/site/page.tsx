"use client";

import { useEffect, useState } from "react";
import { SignalProvider } from "@/components/landing-v2/SignalProvider";
import { SiteNav } from "@/components/landing-v2/SiteNav";
import { Hero, ROLES } from "@/components/landing-v2/Hero";
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

const VALID_ROLE_IDS = ROLES.map((r) => r.id);

// Mappar fran annons-/segment-namn till intern role-id, sa marknad
// kan deeplinka pa det som annonsen heter (t.ex. ?segment=acquisition).
const ROLE_ALIASES: Record<string, string> = {
  acquisition: "acquire",
  acquisitionhunter: "acquire",
  forvarv: "acquire",
  tillvaxt: "acquire",
  engagemang: "boring",
  engage: "boring",
  matning: "measure",
  measurement: "measure",
  trial: "sampling",
  sampling: "sampling",
  lojalitet: "loyalty",
  loyalty: "loyalty",
  consent: "consent",
  cookie: "consent",
  kundvard: "complaint",
  complaint: "complaint",
  cx: "complaint",
  personal: "staff",
  hr: "staff",
};

function resolveRoleFromUrl(): string {
  if (typeof window === "undefined") return "default";
  const params = new URLSearchParams(window.location.search);
  const raw = (
    params.get("problem") ||
    params.get("p") ||
    params.get("segment") ||
    ""
  )
    .toLowerCase()
    .trim();
  if (!raw) return "default";
  if (VALID_ROLE_IDS.includes(raw)) return raw;
  if (ROLE_ALIASES[raw]) return ROLE_ALIASES[raw];
  return "default";
}

export default function SiteLandingPage() {
  // Initial state ar alltid "default" sa server- och client-render matchar.
  // Direkt efter mount byter vi till URL-baserat role, vilket gor det
  // mojligt for annonser att deeplinka: ?problem=acquire, ?p=trial, etc.
  const [role, setRole] = useState("default");

  useEffect(() => {
    const resolved = resolveRoleFromUrl();
    if (resolved !== "default") setRole(resolved);
  }, []);

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
