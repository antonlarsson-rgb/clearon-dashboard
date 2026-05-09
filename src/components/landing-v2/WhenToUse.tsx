"use client";

const TRIGGERS = [
  {
    title: "Produktlanseringar",
    body: "När en lansering ska aktivera, inte bara visa.",
  },
  {
    title: "Kampanjer som ska sticka ut",
    body: "Lekfull mekanik som engagerar och driver inlösen.",
  },
  {
    title: "Samla first-party data",
    body: "Belöning som kvitto för consent och deltagande.",
  },
  {
    title: "Driva trafik till butik",
    body: "Koppla digital aktivering till fysisk inlösen.",
  },
  {
    title: "Säsong och försäljningstoppar",
    body: "Jul, sommar, lansering. Mekanik som fungerar i alla teman.",
  },
  {
    title: "Lojalitet och retention",
    body: "Belöna återkommande kunder med något de använder.",
  },
];

export function WhenToUse() {
  return (
    <section id="nar" style={{ padding: "120px 0", background: "#fff", borderTop: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ marginBottom: 48, maxWidth: 720 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>När det passar</div>
          <h2 className="c-h2" style={{ marginBottom: 20 }}>
            Är det relevant<br/>för er nu?
          </h2>
          <p className="c-body-lg" style={{ color: "var(--clr-ink-2)" }}>
            Sex situationer där ClearOn brukar passa.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }} className="when-grid">
          {TRIGGERS.map((t, i) => (
            <div key={t.title} style={{
              padding: "24px 26px",
              background: "var(--clr-surface-alt)",
              border: "1px solid var(--clr-line)",
              borderLeft: "3px solid var(--clr-green)",
              borderRadius: "var(--r-md)",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11, fontWeight: 600,
                color: "var(--clr-green-deep)",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 17, fontWeight: 700,
                color: "var(--clr-ink)",
                marginBottom: 8,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
              }}>{t.title}</div>
              <div style={{
                fontSize: 14, lineHeight: 1.55, color: "var(--clr-ink-2)",
              }}>{t.body}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .when-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .when-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
