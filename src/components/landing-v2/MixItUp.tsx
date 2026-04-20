"use client";

const MIXES = [
  {
    title: "FMCG-lanseringen",
    desc: "Kombinera Sales Promotion med Interactive Engage for maximal genomslagskraft i butik. Kuponger + gamification ger +46% forsaljningslyft.",
    tags: ["Sales Promotion", "Interactive Engage"],
    color: "var(--clr-green)",
  },
  {
    title: "Kundvards-paketet",
    desc: "Customer Care + Send a Gift. Kompensera kunder direkt via SMS och skicka digitala presentkort som uppfoljning. 70% lojalitetsgrad.",
    tags: ["Customer Care", "Send a Gift"],
    color: "var(--clr-orange)",
  },
  {
    title: "Full-stack-kampanjen",
    desc: "Kampanja + Sales Promotion + Interactive Engage. Bygg landningssida, distribuera kuponger via SMS, lagg till spel for extra engagemang.",
    tags: ["Kampanja", "Sales Promotion", "Interactive Engage"],
    color: "var(--clr-teal)",
  },
];

export function MixItUp() {
  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--clr-surface-alt)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Flexibilitet
          </div>
          <h2 className="c-h2">Mixa som ni vill</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 480,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            Kombinera produkterna efter era behov. Samma infrastruktur, fler
            mojligheter.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            maxWidth: 960,
            margin: "0 auto",
          }}
        >
          {MIXES.map((mix) => (
            <div
              key={mix.title}
              className="c-card"
              style={{
                borderTop: `3px solid ${mix.color}`,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--clr-ink)",
                  marginBottom: 8,
                }}
              >
                {mix.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 14,
                  color: "var(--clr-ink-2)",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {mix.desc}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {mix.tags.map((tag) => (
                  <span key={tag} className="c-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
