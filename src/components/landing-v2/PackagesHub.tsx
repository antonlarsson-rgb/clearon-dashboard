"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const PACKAGES = [
  {
    id: "sales-promotion",
    name: "Sales Promotion",
    desc: "Fysiska kuponger i butik. Driva kop via dagligvaruhandeln med full sparbarhet.",
    color: "#2D6A4F",
    icon: "🎫",
    href: "/sales-promotion",
  },
  {
    id: "interactive-engage",
    name: "Interactive Engage",
    desc: "Gamification som driver +16% extra forsaljning. Spel, tavlingar, scratch cards.",
    color: "#E07A5F",
    icon: "🎮",
    href: "/interactive-engage",
  },
  {
    id: "customer-care",
    name: "Customer Care",
    desc: "Digital kompensation via SMS. Vand missnoje till lojalitet pa sekunder.",
    color: "#4A90A4",
    icon: "💬",
    href: "/customer-care",
  },
  {
    id: "send-a-gift",
    name: "Send a Gift",
    desc: "Digitala presentkort for personalbeloning. Skatteeffektivt, noll administration.",
    color: "#D4A574",
    icon: "🎁",
    href: "/send-a-gift",
  },
  {
    id: "kampanja",
    name: "Kampanja",
    desc: "Bygg kampanjsidor och distribuera kuponger via SMS pa minuter.",
    color: "#7B68EE",
    icon: "📣",
    href: "/kampanja",
  },
];

const INFRA_ITEMS = [
  "20 000 kassasystem",
  "5 000+ butiker",
  "Realtidsclearing",
  "SMS-gateway",
  "API-integrationer",
];

export function PackagesHub() {
  const { track } = useSignal();
  const [activePackage, setActivePackage] = useState<string | null>(null);
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);

  return (
    <section
      id="produkter"
      style={{
        padding: "80px 0",
        background: "var(--clr-cl-surface)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Produkter
          </div>
          <h2 className="c-h2">Ett verktyg. Fem paketeringar.</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 540,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            Alla bygger pa samma infrastruktur: 20 000 anslutna kassor, 5 000
            butiker, och realtidsclearing.
          </p>
        </div>

        {/* Hub visualization */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 48,
            position: "relative",
            minHeight: 200,
          }}
        >
          {/* Center core */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "var(--clr-green)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "var(--font-open-sans), sans-serif",
              fontWeight: 800,
              fontSize: 14,
              position: "relative",
              zIndex: 2,
              boxShadow: "var(--sh-lg)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
              ClearOn
            </div>
            <div>Core</div>
            {/* Pulsing ring */}
            <div
              className="animate-pulse-ring"
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: "2px solid var(--clr-green)",
                opacity: 0.3,
              }}
            />
          </div>

          {/* Spoke dots */}
          {PACKAGES.map((pkg, i) => {
            const angle = (i * 360) / PACKAGES.length - 90;
            const rad = (angle * Math.PI) / 180;
            const radius = 130;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <div
                key={pkg.id}
                onMouseEnter={() => {
                  setHoveredPackage(pkg.id);
                  track("product:hover", { product: pkg.id });
                }}
                onMouseLeave={() => setHoveredPackage(null)}
                onClick={() => {
                  setActivePackage(
                    activePackage === pkg.id ? null : pkg.id
                  );
                  track("product:expand", { product: pkg.id });
                }}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    hoveredPackage === pkg.id
                      ? pkg.color
                      : "var(--clr-cl-surface)",
                  border: `2px solid ${pkg.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  cursor: "pointer",
                  transition: "all 0.25s var(--ease-out)",
                  boxShadow:
                    hoveredPackage === pkg.id ? "var(--sh-md)" : "var(--sh-sm)",
                  zIndex: 3,
                }}
                title={pkg.name}
              >
                {pkg.icon}
              </div>
            );
          })}
        </div>

        {/* Package cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="c-card"
              onClick={() => {
                setActivePackage(
                  activePackage === pkg.id ? null : pkg.id
                );
                track("product:expand", { product: pkg.id });
              }}
              style={{
                cursor: "pointer",
                borderColor:
                  activePackage === pkg.id
                    ? pkg.color
                    : "var(--clr-line-soft)",
                borderWidth: activePackage === pkg.id ? 2 : 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>{pkg.icon}</span>
                <span
                  style={{
                    fontFamily: "var(--font-open-sans), sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "var(--clr-ink)",
                  }}
                >
                  {pkg.name}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 13,
                  color: "var(--clr-muted)",
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                {pkg.desc}
              </p>
              <a
                href={pkg.href}
                onClick={(e) => {
                  e.stopPropagation();
                  track("product:cta", { product: pkg.id });
                }}
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: pkg.color,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Las mer
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8H13M13 8L9 4M13 8L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          ))}
        </div>

        {/* Infrastructure footer strip */}
        <div
          style={{
            background: "var(--clr-green-tint)",
            borderRadius: "var(--r-lg)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--clr-green-deep)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Infrastruktur:
          </span>
          {INFRA_ITEMS.map((item) => (
            <span
              key={item}
              className="c-chip"
              style={{ fontSize: 12, padding: "4px 12px" }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
