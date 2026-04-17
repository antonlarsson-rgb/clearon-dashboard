"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Gift,
  Wallet,
  ArrowRight,
  Eye,
  PiggyBank,
  Target,
  Wrench,
  Layers,
  Store,
  ShoppingCart,
  Wifi,
  Building2,
  Plane,
  Zap,
  Utensils,
  Shield,
  HelpCircle,
  IceCream,
  Clock,
  Send,
  BarChart3,
  UserPlus,
  HeartHandshake,
  Award,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ConsentBanner } from "@/components/landing/ConsentBanner";
import { Footer } from "@/components/landing/Footer";
import { IceCreamPopup } from "@/components/landing/IceCreamPopup";
import { useTracking } from "@/hooks/use-tracking";
import { trackClick, trackLead, trackIceCreamCoupon } from "@/lib/meta-pixel";
import confetti from "canvas-confetti";

/* ---------- data / types ---------- */

interface DiscoveryAnswers {
  role: string;
  industry: string;
}

const roleFeedback: Record<string, string> = {
  vd: "Bra. Vi visar hur ClearOn driver tillväxt och stärker ert varumärke.",
  cfo: "Bra. Vi visar exakt ROI och att ni bara betalar för inlösta kort.",
  marketing: "Bra. Vi visar hur ni ökar kundanskaffning och engagemang.",
  hr: "Bra. Vi visar hur ni belönar och motiverar personal enkelt.",
  operations: "Bra. Vi visar hur smidigt det fungerar i vardagen.",
  multiple: "Bra. Vi ger en bred överblick av alla möjligheter.",
};

const industryLabels: Record<string, string> = {
  retail: "retail",
  ecommerce: "e-handel",
  telecom: "telekom",
  finance: "finans",
  travel: "resor",
  energy: "energi",
  hospitality: "hotell & restaurang",
  union: "fackförbund",
  other: "er bransch",
};

const roles = [
  { id: "vd", label: "VD / Ledning", description: "Strategi och tillväxt", icon: Eye },
  { id: "cfo", label: "Ekonomi / CFO", description: "Budget och ROI", icon: PiggyBank },
  { id: "marketing", label: "Marknad / Sälj", description: "Kunder och kampanjer", icon: Target },
  { id: "hr", label: "HR / Personal", description: "Belöning och kultur", icon: Award },
  { id: "operations", label: "Drift / Kundtjänst", description: "Vardag som funkar", icon: Wrench },
  { id: "multiple", label: "Flera roller", description: "Lite av allt", icon: Layers },
];

const industries = [
  { id: "retail", label: "Retail / Handel", icon: Store },
  { id: "ecommerce", label: "E-handel", icon: ShoppingCart },
  { id: "telecom", label: "Telekom", icon: Wifi },
  { id: "finance", label: "Finans / Försäkring", icon: Building2 },
  { id: "travel", label: "Resor / Transport", icon: Plane },
  { id: "energy", label: "Energi", icon: Zap },
  { id: "hospitality", label: "Hotell / Restaurang", icon: Utensils },
  { id: "union", label: "Fackförbund", icon: Shield },
  { id: "other", label: "Annat", icon: HelpCircle },
];

const valueProps = [
  {
    id: "acquire",
    icon: UserPlus,
    title: "Värva kunder smartare",
    brief: "Incitament som konverterar",
    detail:
      'Använd digitala kuponger som incitament för att driva nya kunder. Erbjud en present vid köp, prenumeration eller rekommendation, t.ex. "Prenumerera och få gratis kaffe i ett år på Pressbyrån". Fungerar även som referral-belöning där båda parter får en kupong.',
    example: '"Teckna abonnemang idag och få en glasskupong varje månad i ett år!"',
    stats: "Företag som använder incitament vid kundvärvning ser i snitt 25% lägre kundanskaffningskostnad.",
  },
  {
    id: "compensate",
    icon: HeartHandshake,
    title: "Kompensera snabbt vid problem",
    brief: "Vänd missnöje till lojalitet",
    detail:
      "När något går fel vill kunden bli sedd direkt. Skicka en digital kupong via SMS inom sekunder, innan missnöjet hinner spridas.",
    example: '"Oj, det blev fel. Här, handla något gott på oss som ursäkt."',
    stats: "70% av kunder som får snabb kompensation förblir lojala, jämfört med 17% utan.",
  },
  {
    id: "reward",
    icon: Award,
    title: "Belöna personal enkelt",
    brief: "Uppskattning utan krångel",
    detail:
      "Uppmärksamma bra insatser i realtid med en digital present som går att använda direkt. Ingen administration, inga blanketter.",
    example: '"Snyggt jobbat idag! Här, en liten uppskattning från oss."',
    stats: "Regelbunden uppskattning minskar personalomsättning med upp till 31%.",
  },
];

const industryScenarios: Record<
  string,
  { churnCost: number; avgOrder: number; referralRate: number; compensations: number; employees: number }
> = {
  retail: { churnCost: 4800, avgOrder: 350, referralRate: 8, compensations: 40, employees: 25 },
  ecommerce: { churnCost: 3600, avgOrder: 450, referralRate: 12, compensations: 60, employees: 15 },
  telecom: { churnCost: 9600, avgOrder: 299, referralRate: 5, compensations: 80, employees: 30 },
  finance: { churnCost: 12000, avgOrder: 200, referralRate: 4, compensations: 30, employees: 20 },
  travel: { churnCost: 7200, avgOrder: 500, referralRate: 6, compensations: 50, employees: 20 },
  energy: { churnCost: 10800, avgOrder: 200, referralRate: 3, compensations: 70, employees: 15 },
  hospitality: { churnCost: 3200, avgOrder: 250, referralRate: 15, compensations: 30, employees: 35 },
  union: { churnCost: 6000, avgOrder: 300, referralRate: 5, compensations: 20, employees: 40 },
  other: { churnCost: 5000, avgOrder: 350, referralRate: 6, compensations: 40, employees: 20 },
};

/* ---------- Calculator sub-component ---------- */

function CalculatorSection({
  industry,
  onContinue,
  onSliderChange,
}: {
  industry: string;
  onContinue: () => void;
  onSliderChange?: (name: string, value: number) => void;
}) {
  const [customers, setCustomers] = useState([1000]);

  const scenario = industryScenarios[industry] || industryScenarios.other;
  const industryLabel = industryLabels[industry] || "er bransch";

  const referrals = Math.round((customers[0] * scenario.referralRate) / 100);
  const referralValue = referrals * scenario.avgOrder;
  const compensations = Math.round((customers[0] * scenario.compensations) / 1000);
  const savedCustomers = Math.round(compensations * 0.7);
  const savedValue = savedCustomers * scenario.churnCost;
  const couponCost = 50;
  const totalCouponCost = (referrals + compensations + scenario.employees * 2) * couponCost;
  const totalValue = referralValue + savedValue;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="font-bold text-[#3a453a] text-xl" data-testid="text-calculator-heading">
          Vad kan ClearOn betyda för er?
        </h3>
        <p className="text-sm text-[#416125] mt-1">
          Anpassat för <span className="text-[#416125] font-medium">{industryLabel}</span>
        </p>
      </div>
      <div className="bg-white border border-[#3a453a]/20 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-[#3a453a]">Hur många kunder har ni idag?</label>
          <span className="text-sm font-bold text-[#416125] tabular-nums">
            {customers[0].toLocaleString()}
          </span>
        </div>
        <Slider
          value={customers}
          onValueChange={setCustomers}
          onValueCommit={(val) => onSliderChange?.("customers", val[0])}
          min={100}
          max={50000}
          step={100}
          className="w-full"
          data-testid="slider-customers"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-white border border-[#3a453a]/20 rounded-xl p-3">
          <UserPlus className="w-4 h-4 text-[#416125] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#3a453a]">Potentiella nya kunder</p>
            <p className="text-xs text-[#3a453a]/60">{scenario.referralRate}% rekommenderar vidare</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#416125] tabular-nums">{referrals.toLocaleString()}</p>
            <p className="text-[10px] text-[#3a453a]/60">{referralValue.toLocaleString()} kr</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-[#3a453a]/20 rounded-xl p-3">
          <HeartHandshake className="w-4 h-4 text-[#416125] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#3a453a]">Räddade kunder</p>
            <p className="text-xs text-[#3a453a]/60">70% stannar vid snabb kompensation</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#416125] tabular-nums">{savedCustomers}</p>
            <p className="text-[10px] text-[#3a453a]/60">{savedValue.toLocaleString()} kr</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-[#3a453a]/20 rounded-xl p-3">
          <Award className="w-4 h-4 text-[#416125] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#3a453a]">Belöningar för egen personal</p>
            <p className="text-xs text-[#3a453a]/60">Lägre personalomsättning</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#416125] tabular-nums">{scenario.employees * 2}</p>
            <p className="text-[10px] text-[#3a453a]/60">tillfällen/år</p>
          </div>
        </div>
      </div>
      <div className="relative bg-[#416125] border border-[#416125]/30 rounded-xl p-5 text-center">
        <p className="text-xs text-white/70 mb-1">Uppskattat årligt värde</p>
        <p className="text-3xl font-bold text-white tabular-nums">{totalValue.toLocaleString()} kr</p>
      </div>
      <p className="text-[#3a453a]/60 text-center text-[16px] font-bold">
        Uppskattning baserad på branschsnitt.
      </p>
      <button
        onClick={onContinue}
        className="w-full py-3 text-sm font-semibold text-white bg-[#416125] rounded-xl hover:bg-[#416125]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        data-testid="button-continue-to-form"
      >
        Vill ni se hur det kan se ut för just er?
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------- Main Landing Page ---------- */

export default function LandingPage() {
  const [answers, setAnswers] = useState<Partial<DiscoveryAnswers>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [bossPhone, setBossPhone] = useState("");
  const [noCall, setNoCall] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { sessionId, consent, trackEvent, setConsent } = useTracking();
  const pageLoadTracked = useRef(false);

  useEffect(() => {
    if (!pageLoadTracked.current && sessionId) {
      pageLoadTracked.current = true;
      trackEvent("page_load", { variant: "main", page_section: "hero" });
    }
  }, [sessionId, trackEvent]);

  /* YouTube player init */
  useEffect(() => {
    let mounted = true;

    const initPlayer = () => {
      if (!mounted || !document.getElementById("yt-player-main")) return;
      new (window as unknown as Record<string, unknown> & { YT: { Player: new (...args: unknown[]) => unknown } }).YT.Player(
        "yt-player-main",
        {
          videoId: "9t5QIPfCsKw",
          playerVars: { rel: 0, modestbranding: 1 },
        }
      );
    };

    const win = window as unknown as Record<string, unknown>;
    if ((win.YT as Record<string, unknown>)?.Player) {
      initPlayer();
    } else {
      const prevCallback = win.onYouTubeIframeAPIReady as (() => void) | undefined;
      win.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  const industryRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const handleRoleSelect = (roleId: string) => {
    if (answers.role === roleId) return;
    trackClick("role_" + roleId, "main", "role_selection");
    setShowFeedback(roleId);
    setAnswers({ role: roleId });
    setShowCalculator(false);
    setShowForm(false);
    trackEvent("discovery_choice", { step_name: "role", choice: roleId });
    setTimeout(() => {
      setShowFeedback(null);
      scrollToRef(industryRef);
    }, 1500);
  };

  const handleIndustrySelect = (industryId: string) => {
    if (answers.industry === industryId) return;
    trackClick("industry_" + industryId, "main", "industry_selection");
    setAnswers((prev) => ({ ...prev, industry: industryId }));
    setShowForm(false);
    trackEvent("discovery_choice", { step_name: "industry", choice: industryId });
    setShowCalculator(true);
    setTimeout(() => {
      scrollToRef(calculatorRef);
    }, 300);
  };

  const handleShowForm = () => {
    trackClick("continue_to_form", "main", "calculator");
    setShowForm(true);
    trackEvent("calculator_completed", { ...answers });
    scrollToRef(formRef);
  };

  const toggleCard = (id: string) => {
    const next = expandedCard === id ? null : id;
    setExpandedCard(next);
    if (next) {
      trackClick("expand_card_" + id, "main", "value_props");
      trackEvent("solution_viewed", { solution: id });
    }
  };

  const hasIceCreamBonus = !!(phone || bossPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackClick("submit_form", "main", "lead_form");
    if (!email) return;

    setIsSubmitting(true);
    try {
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email,
          company: company || null,
          role: answers.role,
          interests: [
            `name:${name || "ej angiven"}`,
            `industry:${answers.industry}`,
            `variant:main`,
            `phone:${phone || "ej angiven"}`,
            `bossPhone:${bossPhone || "ej angiven"}`,
            `noCall:${noCall}`,
            `iceCreamBonus:${hasIceCreamBonus}`,
          ],
        }),
      }).catch(() => {});

      trackEvent("lead_submitted", {
        ...answers,
        has_phone: !!phone,
        has_boss_phone: !!bossPhone,
        no_call: noCall,
        ice_cream_bonus: hasIceCreamBonus,
      });
      trackLead("main", {
        role: answers.role,
        industry: answers.industry,
        has_phone: !!phone,
        has_boss_phone: !!bossPhone,
      });
      if (phone || bossPhone) {
        trackIceCreamCoupon("main", "form_ice_cream");
      }
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

  const industryLabel = industryLabels[answers.industry || ""] || "er bransch";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f1e9", fontFamily: "Carlito, sans-serif" }}>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-16 relative">
        {/* Hero background gradient instead of image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(65, 97, 37, 0.08) 0%, rgba(244, 241, 233, 1) 40%, rgba(244, 241, 233, 1) 60%, rgba(65, 97, 37, 0.05) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(244, 241, 233, 0.85) 0%, rgba(244, 241, 233, 0.55) 30%, rgba(244, 241, 233, 0.55) 70%, rgba(244, 241, 233, 0.85) 100%)",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto relative z-10"
        >
          <div className="text-center mb-10">
            {/* SVG text logo */}
            <a href="https://www.clearon.se/" target="_blank" rel="noopener noreferrer">
              <svg
                viewBox="0 0 140 28"
                className="h-7 mx-auto mb-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                data-testid="img-logo"
              >
                <text
                  x="0"
                  y="22"
                  fill="#416125"
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="-0.5"
                >
                  ClearOn
                </text>
              </svg>
            </a>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs text-[#3a453a]/70 font-semibold tracking-widest uppercase mb-4"
            >
              Digitala kuponger &ndash; bättre kundrelationer
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl md:text-4xl font-bold text-[#3a453a] leading-tight tracking-tight"
              data-testid="text-hero-heading"
            >
              Tre sätt att stärka era{" "}
              <span className="text-[#416125]">kundrelationer</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-[#3a453a]/80 mt-4 max-w-md mx-auto leading-relaxed"
            >
              Skicka digitala kuponger via SMS &ndash; direkt till kundens telefon. Fungerar i{" "}
              <span className="text-[#3a453a] font-medium">5 000+ butiker</span> i hela Sverige.
            </motion.p>
          </div>

          {/* Three value prop cards */}
          <div className="space-y-2 mb-8">
            {valueProps.map((vp, index) => {
              const isExpanded = expandedCard === vp.id;
              const IconComp = vp.icon;
              return (
                <motion.div
                  key={vp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  data-testid={`card-value-${index}`}
                >
                  <button
                    onClick={() => toggleCard(vp.id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
                      isExpanded
                        ? "bg-white border-[#3a453a]/25"
                        : "bg-white/80 border-[#3a453a]/15 hover:shadow-md"
                    }`}
                    data-testid={`button-expand-${vp.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isExpanded ? "bg-[#416125]/15" : "bg-[#416125]/10"
                        }`}
                      >
                        <IconComp className="w-4 h-4 text-[#416125]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#3a453a]">{vp.title}</p>
                        <p className="text-xs text-[#3a453a]/60">{vp.brief}</p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#3a453a]/50 shrink-0 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pt-3 pb-1 space-y-3">
                          <p className="text-sm text-[#3a453a]/70 leading-relaxed">{vp.detail}</p>
                          <div className="bg-[#416125]/5 border border-[#3a453a]/10 rounded-lg p-3">
                            <p className="text-sm text-[#3a453a]/90 italic">{vp.example}</p>
                          </div>
                          <p className="text-xs text-[#416125] font-medium">{vp.stats}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* How it works strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mb-8 space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-[#3a453a]/50">
              <span className="flex items-center gap-1">
                <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#416125] shrink-0" />
                <span className="font-medium text-[#3a453a]">Skicka</span> SMS
              </span>
              <span className="text-[#3a453a]/20">/</span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#416125] shrink-0" />
                <span className="font-medium text-[#3a453a]">Handla</span> i butik
              </span>
              <span className="text-[#3a453a]/20">/</span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#416125] shrink-0" />
                <span className="font-medium text-[#3a453a]">Följ upp</span>
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-[#3a453a]/50">
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#416125] shrink-0" />
                <strong className="text-[#3a453a]">1 timme</strong> setup
              </span>
              <span className="flex items-center gap-1">
                <Wallet className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#416125] shrink-0" />
                <strong className="text-[#3a453a]">Skräddarsydda</strong> lösningar
              </span>
              <span className="flex items-center gap-1">
                <Store className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#416125] shrink-0" />
                <strong className="text-[#3a453a]">5 000+</strong> butiker
              </span>
            </div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="border border-[#3a453a]/15 rounded-xl p-4 mb-10 bg-white/80"
          >
            <p className="text-sm text-[#3a453a]/70 italic leading-relaxed text-center">
              &ldquo;Värdecheckarna är enkla att hantera och ger guldkant på vardagen för
              mottagaren&rdquo;
            </p>
            <p className="text-xs text-[#416125] font-medium mt-2 text-center">
              &ndash; Lina Arwidsson, Vision
            </p>
          </motion.div>

          {/* Video demo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="mb-10"
          >
            <p className="text-xs font-semibold text-[#416125] uppercase tracking-wider mb-3 text-center">
              Se hur det fungerar
            </p>
            <div className="rounded-xl overflow-hidden shadow-lg border border-[#3a453a]/10">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <div id="yt-player-main" className="absolute inset-0 w-full h-full" />
              </div>
            </div>
          </motion.div>

          {/* Role selection */}
          <div className="pt-8 border-t border-[#3a453a]/15">
            <div className="text-center mb-6">
              <p className="text-xl font-bold text-[#3a453a]" data-testid="text-role-prompt">
                Nyfiken? <span className="text-[#416125]">Berätta lite om dig</span>
              </p>
              <p className="text-sm text-[#3a453a]/70 mt-1.5">
                Välj din roll &ndash; så anpassar vi resten
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {roles.map((role, index) => {
                const isSelected = answers.role === role.id;
                const isDisabled = showFeedback && showFeedback !== role.id;
                const IconComponent = role.icon;
                return (
                  <motion.button
                    key={role.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 + index * 0.03 }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "border-[#416125] bg-[#416125]/10"
                        : isDisabled
                          ? "border-[#3a453a]/10 bg-white/50 opacity-30"
                          : "border-[#3a453a]/15 bg-white/80 hover:shadow-md"
                    }`}
                    data-testid={`choice-role-${role.id}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[#416125]/15" : "bg-[#416125]/10"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 text-[#416125]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[#3a453a] block leading-tight">
                        {role.label}
                      </span>
                      <span className="text-[10px] text-[#3a453a]/50 block leading-tight mt-0.5">
                        {role.description}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-white border border-[#3a453a]/15 rounded-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-[#416125]" />
                    <p className="text-sm text-[#3a453a]">{roleFeedback[showFeedback]}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* Industry Selection */}
      <AnimatePresence>
        {answers.role && (
          <motion.section
            ref={industryRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 md:px-6 py-16"
            style={{ backgroundColor: "#f4f1e9" }}
          >
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-[#3a453a] bg-[#416125]/10 border border-[#3a453a]/25 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3 text-[#416125]" />
                  <span>{roles.find((r) => r.id === answers.role)?.label}</span>
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-lg font-bold text-[#3a453a]" data-testid="text-industry-prompt">
                  Vilken <span className="text-[#416125]">bransch</span> är ni i?
                </p>
                <p className="text-sm text-[#3a453a]/70 mt-1">
                  Vi anpassar räkneexemplet efter er verklighet
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {industries.map((industry, index) => {
                  const isSelected = answers.industry === industry.id;
                  const IconComponent = industry.icon;
                  return (
                    <motion.button
                      key={industry.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -2 }}
                      onClick={() => handleIndustrySelect(industry.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 h-20 cursor-pointer ${
                        isSelected
                          ? "border-[#416125] bg-[#416125]/10"
                          : "border-[#3a453a]/20 bg-white hover:shadow-md"
                      }`}
                      data-testid={`choice-industry-${industry.id}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-[#416125]/15" : "bg-[#416125]/10"
                        }`}
                      >
                        <IconComponent className="w-4 h-4 text-[#416125]" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#3a453a] leading-tight">
                        {industry.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Calculator Section */}
      <AnimatePresence>
        {showCalculator && answers.industry && (
          <motion.section
            ref={calculatorRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 md:px-6 py-16"
            style={{ backgroundColor: "#f4f1e9" }}
          >
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-[#3a453a] bg-[#416125]/10 border border-[#3a453a]/25 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3 text-[#416125]" />
                  <span>{roles.find((r) => r.id === answers.role)?.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#3a453a] bg-[#416125]/10 border border-[#3a453a]/25 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3 text-[#416125]" />
                  <span>{industries.find((i) => i.id === answers.industry)?.label}</span>
                </div>
              </div>

              <CalculatorSection
                industry={answers.industry || ""}
                onContinue={handleShowForm}
                onSliderChange={(sliderName, value) =>
                  trackEvent("slider_changed", {
                    choice: sliderName,
                    page_section: "calculator",
                    value,
                  })
                }
              />

              <div className="mt-5 bg-white border border-[#3a453a]/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#416125] shrink-0" />
                  <p className="text-sm font-semibold text-[#3a453a]">
                    Fungerar i 5 000+ butiker i hela Sverige
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {["ICA", "Coop", "Hemköp", "Willys", "City Gross"].map((store) => (
                    <span key={store} className="text-sm font-bold text-[#416125] tracking-wide">
                      {store}
                    </span>
                  ))}
                  <span className="text-xs text-[#3a453a]/50">m.fl.</span>
                </div>
                <div className="flex items-center gap-2 bg-[#416125]/10 border border-[#3a453a]/25 rounded-lg px-3 py-2.5">
                  <Wallet className="w-4 h-4 text-[#416125] shrink-0" />
                  <p className="text-sm text-[#3a453a] font-medium">
                    <span className="text-[#416125] font-bold">Skräddarsydda</span> lösningar för er
                    verksamhet
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Lead Form */}
      <AnimatePresence>
        {showForm && (
          <motion.section
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 md:px-6 py-16"
            style={{ backgroundColor: "#f4f1e9" }}
          >
            <div className="max-w-md mx-auto">
              {!isSubmitted ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#416125]/10 flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-7 h-7 text-[#416125]" />
                    </div>
                    <h3
                      className="text-xl font-bold text-[#3a453a]"
                      data-testid="text-form-heading"
                    >
                      Vi tar fram ett <span className="text-[#416125]">förslag</span> åt er
                    </h3>
                    <p className="text-sm text-[#3a453a]/70 mt-1.5 leading-relaxed">
                      Vi sätter ihop en konkret plan för hur ni kan använda digitala kuponger i er
                      verksamhet &ndash; anpassat efter {industryLabel} och era behov.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Ditt namn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                      data-testid="input-name"
                    />
                    <Input
                      type="email"
                      placeholder="E-post *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                      data-testid="input-email"
                    />
                    <Input
                      type="text"
                      placeholder="Företag"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                      data-testid="input-company"
                    />

                    <div className="flex items-start gap-3 py-2">
                      <Checkbox
                        id="no-call"
                        checked={noCall}
                        onCheckedChange={(checked) => setNoCall(checked as boolean)}
                        className="mt-0.5"
                        data-testid="checkbox-no-call"
                      />
                      <label
                        htmlFor="no-call"
                        className="text-xs text-[#3a453a]/70 cursor-pointer leading-relaxed"
                      >
                        Jag är medveten om att ClearOn lagrar mina personuppgifter enligt ovan för
                        att hantera detta ärende.{" "}
                        <a
                          href="https://www.clearon.se/behandling-av-personuppgifter/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#416125] underline hover:text-[#416125]/80"
                        >
                          Läs mer om personuppgiftsbehandling
                        </a>
                      </label>
                    </div>

                    <div className="border-t border-[#3a453a]/20 pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IceCream className="w-4 h-4 text-[#416125]" />
                        <p className="text-sm font-semibold text-[#3a453a]">
                          Bonus: Vill du ha eller skicka en glass?
                        </p>
                      </div>
                      <p className="text-xs text-[#3a453a]/60 mb-3">
                        Lämna ditt eller din chefs nummer &ndash; vi skickar en glass som tack.
                      </p>
                      <div className="space-y-3">
                        <Input
                          type="tel"
                          placeholder="Ditt telefonnummer (valfritt)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                          data-testid="input-phone"
                        />
                        <Input
                          type="tel"
                          placeholder="Din chefs telefonnummer (valfritt)"
                          value={bossPhone}
                          onChange={(e) => setBossPhone(e.target.value)}
                          className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base"
                          data-testid="input-boss-phone"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 mt-2 text-sm font-semibold text-white bg-[#416125] rounded-xl hover:bg-[#416125]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      disabled={isSubmitting || !email}
                      data-testid="button-submit-lead"
                    >
                      {isSubmitting ? "Skickar..." : "Ja, ta fram ett förslag åt oss"}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-[10px] text-[#3a453a]/50 text-center pt-1">
                      Vi skickar en konkret plan på mail inom en arbetsdag, redo att implementera.
                      {!noCall && " Vi ringer dig om du lämnat telefonnummer."}
                    </p>
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
                  <a href="https://www.clearon.se/" target="_blank" rel="noopener noreferrer">
                    <svg
                      viewBox="0 0 140 28"
                      className="h-6 mx-auto mb-6 opacity-70"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <text
                        x="0"
                        y="22"
                        fill="#416125"
                        fontSize="24"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        letterSpacing="-0.5"
                      >
                        ClearOn
                      </text>
                    </svg>
                  </a>
                  <p className="font-bold text-2xl text-[#416125]" data-testid="text-success">
                    Tack! Vi jobbar på ert förslag.
                  </p>
                  <p className="text-[#3a453a]/70 mt-3 max-w-sm mx-auto">
                    Ni får en konkret plan för hur digitala kuponger kan fungera inom{" "}
                    <span className="text-[#416125] font-medium">{industryLabel}</span> &ndash;
                    direkt till din mail.
                    {!noCall && phone && " Vi ringer dig inom kort."}
                  </p>
                  {hasIceCreamBonus && (
                    <div className="mt-6 bg-white border border-[#3a453a]/20 rounded-xl p-4 inline-flex items-center gap-2">
                      <IceCream className="w-4 h-4 text-[#416125]" />
                      <p className="text-sm text-[#3a453a]">
                        Glassen skickas till{" "}
                        {phone && bossPhone ? "dig och din chef" : phone ? "dig" : "din chef"} inom
                        kort!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <Footer />

      <IceCreamPopup sessionId={sessionId} variant="main" trackEvent={trackEvent} delayMs={7000} />

      <ConsentBanner
        visible={consent === null}
        onAccept={() => setConsent(true)}
        onDecline={() => setConsent(false)}
      />
    </div>
  );
}
