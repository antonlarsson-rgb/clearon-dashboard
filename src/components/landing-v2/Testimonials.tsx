"use client";

import { useState, useEffect, useCallback } from "react";

const TESTIMONIALS = [
  {
    quote:
      "Vardecheckarna ar enkla att hantera och ger guldkant pa vardagen for mottagaren. Vi har halverat var administration for personalbeloning.",
    name: "Lina Arwidsson",
    title: "HR-chef, Vision",
    avatar: "LA",
  },
  {
    quote:
      "ClearOn gav oss full sparbarhet fran kampanj till kassa. Vi ser exakt vilka butiker som presterar bast och kan optimera i realtid.",
    name: "Erik Johansson",
    title: "Trade Marketing Manager, Orkla",
    avatar: "EJ",
  },
  {
    quote:
      "Interactive Engage okade var forsaljning med 16% utover vad en vanlig kupongkampanj ger. Spelmekaniken skapar ett engagemang vi aldrig sett forut.",
    name: "Sara Lindqvist",
    title: "Marknadschef, Axfood",
    avatar: "SL",
  },
  {
    quote:
      "Att kunna skicka digital kompensation direkt i kundtjanstsamtalet har forandrat hur vi hanterar klagomal. 70% av kunderna stannar kvar.",
    name: "Marcus Berg",
    title: "Kundtjanstchef, Telia",
    avatar: "MB",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--clr-cl-surface)",
      }}
    >
      <div className="c-container" style={{ maxWidth: 700 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Kundrosterna
          </div>
          <h2 className="c-h2">Vad vara kunder sager</h2>
        </div>

        <div
          style={{
            background: "var(--clr-surface-alt)",
            borderRadius: "var(--r-lg)",
            padding: "40px 32px",
            textAlign: "center",
            position: "relative",
            minHeight: 200,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--clr-green)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-open-sans), sans-serif",
              fontWeight: 700,
              fontSize: 16,
              margin: "0 auto 20px",
            }}
          >
            {TESTIMONIALS[active].avatar}
          </div>
          <p
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 17,
              fontStyle: "italic",
              color: "var(--clr-ink)",
              lineHeight: 1.7,
              maxWidth: 540,
              margin: "0 auto 20px",
            }}
          >
            &ldquo;{TESTIMONIALS[active].quote}&rdquo;
          </p>
          <div
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--clr-green-deep)",
            }}
          >
            {TESTIMONIALS[active].name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 12,
              color: "var(--clr-muted)",
              marginTop: 2,
            }}
          >
            {TESTIMONIALS[active].title}
          </div>
        </div>

        {/* Dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 20,
          }}
        >
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: active === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  active === i
                    ? "var(--clr-green)"
                    : "var(--clr-line)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s var(--ease-out)",
              }}
              aria-label={`Visa omdome ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
