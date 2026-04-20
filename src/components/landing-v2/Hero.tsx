"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const PROBLEMS = [
  {
    id: "trade-marketing",
    icon: "📊",
    label: "Trade Marketing Manager",
    headline: "Kampanjer som faktiskt syns i hyllan",
    sub: "Ni planerar kampanjer, men saknar sparbarhet fran plan till kassa. ClearOn kopplar ert varumarke direkt till 20 000 kassor.",
  },
  {
    id: "marknadschef",
    icon: "📣",
    label: "Marknadschef",
    headline: "Fran gissning till garanti",
    sub: "Digitala kuponger med full sparbarhet. Ni ser exakt vilka kampanjer som driver kop, i vilka butiker, i realtid.",
  },
  {
    id: "hr-chef",
    icon: "🎁",
    label: "HR-chef",
    headline: "Personalbeloning utan administration",
    sub: "Skicka digitala presentkort via SMS. Ingen blanketthantering, mottagaren valjer sjalv bland 5 000 butiker.",
  },
  {
    id: "kundtjanst",
    icon: "💬",
    label: "Kundtjanstchef",
    headline: "Vand missnoje till lojalitet pa sekunder",
    sub: "Skicka digital kompensation via SMS direkt i samtalet. 70% av kompenserade kunder forblir lojala.",
  },
  {
    id: "category",
    icon: "🏪",
    label: "Category Manager",
    headline: "Clearing utan manuell hantering",
    sub: "ClearOns infrastruktur hanterar inlosning och avrakning automatiskt. Ni far data, inte pappersarbete.",
  },
];

const HERO_STATS = [
  { value: "5 000+", label: "butiker" },
  { value: "20 000", label: "anslutna kassor" },
  { value: "+46%", label: "forsaljningslyft" },
  { value: "70%", label: "behaller kunder" },
];

export function Hero({
  role,
  setRole,
}: {
  role: string | null;
  setRole: (role: string) => void;
}) {
  const { track } = useSignal();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const activeHero = PROBLEMS.find((p) => p.id === role) || PROBLEMS[0];

  const handleRoleClick = (id: string) => {
    setRole(id);
    track("role:pick", { role: id });
  };

  return (
    <section
      id="hero"
      style={{
        paddingTop: 100,
        paddingBottom: 64,
        background: "var(--clr-beige)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background shapes */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--clr-green-soft) 0%, transparent 70%)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--clr-lime-soft) 0%, transparent 70%)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      <div className="c-container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
          <div className="c-eyebrow" style={{ marginBottom: 16 }}>
            Digitala kuponger for hela Sverige
          </div>
          <h1 className="c-h1" style={{ marginBottom: 16 }}>
            {activeHero.headline}
          </h1>
          <p
            className="c-body-lg"
            style={{
              maxWidth: 600,
              margin: "0 auto 40px",
              color: "var(--clr-muted)",
            }}
          >
            {activeHero.sub}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#kontakt" className="c-btn c-btn--primary">
              Boka demo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#hur-det-fungerar" className="c-btn c-btn--ghost">
              Sa fungerar det
            </a>
          </div>
        </div>

        {/* Role cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            maxWidth: 1000,
            margin: "48px auto 0",
          }}
        >
          {PROBLEMS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleRoleClick(p.id)}
              onMouseEnter={() => setHoveredCard(p.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background:
                  role === p.id
                    ? "var(--clr-green)"
                    : hoveredCard === p.id
                    ? "var(--clr-cl-surface)"
                    : "rgba(255,255,255,0.7)",
                color: role === p.id ? "#fff" : "var(--clr-ink)",
                border:
                  role === p.id
                    ? "1.5px solid var(--clr-green)"
                    : "1.5px solid var(--clr-line)",
                borderRadius: "var(--r-md)",
                padding: "16px 14px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s var(--ease-out)",
                boxShadow:
                  role === p.id || hoveredCard === p.id
                    ? "var(--sh-md)"
                    : "none",
                fontFamily: "var(--font-open-sans), sans-serif",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
            </button>
          ))}
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 40,
            flexWrap: "wrap",
            marginTop: 48,
            padding: "24px 0",
            borderTop: "1px solid var(--clr-line-soft)",
          }}
        >
          {HERO_STATS.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--clr-green)",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 12,
                  color: "var(--clr-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
