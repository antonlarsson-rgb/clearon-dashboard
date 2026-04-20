"use client";

import { useState, useEffect } from "react";
import { useSignal } from "./SignalProvider";

const items = [
  {
    quote: "Värdecheckarna är enkla att hantera och ger guldkant på vardagen för mottagaren.",
    author: "Lina Arwidsson",
    role: "Kommunikationsstrateg, Vision",
    accent: "var(--clr-teal)",
  },
  {
    quote: "Vi kompenserar drabbade kunder inom minuter istället för dagar. NPS-kurvan vände helt.",
    author: "Marcus Ek",
    role: "Head of Customer Service, Retail Nord",
    accent: "var(--clr-coral)",
  },
  {
    quote: "Under Black Week skickade vi 280 000 kuponger. Inlösen låg på 34%, tre gånger vår print-kampanj.",
    author: "Sara Lindqvist",
    role: "Campaign Lead, FMCG-varumärke",
    accent: "var(--clr-yellow)",
  },
  {
    quote: "Personalbelöningen gick från en logistikmardröm till ett knapptryck. Fantastiskt.",
    author: "Johanna Berg",
    role: "HR-chef, Serviceföretag",
    accent: "var(--clr-lime)",
  },
];

const arrowBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: "50%",
  background: "transparent", border: "1px solid var(--clr-line)",
  color: "var(--clr-ink)", cursor: "pointer", fontSize: 16,
};

export function Testimonials() {
  const { track } = useSignal();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx(i => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="kundcase" style={{ padding: "120px 0" }}>
      <div className="c-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
          <div>
            <div className="c-eyebrow" style={{ marginBottom: 14 }}>Kundcase</div>
            <h2 className="c-h2">Vad kunder<br/>säger om oss.</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setIdx((idx - 1 + items.length) % items.length); track("module:engage", { id: "testimonial-prev" }); }} style={arrowBtn}>&larr;</button>
            <button onClick={() => { setIdx((idx + 1) % items.length); track("module:engage", { id: "testimonial-next" }); }} style={arrowBtn}>&rarr;</button>
          </div>
        </div>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "var(--r-xl)" }}>
          <div style={{ display: "flex", transform: `translateX(-${idx * 100}%)`, transition: "transform 0.6s var(--ease-out)" }}>
            {items.map((it, i) => (
              <div key={i} style={{ minWidth: "100%", padding: "60px 72px", background: "var(--clr-surface)", border: "1px solid var(--clr-line)", borderRadius: "var(--r-xl)" }}>
                <div style={{ fontSize: 48, color: it.accent, marginBottom: 20, lineHeight: 0.5 }}>&ldquo;</div>
                <blockquote style={{
                  margin: 0, fontSize: "clamp(24px, 2.6vw, 36px)",
                  fontFamily: "var(--font-display)", fontWeight: 500,
                  letterSpacing: "-0.02em", lineHeight: 1.25, maxWidth: 880,
                  marginBottom: 32,
                }}>
                  {it.quote}
                </blockquote>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: it.accent, opacity: 0.3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "var(--clr-navy)",
                  }}>{it.author.split(" ").map(w => w[0]).join("")}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.author}</div>
                    <div style={{ fontSize: 13, color: "var(--clr-muted)" }}>{it.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 24, justifyContent: "center" }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
              background: i === idx ? "var(--clr-navy)" : "var(--clr-line)",
              border: "none", cursor: "pointer", transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}
