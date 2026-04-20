"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const USECASES = [
  {
    id: "elbolag", category: "Acquisition", who: "Svenskt elbolag",
    problem: "Prenumerationer i elbranschen ar emotionellt tomma, priset avgor och Prisjakt vinner.",
    solution: "Varje ny prenumerant fick 500 kr vardecheck att anvanda pa ICA. Kampanjen kordes i 8 veckor via Meta + display.",
    result: ["42% hogre conversion rate vs kontrollgrupp", "ROI 3,2x pa kampanjbudget", "28% lagre churn forsta 90 dagarna"],
    accent: "var(--clr-yellow)",
  },
  {
    id: "telecom-cx", category: "Customer Service", who: "Telekom-operator",
    problem: "Arga kunder i chatten, negativa Trustpilot-omdomen, samre acquisition.",
    solution: "Kundtjanst fick ett verktyg for att skicka kupong direkt i chatten vid nedtid eller leveransproblem. 50 kr - 200 kr beroende pa arende.",
    result: ["+38 punkter NPS-lyft hos kompenserade", "Genomsnittlig arendetid sjunk 22%", "Trustpilot-score steg fran 3,4 till 4,1 pa ett ar"],
    accent: "var(--clr-orange)",
  },
  {
    id: "saas-consent", category: "Consent & Data", who: "Svenskt SaaS-bolag",
    problem: "Cookie-consent-raten lag pa 42%. Marknadsteamet flog blint pa analytics.",
    solution: "Ersatte standard-consent med en \"Sag ja till cookies, fa 20 kr pa Apoteket\"-variant. Beloningen triggades vid aktivt ja.",
    result: ["Consent-rate 42% till 78% pa 6 veckor", "Kostnad per ja: 14 kr", "Attributionsdata blev anvandbar igen"],
    accent: "var(--clr-lime)",
  },
  {
    id: "hr-reward", category: "Internal", who: "Butikskedja med 1 200 anstallda",
    problem: "\"Manadens medarbetare\" med en kaka i fikarummet kannes pliktskyldig. Vardecheckar via lon var byrakratiskt.",
    solution: "Chefer fick en budget att dela ut ClearOn-kuponger spontant via SMS. 100-500 kr, fungerade i matbutik, restaurang, cafe.",
    result: ["eNPS steg fran 6 till 32 pa 9 manader", "93% av cheferna anvander verktyget minst varannan vecka", "\"Jag kande mig sedd\", vanligaste citatet i medarbetarenkat"],
    accent: "var(--clr-teal)",
  },
  {
    id: "fmcg-winback", category: "CRM", who: "Mejerikoncern, ledande varumarke",
    problem: "CRM-bas pa 180 000, varav 60% inte klickat pa mejl pa 6+ manader.",
    solution: "Reaktiveringskampanj: \"Valkommen tillbaka, gratis produkt pa huset\" via SMS till inaktiva. Ingen fraga om varfor de slutat handla.",
    result: ["24% SMS-oppningsgrad, 11% inlosen", "68% av de som loste in handlade igen inom 30 dagar", "ROI 4,7x"],
    accent: "var(--clr-coral)",
  },
  {
    id: "retail-loyalty", category: "Retail", who: "Dagligvarukedja, medlemsprogram",
    problem: "Nya medlemmar, manga registrerade sig aldrig pa appen efter skyltfonsterarvning.",
    solution: "Vid kassan: \"Bli medlem, fa en gratis glass nu.\" Kupong digitalt till telefonen, in i appen direkt.",
    result: ["3,1x fler medlemsregistreringar vid kassan", "Av dessa: 61% aktiverade appen samma dag", "Genomsnittlig LTV-okning 22% vs kontrollgrupp"],
    accent: "var(--clr-lilac)",
  },
];

export function UseCases() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { track } = useSignal();

  return (
    <section id="cases" style={{ padding: "96px 0", background: "var(--clr-bg)" }}>
      <div className="c-container">
        <div style={{ maxWidth: 720, marginBottom: 48 }}>
          <div className="c-eyebrow" style={{ marginBottom: 16 }}>03 &middot; Riktiga kampanjer</div>
          <h2 className="c-h2" style={{ marginBottom: 16 }}>
            Sex satt foretag faktiskt anvander ClearOn.
          </h2>
          <p className="c-body-lg">
            Fran elbolag till HR-team. Siffrorna ar fran anonymiserade kampanjer under 2023 och 2024.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
          {USECASES.map(uc => (
            <UseCaseCard
              key={uc.id}
              uc={uc}
              expanded={expanded === uc.id}
              onToggle={() => {
                const next = expanded === uc.id ? null : uc.id;
                setExpanded(next);
                if (next) track("usecase:open", { id: uc.id, category: uc.category });
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .usecase-expanded-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

function UseCaseCard({ uc, expanded, onToggle }: {
  uc: typeof USECASES[0]; expanded: boolean; onToggle: () => void;
}) {
  return (
    <div style={{
      background: "var(--clr-surface)",
      border: "1px solid var(--clr-line)",
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
      gridColumn: expanded ? "1 / -1" : "auto",
      transition: "all 0.25s var(--ease-out)",
    }}>
      <button onClick={onToggle} style={{
        width: "100%", background: "transparent", border: "none", padding: 28,
        textAlign: "left", cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "start", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "var(--r-sm)",
            background: uc.accent,
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div className="c-eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>{uc.category}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-ink)", marginBottom: 6 }}>{uc.who}</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18"
            style={{ transform: expanded ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 4 }}>
            <path d="M9 3v12M3 9h12" stroke="var(--clr-green-dark)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, color: "var(--clr-ink-2)", lineHeight: 1.5, margin: 0 }}>
          <strong style={{ color: "var(--clr-ink)" }}>Problem:</strong> {uc.problem}
        </p>
      </button>

      {expanded && (
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ height: 1, background: "var(--clr-line)", margin: "0 0 24px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }} className="usecase-expanded-grid">
            <div>
              <div className="c-eyebrow" style={{ marginBottom: 10 }}>Problem</div>
              <p className="c-body" style={{ fontSize: 15 }}>{uc.problem}</p>
            </div>
            <div>
              <div className="c-eyebrow" style={{ marginBottom: 10 }}>ClearOn-losningen</div>
              <p className="c-body" style={{ fontSize: 15 }}>{uc.solution}</p>
            </div>
            <div>
              <div className="c-eyebrow" style={{ marginBottom: 10 }}>Resultat</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {uc.result.map((r, i) => (
                  <li key={i} style={{
                    display: "flex", gap: 10, fontSize: 14, color: "var(--clr-ink)",
                    fontWeight: 500, marginBottom: 10, lineHeight: 1.4,
                  }}>
                    <span style={{ color: "var(--clr-green)", fontWeight: 700 }}>&#x2713;</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
