"use client";

const STEPS = [
  {
    num: "01",
    title: "Bygg kampanjen",
    desc: "Valj produkt, malgrupp och erbjudande. Skapa kampanjsida eller koppla till befintlig kanal.",
    icon: "🛠",
  },
  {
    num: "02",
    title: "Skicka via SMS",
    desc: "Distribuera kupongen direkt till kundens telefon. Personligt, direkt, olasbart.",
    icon: "📱",
  },
  {
    num: "03",
    title: "Kunden loser in",
    desc: "Kunden visar kupong i kassan. Fungerar i 5 000+ butiker med 20 000 anslutna kassor.",
    icon: "🏪",
  },
  {
    num: "04",
    title: "Automatisk clearing",
    desc: "ClearOn hanterar avrakning, rapportering och uppfoljning. Ni far data i realtid.",
    icon: "📊",
  },
];

export function HowItWorks() {
  return (
    <section
      id="hur-det-fungerar"
      style={{
        padding: "80px 0",
        background: "var(--clr-cl-surface)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Process
          </div>
          <h2 className="c-h2">Sa fungerar det</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 480,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            Fran ide till inlost kupong pa under en timme.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
            maxWidth: 960,
            margin: "0 auto",
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ position: "relative" }}>
              <div
                className="c-card"
                style={{
                  textAlign: "center",
                  padding: "32px 24px",
                  height: "100%",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                  {step.icon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--clr-green)",
                    marginBottom: 8,
                    letterSpacing: "0.1em",
                  }}
                >
                  STEG {step.num}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-open-sans), sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--clr-ink)",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-open-sans), sans-serif",
                    fontSize: 13,
                    color: "var(--clr-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </p>
              </div>
              {/* Arrow between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className="step-arrow"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: -16,
                    transform: "translateY(-50%)",
                    color: "var(--clr-line)",
                    fontSize: 20,
                    zIndex: 2,
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 880px) {
            .step-arrow { display: none !important; }
          }
        `}</style>
      </div>
    </section>
  );
}
