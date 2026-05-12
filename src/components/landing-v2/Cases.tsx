"use client";

import { ArrowRight } from "lucide-react";

type Case = {
  id: string;
  industry: string;
  challenge: string;
  solution: string;
  results: { label: string; value: string }[];
};

/**
 * Tomma platshållare. Kunden levererar riktiga case och siffror separat,
 * dessa exempel visar formatet och kan bytas ut rakt av.
 */
const PLACEHOLDER_CASES: Case[] = [
  {
    id: "case-1",
    industry: "FMCG",
    challenge: "Låg interaktion trots hög trafik.",
    solution: "Skraplott kopplad till kupong som löses in i butik.",
    results: [
      { label: "Interaktion", value: "Platshållare" },
      { label: "Kuponguttag", value: "Platshållare" },
      { label: "Försäljning", value: "Platshållare" },
    ],
  },
  {
    id: "case-2",
    industry: "Telekom",
    challenge: "Kampanjbudget gav ingen mätbar konvertering.",
    solution: "Kupong som belöning vid prenumerationsstart.",
    results: [
      { label: "Konvertering", value: "Platshållare" },
      { label: "First-party data", value: "Platshållare" },
      { label: "ROAS", value: "Platshållare" },
    ],
  },
  {
    id: "case-3",
    industry: "Fackförbund",
    challenge: "Svårt att engagera kring abstrakt erbjudande.",
    solution: "ICA-check som påtaglig belöning vid byte av tjänst.",
    results: [
      { label: "Lead-volym", value: "Platshållare" },
      { label: "Cookie-consent", value: "Platshållare" },
      { label: "Cost per lead", value: "Platshållare" },
    ],
  },
];

export function Cases() {
  return (
    <section id="cases" style={{ padding: "120px 0", background: "var(--clr-surface-alt)", borderTop: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div className="c-eyebrow" style={{ marginBottom: 14 }}>Inspiration</div>
          <h2 className="c-h2" style={{ marginBottom: 20 }}>
            Utmaning,<br/>lösning, resultat.
          </h2>
          <p className="c-body-lg" style={{ color: "var(--clr-ink-2)" }}>
            Konkreta exempel. Kort, hårt och mätbart.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }} className="cases-grid">
          {PLACEHOLDER_CASES.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>

        <div style={{
          marginTop: 48,
          display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between",
          padding: "28px 32px",
          background: "var(--clr-green-soft)",
          border: "1px solid var(--clr-green)",
          borderRadius: "var(--r-lg)",
        }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 20, fontWeight: 700,
              color: "var(--clr-ink)", marginBottom: 4,
              letterSpacing: "-0.01em",
            }}>
              Vill ni se ett case för er bransch?
            </div>
            <div style={{ fontSize: 14, color: "var(--clr-ink-2)" }}>
              Vi tar fram ett konkret förslag.
            </div>
          </div>
          <a href="#kontakt" className="c-btn c-btn--cta">
            Få ett kampanjförslag
            <ArrowRight size={16} strokeWidth={2} />
          </a>
        </div>

        <div style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "var(--clr-yellow-accent-soft)",
          border: "1px dashed var(--clr-yellow-accent)",
          borderRadius: "var(--r-sm)",
          fontSize: 12, color: "var(--clr-ink-2)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#7a4a10" }}>
            INTERN NOT
          </span>
          Case-siffrorna ovan är platshållare som byts ut när Kaveh levererat riktiga resultat.
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .cases-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .cases-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function CaseCard({ c }: { c: Case }) {
  return (
    <article style={{
      background: "#fff",
      border: "1px solid var(--clr-line)",
      borderRadius: "var(--r-md)",
      padding: 28,
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      <div style={{
        display: "inline-flex", alignSelf: "flex-start",
        padding: "4px 12px",
        background: "var(--clr-green-soft)",
        color: "var(--clr-green-deep)",
        fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
        borderRadius: "var(--r-pill)",
        letterSpacing: "0.05em",
      }}>
        {c.industry.toUpperCase()}
      </div>

      <CaseRow label="Utmaning" body={c.challenge} accent="#b8615a" />
      <CaseRow label="Lösning" body={c.solution} accent="var(--clr-green-deep)" />

      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <span style={{
            width: 3, height: 14,
            background: "var(--clr-yellow-accent)",
            borderRadius: 2,
          }} />
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
            color: "var(--clr-ink)", letterSpacing: "0.04em",
          }}>RESULTAT</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {c.results.map((r) => (
            <li key={r.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: "8px 0",
              borderBottom: "1px solid var(--clr-line-soft)",
            }}>
              <span style={{ fontSize: 13, color: "var(--clr-ink-2)" }}>{r.label}</span>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: 14, color: "var(--clr-muted)",
                fontStyle: "italic",
              }}>{r.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function CaseRow({
  label, body, accent,
}: {
  label: string;
  body: string;
  accent: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <span style={{
          width: 3, height: 14,
          background: accent,
          borderRadius: 2,
        }} />
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
          color: "var(--clr-ink)", letterSpacing: "0.04em",
        }}>{label.toUpperCase()}</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--clr-ink)", margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
