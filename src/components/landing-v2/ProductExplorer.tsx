"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const PRODUCTS = [
  {
    id: "sales-promotion",
    name: "Sales Promotion",
    category: "forsaljning",
    desc: "Fysiska kuponger i butik. +15% forsaljningsokning pa etablerade produkter, +46% vid nylansering.",
    bullets: [
      "20 000 anslutna kassor",
      "5 000+ butiker",
      "Full sparbarhet",
      "Realtidsrapportering",
    ],
    href: "/sales-promotion",
    color: "#2D6A4F",
  },
  {
    id: "interactive-engage",
    name: "Interactive Engage",
    category: "forsaljning",
    desc: "Gamification som driver +16% extra forsaljning. Spel, tavlingar, scratch cards.",
    bullets: [
      "Snurra hjulet",
      "Skrapkort",
      "Quiz-spel",
      "Adventskalender",
    ],
    href: "/interactive-engage",
    color: "#E07A5F",
  },
  {
    id: "customer-care",
    name: "Customer Care",
    category: "kundvard",
    desc: "Digital kompensation via SMS. 70% av kompenserade kunder forblir lojala.",
    bullets: [
      "Direkt i kundtjanstsamtalet",
      "Digitala vardecheckar",
      "CRM-integration",
      "Inga fysiska vardeavier",
    ],
    href: "/customer-care",
    color: "#4A90A4",
  },
  {
    id: "kampanja",
    name: "Kampanja",
    category: "forsaljning",
    desc: "Bygg kampanjsidor och distribuera kuponger via SMS. Fran ide till live pa minuter.",
    bullets: [
      "Egna kampanjsidor",
      "SMS-distribution",
      "Ingen utvecklare kravs",
      "Full statistik",
    ],
    href: "/kampanja",
    color: "#7B68EE",
  },
  {
    id: "send-a-gift",
    name: "Send a Gift",
    category: "hr",
    desc: "Digitala presentkort for personalbeloning. Skatteeffektivt och utan administration.",
    bullets: [
      "SMS- eller mailutskick",
      "Mottagaren valjer butik",
      "Skatteeffektivt",
      "Noll administration",
    ],
    href: "/send-a-gift",
    color: "#D4A574",
  },
  {
    id: "personalbeloning",
    name: "Personalbeloning",
    category: "hr",
    desc: "Systematisk personalbeloning med digitala vardecheckar. Fodelsedag, jubileum, prestation.",
    bullets: [
      "Automatiska utskick",
      "Anpassade belopp",
      "5 000+ inlosningsplatser",
      "Rapportering till HR",
    ],
    href: "/personalbeloning",
    color: "#8B6F47",
  },
  {
    id: "kuponger",
    name: "Kuponger",
    category: "forsaljning",
    desc: "Digitala kuponger for fysisk retail. Hela kedjan fran skapande till inlosning och clearing.",
    bullets: [
      "Digital distribution",
      "Kassaintegration",
      "Automatisk clearing",
      "Kampanjuppfoljning",
    ],
    href: "/kuponger",
    color: "#5e9732",
  },
  {
    id: "mobila-presentkort",
    name: "Mobila Presentkort",
    category: "kundvard",
    desc: "Digitala presentkort via mobilen. Perfekt for kompensation, beloning och gavagivande.",
    bullets: [
      "Direkt leverans via SMS",
      "Valbart belopp",
      "5 000+ butiker",
      "Ingen fysisk hantering",
    ],
    href: "/mobila-presentkort",
    color: "#c8a830",
  },
];

const FILTERS = [
  { label: "Alla", value: "alla" },
  { label: "Forsaljning", value: "forsaljning" },
  { label: "Kundvard", value: "kundvard" },
  { label: "HR", value: "hr" },
];

export function ProductExplorer() {
  const { track } = useSignal();
  const [filter, setFilter] = useState("alla");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    filter === "alla"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === filter);

  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--clr-surface-alt)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Alla produkter
          </div>
          <h2 className="c-h2">Utforska vara losningar</h2>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "6px 18px",
                borderRadius: "var(--r-pill)",
                border:
                  filter === f.value
                    ? "2px solid var(--clr-green)"
                    : "1.5px solid var(--clr-line)",
                background:
                  filter === f.value
                    ? "var(--clr-green)"
                    : "var(--clr-cl-surface)",
                color: filter === f.value ? "#fff" : "var(--clr-ink-2)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-open-sans), sans-serif",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {filtered.map((product) => (
            <div
              key={product.id}
              className="c-card"
              style={{
                borderTop: `3px solid ${product.color}`,
                cursor: "pointer",
              }}
              onClick={() => {
                const next =
                  expanded === product.id ? null : product.id;
                setExpanded(next);
                if (next) {
                  track("product:expand", { product: product.id });
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-open-sans), sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--clr-ink)",
                  }}
                >
                  {product.name}
                </h3>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform:
                      expanded === product.id
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="var(--clr-muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 13,
                  color: "var(--clr-muted)",
                  lineHeight: 1.5,
                }}
              >
                {product.desc}
              </p>

              {expanded === product.id && (
                <div style={{ marginTop: 16 }}>
                  <ul style={{ padding: 0, margin: "0 0 16px 0", listStyle: "none" }}>
                    {product.bullets.map((b) => (
                      <li
                        key={b}
                        style={{
                          fontSize: 13,
                          color: "var(--clr-ink-2)",
                          padding: "4px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: product.color,
                            flexShrink: 0,
                          }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={product.href}
                    className="c-btn c-btn--primary"
                    style={{
                      fontSize: 13,
                      padding: "8px 20px",
                      background: product.color,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      track("product:cta", { product: product.id });
                    }}
                  >
                    Las mer
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8H13M13 8L9 4M13 8L9 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
