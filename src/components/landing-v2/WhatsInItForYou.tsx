"use client";

const MARKNAD = {
  title: "För marknadschefen",
  sub: "Marknadschefer och marknadsförare i dagligvaruhandeln",
  accentBar: "var(--clr-green)",
    bullets: [
    {
      headline: "Starkare varumärkesbyggande i kampanjerna",
      body: "Belöningar som känns i vardagen stärker varumärket utan att offra mätbarhet.",
    },
    {
      headline: "Mer first-party data ni äger",
      body: "Consent, klick och inlösen blir mätbart hela vägen. Slut på att gissa.",
    },
    {
      headline: "Tydligare effekt på aktiveringar",
      body: "Se hur branding och aktivering hänger ihop från första klick till inlösen.",
    },
  ],
};

const BYRA = {
  title: "För mediabyrån",
  sub: "Mediabyråer med kunder i dagligvaruhandeln",
  accentBar: "var(--clr-yellow-accent)",
  bullets: [
    {
      headline: "Mer effekt per kampanjbudget",
      body: "En mekanik som driver inlösen, inte bara visningar och klick.",
    },
    {
      headline: "Starkare case mot kund",
      body: "Färdig infrastruktur. Visa hela funneln, från exponering till transaktion.",
    },
    {
      headline: "Branding som blir konvertering",
      body: "Koppla varumärkesbyggande till mätbar konvertering i butik.",
    },
  ],
};

export function WhatsInItForYou() {
  return (
    <section id="for-er" style={{ padding: "120px 0", background: "#fff", borderTop: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>För er</div>
          <h2 className="c-h2" style={{ marginBottom: 20 }}>
            Vad ni får ut.
          </h2>
          <p className="c-body-lg" style={{ color: "var(--clr-ink-2)" }}>
            Två roller, samma plattform.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }} className="wiify-grid">
          <AudienceCard data={MARKNAD} />
          <AudienceCard data={BYRA} />
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .wiify-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

type AudienceCardProps = {
  data: typeof MARKNAD;
};

function AudienceCard({ data }: AudienceCardProps) {
  return (
    <div style={{
      background: "var(--clr-surface-alt)",
      border: "1px solid var(--clr-line)",
      borderRadius: "var(--r-lg)",
      padding: 36,
      display: "flex", flexDirection: "column", gap: 28,
      borderTop: `4px solid ${data.accentBar}`,
    }}>
      <div>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24, fontWeight: 700,
          color: "var(--clr-ink)",
          letterSpacing: "-0.015em",
          marginBottom: 6,
          lineHeight: 1.2,
        }}>{data.title}</h3>
        <div style={{ fontSize: 14, color: "var(--clr-muted)" }}>{data.sub}</div>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 22 }}>
        {data.bullets.map((b) => (
          <li key={b.headline} style={{
            paddingBottom: 18,
            borderBottom: "1px solid var(--clr-line)",
          }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: 17,
              color: "var(--clr-ink)",
              marginBottom: 6,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}>
              {b.headline}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--clr-ink-2)" }}>
              {b.body}
            </div>
          </li>
        ))}
      </ul>

      <div style={{
        fontSize: 13, color: "var(--clr-muted)",
        fontStyle: "italic",
      }}>
        Samma plattform, samma butiksnätverk.
      </div>
    </div>
  );
}
