"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const PRODUCTS = [
  {
    id: "kuponger", name: "Digitala kuponger",
    tagline: "SMS-kuponger som löses in i butik.",
    color: "var(--clr-coral)", colorSoft: "var(--clr-coral-soft)", icon: "\u25CE",
    forLabels: ["Marknad", "FMCG"],
    bullets: ["Skicka kampanj på minuter", "Inlösen i 5 000+ butiker", "Automatisk clearing"],
    metric: { v: "3-5x", l: "högre inlösen vs print" },
  },
  {
    id: "mobila-presentkort", name: "Mobila presentkort",
    tagline: "Värdet i fickan, inget kort att tappa bort.",
    color: "var(--clr-teal)", colorSoft: "var(--clr-teal-soft)", icon: "\u25C9",
    forLabels: ["Marknad", "HR"],
    bullets: ["Valfritt belopp", "Sverigechecken inkluderad", "Digital leverans via SMS"],
    metric: { v: "<60 s", l: "från skickat till mottaget" },
  },
  {
    id: "sverigechecken", name: "Sverigechecken",
    tagline: "En check, tusentals butiker.",
    color: "var(--clr-yellow)", colorSoft: "var(--clr-yellow-soft)", icon: "\u273A",
    forLabels: ["HR", "VD"],
    bullets: ["Sveriges mest flexibla check", "Dagligvaror + service", "Fysisk eller digital"],
    metric: { v: "5 000+", l: "inlösenställen" },
  },
  {
    id: "customer-care", name: "Customer Care",
    tagline: "Kompensera drabbade kunder direkt.",
    color: "var(--clr-lime)", colorSoft: "var(--clr-lime-soft)", icon: "\u2726",
    forLabels: ["Drift"],
    bullets: ["SMS med värdebärare", "Från klagomål till löst", "Full spårbarhet"],
    metric: { v: "+38p", l: "NPS-lyft i snitt" },
  },
  {
    id: "personalbeloning", name: "Personalbelöning",
    tagline: "Tack för insatsen, på sekunder.",
    color: "var(--clr-lilac)", colorSoft: "#ebe3f5", icon: "\u2661",
    forLabels: ["HR"],
    bullets: ["Värdecheckar i batch", "Skatteklassificering klar", "Export till lön"],
    metric: { v: "0 min", l: "logistik" },
  },
  {
    id: "engage", name: "Engage",
    tagline: "Kampanjsidor med kuponger via SMS.",
    color: "#f5b6a8", colorSoft: "#fcebe5", icon: "\u25B0",
    forLabels: ["Marknad", "FMCG"],
    bullets: ["Egna kampanjsidor", "A/B-test av erbjudande", "Integrerad mätning"],
    metric: { v: "2x", l: "konverteringsgrad" },
  },
  {
    id: "send-a-gift", name: "Send a gift",
    tagline: "Ge bort ett urval av Sveriges bästa varumärken.",
    color: "#ffd6a8", colorSoft: "#fff3e1", icon: "\u2756",
    forLabels: ["HR", "Drift"],
    bullets: ["Mottagaren väljer", "Smakfull presentation", "Alltid aktuellt sortiment"],
    metric: { v: "4,7/5", l: "mottagarnöjdhet" },
  },
  {
    id: "clearing", name: "Clearing Solutions",
    tagline: "Clearing-infra för hela kedjan.",
    color: "var(--clr-navy-soft)", colorSoft: "#e6ebf5", icon: "\u25A4",
    forLabels: ["CFO", "VD"],
    bullets: ["Anslut kedjan på dagar", "Säker och auditerbar", "Alla värdebärare i ett flöde"],
    metric: { v: "99,8%", l: "tillförlitlighet" },
  },
];

const filters = [
  { id: "alla", label: "Alla produkter" },
  { id: "marknad", label: "Marknad & Sälj" },
  { id: "hr", label: "HR & Personal" },
  { id: "drift", label: "Kundtjänst" },
  { id: "fmcg", label: "FMCG" },
  { id: "cfo", label: "CFO" },
];

export function ProductExplorer() {
  const { track } = useSignal();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("alla");

  const filtered = PRODUCTS.filter(p => {
    if (filter === "alla") return true;
    const labelMap: Record<string, string[]> = {
      marknad: ["Marknad"], hr: ["HR"], drift: ["Drift"], fmcg: ["FMCG"], cfo: ["CFO", "VD"],
    };
    return p.forLabels.some(l => (labelMap[filter] || []).some(fl => l.includes(fl)));
  });

  return (
    <section id="produkter" style={{ padding: "120px 0" }}>
      <div className="c-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
          <div>
            <div className="c-eyebrow" style={{ marginBottom: 14 }}>Hela produktfamiljen</div>
            <h2 className="c-h2" style={{ maxWidth: 680 }}>En plattform,<br/>åtta tjänster.</h2>
          </div>
          <p className="c-body" style={{ maxWidth: 360 }}>
            Filtrera efter roll för att se vad som passar just dig. Klicka för att läsa mer.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "8px 14px",
                background: filter === f.id ? "var(--clr-navy)" : "transparent",
                color: filter === f.id ? "#fff" : "var(--clr-ink-2)",
                border: `1px solid ${filter === f.id ? "var(--clr-navy)" : "var(--clr-line)"}`,
                borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >{f.label}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map(p => (
            <div
              key={p.id}
              style={{
                background: "var(--clr-surface)",
                border: "1px solid var(--clr-line)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
                transition: "all 0.25s var(--ease-out)",
                gridColumn: expanded === p.id ? "span 2" : "span 1",
              }}
            >
              <div style={{ padding: 28, cursor: "pointer" }} onClick={() => {
                setExpanded(expanded === p.id ? null : p.id);
                track(expanded === p.id ? "product:hover" : "product:expand", { id: p.name });
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "var(--r-sm)",
                    background: p.colorSoft, color: p.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, fontWeight: 700,
                  }}>{p.icon}</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", fontFamily: "var(--font-display)" }}>{p.metric.v}</div>
                    <div style={{ fontSize: 11, color: "var(--clr-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{p.metric.l}</div>
                  </div>
                </div>

                <h3 className="c-h3" style={{ marginBottom: 8 }}>{p.name}</h3>
                <p className="c-body" style={{ color: "var(--clr-ink-2)", marginBottom: 16 }}>{p.tagline}</p>

                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                  <span style={{ color: "var(--clr-green-dark)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {expanded === p.id ? "Visa mindre" : "Läs mer"}
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: expanded === p.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <span style={{ color: "var(--clr-line)" }}>&middot;</span>
                  <a href={`/${p.id}`} onClick={(e) => { e.stopPropagation(); track("product:cta", { id: p.name }); }}
                     style={{ color: "var(--clr-green)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Öppna produktsida &rarr;
                  </a>
                </div>
              </div>

              {expanded === p.id && (
                <div style={{ padding: "0 28px 28px" }}>
                  <div style={{ height: 1, background: "var(--clr-line)", margin: "0 0 24px" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div className="c-eyebrow" style={{ marginBottom: 10 }}>Nyckelpunkter</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {p.bullets.map((b, i) => (
                          <li key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14, color: "var(--clr-ink-2)" }}>
                            <span style={{ color: p.color, fontWeight: 700 }}>&rarr;</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="c-eyebrow" style={{ marginBottom: 10 }}>Passar bäst för</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {p.forLabels.map(r => (
                          <span key={r} className="c-chip" style={{ fontSize: 12 }}>{r}</span>
                        ))}
                      </div>
                      <a
                        href={`/${p.id}`}
                        onClick={() => track("product:cta", { id: p.name })}
                        className="c-btn c-btn--primary"
                        style={{ marginTop: 20, fontSize: 13, padding: "10px 16px" }}
                      >
                        Öppna produktsida &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
