"use client";

import { useState, useEffect } from "react";
import { useSignal } from "./SignalProvider";

const assumptions: Record<string, { redemption: number; uplift: number; cac: number; label: string }> = {
  marknad: { redemption: 0.28, uplift: 3.2, cac: 1.4, label: "Kundforvarv" },
  compensation: { redemption: 0.71, uplift: 1.0, cac: 1.0, label: "Kompensation" },
  personal: { redemption: 0.94, uplift: 1.1, cac: 0.6, label: "Personalbeloning" },
};

export function RoiCalculator() {
  const { track } = useSignal();
  const [volume, setVolume] = useState(50000);
  const [value, setValue] = useState(25);
  const [useCase, setUseCase] = useState("marknad");

  const a = assumptions[useCase];

  const redeemed = Math.round(volume * a.redemption);
  const spend = redeemed * value;
  const generatedRevenue = Math.round(spend * a.uplift * 4.5);
  const roi = Math.round((generatedRevenue - spend) / Math.max(spend, 1) * 100);

  useEffect(() => {
    const t = setTimeout(() => track("roi:compute", { useCase, volume, value }), 400);
    return () => clearTimeout(t);
  }, [volume, value, useCase, track]);

  const fmt = (n: number) => n.toLocaleString("sv-SE");

  return (
    <section id="roi" style={{ padding: "120px 0", background: "var(--clr-navy)", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: -120, left: -120, width: 400, height: 400,
        borderRadius: "50%", background: "var(--clr-teal)", opacity: 0.15, filter: "blur(60px)",
      }} />
      <div className="c-container" style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "start" }} className="roi-grid">
          <div>
            <div className="c-eyebrow" style={{ color: "var(--clr-yellow)", marginBottom: 14 }}>Rakna sjalv</div>
            <h2 className="c-h2" style={{ color: "#fff", marginBottom: 20 }}>
              Vad far ni<br/>tillbaka?
            </h2>
            <p className="c-body-lg" style={{ color: "rgba(255,255,255,0.75)", marginBottom: 40, maxWidth: 440 }}>
              Justera volym, varde och syfte. Modellen ar baserad pa snittdata fran over 1 000 ClearOn-kampanjer
              inom svensk dagligvaruhandel.
            </p>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                ANVANDNINGSOMRADE
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(assumptions).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setUseCase(k)}
                    style={{
                      padding: "10px 14px",
                      background: useCase === k ? "#fff" : "rgba(255,255,255,0.1)",
                      color: useCase === k ? "var(--clr-navy)" : "#fff",
                      border: `1px solid ${useCase === k ? "#fff" : "rgba(255,255,255,0.2)"}`,
                      borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}
                  >{v.label}</button>
                ))}
              </div>
            </div>

            <Slider
              label="Antal skickade vardebarare"
              value={volume}
              min={1000} max={500000} step={1000}
              onChange={setVolume}
              format={v => fmt(v) + " st"}
            />
            <Slider
              label="Varde per vardebarare"
              value={value}
              min={5} max={500} step={5}
              onChange={setValue}
              format={v => fmt(v) + " kr"}
            />
          </div>

          <div style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--r-lg)",
            padding: 40,
          }}>
            <div style={{ marginBottom: 28 }}>
              <div className="c-eyebrow" style={{ color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Beraknad effekt</div>
              <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "var(--font-display)" }}>
                {roi > 0 ? "+" : ""}{fmt(roi)}<span style={{ fontSize: 32, color: "var(--clr-yellow)" }}>%</span>
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>beraknad ROI over kampanjperioden</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(255,255,255,0.1)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
              <RoiMetric label="Inlosta" value={fmt(redeemed)} sub={`${Math.round(a.redemption * 100)}% inlosengrad`} />
              <RoiMetric label="Kostnad" value={fmt(spend) + " kr"} sub="utbetalt till butik" />
              <RoiMetric label="Genererad intakt" value={fmt(generatedRevenue) + " kr"} sub={`${a.uplift.toFixed(1)}x hyllvarde`} highlight />
              <RoiMetric label="CPA" value={fmt(Math.round(spend / Math.max(redeemed, 1) * a.cac)) + " kr"} sub="per engagerad mottagare" />
            </div>

            <div style={{ marginTop: 24, padding: 16, background: "rgba(255, 199, 44, 0.15)", borderRadius: "var(--r-sm)", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--clr-yellow)" }}>Tips.</strong> En riktig berakning tar ocksa hansyn till marginal, viral spridning och aterkopsfrekvens. Vi tar garna ett detaljerat samtal.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .roi-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          {label.toUpperCase()}
        </label>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--clr-yellow)" }}
      />
    </div>
  );
}

function RoiMetric({ label, value, sub, highlight }: {
  label: string; value: string; sub: string; highlight?: boolean;
}) {
  return (
    <div style={{
      background: highlight ? "rgba(255, 199, 44, 0.1)" : "rgba(255,255,255,0.02)",
      padding: "18px 18px",
    }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: highlight ? "var(--clr-yellow)" : "#fff" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}
