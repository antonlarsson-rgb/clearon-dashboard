"use client";

import { useState, useMemo } from "react";
import { useSignal } from "./SignalProvider";

const USE_CASES_ROI = [
  { label: "Sales Promotion", uplift: 0.15, cpa: 8 },
  { label: "Interactive Engage", uplift: 0.16, cpa: 12 },
  { label: "Customer Care", uplift: 0.10, cpa: 5 },
  { label: "Send a Gift", uplift: 0.08, cpa: 6 },
];

export function RoiCalculator() {
  const { track } = useSignal();
  const [volume, setVolume] = useState(5000);
  const [value, setValue] = useState(50);
  const [useCaseIdx, setUseCaseIdx] = useState(0);

  const uc = USE_CASES_ROI[useCaseIdx];

  const metrics = useMemo(() => {
    const inlosta = Math.round(volume * 0.12);
    const kostnad = Math.round(inlosta * uc.cpa);
    const intakt = Math.round(inlosta * value * (1 + uc.uplift));
    const roi = kostnad > 0 ? Math.round(((intakt - kostnad) / kostnad) * 100) : 0;
    return { inlosta, kostnad, intakt, roi };
  }, [volume, value, useCaseIdx, uc.cpa, uc.uplift]);

  const handleSliderChange = (
    setter: (v: number) => void,
    slider: string,
    val: number
  ) => {
    setter(val);
    track("roi:compute", { slider, value: val, useCase: uc.label });
  };

  return (
    <section
      id="roi"
      style={{
        padding: "80px 0",
        background: "var(--clr-ink)",
      }}
    >
      <div className="c-container" style={{ maxWidth: 800 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            className="c-eyebrow"
            style={{ color: "var(--clr-lime)", marginBottom: 12 }}
          >
            ROI-kalkylator
          </div>
          <h2
            className="c-h2"
            style={{ color: "#fff" }}
          >
            Berakna er avkastning
          </h2>
          <p
            className="c-body"
            style={{
              maxWidth: 480,
              margin: "12px auto 0",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Justera volym och varde for att se vad ClearOn kan betyda for er
            forsaljning.
          </p>
        </div>

        {/* Use case selector */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {USE_CASES_ROI.map((u, i) => (
            <button
              key={u.label}
              onClick={() => setUseCaseIdx(i)}
              style={{
                padding: "6px 16px",
                borderRadius: "var(--r-pill)",
                border:
                  useCaseIdx === i
                    ? "2px solid var(--clr-lime)"
                    : "1.5px solid rgba(255,255,255,0.2)",
                background:
                  useCaseIdx === i
                    ? "var(--clr-lime)"
                    : "transparent",
                color:
                  useCaseIdx === i
                    ? "var(--clr-ink)"
                    : "rgba(255,255,255,0.7)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-open-sans), sans-serif",
              }}
            >
              {u.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                Antal utskick
              </label>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--clr-lime)",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                {volume.toLocaleString("sv-SE")}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={volume}
              onChange={(e) =>
                handleSliderChange(setVolume, "volume", +e.target.value)
              }
              style={{
                width: "100%",
                accentColor: "var(--clr-lime)",
                height: 6,
                cursor: "pointer",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-open-sans), sans-serif",
                marginTop: 4,
              }}
            >
              <span>1 000</span>
              <span>100 000</span>
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                Snitvarde per kop (kr)
              </label>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--clr-lime)",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                {value} kr
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={value}
              onChange={(e) =>
                handleSliderChange(setValue, "value", +e.target.value)
              }
              style={{
                width: "100%",
                accentColor: "var(--clr-lime)",
                height: 6,
                cursor: "pointer",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-open-sans), sans-serif",
                marginTop: 4,
              }}
            >
              <span>10 kr</span>
              <span>500 kr</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {[
            {
              label: "ROI",
              value: `${metrics.roi}%`,
              color: "var(--clr-lime)",
            },
            {
              label: "Inlosta kuponger",
              value: metrics.inlosta.toLocaleString("sv-SE"),
              color: "#fff",
            },
            {
              label: "Kostnad",
              value: `${metrics.kostnad.toLocaleString("sv-SE")} kr`,
              color: "var(--clr-orange)",
            },
            {
              label: "Genererad intakt",
              value: `${metrics.intakt.toLocaleString("sv-SE")} kr`,
              color: "var(--clr-lime)",
            },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                textAlign: "center",
                padding: "20px 12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "var(--r-md)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: m.color,
                  fontFamily: "var(--font-open-sans), sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-open-sans), sans-serif",
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-open-sans), sans-serif",
          }}
        >
          * Uppskattad inlosningsgrad 12%. Faktisk avkastning varierar.
        </div>
      </div>
    </section>
  );
}
