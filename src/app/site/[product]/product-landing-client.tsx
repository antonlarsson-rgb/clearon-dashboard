"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { products } from "@/lib/products";
import { useTracking } from "@/hooks/use-tracking";
import { trackClick, trackLead } from "@/lib/meta-pixel";
import { ConsentBanner } from "@/components/landing/ConsentBanner";
import { IceCreamPopup } from "@/components/landing/IceCreamPopup";
import {
  ArrowRight,
  Check,
  Store,
  Wallet,
  Clock,
  Send,
  CreditCard,
  BarChart3,
  Gift,
  Ticket,
  HeartHandshake,
  Gamepad2,
  Megaphone,
  Award,
  ArrowLeftRight,
  IceCream,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Footer } from "@/components/landing/Footer";
import confetti from "canvas-confetti";

const iconMap: Record<string, React.ElementType> = {
  ticket: Ticket,
  "heart-handshake": HeartHandshake,
  "gamepad-2": Gamepad2,
  megaphone: Megaphone,
  gift: Gift,
  "arrow-left-right": ArrowLeftRight,
};

const productBenefits: Record<string, { benefits: string[]; stats: string; cta: string; useCases: string[] }> = {
  "sales-promotion": {
    benefits: [
      "Fysiska kuponger som los in i kassan, 20 000 anslutna kassor",
      "+15% forsaljningsokning pa etablerade produkter",
      "+46% forsaljningsokning vid nylansering",
      "Full sparbarhet och rapportering i realtid",
      "Fungerar i 5 000+ butiker i hela Sverige",
    ],
    stats: "Foretag som anvander ClearOn Sales Promotion ser i snitt 15-46% forsaljningsokning beroende pa produktens mognad.",
    cta: "Boka en demo av Sales Promotion",
    useCases: [
      "FMCG-bolag som lanserar nya produkter i dagligvaruhandeln",
      "Varumarken som vill oka forsaljning pa etablerade produkter",
      "Trade Marketing-team som behover matbara kampanjresultat",
    ],
  },
  "customer-care": {
    benefits: [
      "Skicka digital kompensation via SMS pa sekunder",
      "70% av kompenserade kunder forblir lojala",
      "Ersatt fysiska vardeavier med digitala checkar",
      "Fullt sparbart for kundtjanst-teamet",
      "Integration med befintliga CRM-system",
    ],
    stats: "70% av kunder som far snabb kompensation forblir lojala, jamfort med 17% utan.",
    cta: "Se hur Customer Care fungerar",
    useCases: [
      "Kundtjanst-team som hanterar klagomal och kompensationer",
      "CRM-avdelningar som vill minska churn",
      "Foretag med hog volym kundkontakt (telekom, retail, hotell)",
    ],
  },
  "interactive-engage": {
    benefits: [
      "Gamification: spel, tavlingar, spin-the-wheel",
      "+16% extra forsaljningsokning utover standard-kampanj",
      "Engagerande upplevelser som driver delning",
      "Kuponger som beloning for deltagande",
      "Perfekt for events, massor och digitala kampanjer",
    ],
    stats: "Interactive Engage ger i snitt +16% extra forsaljningsokning utover vad en vanlig kupongkampanj ger.",
    cta: "Se Interactive Engage i aktion",
    useCases: [
      "FMCG-varumarken som vill skapa engagemang runt kampanjer",
      "Shopper Marketing-team som planerar butiksaktiviteter",
      "Event-arrangorer som vill driva trafik och delning",
    ],
  },
  kampanja: {
    benefits: [
      "Skapa egna kampanjsidor med egen URL pa minuter",
      "Distribuera kuponger via SMS direkt till kunder",
      "Perfekt for nylansering och tidsbestamda kampanjer",
      "Ingen utvecklare behövs, lat att satta upp",
      "Fullstandig statistik och uppfoljning",
    ],
    stats: "Kampanja minskar time-to-market for kupongkampanjer fran veckor till timmar.",
    cta: "Testa Kampanja gratis",
    useCases: [
      "Marknadschefer som snabbt vill lansera kampanjer",
      "Brand Managers som driver produktlanseringar",
      "Foretag som behover agil kampanjhantering",
    ],
  },
  "send-a-gift": {
    benefits: [
      "Digitala presentkort via SMS eller mail",
      "Perfekt for personalbeloning och jubileum",
      "Ingen administration, inga blanketter",
      "Mottagaren valjer sjalv var de handlar",
      "Skatteeffektiv personalformaner",
    ],
    stats: "Regelbunden uppskattning minskar personalomsattning med upp till 31%.",
    cta: "Borja skicka presenter idag",
    useCases: [
      "HR-avdelningar som vill belona personal enkelt",
      "Chefer som vill uppmarksamma medarbetares insatser",
      "Foretag med manga anstallda som behover skalbar beloning",
    ],
  },
  "clearing-solutions": {
    benefits: [
      "Clearing-tjanster for kedjor och handlare",
      "Enkel, saker och effektiv betalningshantering",
      "Koppla kedjan till ClearOns clearing-infrastruktur",
      "Automatisk avrakning och rapportering",
      "Integreras med befintliga kassasystem",
    ],
    stats: "ClearOns clearing-infrastruktur ar kopplad till 20 000 kassor i Sverige.",
    cta: "Kontakta oss om Clearing",
    useCases: [
      "Dagligvarukedjor som hanterar kupongclearing",
      "Category Managers som behover battre insyn i kampanjresultat",
      "Kedjor som vill effektivisera sin clearing-process",
    ],
  },
};

export default function ProductLandingClient({ productSlug }: { productSlug: string }) {
  const product = products.find((p) => p.slug === productSlug);
  const benefits = productBenefits[productSlug];

  if (!product || !benefits) return null;

  const Icon = iconMap[product.icon];

  const { sessionId, consent, trackEvent, setConsent } = useTracking();
  const pageLoadTracked = useRef(false);

  useEffect(() => {
    if (!pageLoadTracked.current && sessionId) {
      pageLoadTracked.current = true;
      trackEvent("page_load", { variant: "product", product: productSlug, page_section: "hero" });
    }
  }, [sessionId, trackEvent, productSlug]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [noCall, setNoCall] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

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
      fetch("/api/leads", {
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
            `noCall:${noCall}`,
            `variant:product-landing`,
          ],
        }),
      }).catch(() => {});
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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#739B36", "#8BB347", "#A3C55E"],
      });
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f1e9", fontFamily: "Carlito, sans-serif" }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f4f1e9]/90 backdrop-blur-md border-b border-[#3a453a]/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <svg viewBox="0 0 140 28" className="h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="22" fill="#416125" fontSize="24" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.5">ClearOn</text>
            </svg>
          </a>
          <button
            onClick={scrollToForm}
            className="text-sm font-semibold text-white bg-[#416125] rounded-lg px-4 py-2 hover:bg-[#416125]/90 transition-colors cursor-pointer"
          >
            Kontakta oss
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: product.color + "1A" }}
              >
                {Icon && <Icon className="h-7 w-7" style={{ color: product.color }} />}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#3a453a] leading-tight tracking-tight mb-4">
              {product.name}
            </h1>
            <p className="text-lg text-[#3a453a]/80 max-w-xl mx-auto leading-relaxed">
              {product.tagline}
            </p>
            <button
              onClick={scrollToForm}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#416125] rounded-xl px-6 py-3 hover:bg-[#416125]/90 transition-colors cursor-pointer"
            >
              {benefits.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#3a453a] text-center mb-8">
            Fordelar med {product.name}
          </h2>
          <div className="space-y-3">
            {benefits.benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-start gap-3 bg-white/80 border border-[#3a453a]/15 rounded-xl p-4"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#416125]/10 shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-[#416125]" />
                </div>
                <p className="text-sm text-[#3a453a] leading-relaxed">{benefit}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 bg-[#416125]/5 border border-[#3a453a]/10 rounded-xl p-4 text-center">
            <p className="text-sm text-[#416125] font-medium">{benefits.stats}</p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-4 md:px-6 py-16 bg-white/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#3a453a] text-center mb-8">
            Vem ar {product.name} for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.useCases.map((useCase, i) => (
              <div key={i} className="bg-white border border-[#3a453a]/15 rounded-xl p-4">
                <p className="text-sm text-[#3a453a] leading-relaxed">{useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#3a453a] mb-8">
            Sa har fungerar det
          </h2>
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#416125]/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-[#416125]" />
              </div>
              <p className="text-xs font-semibold text-[#3a453a]">Skicka</p>
              <p className="text-[10px] text-[#3a453a]/60">SMS/mail</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#3a453a]/30" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#416125]/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#416125]" />
              </div>
              <p className="text-xs font-semibold text-[#3a453a]">Handla</p>
              <p className="text-[10px] text-[#3a453a]/60">5 000+ butiker</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#3a453a]/30" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#416125]/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#416125]" />
              </div>
              <p className="text-xs font-semibold text-[#3a453a]">Folj upp</p>
              <p className="text-[10px] text-[#3a453a]/60">Realtidsdata</p>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-[#3a453a]/50">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#416125]" />
              <strong className="text-[#3a453a]">1 timme</strong> setup
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3 text-[#416125]" />
              <strong className="text-[#3a453a]">Skraddarsydda</strong> losningar
            </span>
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3 text-[#416125]" />
              <strong className="text-[#3a453a]">5 000+</strong> butiker
            </span>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-4 md:px-6 py-8">
        <div className="max-w-xl mx-auto">
          <div className="border border-[#3a453a]/15 rounded-xl p-4 bg-white/80 text-center">
            <p className="text-sm text-[#3a453a]/70 italic leading-relaxed">
              &ldquo;Vardecheckarna ar enkla att hantera och ger guldkant pa vardagen for mottagaren&rdquo;
            </p>
            <p className="text-xs text-[#416125] font-medium mt-2">
              - Lina Arwidsson, Vision
            </p>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section ref={formRef} className="px-4 md:px-6 py-16">
        <div className="max-w-md mx-auto">
          {!isSubmitted ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#416125]/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-7 h-7 text-[#416125]" />
                </div>
                <h3 className="text-xl font-bold text-[#3a453a]">
                  Intresserad av <span className="text-[#416125]">{product.name}</span>?
                </h3>
                <p className="text-sm text-[#3a453a]/70 mt-1.5 leading-relaxed">
                  Lamna dina uppgifter sa tar vi fram ett forslag anpassat for er.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Ditt namn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                />
                <Input
                  type="email"
                  placeholder="E-post *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                />
                <Input
                  type="text"
                  placeholder="Foretag"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                />
                <Input
                  type="tel"
                  placeholder="Telefonnummer (valfritt)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                />

                <div className="flex items-start gap-3 py-2">
                  <Checkbox
                    id="no-call-product"
                    checked={noCall}
                    onCheckedChange={(checked) => setNoCall(checked as boolean)}
                    className="mt-0.5"
                  />
                  <label htmlFor="no-call-product" className="text-xs text-[#3a453a]/70 cursor-pointer leading-relaxed">
                    Jag ar medveten om att ClearOn lagrar mina personuppgifter for att hantera detta arende.{" "}
                    <a
                      href="https://www.clearon.se/behandling-av-personuppgifter/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#416125] underline hover:text-[#416125]/80"
                    >
                      Las mer om personuppgiftsbehandling
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 text-sm font-semibold text-white bg-[#416125] rounded-xl hover:bg-[#416125]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? "Skickar..." : benefits.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#416125]/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-7 h-7 text-[#416125]" />
              </div>
              <p className="font-bold text-2xl text-[#416125]">Tack! Vi hör av oss.</p>
              <p className="text-[#3a453a]/70 mt-3 max-w-sm mx-auto">
                Vi satter ihop ett forslag for hur {product.name} kan fungera for er och aterkommer inom en arbetsdag.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Other products */}
      <section className="px-4 md:px-6 py-16 bg-white/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-[#3a453a] text-center mb-6">
            Utforska fler losningar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products
              .filter((p) => p.slug !== productSlug)
              .map((p) => {
                const PIcon = iconMap[p.icon];
                const urlSlug = p.slug === "clearing-solutions" ? "clearing" : p.slug;
                return (
                  <a
                    key={p.slug}
                    href={`/${urlSlug}`}
                    className="flex items-center gap-3 bg-white border border-[#3a453a]/15 rounded-xl p-3 hover:shadow-md transition-all"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
                      style={{ backgroundColor: p.color + "1A" }}
                    >
                      {PIcon && <PIcon className="h-4 w-4" style={{ color: p.color }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#3a453a] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#3a453a]/60 truncate">{p.tagline}</p>
                    </div>
                  </a>
                );
              })}
          </div>
        </div>
      </section>

      <Footer />

      <IceCreamPopup sessionId={sessionId} variant={productSlug} trackEvent={trackEvent} delayMs={7000} />

      <ConsentBanner
        visible={consent === null}
        onAccept={() => setConsent(true)}
        onDecline={() => setConsent(false)}
      />
    </div>
  );
}
