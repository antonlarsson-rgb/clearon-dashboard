"use client";

const STEPS = [
  {
    n: "01",
    title: "Fånga",
    body: "Annons, sajt, kassakvitto, sociala medier eller kundtjänstärende. Möt mottagaren där hen redan är.",
    accent: "var(--clr-lime)",
  },
  {
    n: "02",
    title: "Engagera",
    body: "Lyckohjul, skraplott eller quiz - eller en glass direkt på mailen. Välj mekanik efter tillfälle.",
    accent: "var(--clr-yellow-accent)",
  },
  {
    n: "03",
    title: "Belöna",
    body: "Kupong eller värdecheck via SMS. Direkt i mobilen, ingen app.",
    accent: "var(--clr-orange)",
  },
  {
    n: "04",
    title: "Driv till köp",
    body: "Lös in i 5 000+ butiker. Affärseffekt direkt i kassan.",
    accent: "var(--clr-green)",
  },
];

export function HowItWorks() {
  return (
    <section id="hur" style={{ padding: "120px 0", background: "var(--clr-surface-alt)", borderTop: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>Så fungerar det</div>
          <h2 className="c-h2" style={{ marginBottom: 20 }}>
            Från klick<br/>till kassa.
          </h2>
          <p className="c-body-lg" style={{ color: "var(--clr-ink-2)" }}>
            Fyra steg, samma infrastruktur. Data samlas genom hela resan.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div className="data-trail" style={{
            position: "absolute",
            top: 90,
            left: "8%",
            right: "8%",
            height: 1,
            background: "repeating-linear-gradient(to right, var(--clr-green) 0 8px, transparent 8px 16px)",
            zIndex: 0,
          }} />
          <div className="data-trail-label" style={{
            position: "absolute",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            background: "var(--clr-surface-alt)",
            padding: "0 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 10, fontWeight: 700,
            color: "var(--clr-green-deep)",
            letterSpacing: "0.1em",
          }}>+ DATAINSAMLING</div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            position: "relative",
            zIndex: 1,
          }} className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} style={{
                background: "#fff",
                border: "1px solid var(--clr-line)",
                borderTop: `4px solid ${s.accent}`,
                borderRadius: "var(--r-md)",
                padding: "28px 26px",
                display: "flex", flexDirection: "column",
                minHeight: 240,
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 11,
                  color: "var(--clr-muted)", letterSpacing: "0.08em",
                  marginBottom: 14,
                }}>STEG {s.n}</div>

                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 44, fontWeight: 700,
                  lineHeight: 1, color: "var(--clr-ink)",
                  letterSpacing: "-0.03em",
                  marginBottom: 18,
                }}>{s.n}</div>

                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 19, fontWeight: 700,
                  color: "var(--clr-ink)",
                  marginBottom: 10, letterSpacing: "-0.01em",
                  lineHeight: 1.25,
                }}>{s.title}</h3>
                <p style={{
                  fontSize: 14, lineHeight: 1.55, color: "var(--clr-ink-2)",
                }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 28,
          padding: "20px 24px",
          background: "var(--clr-green-soft)",
          borderLeft: "3px solid var(--clr-green)",
          borderRadius: "var(--r-sm)",
          maxWidth: 720,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11, fontWeight: 600,
            color: "var(--clr-green-deep)",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}>
            DATA GENOM HELA RESAN
          </div>
          <div style={{ fontSize: 14, color: "var(--clr-ink)", lineHeight: 1.55 }}>
            Consent, beteende och inlösen blir first-party data ni äger. Använd det i nästa kampanj.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .data-trail, .data-trail-label { display: none !important; }
        }
        @media (max-width: 520px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
