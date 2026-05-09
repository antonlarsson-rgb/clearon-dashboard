"use client";

import { useSignal } from "./SignalProvider";
import { ArrowRight } from "lucide-react";

const PROBLEMS = [
  {
    id: "boring",
    label: "Kampanjerna engagerar inte",
    sub: "Lekfull mekanik som driver inlösen",
    accent: "var(--clr-coral)",
    accentInk: "#7a3010",
    segment: "playful-marketer",
  },
  {
    id: "consent",
    label: "Cookie-consent är låg",
    sub: "Belöning för att säga ja till data",
    accent: "var(--clr-lime)",
    accentInk: "#4a5a1a",
    segment: "consent-hunter",
  },
  {
    id: "acquire",
    label: "Svårt att locka nya kunder",
    sub: "Lån värdet från något alla förstår",
    accent: "var(--clr-yellow-accent)",
    accentInk: "#4a3010",
    segment: "acquisition-hunter",
  },
  {
    id: "measure",
    label: "Effekten går inte att mäta",
    sub: "Spårbart från klick till kassa",
    accent: "var(--clr-green)",
    accentInk: "#1f3d13",
    segment: "measure-seeker",
  },
  {
    id: "sampling",
    label: "Fler måste prova produkten",
    sub: "Kupong som driver första köpet",
    accent: "var(--clr-orange)",
    accentInk: "#7a3810",
    segment: "trial-driver",
  },
  {
    id: "loyalty",
    label: "Kunderna återvänder inte",
    sub: "Belöna andra och tredje köpet",
    accent: "var(--clr-green-deep)",
    accentInk: "#1f3d13",
    segment: "loyalty-builder",
  },
  {
    id: "complaint",
    label: "Klagomål skadar relationen",
    sub: "Plåster på såret i kundtjänst",
    accent: "var(--clr-teal)",
    accentInk: "#1f3d13",
    segment: "cx-rescuer",
  },
  {
    id: "staff",
    label: "Personalen känns osedd",
    sub: "Spontan erkänsla med verkligt värde",
    accent: "var(--clr-lilac)",
    accentInk: "#3a4a2a",
    segment: "hr-rewarder",
  },
];

export const ROLES = PROBLEMS.map(p => ({ id: p.id, label: p.label, accent: p.accent, sub: p.sub }));

const HEROES: Record<string, { kicker: string; headline: string; sub: string }> = {
  default: {
    kicker: "Belöningar som driver affär",
    headline: "Få fler att interagera,\ninte bara titta.",
    sub: "Förvandla passiva kampanjer till aktiverande upplevelser. Vi ger infrastrukturen och butiksnätverket, ni bygger affären.",
  },
  consent: {
    kicker: "Cookie-consent",
    headline: "Få fler att säga ja\ntill data.",
    sub: "Förvandla cookie-bannern till ett erbjudande mottagaren vill ta del av. Mer consent, mer first-party data.",
  },
  complaint: {
    kicker: "Kundvård",
    headline: "Vänd irritation\ntill tacksamhet.",
    sub: "Skicka ett påtagligt förlåt direkt i chatten. En verklig belöning väger tyngre än ett standardsvar.",
  },
  staff: {
    kicker: "Personalbelöning",
    headline: "Säg tack\nmed ett SMS.",
    sub: "Spontan uppskattning slår årlig bonus. Skicka en värdecheck när någon levererat. Ingen logistik.",
  },
  boring: {
    kicker: "Engagemang",
    headline: "Kampanjer som\nkänns som spel.",
    sub: "Lyckohjul, skraplott, quiz. Mekanik som får mottagaren att stanna kvar, kopplat till en belöning som löses in i butik.",
  },
  acquire: {
    kicker: "Förvärv",
    headline: "Låt maten\ngöra jobbet.",
    sub: "När er produkt är abstrakt, lånar ni värdet från något alla förstår. En ICA-check tar mottagaren från kanske till ja.",
  },
  measure: {
    kicker: "Mätbarhet",
    headline: "Spårbart från\nklick till kassa.",
    sub: "Varje belöning är clearad i butiksledet. Ni ser vad som faktiskt löstes in, av vem och i vilken kanal.",
  },
  sampling: {
    kicker: "Trial",
    headline: "Få fler att\nprova produkten.",
    sub: "Skicka ut en kupong som löses in på er hyllvara. Mottagaren möter produkten i butik, ni får data på första köpet.",
  },
  loyalty: {
    kicker: "Lojalitet",
    headline: "Belöna det\nandra köpet.",
    sub: "Trigga andra och tredje köpet med en värdecheck efter första inlösen. Återköp som går att räkna hem.",
  },
};

export function Hero({
  role,
  setRole,
}: {
  role: string;
  setRole: (role: string) => void;
}) {
  const { track } = useSignal();
  const hero = HEROES[role] || HEROES.default;

  return (
    <section style={{ padding: "72px 0 56px", position: "relative", background: "var(--clr-beige)" }}>
      <div className="c-container" style={{ position: "relative" }}>
        <div className="c-eyebrow" style={{ marginBottom: 20 }}>
          <span className="dot" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--clr-green)", marginRight: 8 }} />
          {hero.kicker}
        </div>

        <h1 className="c-h1" style={{ maxWidth: 1040, whiteSpace: "pre-line", marginBottom: 28 }}>
          {hero.headline}
        </h1>

        <p className="c-body-lg" style={{ maxWidth: 680, marginBottom: 36, color: "var(--clr-ink-2)" }}>
          {hero.sub}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
          <a href="#kontakt" className="c-btn c-btn--cta" onClick={() => track("module:engage", { id: "hero-cta-funka" })}>
            Se hur det kan funka för er
            <ArrowRight size={16} strokeWidth={2} />
          </a>
          <a href="#hur" className="c-btn c-btn--ghost" onClick={() => track("module:engage", { id: "hero-howitworks" })}>
            Så fungerar det
          </a>
        </div>

        <div>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>
            {role === "default" ? "Börja med ert problem" : "Byt problem"}
          </div>
          <div className="hero-problem-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {PROBLEMS.map(p => {
              const active = role === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setRole(active ? "default" : p.id);
                    track("problem:pick", { id: p.id, segment: p.segment });
                  }}
                  style={{
                    display: "flex", alignItems: "stretch", gap: 0,
                    padding: 0,
                    minHeight: 96,
                    background: active ? p.accent : "var(--clr-surface)",
                    color: active ? p.accentInk : "var(--clr-ink)",
                    border: `1.5px solid ${active ? p.accentInk : "var(--clr-line)"}`,
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                    transition: "all 0.2s var(--ease-out)",
                    textAlign: "left",
                    boxShadow: active ? "var(--sh-md)" : "none",
                    overflow: "hidden",
                  }}
                >
                  <span style={{
                    width: 4, flexShrink: 0,
                    background: active ? p.accentInk : p.accent,
                    transition: "background 0.2s var(--ease-out)",
                  }} />
                  <span style={{
                    flex: 1, minWidth: 0,
                    padding: "16px 18px",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                  }}>
                    <span style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700, fontSize: 15,
                      lineHeight: 1.25,
                      marginBottom: 4,
                      letterSpacing: "-0.005em",
                    }}>
                      {p.label}
                    </span>
                    <span style={{ display: "block", fontSize: 13, lineHeight: 1.4, opacity: 0.75 }}>
                      {p.sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <style>{`
            @media (max-width: 1100px) {
              .hero-problem-grid { grid-template-columns: repeat(3, 1fr) !important; }
            }
            @media (max-width: 780px) {
              .hero-problem-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (max-width: 480px) {
              .hero-problem-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>

        <HeroStats />
      </div>
    </section>
  );
}

function HeroStats() {
  const stats = [
    { v: "5 000+", l: "Butiker i Sverige" },
    { v: "30+ år", l: "Belönings\u00ADexpertis" },
    { v: "< 1 min", l: "Från SMS till inlöst" },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
      borderTop: "1px solid var(--clr-line)", borderBottom: "1px solid var(--clr-line)",
      marginTop: 56,
    }} className="hero-stats">
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: "24px 20px",
          borderRight: i < stats.length - 1 ? "1px solid var(--clr-line)" : "none",
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>{s.v}</div>
          <div style={{ fontSize: 13, color: "var(--clr-muted)", marginTop: 4 }}>{s.l}</div>
        </div>
      ))}
      <style>{`
        @media (max-width: 960px) {
          .hero-stats { grid-template-columns: 1fr !important; }
          .hero-stats > div { border-right: none !important; border-bottom: 1px solid var(--clr-line); }
          .hero-stats > div:last-child { border-bottom: none !important; }
        }
      `}</style>
    </div>
  );
}
