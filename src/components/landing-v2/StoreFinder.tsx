"use client";

import { useState, useMemo } from "react";
import { useSignal } from "./SignalProvider";

const cities = [
  { name: "Stockholm", x: 68, y: 58, count: 842, type: "Huvudstad" },
  { name: "Goteborg", x: 30, y: 62, count: 512, type: "Vastkusten" },
  { name: "Malmo", x: 38, y: 86, count: 328, type: "Skane" },
  { name: "Uppsala", x: 66, y: 54, count: 182, type: "Malardalen" },
  { name: "Linkoping", x: 56, y: 68, count: 147, type: "Ostergotland" },
  { name: "Vasteras", x: 60, y: 54, count: 129, type: "Malardalen" },
  { name: "Orebro", x: 52, y: 58, count: 124, type: "Bergslagen" },
  { name: "Norrkoping", x: 60, y: 66, count: 118, type: "Ostergotland" },
  { name: "Helsingborg", x: 32, y: 82, count: 98, type: "Skane" },
  { name: "Jonkoping", x: 44, y: 72, count: 88, type: "Smaland" },
  { name: "Umea", x: 62, y: 22, count: 78, type: "Norrland" },
  { name: "Lulea", x: 70, y: 10, count: 62, type: "Norrbotten" },
  { name: "Sundsvall", x: 56, y: 32, count: 92, type: "Medelpad" },
  { name: "Gavle", x: 58, y: 46, count: 74, type: "Gastrikland" },
  { name: "Boras", x: 32, y: 70, count: 78, type: "Vastergotland" },
  { name: "Halmstad", x: 32, y: 78, count: 58, type: "Halland" },
  { name: "Kalmar", x: 58, y: 78, count: 48, type: "Smaland" },
  { name: "Vaxjo", x: 48, y: 78, count: 52, type: "Smaland" },
  { name: "Karlstad", x: 42, y: 54, count: 82, type: "Varmland" },
  { name: "Falun", x: 52, y: 46, count: 48, type: "Dalarna" },
  { name: "Ostersund", x: 46, y: 30, count: 42, type: "Jamtland" },
  { name: "Kiruna", x: 66, y: 4, count: 18, type: "Norrbotten" },
];

export function StoreFinder() {
  const { track } = useSignal();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<typeof cities[0] | null>(null);

  const extras = useMemo(() => {
    const arr: { x: number; y: number; size: number }[] = [];
    for (let i = 0; i < 180; i++) {
      arr.push({ x: 25 + Math.random() * 55, y: 10 + Math.random() * 80, size: 1 + Math.random() * 1.5 });
    }
    return arr;
  }, []);

  const filtered = cities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.type.toLowerCase().includes(query.toLowerCase()));
  const total = cities.reduce((s, c) => s + c.count, 0);

  return (
    <section id="butiker" style={{ padding: "120px 0", background: "var(--clr-surface-alt)", borderTop: "1px solid var(--clr-line)", borderBottom: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }} className="butik-grid">
          <div>
            <div className="c-eyebrow" style={{ marginBottom: 14 }}>Tackning i hela Sverige</div>
            <h2 className="c-h2" style={{ marginBottom: 20 }}>5 000+ butiker.<br/>Hela Sverige.</h2>
            <p className="c-body-lg" style={{ marginBottom: 32, maxWidth: 440 }}>
              Dagligvaror, service, apotek och restauranger. Fran Kiruna i norr till Smygehuk i soder, var din mottagare an bor finns en butik pa gangavstand.
            </p>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); track("module:engage", { id: "storefinder-search" }); }}
              placeholder="Sok stad eller region..."
              style={{
                width: "100%", padding: "14px 18px",
                border: "1px solid var(--clr-line)", background: "#fff",
                borderRadius: "var(--r-pill)", fontSize: 15,
                marginBottom: 16,
              }}
            />
            <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid var(--clr-line)", borderRadius: "var(--r-sm)", background: "#fff" }}>
              {filtered.map(c => (
                <div
                  key={c.name}
                  onClick={() => { setSelected(c); track("module:engage", { id: "storefinder-pick-" + c.name }); }}
                  style={{
                    padding: "14px 18px", borderBottom: "1px solid var(--clr-line-soft)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", transition: "background 0.15s",
                    background: selected?.name === c.name ? "var(--clr-teal-soft)" : "transparent",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--clr-muted)" }}>{c.type}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>{c.count} st</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", minHeight: 540 }}>
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "auto", maxHeight: 620 }}>
              <path
                d="M60 2 L68 4 L72 10 L70 18 L65 22 L60 26 L58 32 L60 38 L56 42 L54 48 L52 54 L48 58 L46 62 L42 60 L38 62 L34 66 L32 72 L28 76 L30 82 L34 86 L38 92 L42 94 L44 92 L42 86 L44 82 L48 82 L52 80 L54 76 L58 74 L60 68 L62 62 L64 56 L66 50 L68 44 L70 38 L66 32 L64 26 L62 18 L64 10 Z"
                fill="var(--clr-bg-warm)" stroke="var(--clr-line)" strokeWidth="0.3"
              />
              {extras.map((e, i) => (
                <circle key={i} cx={e.x} cy={e.y} r={e.size * 0.3} fill="var(--clr-teal)" opacity="0.35" />
              ))}
              {cities.map(c => (
                <g key={c.name} onClick={() => setSelected(c)} style={{ cursor: "pointer" }}>
                  <circle cx={c.x} cy={c.y} r={Math.sqrt(c.count) / 5 + 0.8} fill="var(--clr-coral)" opacity="0.85" />
                  <circle cx={c.x} cy={c.y} r={Math.sqrt(c.count) / 5 + 2} fill="var(--clr-coral)" opacity="0.15" />
                  {(c.count > 140 || selected?.name === c.name) && (
                    <text x={c.x + 2} y={c.y + 0.6} fontSize="1.6" fill="var(--clr-navy)" style={{ fontFamily: "var(--font-mono)" }}>
                      {c.name}
                    </text>
                  )}
                </g>
              ))}
            </svg>
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              background: "#fff", padding: "14px 18px",
              borderRadius: "var(--r-sm)", border: "1px solid var(--clr-line)",
              fontSize: 13,
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--clr-muted)", letterSpacing: "0.06em" }}>TOTAL TACKNING</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{total.toLocaleString("sv-SE")}+</div>
              <div style={{ color: "var(--clr-muted)", fontSize: 12 }}>anslutna inlosenstallen</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .butik-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}
