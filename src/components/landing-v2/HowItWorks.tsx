"use client";

const steps = [
  { n: "01", title: "Du bygger kampanjen", body: "I Kundportalen väljer du mottagare, utformning och erbjudande. Skräddarsytt från minut ett.", icon: "\u25B1" },
  { n: "02", title: "Mottagaren får SMS", body: "Ett SMS med en länk. Mottagaren öppnar värdebäraren direkt i mobilen, inget konto, ingen app.", icon: "\u2709" },
  { n: "03", title: "Inlöses i butik", body: "Scannas i kassan i någon av 5 000+ anslutna butiker. Fungerar på all dagligvaru- och servicehandel.", icon: "\u25C9" },
  { n: "04", title: "Clearing sker automatiskt", body: "Vi clearar betalningen mellan butik, kedja och varumärke. Du får realtidsrapport på alla transaktioner.", icon: "\u21CC" },
];

export function HowItWorks() {
  return (
    <section id="hur" style={{ padding: "120px 0" }}>
      <div className="c-container">
        <div style={{ marginBottom: 56, maxWidth: 680 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>Så fungerar det</div>
          <h2 className="c-h2">Fyra steg från<br/>kampanj till kassa.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2, background: "var(--clr-line)", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--clr-line)" }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: "var(--clr-surface)", padding: 32, minHeight: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--clr-muted)", letterSpacing: "0.08em" }}>{s.n}</span>
                <span style={{ fontSize: 32, color: "var(--clr-teal)" }}>{s.icon}</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 12 }}>{s.title}</h3>
              <p className="c-body" style={{ fontSize: 15, color: "var(--clr-ink-2)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
