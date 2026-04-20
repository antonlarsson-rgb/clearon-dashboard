"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSignal } from "./SignalProvider";

type GameTab = "wheel" | "scratch" | "quiz" | "advent";

const GAME_INFO: Record<GameTab, { title: string; desc: string; usecases: string[] }> = {
  wheel: {
    title: "Snurra hjulet",
    desc: "Slumpad vinst som driver engagemang. Perfekt for events och butiksaktiviteter.",
    usecases: ["Massor och events", "Butiksaktiveringar", "Digital kampanj"],
  },
  scratch: {
    title: "Skrapkort",
    desc: "Digital skraplott med garanterad vinst. Skapar spaning och delning.",
    usecases: ["FMCG-lanseringar", "Sommarkampanjer", "Nyhetsbrev"],
  },
  quiz: {
    title: "Quiz",
    desc: "Kunskapsfraga med beloning. Larorik interaktion som ger data.",
    usecases: ["Produktutbildning", "Varumarkeskampanjer", "Lojalitetsprogram"],
  },
  advent: {
    title: "Adventskalender",
    desc: "24 luckor med dagliga erbjudanden. Atekommande engagemang over tid.",
    usecases: ["Julkampanjer", "Lanseringsperioder", "Arskalendrar"],
  },
};

const WHEEL_SEGMENTS = [
  { label: "10 kr", color: "#5e9732" },
  { label: "Testa igen", color: "#e8864c" },
  { label: "25 kr", color: "#416125" },
  { label: "Gratis", color: "#c8e66b", textColor: "#2a3326" },
  { label: "5 kr", color: "#5e9732" },
  { label: "50 kr!", color: "#e8864c" },
];

const QUIZ_QUESTIONS = [
  {
    q: "Hur manga butiker ar anslutna till ClearOn?",
    options: ["1 000", "3 000", "5 000+", "10 000"],
    correct: 2,
  },
];

export function GamesSection() {
  const { track } = useSignal();
  const [activeTab, setActiveTab] = useState<GameTab>("wheel");

  const handleTabChange = (tab: GameTab) => {
    setActiveTab(tab);
    track("game:open", { game: tab });
  };

  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--clr-beige)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Interactive Engage
          </div>
          <h2 className="c-h2">Prova vara spel</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 500,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            Gamification som driver +16% extra forsaljning. Testa sjalv.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {(["wheel", "scratch", "quiz", "advent"] as GameTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--r-pill)",
                border:
                  activeTab === tab
                    ? "2px solid var(--clr-green)"
                    : "2px solid var(--clr-line)",
                background:
                  activeTab === tab ? "var(--clr-green)" : "var(--clr-cl-surface)",
                color: activeTab === tab ? "#fff" : "var(--clr-ink-2)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-open-sans), sans-serif",
                transition: "all 0.2s var(--ease-out)",
              }}
            >
              {GAME_INFO[tab].title}
            </button>
          ))}
        </div>

        {/* Game info */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <p className="c-body" style={{ marginBottom: 8 }}>
            {GAME_INFO[activeTab].desc}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {GAME_INFO[activeTab].usecases.map((uc) => (
              <span key={uc} className="c-chip" style={{ fontSize: 11 }}>
                {uc}
              </span>
            ))}
          </div>
        </div>

        {/* Game area */}
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            background: "var(--clr-cl-surface)",
            borderRadius: "var(--r-lg)",
            padding: 32,
            boxShadow: "var(--sh-md)",
            minHeight: 300,
          }}
        >
          {activeTab === "wheel" && <WheelGame />}
          {activeTab === "scratch" && <ScratchGame />}
          {activeTab === "quiz" && <QuizGame />}
          {activeTab === "advent" && <AdventGame />}
        </div>
      </div>
    </section>
  );
}

function WheelGame() {
  const { track } = useSignal();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    track("game:spin", { game: "wheel" });

    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const extraSpins = 360 * 4;
    const winIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const targetAngle = extraSpins + (360 - winIndex * segmentAngle - segmentAngle / 2);

    setRotation(targetAngle);
    setTimeout(() => {
      setSpinning(false);
      setResult(WHEEL_SEGMENTS[winIndex].label);
      track("game:win", { game: "wheel", prize: WHEEL_SEGMENTS[winIndex].label });
    }, 3500);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 240,
          height: 240,
          margin: "0 auto 24px",
          position: "relative",
        }}
      >
        {/* Simple wheel visualization */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `conic-gradient(${WHEEL_SEGMENTS.map(
              (s, i) =>
                `${s.color} ${(i / WHEEL_SEGMENTS.length) * 360}deg ${
                  ((i + 1) / WHEEL_SEGMENTS.length) * 360
                }deg`
            ).join(", ")})`,
            transition: spinning
              ? "transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
            transform: `rotate(${rotation}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--sh-lg)",
          }}
        >
          {/* Center button */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "var(--sh-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--clr-green-deep)",
              fontFamily: "var(--font-open-sans), sans-serif",
            }}
          >
            SNURRA
          </div>
        </div>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            top: -8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "16px solid var(--clr-ink)",
          }}
        />
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        className="c-btn c-btn--primary"
        style={{ opacity: spinning ? 0.6 : 1 }}
      >
        {spinning ? "Snurrar..." : "Snurra hjulet"}
      </button>
      {result && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 24px",
            background: "var(--clr-lime-soft)",
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font-open-sans), sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--clr-green-deep)",
          }}
        >
          Du vann: {result}
        </div>
      )}
    </div>
  );
}

function ScratchGame() {
  const { track } = useSignal();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const prize = "25 kr rabatt";

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#a8b896";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px var(--font-open-sans), sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("Skrapa har", canvas.width / 2, canvas.height / 2 + 5);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isScratching) {
      setIsScratching(true);
      track("game:scratch", { game: "scratch" });
    }

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check how much is revealed
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const ratio = transparent / (imageData.data.length / 4);
    if (ratio > 0.5 && !revealed) {
      setRevealed(true);
      track("game:win", { game: "scratch", prize });
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p className="c-body" style={{ marginBottom: 16 }}>
        Skrapa med musen eller fingret for att avsloja din vinst.
      </p>
      <div
        style={{
          position: "relative",
          width: 280,
          height: 140,
          margin: "0 auto 16px",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
        }}
      >
        {/* Prize underneath */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--clr-lime-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 28 }}>🎉</span>
          <span
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--clr-green-deep)",
            }}
          >
            {prize}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={280}
          height={140}
          onMouseMove={(e) => e.buttons === 1 && scratch(e)}
          onMouseDown={scratch}
          onTouchMove={scratch}
          onTouchStart={scratch}
          style={{
            position: "absolute",
            inset: 0,
            cursor: "crosshair",
            touchAction: "none",
          }}
        />
      </div>
      {revealed && (
        <div
          style={{
            padding: "12px 24px",
            background: "var(--clr-lime-soft)",
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font-open-sans), sans-serif",
            fontWeight: 700,
            color: "var(--clr-green-deep)",
          }}
        >
          Grattis! Du vann {prize}!
        </div>
      )}
    </div>
  );
}

function QuizGame() {
  const { track } = useSignal();
  const [selected, setSelected] = useState<number | null>(null);
  const q = QUIZ_QUESTIONS[0];

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    track("game:quiz-answer", {
      game: "quiz",
      answer: q.options[idx],
      correct: idx === q.correct,
    });
    if (idx === q.correct) {
      track("game:win", { game: "quiz" });
    }
  };

  return (
    <div>
      <h3
        style={{
          fontFamily: "var(--font-open-sans), sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: "var(--clr-ink)",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {q.q}
      </h3>
      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => selected === null && handleAnswer(i)}
            disabled={selected !== null}
            style={{
              padding: "14px 20px",
              borderRadius: "var(--r-sm)",
              border:
                selected === i
                  ? i === q.correct
                    ? "2px solid var(--clr-green)"
                    : "2px solid var(--clr-orange)"
                  : selected !== null && i === q.correct
                  ? "2px solid var(--clr-green)"
                  : "1.5px solid var(--clr-line)",
              background:
                selected === i
                  ? i === q.correct
                    ? "var(--clr-green-soft)"
                    : "var(--clr-orange-soft)"
                  : selected !== null && i === q.correct
                  ? "var(--clr-green-soft)"
                  : "var(--clr-cl-surface)",
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--clr-ink)",
              cursor: selected === null ? "pointer" : "default",
              textAlign: "left",
              transition: "all 0.2s",
            }}
          >
            {opt}
            {selected !== null && i === q.correct && (
              <span style={{ float: "right", color: "var(--clr-green)" }}>
                ✓
              </span>
            )}
            {selected === i && i !== q.correct && (
              <span style={{ float: "right", color: "var(--clr-orange)" }}>
                ✗
              </span>
            )}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div
          style={{
            marginTop: 16,
            padding: "12px",
            borderRadius: "var(--r-md)",
            background:
              selected === q.correct
                ? "var(--clr-green-soft)"
                : "var(--clr-orange-soft)",
            textAlign: "center",
            fontFamily: "var(--font-open-sans), sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color:
              selected === q.correct
                ? "var(--clr-green-deep)"
                : "var(--clr-orange)",
          }}
        >
          {selected === q.correct
            ? "Ratt svar! ClearOn ar anslutet till over 5 000 butiker."
            : "Inte riktigt. Det korrekta svaret ar 5 000+!"}
        </div>
      )}
    </div>
  );
}

function AdventGame() {
  const { track } = useSignal();
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const today = new Date().getDate();
  const prizes = [
    "10 kr", "Gratis", "25 kr", "5 kr", "50 kr", "15 kr",
    "10 kr", "Gratis", "30 kr", "5 kr", "20 kr", "Gratis",
    "10 kr", "25 kr", "5 kr", "15 kr", "Gratis", "10 kr",
    "50 kr", "5 kr", "25 kr", "10 kr", "Gratis", "100 kr",
  ];

  const openDoor = (day: number) => {
    if (opened.has(day)) return;
    const next = new Set(opened);
    next.add(day);
    setOpened(next);
    track("game:open", { game: "advent", day });
  };

  return (
    <div>
      <p className="c-body" style={{ textAlign: "center", marginBottom: 16 }}>
        Klicka pa en lucka for att oppna (demo).
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 6,
        }}
      >
        {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => openDoor(day)}
            style={{
              aspectRatio: "1",
              borderRadius: "var(--r-xs)",
              border: "1px solid var(--clr-line)",
              background: opened.has(day)
                ? "var(--clr-lime-soft)"
                : day <= today
                ? "var(--clr-green)"
                : "var(--clr-beige-warm)",
              color: opened.has(day)
                ? "var(--clr-green-deep)"
                : day <= today
                ? "#fff"
                : "var(--clr-muted)",
              fontSize: opened.has(day) ? 9 : 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-open-sans), sans-serif",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {opened.has(day) ? prizes[day - 1] : day}
          </button>
        ))}
      </div>
    </div>
  );
}
