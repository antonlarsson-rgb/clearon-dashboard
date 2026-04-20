"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const QUIZ_QS = [
  {
    id: "dept",
    q: "Vem ar du pa din sida?",
    opts: [
      { v: "marketing", label: "Marknad / Brand", weight: { gamify: 3, reward: 2 } },
      { v: "crm", label: "CRM / Loyalty", weight: { winback: 3, reward: 2 } },
      { v: "cx", label: "Kundtjanst / CX", weight: { complaint: 3 } },
      { v: "hr", label: "HR / People", weight: { staff: 3 } },
      { v: "data", label: "Data / Digital", weight: { consent: 3 } },
      { v: "growth", label: "Tillvaxt / Salj", weight: { acquisition: 3, gamify: 1 } },
    ],
  },
  {
    id: "goal",
    q: "Vad vill du uppna narmaste kvartalet?",
    opts: [
      { v: "new", label: "Hitta nya kunder", weight: { acquisition: 3, gamify: 2 } },
      { v: "activate", label: "Aktivera sovande kunder", weight: { winback: 3, reward: 1 } },
      { v: "engage", label: "Gora befintliga glada", weight: { reward: 3, complaint: 1 } },
      { v: "consent", label: "Hoja consent / svar pa enkat", weight: { consent: 3 } },
      { v: "staff", label: "Se personalen battre", weight: { staff: 3 } },
    ],
  },
  {
    id: "volume",
    q: "Hur manga vill du na?",
    opts: [
      { v: "s", label: "Under 1 000", weight: { staff: 2, complaint: 2 } },
      { v: "m", label: "1 000 - 10 000", weight: { winback: 2, reward: 2, consent: 1 } },
      { v: "l", label: "10 000 - 100 000", weight: { gamify: 2, acquisition: 2, consent: 2 } },
      { v: "xl", label: "Fler an 100 000", weight: { acquisition: 3, gamify: 2 } },
    ],
  },
  {
    id: "reward",
    q: "Vilken typ av beloning kanns ratt?",
    opts: [
      { v: "free", label: "En specifik produkt (glass, kaffe, havredryck)", weight: { gamify: 2, reward: 2 } },
      { v: "cash", label: "En vardecheck i kronor", weight: { staff: 2, acquisition: 2, complaint: 2 } },
      { v: "either", label: "Bada / vet inte", weight: { reward: 1 } },
    ],
  },
];

const QUIZ_RESULTS: Record<string, { title: string; desc: string; product: string; pageLabel: string }> = {
  gamify: {
    title: "Gamifierad kampanj",
    desc: "Ni vill engagera en storre malgrupp med nagot roligt. Skraplotter, lyckohjul eller kalender gor jobbet, alla vinner nagot, och beloningen ar alltid inlosbar i butik.",
    product: "kuponger", pageLabel: "Digitala kuponger & spel",
  },
  acquisition: {
    title: "Acquisition-kampanj",
    desc: "Anvand maten som havstang. ICA-check pa kopet ar ofta det som avgor nar er egen produkt ar abstrakt (el, forsakring, mobilabonnemang).",
    product: "engage", pageLabel: "Varumarkeskampanjer",
  },
  winback: {
    title: "CRM-reaktivering",
    desc: "Ni har en sovande bas. SMS-kupong med en specifik, tidsatt beloning har hogst oppningsgrad av alla kanaler.",
    product: "kuponger", pageLabel: "Kundklubb & lojalitet",
  },
  consent: {
    title: "Consent-beloning",
    desc: "Hoj cookie-acceptans eller enkatsvar genom att erbjuda riktigt varde. En 20-kronor till Apoteket slar vanlig consent-banner gang pa gang.",
    product: "kuponger", pageLabel: "Digitala kuponger",
  },
  complaint: {
    title: "Kundtjanst-plaster",
    desc: "Nar nagot gar fel, skicka en kupong i chatten. Farre negativa omdomen, snabbare arendelosning, mottagaren kannar sig sedd.",
    product: "customer-care", pageLabel: "SMS-vardecheckar",
  },
  staff: {
    title: "Personalbeloning",
    desc: "Spontan erkansla slar arlig bonus. En 100-krona nar nagon gjort nagot bra, fungerar i dagligvaruhandeln, inga fakturor, inga lagerbeslut.",
    product: "personalbeloning", pageLabel: "Beloningar & lojalitet",
  },
  reward: {
    title: "Oppen reward-setup",
    desc: "Ni vet att ni vill belona, men ar inte sakra pa hur. Borja med en liten pilot: 500 mottagare, en specifik mekanik, mat resultatet, skala upp.",
    product: "kuponger", pageLabel: "Digitala kuponger",
  },
};

export function FitQuiz() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const { track } = useSignal();

  const pick = (opt: typeof QUIZ_QS[0]["opts"][0]) => {
    const newScores = { ...scores };
    for (const [k, v] of Object.entries(opt.weight)) {
      newScores[k] = (newScores[k] || 0) + v;
    }
    setScores(newScores);
    track("quiz:answer", { step, value: opt.v });
    if (step < QUIZ_QS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0]?.[0] || "reward";
      track("quiz:result", { segment: winner });
    }
  };

  const reset = () => { setStep(0); setScores({}); setDone(false); };
  const winnerKey = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "reward";
  const winner = QUIZ_RESULTS[winnerKey] || QUIZ_RESULTS.reward;

  return (
    <section id="quiz" style={{ padding: "96px 0", background: "var(--clr-surface)" }}>
      <div className="c-container">
        <div style={{ maxWidth: 720, marginBottom: 40 }}>
          <div className="c-eyebrow" style={{ marginBottom: 16 }}>04 &middot; Hitta ratt</div>
          <h2 className="c-h2" style={{ marginBottom: 16 }}>
            Vilken ClearOn-losning passar just er?
          </h2>
          <p className="c-body-lg">
            Fyra fragor. Ingen e-post. En rekommendation.
          </p>
        </div>

        <div style={{
          maxWidth: 760, background: "var(--clr-beige)",
          border: "1px solid var(--clr-line)",
          borderRadius: "var(--r-lg)",
          padding: 36,
        }}>
          {!done ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                {QUIZ_QS.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i < step ? "var(--clr-green)" : i === step ? "var(--clr-green-soft)" : "var(--clr-line)",
                  }} />
                ))}
              </div>
              <div className="c-eyebrow" style={{ marginBottom: 12 }}>Fraga {step + 1} / {QUIZ_QS.length}</div>
              <h3 className="c-h3" style={{ marginBottom: 24, fontSize: 26 }}>{QUIZ_QS[step].q}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {QUIZ_QS[step].opts.map(o => (
                  <button key={o.v} onClick={() => pick(o)} style={{
                    padding: "18px 20px",
                    background: "var(--clr-surface)",
                    border: "1.5px solid var(--clr-line)",
                    borderRadius: "var(--r-sm)",
                    fontSize: 14, fontWeight: 500, textAlign: "left", cursor: "pointer",
                    transition: "all 0.15s var(--ease-out)",
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--clr-green)";
                      e.currentTarget.style.background = "var(--clr-green-tint)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--clr-line)";
                      e.currentTarget.style.background = "var(--clr-surface)";
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} style={{
                  marginTop: 20, background: "transparent", border: "none",
                  fontSize: 13, color: "var(--clr-muted)", cursor: "pointer", textDecoration: "underline",
                }}>&larr; Foregaende</button>
              )}
            </>
          ) : (
            <div>
              <div className="c-eyebrow" style={{ marginBottom: 10 }}>Var rekommendation</div>
              <h3 className="c-h3" style={{ marginBottom: 16, fontSize: 32 }}>{winner.title}</h3>
              <p className="c-body-lg" style={{ marginBottom: 28 }}>{winner.desc}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={`/${winner.product}`} className="c-btn c-btn--primary"
                  onClick={() => track("quiz:cta", { product: winner.product })}>
                  Utforska {winner.pageLabel} &rarr;
                </a>
                <button onClick={reset} className="c-btn c-btn--ghost">
                  Gor om quizet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
