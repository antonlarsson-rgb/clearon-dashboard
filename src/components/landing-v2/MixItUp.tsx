"use client";

import React from "react";

const MIXES = [
  {
    name: "Den spelifierade consent-kampanjen",
    flow: ["Spel & kampanj", "Incitament"],
    story: "Besokare spinner lyckohjul, ger e-post + consent, far kupong via SMS. Tva mekaniker, ett flode.",
  },
  {
    name: "Support-till-NPS-loopen",
    flow: ["Kundvard", "Incitament"],
    story: "Lost supportarende triggar kompensation, 72 h senare skickas ny kampanjkupong till samma kund.",
  },
  {
    name: "Medarbetare + kund i samma program",
    flow: ["Personalbeloning", "Kundvard"],
    story: "Butikspersonal far bonus nar de fangar NPS-svar. Missnojda kunder far glass-kupong direkt.",
  },
];

export function MixItUp() {
  return (
    <section style={{ padding: "120px 0", background: "#fff", borderTop: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }} className="mix-grid">
          <div>
            <div className="c-eyebrow" style={{ marginBottom: 14 }}>Plattformens styrka</div>
            <h2 className="c-h2" style={{ marginBottom: 20 }}>
              Mixa<br/>som ni vill.
            </h2>
            <p className="c-body" style={{ color: "var(--clr-ink-2)", marginBottom: 16 }}>
              Ni ar inte lasta till en paketering. Samma infrastruktur, samma kupongmotor, samma butiksnatverk, anvands for flera affarer parallellt.
            </p>
            <p className="c-body" style={{ color: "var(--clr-ink-2)" }}>
              Har ar tre exempel pa hur paketeringar kombineras i verkliga kundfloden.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {MIXES.map((m, i) => (
              <div key={i} style={{
                padding: 28,
                background: "var(--clr-surface-alt)",
                border: "1px solid var(--clr-line)",
                borderRadius: "var(--r-md)",
              }}>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--clr-muted)", letterSpacing: "0.1em", marginBottom: 10 }}>
                  MIX {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 12 }}>{m.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  {m.flow.map((step, j) => (
                    <React.Fragment key={j}>
                      <span style={{
                        fontSize: 12, padding: "4px 12px",
                        background: "#fff", border: "1px solid var(--clr-line)",
                        borderRadius: "var(--r-pill)", fontWeight: 500,
                      }}>{step}</span>
                      {j < m.flow.length - 1 && (
                        <span style={{ color: "var(--clr-muted)", fontSize: 14 }}>&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p style={{ fontSize: 14, color: "var(--clr-ink-2)", lineHeight: 1.55, margin: 0 }}>{m.story}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 880px) {
            .mix-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>
      </div>
    </section>
  );
}
