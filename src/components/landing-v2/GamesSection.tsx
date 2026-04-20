"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSignal } from "./SignalProvider";

type GameId = "wheel" | "scratch" | "quiz" | "calendar";

const games: { id: GameId; label: string; desc: string; segment: string }[] = [
  { id: "wheel", label: "Lyckohjul", desc: "Snurra och vinn", segment: "playful-marketer" },
  { id: "scratch", label: "Skraplott", desc: "Skrapa fram beloningen", segment: "playful-marketer" },
  { id: "quiz", label: "Quiz", desc: "Svara ratt, vinn kupong", segment: "playful-marketer" },
  { id: "calendar", label: "Kalender", desc: "En lucka om dagen", segment: "playful-marketer" },
];

export function GamesSection() {
  const [active, setActive] = useState<GameId>("wheel");
  const { track } = useSignal();

  const pick = (g: typeof games[0]) => {
    setActive(g.id);
    track("game:open", { id: g.id, segment: g.segment });
  };

  return (
    <section id="spela" style={{ padding: "96px 0", background: "var(--clr-bg-warm)" }}>
      <div className="c-container">
        <div style={{ maxWidth: 720, marginBottom: 48 }}>
          <div className="c-eyebrow" style={{ marginBottom: 16 }}>02 &middot; Testa sjalv</div>
          <h2 className="c-h2" style={{ marginBottom: 18 }}>
            Spelen som kunderna faktiskt vill spela.
          </h2>
          <p className="c-body-lg">
            Varje mekanik gar att kora som standalone-kampanj eller baddas in i er app, mejl eller hemsida. Beloningen ar alltid en kupong som gar att losa in i butik.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {games.map(g => (
            <button key={g.id} onClick={() => pick(g)}
              style={{
                padding: "12px 18px",
                background: active === g.id ? "var(--clr-green-dark)" : "var(--clr-surface)",
                color: active === g.id ? "#fff" : "var(--clr-ink)",
                border: `1px solid ${active === g.id ? "var(--clr-green-dark)" : "var(--clr-line)"}`,
                borderRadius: "var(--r-pill)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                transition: "all 0.2s var(--ease-out)",
              }}>
              <span>{g.label}</span>
              <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 400 }}>&middot; {g.desc}</span>
            </button>
          ))}
        </div>

        <div style={{
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-line)",
          borderRadius: "var(--r-lg)",
          padding: "40px",
          minHeight: 520,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          alignItems: "center",
        }} className="games-grid">
          {active === "wheel" && <WheelGame />}
          {active === "scratch" && <ScratchGame />}
          {active === "quiz" && <QuizGame />}
          {active === "calendar" && <CalendarGame />}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .games-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

function GameHeader({ eyebrow, title, desc, usecases }: {
  eyebrow: string; title: string; desc: string; usecases: string[];
}) {
  return (
    <div>
      <div className="c-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
      <h3 className="c-h3" style={{ marginBottom: 14, fontSize: 28 }}>{title}</h3>
      <p className="c-body" style={{ marginBottom: 24 }}>{desc}</p>
      <div style={{ marginBottom: 8 }} className="c-eyebrow">Passar for</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {usecases.map(u => <span key={u} className="c-chip" style={{ fontSize: 12 }}>{u}</span>)}
      </div>
    </div>
  );
}

/* ================= WHEEL ================= */

function WheelGame() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ label: string; color: string } | null>(null);
  const { track } = useSignal();

  const slices = [
    { label: "50 kr ICA", color: "#5e9732", ink: "#fff" },
    { label: "Forsok igen", color: "#ece7d8", ink: "#4a5344" },
    { label: "Glass gratis", color: "#e8864c", ink: "#fff" },
    { label: "Forsok igen", color: "#f4f1e9", ink: "#4a5344" },
    { label: "20 kr Apotek", color: "#c8e66b", ink: "#4a5a1a" },
    { label: "Forsok igen", color: "#ece7d8", ink: "#4a5344" },
    { label: "100 kr Hemkop", color: "#416125", ink: "#fff" },
    { label: "Forsok igen", color: "#f4f1e9", ink: "#4a5344" },
  ];
  const n = slices.length;
  const sliceDeg = 360 / n;

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const winIndices = [0, 2, 4, 6];
    const targetIdx = winIndices[Math.floor(Math.random() * winIndices.length)];
    const targetAngle = 360 - (targetIdx * sliceDeg + sliceDeg / 2);
    const spins = 5;
    const final = rotation + spins * 360 + (targetAngle - (rotation % 360));
    setRotation(final);
    track("game:spin", { game: "wheel" });
    setTimeout(() => {
      setSpinning(false);
      setResult(slices[targetIdx]);
      track("game:win", { game: "wheel", prize: slices[targetIdx].label });
    }, 4200);
  };

  const size = 340;
  const r = size / 2;

  return (
    <>
      <div>
        <GameHeader
          eyebrow="Lyckohjul"
          title="Varje snurr en ny chans."
          desc="Perfekt for kundklubbs-aktivering, massor, eller for att vacka en sovande CRM-bas. Satt vinstchansen, satt budgeten, vi skoter clearing."
          usecases={["Black Friday-teaser", "Sommarkampanj", "Aktivera vilande kunder", "Massa / event"]}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: "100%", maxWidth: size, aspectRatio: "1 / 1" }}>
          {/* Pointer */}
          <div style={{
            position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "22px solid var(--clr-green-dark)",
            zIndex: 2,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
          }} />
          <svg viewBox={`0 0 ${size} ${size}`}
            style={{
              width: "100%", height: "100%",
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.2, 1)" : "none",
              filter: "drop-shadow(0 10px 20px rgba(58,69,58,0.15))",
            }}>
            {slices.map((s, i) => {
              const startAngle = i * sliceDeg - 90;
              const endAngle = startAngle + sliceDeg;
              const x1 = r + r * Math.cos(startAngle * Math.PI / 180);
              const y1 = r + r * Math.sin(startAngle * Math.PI / 180);
              const x2 = r + r * Math.cos(endAngle * Math.PI / 180);
              const y2 = r + r * Math.sin(endAngle * Math.PI / 180);
              const largeArc = sliceDeg > 180 ? 1 : 0;
              const midAngle = startAngle + sliceDeg / 2;
              const labelR = r * 0.68;
              const lx = r + labelR * Math.cos(midAngle * Math.PI / 180);
              const ly = r + labelR * Math.sin(midAngle * Math.PI / 180);
              return (
                <g key={i}>
                  <path d={`M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={s.color} stroke="#fff" strokeWidth="2" />
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${lx}, ${ly})`}
                    style={{ fontSize: 12, fontWeight: 700, fill: s.ink, fontFamily: "var(--font-sans)" }}>
                    {s.label.split(" ").map((w, j) => (
                      <tspan key={j} x={lx} dy={j === 0 ? "-0.2em" : "1.1em"}>{w}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
            <circle cx={r} cy={r} r={28} fill="#fff" stroke="var(--clr-green-dark)" strokeWidth="3" />
            <text x={r} y={r} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 11, fontWeight: 700, fill: "var(--clr-green-dark)", letterSpacing: "0.08em" }}>
              ClearOn
            </text>
          </svg>
        </div>

        <button onClick={spin} disabled={spinning}
          className="c-btn c-btn--primary"
          style={{ minWidth: 180, justifyContent: "center", fontSize: 16, padding: "14px 28px",
            opacity: spinning ? 0.6 : 1, cursor: spinning ? "wait" : "pointer" }}>
          {spinning ? "Snurrar..." : result ? "Snurra igen" : "Snurra hjulet"}
        </button>

        {result && !spinning && (
          <div style={{
            padding: "14px 20px",
            background: result.label === "Forsok igen" ? "var(--clr-beige-warm)" : "var(--clr-green-soft)",
            borderRadius: "var(--r-md)",
            textAlign: "center",
            minWidth: 260,
          }}>
            <div className="c-eyebrow" style={{ marginBottom: 4, fontSize: 10 }}>
              {result.label === "Forsok igen" ? "OJ" : "VINST"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--clr-green-dark)" }}>
              {result.label}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= SCRATCH ================= */

function ScratchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [percent, setPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [key, setKey] = useState(0);
  const { track } = useSignal();

  const sizeW = 340, sizeH = 220;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, sizeW, sizeH);
    gradient.addColorStop(0, "#b8b4a6");
    gradient.addColorStop(0.5, "#d1ccbd");
    gradient.addColorStop(1, "#a59f8e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, sizeW, sizeH);
    ctx.fillStyle = "rgba(74,83,68,0.4)";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SKRAPA HAR", sizeW / 2, sizeH / 2 - 8);
    ctx.font = "11px monospace";
    ctx.fillText("anvand musen eller fingret", sizeW / 2, sizeH / 2 + 14);
    setPercent(0);
    setRevealed(false);
  }, [key]);

  const scratchAt = (x: number, y: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  };

  const computePercent = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, sizeW, sizeH).data;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4 * 80) {
      if (data[i] === 0) cleared++;
    }
    const total = Math.floor(data.length / (4 * 80));
    const p = Math.round((cleared / total) * 100);
    setPercent(p);
    if (p > 45 && !revealed) {
      setRevealed(true);
      track("game:win", { game: "scratch", prize: "Glass fran GB" });
    }
  };

  const dragRef = useRef(false);
  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    dragRef.current = true;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = sizeW / rect.width, sy = sizeH / rect.height;
    const p = "touches" in e ? e.touches[0] : e;
    scratchAt((p.clientX - rect.left) * sx, (p.clientY - rect.top) * sy);
    track("game:scratch", { game: "scratch" });
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = sizeW / rect.width, sy = sizeH / rect.height;
    const p = "touches" in e ? e.touches[0] : e;
    scratchAt((p.clientX - rect.left) * sx, (p.clientY - rect.top) * sy);
    computePercent();
  };
  const onUp = () => { dragRef.current = false; };

  return (
    <>
      <div>
        <GameHeader
          eyebrow="Skraplott"
          title="Den analoga kanslan, digitalt."
          desc="Byggs som fysisk print (utdelas i butik / per post) eller digitalt i webben, appen eller SMS:et. Alla vinner nagot, bara olika mycket."
          usecases={["Valkomstpresent nya medlemmar", "Kompletterar stort kop", "Eventutdelning", "Tidningsbilaga"]}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: sizeW, aspectRatio: `${sizeW} / ${sizeH}`, borderRadius: "var(--r-md)", overflow: "hidden",
          boxShadow: "var(--sh-md)" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #f1f6e4 0%, #e4efd6 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 6, padding: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 48 }}>&#x1F366;</div>
            <div className="c-eyebrow" style={{ color: "var(--clr-green-dark)", fontSize: 10 }}>DU VANN</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-green-dark)", letterSpacing: "-0.01em" }}>
              Gratis glass fran GB
            </div>
            <div style={{ fontSize: 12, color: "var(--clr-ink-2)" }}>Varde upp till 35 kr</div>
          </div>
          <canvas
            ref={canvasRef}
            width={sizeW}
            height={sizeH}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--clr-muted)", fontFamily: "var(--font-mono)" }}>
          SKRAPAT {percent}% {revealed && " AVSLOJAT"}
        </div>
        <button onClick={() => setKey(k => k + 1)}
          className="c-btn c-btn--ghost"
          style={{ fontSize: 13, padding: "10px 18px" }}>
          Borja om
        </button>
      </div>
    </>
  );
}

/* ================= QUIZ ================= */

function QuizGame() {
  const questions = [
    { q: "Hur manga butiker loser in ClearOn-kuponger i Sverige?", opts: ["500+", "2 000+", "5 000+", "10 000+"], correct: 2 },
    { q: "Vilket ar grundades ClearOn?", opts: ["1994", "2004", "2014", "1985"], correct: 0 },
    { q: "Vad hander efter att en kupong scannas i kassan?", opts: ["Kunden betalar mellanskillnaden", "Butiken ater kostnaden", "ClearOn clearar automatiskt mellan varumarke och butik", "Ingenting, det ar bara symboliskt"], correct: 2 },
  ];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const { track } = useSignal();

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    track("game:quiz-answer", { q: step, correct: i === questions[step].correct });
    setTimeout(() => {
      setAnswers([...answers, i]);
      if (step < questions.length - 1) {
        setStep(step + 1);
        setSelected(null);
      } else {
        track("game:win", { game: "quiz", prize: "20 kr Oatly havredryck" });
      }
    }, 1400);
  };

  const reset = () => { setStep(0); setAnswers([]); setSelected(null); };
  const done = answers.length === questions.length;
  const score = answers.filter((a, i) => a === questions[i].correct).length;

  return (
    <>
      <div>
        <GameHeader
          eyebrow="Quiz"
          title="Lar och belona samtidigt."
          desc="Engagerar mer an en vanlig enkat. Anvand for produktkannedom, onboarding, kampanjer mot malgrupper som redan kan ditt varumarke."
          usecases={["Enkat med incitament", "Produktlansering", "Onboarding-kampanj", "CRM-reaktivering"]}
        />
      </div>

      <div style={{ background: "var(--clr-beige)", padding: 28, borderRadius: "var(--r-md)", minHeight: 360, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {!done ? (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < step ? "var(--clr-green)" : i === step ? "var(--clr-green-soft)" : "var(--clr-line)",
                }} />
              ))}
            </div>
            <div className="c-eyebrow" style={{ marginBottom: 10 }}>Fraga {step + 1} / {questions.length}</div>
            <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, lineHeight: 1.3, color: "var(--clr-ink)" }}>
              {questions[step].q}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {questions[step].opts.map((o, i) => {
                const isSelected = selected === i;
                const isCorrect = i === questions[step].correct;
                let bg = "var(--clr-surface)";
                let border = "var(--clr-line)";
                if (selected !== null) {
                  if (isCorrect) { bg = "var(--clr-green-soft)"; border = "var(--clr-green)"; }
                  else if (isSelected) { bg = "var(--clr-orange-soft)"; border = "var(--clr-orange)"; }
                }
                return (
                  <button key={i} onClick={() => answer(i)}
                    disabled={selected !== null}
                    style={{
                      padding: "14px 18px",
                      background: bg, color: "var(--clr-ink)",
                      border: `1.5px solid ${border}`,
                      borderRadius: "var(--r-sm)",
                      fontSize: 14, fontWeight: 500, textAlign: "left",
                      cursor: selected !== null ? "default" : "pointer",
                      transition: "all 0.15s var(--ease-out)",
                    }}>
                    {o}
                    {selected !== null && isCorrect && <span style={{ float: "right", color: "var(--clr-green-dark)" }}>&#x2713;</span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div className="c-eyebrow" style={{ marginBottom: 8 }}>Klar &middot; {score}/{questions.length} ratt</div>
            <h4 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
              {score === questions.length ? "Fullpott!" : score >= 2 ? "Snyggt jobbat." : "Nara!"}
            </h4>
            <p className="c-body" style={{ marginBottom: 20 }}>
              Din beloning: <strong>20 kr rabatt pa Oatly havredryck</strong>.
            </p>
            <button onClick={reset} className="c-btn c-btn--ghost" style={{ fontSize: 13 }}>
              Gor om
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= CALENDAR ================= */

function CalendarGame() {
  const [opened, setOpened] = useState<Record<number, boolean>>({});
  const { track } = useSignal();

  const doors = [
    { d: 1, prize: "5 kr rabatt", emoji: "\u2615" },
    { d: 2, prize: "Nothing", emoji: "\u00B7" },
    { d: 3, prize: "10 kr rabatt", emoji: "\ud83e\udd5b" },
    { d: 4, prize: "Gratis glass", emoji: "\ud83c\udf66" },
    { d: 5, prize: "Nothing", emoji: "\u00B7" },
    { d: 6, prize: "20 kr Apotek", emoji: "\ud83d\udc8a" },
    { d: 7, prize: "Gratis bulle", emoji: "\ud83e\udd50" },
    { d: 8, prize: "Nothing", emoji: "\u00B7" },
    { d: 9, prize: "15 kr rabatt", emoji: "\ud83e\uddc0" },
    { d: 10, prize: "50 kr ICA", emoji: "\ud83d\uded2" },
    { d: 11, prize: "Nothing", emoji: "\u00B7" },
    { d: 12, prize: "Storvinst 500 kr", emoji: "\ud83c\udf81" },
  ];

  const open = (door: typeof doors[0]) => {
    if (opened[door.d]) return;
    setOpened({ ...opened, [door.d]: true });
    track("game:door", { d: door.d, prize: door.prize });
    if (door.prize !== "Nothing") {
      track("game:win", { game: "calendar", prize: door.prize });
    }
  };

  return (
    <>
      <div>
        <GameHeader
          eyebrow="Kalender"
          title="En anledning att komma tillbaka, 12 dagar i rad."
          desc="Klassisk julkalender, men fungerar lika bra som sommarkalender, paskaegg, eller 30-dagars onboardingkalender. Folk oppnar appen varje dag for att inte missa sin lucka."
          usecases={["Adventskampanj", "Sommaraktivering", "App-retention", "30-dagars onboarding"]}
        />
      </div>

      <div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
          maxWidth: 380, margin: "0 auto",
        }}>
          {doors.map(door => {
            const isOpen = opened[door.d];
            const won = isOpen && door.prize !== "Nothing";
            return (
              <button key={door.d} onClick={() => open(door)}
                style={{
                  aspectRatio: "1",
                  border: "none",
                  background: isOpen
                    ? (won ? "var(--clr-green-soft)" : "var(--clr-beige-warm)")
                    : "var(--clr-green-dark)",
                  color: isOpen ? "var(--clr-green-dark)" : "#fff",
                  borderRadius: "var(--r-sm)",
                  cursor: isOpen ? "default" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4,
                  padding: 8,
                  transition: "all 0.3s var(--ease-out)",
                }}>
                {isOpen ? (
                  <>
                    <div style={{ fontSize: 22 }}>{door.emoji}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, textAlign: "center", lineHeight: 1.1 }}>
                      {door.prize === "Nothing" ? "tomt" : door.prize}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", lineHeight: 1 }}>
                      {door.d}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.7, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                      DAG
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "var(--clr-muted)", fontFamily: "var(--font-mono)" }}>
          OPPNAT {Object.keys(opened).length} / {doors.length}
        </div>
      </div>
    </>
  );
}
