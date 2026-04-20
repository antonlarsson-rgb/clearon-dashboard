"use client";

import { useState } from "react";

const CITIES = [
  { name: "Stockholm", x: 62, y: 42, stores: 820 },
  { name: "Goteborg", x: 42, y: 56, stores: 480 },
  { name: "Malmo", x: 48, y: 78, stores: 360 },
  { name: "Uppsala", x: 64, y: 38, stores: 210 },
  { name: "Linkoping", x: 56, y: 52, stores: 150 },
  { name: "Umea", x: 68, y: 18, stores: 120 },
  { name: "Orebro", x: 52, y: 44, stores: 160 },
  { name: "Vaxjo", x: 52, y: 64, stores: 95 },
  { name: "Lulea", x: 72, y: 12, stores: 85 },
  { name: "Karlstad", x: 44, y: 42, stores: 110 },
  { name: "Sundsvall", x: 64, y: 26, stores: 90 },
  { name: "Gavle", x: 64, y: 32, stores: 100 },
  { name: "Jonkoping", x: 50, y: 58, stores: 130 },
  { name: "Norrkoping", x: 60, y: 50, stores: 120 },
  { name: "Halmstad", x: 42, y: 64, stores: 80 },
];

export function StoreFinder() {
  const [search, setSearch] = useState("");
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const filtered = search
    ? CITIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : CITIES;

  return (
    <section
      id="butiker"
      style={{
        padding: "80px 0",
        background: "var(--clr-beige)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Tackning
          </div>
          <h2 className="c-h2">5 000+ butiker i hela Sverige</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 480,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            ClearOns kuponger fungerar i 5 000+ butiker med 20 000 anslutna
            kassor over hela Sverige.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 40,
            justifyContent: "center",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Map */}
          <div
            style={{
              width: 300,
              height: 500,
              background: "var(--clr-cl-surface)",
              borderRadius: "var(--r-lg)",
              position: "relative",
              boxShadow: "var(--sh-md)",
              overflow: "hidden",
              flex: "0 0 300px",
            }}
          >
            {/* Simple Sweden outline */}
            <svg
              viewBox="0 0 100 100"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                inset: 0,
              }}
            >
              {/* Simplified Sweden shape */}
              <path
                d="M45,85 L50,80 L48,75 L52,68 L42,60 L40,55 L45,48 L42,42 L48,38 L55,32 L60,28 L65,22 L70,15 L68,10 L72,8 L70,12 L65,18 L62,24 L58,30 L55,35 L50,40 L54,45 L52,50 L58,55 L55,60 L50,65 L52,72 L48,78 L45,85Z"
                fill="var(--clr-green-soft)"
                stroke="var(--clr-green)"
                strokeWidth="0.5"
              />
              {/* City dots */}
              {CITIES.map((city) => (
                <g key={city.name}>
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={hoveredCity === city.name ? 3 : 2}
                    fill={
                      hoveredCity === city.name
                        ? "var(--clr-orange)"
                        : "var(--clr-green)"
                    }
                    style={{
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHoveredCity(city.name)}
                    onMouseLeave={() => setHoveredCity(null)}
                  />
                  {hoveredCity === city.name && (
                    <text
                      x={city.x + 4}
                      y={city.y - 4}
                      fontSize="3.5"
                      fill="var(--clr-ink)"
                      fontWeight="700"
                      fontFamily="var(--font-open-sans), sans-serif"
                    >
                      {city.name}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Search + List */}
          <div style={{ maxWidth: 340, flex: "1 1 300px" }}>
            <input
              type="text"
              placeholder="Sok stad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "var(--r-sm)",
                border: "1.5px solid var(--clr-line)",
                fontFamily: "var(--font-open-sans), sans-serif",
                fontSize: 14,
                outline: "none",
                background: "var(--clr-cl-surface)",
                marginBottom: 16,
              }}
            />

            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                display: "grid",
                gap: 8,
              }}
            >
              {filtered.map((city) => (
                <div
                  key={city.name}
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--r-sm)",
                    background:
                      hoveredCity === city.name
                        ? "var(--clr-green-soft)"
                        : "var(--clr-cl-surface)",
                    border: "1px solid var(--clr-line-soft)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-open-sans), sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--clr-ink)",
                    }}
                  >
                    {city.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-open-sans), sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--clr-green)",
                    }}
                  >
                    {city.stores} butiker
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
