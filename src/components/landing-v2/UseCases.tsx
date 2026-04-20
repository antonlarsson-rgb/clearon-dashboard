"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const USE_CASES = [
  {
    id: "elbolag",
    icon: "⚡",
    title: "Energibolag",
    problem: "Hog churn och svart att differentiera sig. Priset ar enda argumentet.",
    solution: "Digitala vardecheckar som kompensation och lojalitetsbeloning via SMS. Automatisk clearing.",
    result: "32% lagre churn bland kompenserade kunder. NPS +18 poang.",
    color: "var(--clr-orange)",
  },
  {
    id: "telecom",
    icon: "📱",
    title: "Telekom",
    problem: "Kundtjanst hanterar tusentals klagomal per manad. Kompensation ar segt och manuellt.",
    solution: "Customer Care: digital kompensation via SMS pa sekunder, direkt i kundtjanstsamtalet.",
    result: "70% av kompenserade kunder forblir lojala. Arenden avslutas 3x snabbare.",
    color: "var(--clr-teal)",
  },
  {
    id: "saas",
    icon: "💻",
    title: "SaaS-bolag",
    problem: "Behover aktivera trial-anvandare och driva konvertering till betalande kunder.",
    solution: "Kampanja + Interactive Engage: gamifierad onboarding med kuponger som beloning.",
    result: "+23% konverteringsgrad fran trial till betalande. CAC sank med 15%.",
    color: "#7B68EE",
  },
  {
    id: "hr",
    icon: "👥",
    title: "HR-avdelningar",
    problem: "Personalbeloning ar administrativt tungt. Blanketter, inkop, logistik.",
    solution: "Send a Gift: digitala presentkort via SMS. Mottagaren valjer sjalv bland 5 000 butiker.",
    result: "31% lagre personalomsattning. 90% av mottagare uppskattade formatet.",
    color: "var(--clr-coral)",
  },
  {
    id: "fmcg",
    icon: "🛒",
    title: "FMCG-varumarken",
    problem: "Lanserar nya produkter men saknar sparbarhet fran kampanj till kassa.",
    solution: "Sales Promotion + Interactive Engage: kuponger i butik med gamification for extra engagemang.",
    result: "+46% forsaljningslyft vid nylansering. Full data fran 20 000 kassor.",
    color: "var(--clr-green)",
  },
  {
    id: "retail",
    icon: "🏬",
    title: "Butikskedjor",
    problem: "Behover effektivisera kupongclearing och fa battre insyn i kampanjresultat.",
    solution: "Clearing Solutions: automatisk avrakning kopplad till kassasystemet.",
    result: "85% mindre manuellt arbete. Realtidsrapportering istallet for manadsvisa avrakningar.",
    color: "var(--clr-navy)",
  },
];

export function UseCases() {
  const { track } = useSignal();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next) {
      track("usecase:open", { usecase: id });
    }
  };

  return (
    <section
      id="kundcase"
      style={{
        padding: "80px 0",
        background: "var(--clr-cl-surface)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Anvandningsomraden
          </div>
          <h2 className="c-h2">Sa anvands ClearOn i praktiken</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 500,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            Fran energibolag till FMCG. Se hur olika branscher anvander vara
            losningar.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {USE_CASES.map((uc) => (
            <div
              key={uc.id}
              className="c-card"
              onClick={() => toggle(uc.id)}
              style={{
                cursor: "pointer",
                borderLeft: `4px solid ${uc.color}`,
                padding: expanded === uc.id ? "24px" : "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{uc.icon}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-open-sans), sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "var(--clr-ink)",
                    }}
                  >
                    {uc.title}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform:
                      expanded === uc.id ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s var(--ease-out)",
                  }}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="var(--clr-muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {expanded === uc.id && (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--clr-orange)",
                          marginBottom: 6,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        Problem
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--clr-ink-2)",
                          lineHeight: 1.5,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        {uc.problem}
                      </p>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--clr-green)",
                          marginBottom: 6,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        Losning
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--clr-ink-2)",
                          lineHeight: 1.5,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        {uc.solution}
                      </p>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--clr-teal)",
                          marginBottom: 6,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        Resultat
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--clr-ink-2)",
                          lineHeight: 1.5,
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      >
                        {uc.result}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
