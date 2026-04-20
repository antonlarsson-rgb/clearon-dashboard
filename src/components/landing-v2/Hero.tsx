"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const PROBLEMS = [
  {
    id: "consent",
    label: "Cookie-consent-raten är låg",
    sub: "Belöna besökare för att säga ja till data",
    departments: ["Data / GDPR", "Digital"],
    accent: "var(--clr-lime)",
    accentInk: "#4a5a1a",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="7" cy="9" r="1.2" fill="currentColor"/>
        <circle cx="13" cy="8" r="1" fill="currentColor"/>
        <circle cx="10" cy="14" r="1.3" fill="currentColor"/>
      </svg>
    ),
    segment: "consent-hunter",
  },
  {
    id: "complaint",
    label: "Kunder som klagar blir förbannade",
    sub: "Ge plåster på såret i kundtjänst",
    departments: ["Kundtjänst", "CX"],
    accent: "var(--clr-orange)",
    accentInk: "#7a3810",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 7a3 3 0 013-3h8a3 3 0 013 3v5a3 3 0 01-3 3H9l-4 3v-3a3 3 0 01-1-2V7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
    segment: "cx-rescuer",
  },
  {
    id: "staff",
    label: "Personalen känns osedd",
    sub: "Spontan erkänsla med verkligt värde",
    departments: ["HR", "Ledning"],
    accent: "var(--clr-teal)",
    accentInk: "#1f3d13",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 13a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M4 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    segment: "hr-rewarder",
  },
  {
    id: "boring",
    label: "Våra kampanjer är tråkiga",
    sub: "Gör det lekfullt med spel och skraplotter",
    departments: ["Marknad", "Brand"],
    accent: "var(--clr-coral)",
    accentInk: "#7a3010",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2l2.5 5.5L19 8.5l-4 4 1 5.5L11 15l-5 3 1-5.5-4-4 5.5-1L11 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
    segment: "playful-marketer",
  },
  {
    id: "acquire",
    label: "Vi behöver locka kunder från nya branscher",
    sub: "Elbolag? Telekom? Försäkring? Ge en ICA-check på köpet",
    departments: ["Marknad", "Tillväxt"],
    accent: "var(--clr-yellow)",
    accentInk: "#4a5a1a",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 11h13M11 6l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="19" cy="11" r="1.6" fill="currentColor"/>
      </svg>
    ),
    segment: "acquisition-hunter",
  },
];

export const ROLES = PROBLEMS.map(p => ({ id: p.id, label: p.label, accent: p.accent, sub: p.sub }));

const HEROES: Record<string, { kicker: string; headline: string; sub: string }> = {
  default: {
    kicker: "Reward platform for B2B",
    headline: "Vi belönar dina kunder,\npersonal och besökare.",
    sub: "ClearOn är Sveriges reward-plattform. Kupongen är valutan, fysisk eller digital, alltid kopplad till mat och vardagsvaror i 5 000+ butiker. Du bygger spel, skraplotter, kampanjer och belöningar, vi sköter infrastrukturen.",
  },
  consent: {
    kicker: "För Data & Digital",
    headline: "Höj consent-raten\nmed ett riktigt värde.",
    sub: "En ICA-check för att säga ja till cookies slår \"vi använder cookies för att förbättra din upplevelse\" varenda gång. Vi ser kunder gå från 42% till 78% consent.",
  },
  complaint: {
    kicker: "För Kundtjänst",
    headline: "Vänd ilska\ntill tacksamhet.",
    sub: "Skicka en kupong direkt i chatten när något går fel. Det kostar mindre än en missnöjd kund på Trustpilot, och mottagaren får ett verkligt värde samma dag.",
  },
  staff: {
    kicker: "För HR & People",
    headline: "En fredag.\nEn värdecheck.\nEn tårta på huset.",
    sub: "Spontan erkänsla slår årliga bonusar. Skicka en 100-krona till dagligvaran när någon gjort något bra. Inga fakturor, ingen logistik, bara ett SMS.",
  },
  boring: {
    kicker: "För Marknad & Brand",
    headline: "Kampanjer som\nkänns som spel.",
    sub: "Lyckohjul, skraplott, quiz, adventskalender. Alla varianter kopplade till en riktig belöning som löses in i butik. Vi bygger spelet, du får engagemanget.",
  },
  acquire: {
    kicker: "För Tillväxt & Förvärv",
    headline: "Låt maten\ngöra jobbet.",
    sub: "Prenumerera på vårt elbolag, få 500 kr på ICA. Byt bank, få en månad gratis glass. När din produkt är abstrakt, lånar du värdet från något alla förstår.",
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
    <section style={{ padding: "64px 0 40px", position: "relative", overflow: "hidden" }}>
      {/* Background shapes */}
      <div style={{
        position: "absolute", top: 80, right: -80, width: 320, height: 320,
        borderRadius: "50%", background: "var(--clr-lime)", opacity: 0.35,
        filter: "blur(40px)", zIndex: 0, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 280, right: 140, width: 180, height: 180,
        borderRadius: "50%", background: "var(--clr-green-soft)", opacity: 0.55,
        filter: "blur(30px)", zIndex: 0, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 40, left: -60, width: 220, height: 220,
        borderRadius: "50%", background: "var(--clr-orange-soft)", opacity: 0.5,
        filter: "blur(34px)", zIndex: 0, pointerEvents: "none",
      }} />

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
          <a href="#spela" className="c-btn c-btn--primary" onClick={() => track("module:engage", { id: "hero-games" })}>
            Testa spelen
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <a href="#quiz" className="c-btn c-btn--ghost" onClick={() => track("module:engage", { id: "hero-quiz" })}>
            Vilken lösning passar mig?
          </a>
        </div>

        <div>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>
            {role === "default" ? "Börja med problemet du brottas med" : "Byt problem"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
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
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "16px 18px",
                    background: active ? p.accent : "var(--clr-surface)",
                    color: active ? p.accentInk : "var(--clr-ink)",
                    border: `1.5px solid ${active ? p.accentInk : "var(--clr-line)"}`,
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                    transition: "all 0.2s var(--ease-out)",
                    textAlign: "left",
                    boxShadow: active ? "var(--sh-md)" : "none",
                  }}
                >
                  <span style={{
                    width: 36, height: 36, flexShrink: 0,
                    borderRadius: "var(--r-sm)",
                    background: active ? "rgba(255,255,255,0.35)" : p.accent,
                    color: p.accentInk,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{p.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600, fontSize: 14, lineHeight: 1.25, marginBottom: 3 }}>
                      {p.label}
                    </span>
                    <span style={{ display: "block", fontSize: 12, lineHeight: 1.35, opacity: 0.75 }}>
                      {p.sub}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
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
    { v: "99,8%", l: "Clearing-tillförlitlighet" },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
      borderTop: "1px solid var(--clr-line)", borderBottom: "1px solid var(--clr-line)",
      marginTop: 56,
    }} className="hero-stats">
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: "24px 20px",
          borderRight: i < stats.length - 1 ? "1px solid var(--clr-line)" : "none",
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>{s.v}</div>
          <div style={{ fontSize: 13, color: "var(--clr-muted)", marginTop: 4, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{s.l}</div>
        </div>
      ))}
      <style>{`
        @media (max-width: 960px) {
          .hero-stats { grid-template-columns: 1fr 1fr !important; }
          .hero-stats > div:nth-child(2n) { border-right: none !important; }
        }
      `}</style>
    </div>
  );
}
