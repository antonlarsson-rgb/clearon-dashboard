"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const QUESTIONS = [
  {
    question: "Vad ar ert primara mal?",
    options: [
      { label: "Oka forsaljning i butik", value: "sales" },
      { label: "Forbattra kundvard", value: "care" },
      { label: "Belona personal", value: "hr" },
      { label: "Bygga kampanjer", value: "campaign" },
    ],
  },
  {
    question: "Vilken bransch ar ni i?",
    options: [
      { label: "FMCG / Dagligvaror", value: "fmcg" },
      { label: "Telekom / Energi", value: "service" },
      { label: "Retail / E-handel", value: "retail" },
      { label: "Annat", value: "other" },
    ],
  },
  {
    question: "Hur manga kampanjer kor ni per ar?",
    options: [
      { label: "1-5 kampanjer", value: "few" },
      { label: "6-20 kampanjer", value: "medium" },
      { label: "20+ kampanjer", value: "many" },
      { label: "Vi har inte borjat annu", value: "none" },
    ],
  },
  {
    question: "Vad ar viktigast for er?",
    options: [
      { label: "Matbarhet och data", value: "data" },
      { label: "Snabb setup", value: "speed" },
      { label: "Engagemang och interaktion", value: "engage" },
      { label: "Skalbarhet", value: "scale" },
    ],
  },
];

function getRecommendation(answers: string[]): {
  product: string;
  slug: string;
  reason: string;
} {
  const [goal, , , priority] = answers;

  if (goal === "hr") {
    return {
      product: "Send a Gift",
      slug: "send-a-gift",
      reason:
        "Digitala presentkort for personalbeloning. Skatteeffektivt och utan administration.",
    };
  }
  if (goal === "care") {
    return {
      product: "Customer Care",
      slug: "customer-care",
      reason:
        "Digital kompensation via SMS. Vand missnoje till lojalitet pa sekunder.",
    };
  }
  if (priority === "engage") {
    return {
      product: "Interactive Engage",
      slug: "interactive-engage",
      reason:
        "Gamification som driver +16% extra forsaljning. Spel, quiz och scratch cards.",
    };
  }
  if (goal === "campaign") {
    return {
      product: "Kampanja",
      slug: "kampanja",
      reason:
        "Bygg kampanjsidor och distribuera kuponger via SMS pa minuter.",
    };
  }
  return {
    product: "Sales Promotion",
    slug: "sales-promotion",
    reason:
      "Fysiska kuponger i butik med full sparbarhet. +46% forsaljningslyft vid nylansering.",
  };
}

export function FitQuiz() {
  const { track } = useSignal();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<ReturnType<typeof getRecommendation> | null>(null);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    track("quiz:answer", { step, answer: value });

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const rec = getRecommendation(newAnswers);
      setResult(rec);
      track("quiz:result", { product: rec.product });
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  if (result) {
    return (
      <section
        style={{
          padding: "80px 0",
          background: "var(--clr-green-tint)",
        }}
      >
        <div className="c-container" style={{ maxWidth: 600, textAlign: "center" }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Var rekommendation
          </div>
          <h2 className="c-h2" style={{ marginBottom: 16 }}>
            {result.product}
          </h2>
          <p className="c-body-lg" style={{ marginBottom: 24, color: "var(--clr-ink-2)" }}>
            {result.reason}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={`/${result.slug}`}
              className="c-btn c-btn--primary"
              onClick={() => track("quiz:cta", { product: result.product })}
            >
              Las mer om {result.product}
            </a>
            <button onClick={restart} className="c-btn c-btn--ghost">
              Gora om quizet
            </button>
          </div>
        </div>
      </section>
    );
  }

  const q = QUESTIONS[step];

  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--clr-green-tint)",
      }}
    >
      <div className="c-container" style={{ maxWidth: 600 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Hitta ratt produkt
          </div>
          <h2 className="c-h2">Vilken losning passar er?</h2>
        </div>

        {/* Progress */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 32,
          }}
        >
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i <= step ? "var(--clr-green)" : "var(--clr-line)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div
          style={{
            fontFamily: "var(--font-open-sans), sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--clr-muted)",
            marginBottom: 8,
          }}
        >
          Steg {step + 1} av {QUESTIONS.length}
        </div>

        <h3
          style={{
            fontFamily: "var(--font-open-sans), sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--clr-ink)",
            marginBottom: 20,
          }}
        >
          {q.question}
        </h3>

        <div style={{ display: "grid", gap: 10 }}>
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              style={{
                padding: "16px 20px",
                borderRadius: "var(--r-sm)",
                border: "1.5px solid var(--clr-line)",
                background: "var(--clr-cl-surface)",
                fontFamily: "var(--font-open-sans), sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--clr-ink)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s var(--ease-out)",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--clr-green)";
                (e.target as HTMLElement).style.background = "var(--clr-green-soft)";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--clr-line)";
                (e.target as HTMLElement).style.background = "var(--clr-cl-surface)";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={() => {
              setStep(step - 1);
              setAnswers(answers.slice(0, -1));
            }}
            style={{
              marginTop: 16,
              background: "none",
              border: "none",
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--clr-muted)",
              cursor: "pointer",
            }}
          >
            ← Tillbaka
          </button>
        )}
      </div>
    </section>
  );
}
