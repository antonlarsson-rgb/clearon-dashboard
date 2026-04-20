"use client";

import { useState, useRef, useEffect } from "react";
import { useTracking } from "@/hooks/use-tracking";
import { trackClick, trackLead } from "@/lib/meta-pixel";
import { SiteNav } from "@/components/landing-v2/SiteNav";
import { CtaFooter } from "@/components/landing-v2/CtaFooter";
import { SignalProvider } from "@/components/landing-v2/SignalProvider";

const PRODUCT_DETAILS: Record<
  string,
  {
    name: string;
    tagline: string;
    desc: string;
    color: string;
    icon: string;
    metrics: { value: string; label: string }[];
    features: { title: string; desc: string }[];
    useCases: { title: string; desc: string }[];
    relatedSlugs: string[];
  }
> = {
  "sales-promotion": {
    name: "Sales Promotion",
    tagline: "Fysiska kuponger som driver köp i butik",
    desc: "Lansera nya produkter eller öka försäljning på etablerade varumärken med kuponger som löses in direkt i kassan. Full spårbarhet från plan till resultat.",
    color: "#2D6A4F",
    icon: "🎫",
    metrics: [
      { value: "+46%", label: "Försäljningslyft nylansering" },
      { value: "+15%", label: "Etablerade produkter" },
      { value: "20 000", label: "Anslutna kassor" },
      { value: "5 000+", label: "Butiker" },
    ],
    features: [
      { title: "Kassaintegration", desc: "Kopplat till 20 000 kassor i hela Sverige. Kupongen scannas direkt." },
      { title: "Realtidsdata", desc: "Se vilka butiker, regioner och tidsperioder som presterar bäst." },
      { title: "Flexibla kampanjer", desc: "Kronor-av, procent, köp 2 betala för 1, och fler kampanjtyper." },
      { title: "Full clearing", desc: "Automatisk avräkning och rapportering. Ni får faktura, inte pappersarbete." },
    ],
    useCases: [
      { title: "FMCG-lansering", desc: "Lansera nya produkter med garanterad exponering i butik." },
      { title: "Trade Marketing", desc: "Ge ert field sales-team mätbara verktyg." },
      { title: "Säsongskampanjer", desc: "Tidsbestämda erbjudanden med full kontroll." },
    ],
    relatedSlugs: ["interactive-engage", "kampanja", "kuponger"],
  },
  "customer-care": {
    name: "Customer Care",
    tagline: "Digital kompensation som vänder missnöje till lojalitet",
    desc: "Skicka digital kompensation via SMS direkt i kundtjänstsamtalet. Värdecheckar, presentkort och kuponger som löser in i 5 000+ butiker.",
    color: "#4A90A4",
    icon: "💬",
    metrics: [
      { value: "70%", label: "Behållerlojalitet" },
      { value: "3x", label: "Snabbare ärendehantering" },
      { value: "0", label: "Fysiska värdeavier" },
      { value: "SMS", label: "Direkt leverans" },
    ],
    features: [
      { title: "Direkt kompensation", desc: "Skicka värdecheckar via SMS på sekunder, direkt i samtalet." },
      { title: "CRM-integration", desc: "Koppla till ert befintliga CRM för automatisk loggning." },
      { title: "Anpassade belopp", desc: "Sätt belopp fritt eller använd förinställda nivåer." },
      { title: "Uppföljning", desc: "Se inlösningsgrad och kundnöjdhet i realtid." },
    ],
    useCases: [
      { title: "Klagomål", desc: "Kompensera missnöjda kunder direkt och behåll dem." },
      { title: "Servicegaranti", desc: "Ge automatisk kompensation vid SLA-brott." },
      { title: "Win-back", desc: "Återaktivera churnade kunder med riktade erbjudanden." },
    ],
    relatedSlugs: ["send-a-gift", "mobila-presentkort", "sales-promotion"],
  },
  "interactive-engage": {
    name: "Interactive Engage",
    tagline: "Gamification som ökar försäljning med +16%",
    desc: "Lägg till spelmekanik på era kampanjer. Snurra hjulet, skrapkort, quiz och adventskalender. Kuponger som belöning för deltagande.",
    color: "#E07A5F",
    icon: "🎮",
    metrics: [
      { value: "+16%", label: "Extra försäljning" },
      { value: "4", label: "Speltyper" },
      { value: "85%", label: "Engagemangsgrad" },
      { value: "3x", label: "Delningsgrad" },
    ],
    features: [
      { title: "Snurra hjulet", desc: "Slumpad vinst som driver engagemang och delning." },
      { title: "Skrapkort", desc: "Digital skraplott med garanterad vinst." },
      { title: "Quiz", desc: "Kunskapsfråga med belöning. Lärorik interaktion." },
      { title: "Adventskalender", desc: "24 luckor med dagliga erbjudanden." },
    ],
    useCases: [
      { title: "Events", desc: "Skapa engagemang på mässor och butiksaktiviteter." },
      { title: "Digital kampanj", desc: "Öka konvertering i digitala kanaler." },
      { title: "Lojalitet", desc: "Belöna återkommande kunder med spelupplevelser." },
    ],
    relatedSlugs: ["sales-promotion", "kampanja", "kuponger"],
  },
  kampanja: {
    name: "Kampanja",
    tagline: "Bygg kampanjsidor och distribuera kuponger via SMS",
    desc: "Skapa egna kampanjsidor på minuter, distribuera kuponger via SMS direkt till kunder. Ingen utvecklare behövs.",
    color: "#7B68EE",
    icon: "📣",
    metrics: [
      { value: "< 1h", label: "Tid till live" },
      { value: "0", label: "Utvecklare krävs" },
      { value: "SMS", label: "Distribution" },
      { value: "100%", label: "Spårbarhet" },
    ],
    features: [
      { title: "Drag-and-drop", desc: "Bygg kampanjsidor utan teknisk kompetens." },
      { title: "SMS-distribution", desc: "Skicka kuponger direkt till kundens telefon." },
      { title: "Egen URL", desc: "Varumärkesanpassade kampanjsidor med egen URL." },
      { title: "A/B-testning", desc: "Testa olika erbjudanden och optimera i realtid." },
    ],
    useCases: [
      { title: "Nylansering", desc: "Snabb lansering av kampanjer för nya produkter." },
      { title: "Flash sales", desc: "Tidsbestämda erbjudanden med hög urgency." },
      { title: "Events", desc: "QR-koder på plats som leder till kampanjsida." },
    ],
    relatedSlugs: ["sales-promotion", "interactive-engage", "kuponger"],
  },
  "send-a-gift": {
    name: "Send a Gift",
    tagline: "Digitala presentkort och personalbelöning",
    desc: "Skicka digitala presentkort via SMS eller mail. Perfekt för personalbelöning, jubileum och kundgåvor. Mottagaren väljer själv bland 5 000+ butiker.",
    color: "#D4A574",
    icon: "🎁",
    metrics: [
      { value: "-31%", label: "Personalomsättning" },
      { value: "90%", label: "Uppskattningsgrad" },
      { value: "5 000+", label: "Inlösningsplatser" },
      { value: "0", label: "Administration" },
    ],
    features: [
      { title: "SMS & mail", desc: "Välj leveranssätt efter mottagarens preferens." },
      { title: "Fritt val", desc: "Mottagaren väljer själv bland tusentals butiker." },
      { title: "Skatteeffektivt", desc: "Uppfyller Skatteverkets krav för personalförmåner." },
      { title: "Bulkutskick", desc: "Skicka till hundratals mottagare på en gång." },
    ],
    useCases: [
      { title: "Personalbelöning", desc: "Belöna prestation, jubileum och födelsedag." },
      { title: "Kundgåvor", desc: "Skicka tackgåvor till viktiga kunder." },
      { title: "Incitament", desc: "Motivera säljteam och partners." },
    ],
    relatedSlugs: ["personalbeloning", "customer-care", "mobila-presentkort"],
  },
  "clearing-solutions": {
    name: "Clearing Solutions",
    tagline: "Clearing-tjänster för kedjor och handlare",
    desc: "Koppla er kedja till ClearOns clearing-infrastruktur. Automatisk avräkning, rapportering och betalningshantering för 20 000 kassor.",
    color: "#6B7280",
    icon: "🔄",
    metrics: [
      { value: "20 000", label: "Kassor" },
      { value: "-85%", label: "Manuellt arbete" },
      { value: "Realtid", label: "Rapportering" },
      { value: "Auto", label: "Avrakning" },
    ],
    features: [
      { title: "Kassaintegration", desc: "Kopplat till de största kassasystemen i Sverige." },
      { title: "Automatisk avräkning", desc: "Slöpp manuella avräkningar och fakturor." },
      { title: "Realtidsdata", desc: "Se inlösning, värde och trender i realtid." },
      { title: "API", desc: "Integrera med era befintliga system." },
    ],
    useCases: [
      { title: "Dagligvarukedjor", desc: "Effektivisera kupongclearing för hela kedjan." },
      { title: "Category Management", desc: "Bättre insyn i kampanjresultat per kategori." },
      { title: "Leverantörssamarbete", desc: "Förenkla samarbete med FMCG-leverantörer." },
    ],
    relatedSlugs: ["sales-promotion", "kuponger", "kampanja"],
  },
  engage: {
    name: "Engage",
    tagline: "Engagera kunder med interaktiva upplevelser",
    desc: "Skapa engagerande kundupplevelser med gamification, quiz och interaktiva kampanjer. Öka försäljning och lojalitet.",
    color: "#E07A5F",
    icon: "🎯",
    metrics: [
      { value: "+16%", label: "Extra försäljning" },
      { value: "85%", label: "Engagemangsgrad" },
      { value: "4", label: "Speltyper" },
      { value: "3x", label: "Delning" },
    ],
    features: [
      { title: "Gamification", desc: "Snurra hjulet, skrapkort och quiz-spel." },
      { title: "Belöning", desc: "Kuponger som belöning för deltagande." },
      { title: "Data", desc: "Samla in kundinsikter genom interaktion." },
      { title: "Delning", desc: "Viral spridningsmekanik built-in." },
    ],
    useCases: [
      { title: "Events", desc: "Aktivera besökare på mässor och events." },
      { title: "Nylansering", desc: "Skapa buzz runt nya produkter." },
      { title: "Lojalitet", desc: "Bygga långvariga kundrelationer." },
    ],
    relatedSlugs: ["interactive-engage", "kampanja", "sales-promotion"],
  },
  personalbeloning: {
    name: "Personalbelöning",
    tagline: "Systematisk personalbelöning med digitala värdecheckar",
    desc: "Automatisera personalbelöning för födelsedag, jubileum och prestation. Digitala värdecheckar som löser in i 5 000+ butiker.",
    color: "#8B6F47",
    icon: "🏆",
    metrics: [
      { value: "-31%", label: "Personalomsättning" },
      { value: "90%", label: "Uppskattning" },
      { value: "Auto", label: "Utskick" },
      { value: "0 kr", label: "Adminkostnad" },
    ],
    features: [
      { title: "Automatisering", desc: "Schemalägg utskick för födelsedag och jubileum." },
      { title: "Anpassade belopp", desc: "Valfritt belopp från 50 kr till 5 000 kr." },
      { title: "HR-rapportering", desc: "Översikt över alla utskick och inlösningar." },
      { title: "Bulkhantering", desc: "Ladda upp listor för storskaliga utskick." },
    ],
    useCases: [
      { title: "Födelsedag", desc: "Automatiska födelsedagspresenter." },
      { title: "Jubileum", desc: "Uppmärksamma anställningsårsdagar." },
      { title: "Prestation", desc: "Belöna extra insatser och resultat." },
    ],
    relatedSlugs: ["send-a-gift", "mobila-presentkort", "customer-care"],
  },
  kuponger: {
    name: "Kuponger",
    tagline: "Digitala kuponger för fysisk retail",
    desc: "Hela kedjan från skapande till inlösning och clearing. Digitala kuponger som fungerar i 5 000+ butiker med 20 000 anslutna kassor.",
    color: "#5e9732",
    icon: "🎟",
    metrics: [
      { value: "5 000+", label: "Butiker" },
      { value: "20 000", label: "Kassor" },
      { value: "12%", label: "Snittinlösning" },
      { value: "< 1h", label: "Setup" },
    ],
    features: [
      { title: "Digitalt först", desc: "SMS-distribution direkt till kunden." },
      { title: "Kassaintegration", desc: "Skannas i kassan, automatisk avdrag." },
      { title: "Clearing", desc: "Automatisk avräkning och betalning." },
      { title: "Statistik", desc: "Full uppföljning i realtid." },
    ],
    useCases: [
      { title: "Försäljningskampanj", desc: "Driva köp av specifika produkter." },
      { title: "Nylansering", desc: "Introducera nya produkter." },
      { title: "Lojalitet", desc: "Belöna återkommande kunder." },
    ],
    relatedSlugs: ["sales-promotion", "kampanja", "interactive-engage"],
  },
  "mobila-presentkort": {
    name: "Mobila Presentkort",
    tagline: "Digitala presentkort via mobilen",
    desc: "Skicka digitala presentkort via SMS. Perfekt för kompensation, belöning och gåvogivande. Löser in i 5 000+ butiker över hela Sverige.",
    color: "#c8a830",
    icon: "💳",
    metrics: [
      { value: "SMS", label: "Leverans" },
      { value: "5 000+", label: "Butiker" },
      { value: "Valfritt", label: "Belopp" },
      { value: "0", label: "Fysisk hantering" },
    ],
    features: [
      { title: "Direkt leverans", desc: "Mottagaren får presentkortet via SMS på sekunder." },
      { title: "Valfritt belopp", desc: "Från 25 kr till 10 000 kr." },
      { title: "Bred täckning", desc: "5 000+ butiker i hela Sverige." },
      { title: "Enkel hantering", desc: "Ingen fysisk logistik eller distribution." },
    ],
    useCases: [
      { title: "Kompensation", desc: "Snabb kompensation till missnöjda kunder." },
      { title: "Gåva", desc: "Skicka presentkort till vänner och familj." },
      { title: "Belöning", desc: "Personalbelöning utan administration." },
    ],
    relatedSlugs: ["send-a-gift", "customer-care", "personalbeloning"],
  },
  sverigechecken: {
    name: "Sverigechecken",
    tagline: "Värdecheck som fungerar i hela Sverige",
    desc: "En värdecheck som löser in i 5 000+ butiker över hela Sverige. Perfekt för kompensation, belöning och förmåner.",
    color: "#0068B5",
    icon: "🇸🇪",
    metrics: [
      { value: "5 000+", label: "Butiker" },
      { value: "Hela", label: "Sverige" },
      { value: "Valfritt", label: "Belopp" },
      { value: "Digital", label: "Distribution" },
    ],
    features: [
      { title: "Rikstäckande", desc: "Fungerar i 5 000+ butiker över hela Sverige." },
      { title: "Flexibelt belopp", desc: "Sätt valfritt belopp för varje check." },
      { title: "Digital leverans", desc: "Skickas via SMS direkt till mottagaren." },
      { title: "Hög acceptans", desc: "Brett nätverk av anslutna handlare." },
    ],
    useCases: [
      { title: "Personalförmån", desc: "Skatteeffektiv personalförmån med bred användning." },
      { title: "Kundkompensation", desc: "Generell kompensation för alla typer av ärenden." },
      { title: "Marknadsföringskampanj", desc: "Attraktiv belöning i kampanjer." },
    ],
    relatedSlugs: ["mobila-presentkort", "send-a-gift", "customer-care"],
  },
};

function resolveDetails(slug: string) {
  // Map URL slugs to product detail keys
  if (slug === "clearing") return PRODUCT_DETAILS["clearing-solutions"];
  return PRODUCT_DETAILS[slug] || null;
}

export default function ProductLandingClient({
  productSlug,
}: {
  productSlug: string;
}) {
  const details = resolveDetails(productSlug);
  const { sessionId, trackEvent } = useTracking();
  const formRef = useRef<HTMLDivElement>(null);
  const pageLoadTracked = useRef(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!pageLoadTracked.current && sessionId) {
      pageLoadTracked.current = true;
      trackEvent("page_load", {
        variant: "product-v2",
        product: productSlug,
        page_section: "hero",
      });
    }
  }, [sessionId, trackEvent, productSlug]);

  if (!details) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-open-sans), sans-serif",
          color: "var(--clr-ink)",
        }}
      >
        Produkten kunde inte hittas.
      </div>
    );
  }

  const scrollToForm = () => {
    trackClick("cta_contact", productSlug, "hero");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    trackClick("submit_form", productSlug, "lead_form");
    setIsSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email,
          company: company || null,
          interests: [
            `name:${name || "ej angiven"}`,
            `product:${productSlug}`,
            `phone:${phone || "ej angiven"}`,
            `variant:product-v2`,
          ],
        }),
      });
      trackEvent("lead_submitted", {
        product: productSlug,
        has_phone: !!phone,
        has_company: !!company,
      });
      trackLead(productSlug, {
        product: productSlug,
        has_phone: !!phone,
      });
      setIsSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  const relatedProducts = details.relatedSlugs
    .map((s) => {
      const d = PRODUCT_DETAILS[s];
      return d ? { slug: s, ...d } : null;
    })
    .filter(Boolean) as Array<{ slug: string; name: string; tagline: string; color: string; icon: string }>;

  return (
    <SignalProvider>
      <div
        style={{
          fontFamily: "var(--font-open-sans), sans-serif",
          background: "var(--clr-beige)",
          minHeight: "100vh",
        }}
      >
        <SiteNav />

        {/* Hero */}
        <section
          style={{
            paddingTop: 100,
            paddingBottom: 64,
            background: `linear-gradient(135deg, ${details.color}10, ${details.color}05, var(--clr-beige))`,
            position: "relative",
          }}
        >
          <div className="c-container" style={{ maxWidth: 800, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{details.icon}</div>
            <div className="c-eyebrow" style={{ marginBottom: 12, color: details.color }}>
              {details.name}
            </div>
            <h1 className="c-h1" style={{ marginBottom: 16 }}>
              {details.tagline}
            </h1>
            <p
              className="c-body-lg"
              style={{ maxWidth: 560, margin: "0 auto 32px", color: "var(--clr-muted)" }}
            >
              {details.desc}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={scrollToForm} className="c-btn c-btn--primary" style={{ background: details.color }}>
                Boka demo
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a href="/" className="c-btn c-btn--ghost">
                Alla produkter
              </a>
            </div>
          </div>
        </section>

        {/* Metrics strip */}
        <section
          style={{
            background: details.color,
            padding: "24px 0",
          }}
        >
          <div
            className="c-container"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 40,
              flexWrap: "wrap",
            }}
          >
            {details.metrics.map((m) => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section style={{ padding: "80px 0", background: "var(--clr-cl-surface)" }}>
          <div className="c-container" style={{ maxWidth: 900 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="c-eyebrow" style={{ marginBottom: 12 }}>Funktioner</div>
              <h2 className="c-h2">Vad ingår i {details.name}</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 20,
              }}
            >
              {details.features.map((f) => (
                <div key={f.title} className="c-card" style={{ borderTop: `3px solid ${details.color}` }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--clr-ink)",
                      marginBottom: 8,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--clr-muted)", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section style={{ padding: "80px 0", background: "var(--clr-surface-alt)" }}>
          <div className="c-container" style={{ maxWidth: 900 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="c-eyebrow" style={{ marginBottom: 12 }}>Användningsområden</div>
              <h2 className="c-h2">Vem är {details.name} för?</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {details.useCases.map((uc) => (
                <div key={uc.title} className="c-card">
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--clr-ink)",
                      marginBottom: 8,
                    }}
                  >
                    {uc.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--clr-muted)", lineHeight: 1.6 }}>{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section style={{ padding: "60px 0", background: "var(--clr-cl-surface)" }}>
            <div className="c-container" style={{ maxWidth: 900 }}>
              <h2 className="c-h3" style={{ textAlign: "center", marginBottom: 24 }}>
                Utforska fler lösningar
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {relatedProducts.map((rp) => (
                  <a
                    key={rp.slug}
                    href={`/${rp.slug === "clearing-solutions" ? "clearing" : rp.slug}`}
                    className="c-card"
                    style={{
                      textDecoration: "none",
                      borderLeft: `4px solid ${rp.color}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{rp.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--clr-ink)" }}>{rp.name}</div>
                      <div style={{ fontSize: 12, color: "var(--clr-muted)" }}>{rp.tagline}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact form */}
        <section
          ref={formRef}
          style={{
            padding: "80px 0",
            background: "var(--clr-green-dark)",
          }}
        >
          <div className="c-container" style={{ maxWidth: 500 }}>
            {!isSubmitted ? (
              <div>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <div className="c-eyebrow" style={{ color: "var(--clr-lime)", marginBottom: 12 }}>
                    Kontakta oss
                  </div>
                  <h2 className="c-h2" style={{ color: "#fff" }}>
                    Intresserad av {details.name}?
                  </h2>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
                    Lämna era uppgifter så tar vi fram ett förslag anpassat för er.
                  </p>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
                  {[
                    { type: "text", placeholder: "Namn", value: name, setter: setName },
                    { type: "email", placeholder: "E-post *", value: email, setter: setEmail, required: true },
                    { type: "text", placeholder: "Företag", value: company, setter: setCompany },
                    { type: "tel", placeholder: "Telefon (valfritt)", value: phone, setter: setPhone },
                  ].map((field) => (
                    <input
                      key={field.placeholder}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      required={field.required}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  ))}
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="c-btn c-btn--accent"
                    style={{
                      justifyContent: "center",
                      width: "100%",
                      opacity: isSubmitting || !email ? 0.6 : 1,
                    }}
                  >
                    {isSubmitting ? "Skickar..." : `Boka demo av ${details.name}`}
                  </button>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                    Genom att skicka godkänner du vår{" "}
                    <a
                      href="https://www.clearon.se/behandling-av-personuppgifter/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--clr-lime)", textDecoration: "underline" }}
                    >
                      personuppgiftspolicy
                    </a>
                    .
                  </p>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--clr-lime)", marginBottom: 8 }}>
                  Tack för ert intresse!
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  Vi återkommer inom en arbetsdag med ett skräddarsytt förslag för {details.name}.
                </p>
              </div>
            )}
          </div>
        </section>

        <CtaFooter />
      </div>
    </SignalProvider>
  );
}
