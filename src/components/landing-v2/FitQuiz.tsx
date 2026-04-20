"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const QUIZ_QS = [
  {
    id: "dept",
    q: "Vem är du på din sida?",
    opts: [
      { v: "marketing", label: "Marknad / Brand", weight: { gamify: 3, reward: 2 } },
      { v: "crm", label: "CRM / Loyalty", weight: { winback: 3, reward: 2 } },
      { v: "cx", label: "Kundtjänst / CX", weight: { complaint: 3 } },
      { v: "hr", label: "HR / People", weight: { staff: 3 } },
      { v: "data", label: "Data / Digital", weight: { consent: 3 } },
      { v: "growth", label: "Tillväxt / Sälj", weight: { acquisition: 3, gamify: 1 } },
    ],
  },
  {
    id: "goal",
    q: "Vad vill du uppnå närmaste kvartalet?",
    opts: [
      { v: "new", label: "Hitta nya kunder", weight: { acquisition: 3, gamify: 2 } },
      { v: "activate", label: "Aktivera sovande kunder", weight: { winback: 3, reward: 1 } },
      { v: "engage", label: "Göra befintliga glada", weight: { reward: 3, complaint: 1 } },
      { v: "consent", label: "Höja consent / svar på enkät", weight: { consent: 3 } },
      { v: "staff", label: "Se personalen bättre", weight: { staff: 3 } },
    ],
  },
  {
    id: "volume",
    q: "Hur många vill du nå?",
    opts: [
      { v: "s", label: "Under 1 000", weight: { staff: 2, complaint: 2 } },
      { v: "m", label: "1 000 - 10 000", weight: { winback: 2, reward: 2, consent: 1 } },
      { v: "l", label: "10 000 - 100 000", weight: { gamify: 2, acquisition: 2, consent: 2 } },
      { v: "xl", label: "Fler än 100 000", weight: { acquisition: 3, gamify: 2 } },
    ],
  },
  {
    id: "reward",
    q: "Vilken typ av belöning känns rätt?",
    opts: [
      { v: "free", label: "En specifik produkt (glass, kaffe, havredryck)", weight: { gamify: 2, reward: 2 } },
      { v: "cash", label: "En värdecheck i kronor", weight: { staff: 2, acquisition: 2, complaint: 2 } },
      { v: "either", label: "Båda / vet inte", weight: { reward: 1 } },
    ],
  },
];

const QUIZ_RESULTS: Record<string, { title: string; desc: string; product: string; pageLabel: string }> = {
  gamify: {
    title: "Gamifierad kampanj",
    desc: "Ni vill engagera en större målgrupp med något roligt. Skraplotter, lyckohjul eller kalender gör jobbet, alla vinner något, och belöningen är alltid inlösbar i butik.",
    product: "kuponger", pageLabel: "Digitala kuponger & spel",
  },
  acquisition: {
    title: "Acquisition-kampanj",
    desc: "Använd maten som hävstång. ICA-check på köpet är ofta det som avgör när er egen produkt är abstrakt (el, försäkring, mobilabonnemang).",
    product: "engage", pageLabel: "Varumärkeskampanjer",
  },
  winback: {
    title: "CRM-reaktivering",
    desc: "Ni har en sovande bas. SMS-kupong med en specifik, tidsatt belöning har högst öppningsgrad av alla kanaler.",
    product: "kuponger", pageLabel: "Kundklubb & lojalitet",
  },
  consent: {
    title: "Consent-belöning",
    desc: "Höj cookie-acceptans eller enkätsvar genom att erbjuda riktigt värde. En 20-kronor till Apoteket slår vanlig consent-banner gång på gång.",
    product: "kuponger", pageLabel: "Digitala kuponger",
  },
  complaint: {
    title: "Kundtjanst-plaster",
    desc: "När något går fel, skicka en kupong i chatten. Färre negativa omdömen, snabbare ärendelösning, mottagaren känner sig sedd.",
    product: "customer-care", pageLabel: "SMS-värdecheckar",
  },
  staff: {
    title: "Personalbelöning",
    desc: "Spontan erkänsla slår årlig bonus. En 100-krona när någon gjort något bra, fungerar i dagligvaruhandeln, inga fakturor, inga lagerbeslut.",
    product: "personalbeloning", pageLabel: "Belöningar & lojalitet",
  },
  reward: {
    title: "Öppen reward-setup",
    desc: "Ni vet att ni vill belöna, men är inte säkra på hur. Börja med en liten pilot: 500 mottagare, en specifik mekanik, mät resultatet, skala upp.",
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
          <div className="c-eyebrow" style={{ marginBottom: 16 }}>04 &middot; Hitta rätt</div>
          <h2 className="c-h2" style={{ marginBottom: 16 }}>
            Vilken ClearOn-lösning passar just er?
          </h2>
          <p className="c-body-lg">
            Fyra frågor. Ingen e-post. En rekommendation.
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
              <div className="c-eyebrow" style={{ marginBottom: 12 }}>Fråga {step + 1} / {QUIZ_QS.length}</div>
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
                }}>&larr; Föregående</button>
              )}
            </>
          ) : (
            <div>
              <div className="c-eyebrow" style={{ marginBottom: 10 }}>Vår rekommendation</div>
              <h3 className="c-h3" style={{ marginBottom: 16, fontSize: 32 }}>{winner.title}</h3>
              <p className="c-body-lg" style={{ marginBottom: 28 }}>{winner.desc}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={`/${winner.product}`} className="c-btn c-btn--primary"
                  onClick={() => track("quiz:cta", { product: winner.product })}>
                  Utforska {winner.pageLabel} &rarr;

                </a>
                <button onClick={reset} className="c-btn c-btn--ghost">
                  Gör om quizet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
