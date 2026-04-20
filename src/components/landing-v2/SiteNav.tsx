"use client";

import { useState } from "react";

const products = [
  { id: "kuponger", label: "Digitala kuponger" },
  { id: "mobila-presentkort", label: "Mobila presentkort" },
  { id: "sverigechecken", label: "Sverigechecken" },
  { id: "customer-care", label: "Customer Care" },
  { id: "personalbeloning", label: "Personalbeloning" },
  { id: "engage", label: "Engage" },
  { id: "send-a-gift", label: "Send a gift" },
  { id: "clearing", label: "Clearing Solutions" },
];

const navLinkStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "var(--r-sm)",
  textDecoration: "none",
  color: "var(--clr-ink-2)",
  fontWeight: 500,
  transition: "color 0.15s",
  fontSize: 14,
};

export function SiteNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(244, 241, 233, 0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--clr-line)",
    }}>
      <div className="c-container" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--clr-navy)" }}>
          <img src="/clearon-logo.png" alt="ClearOn" style={{ height: 34, width: "auto" }} />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }} className="nav-desktop">
          <div
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
            style={{ position: "relative" }}
          >
            <button style={{
              ...navLinkStyle,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--clr-navy)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              Produkter
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5, transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, marginTop: 8,
                background: "#fff", borderRadius: "var(--r-md)", boxShadow: "var(--sh-lg)",
                border: "1px solid var(--clr-line)", padding: 12,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: 460,
              }}>
                {products.map(p => (
                  <a key={p.id} href={`/${p.id}`} style={{
                    padding: "10px 12px", borderRadius: "var(--r-sm)",
                    textDecoration: "none", color: "var(--clr-ink)",
                    fontSize: 14, transition: "background 0.15s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "var(--clr-bg-warm)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                    {p.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <a href="#hur" style={navLinkStyle}>Sa fungerar det</a>
          <a href="#roi" style={navLinkStyle}>ROI</a>
          <a href="#butiker" style={navLinkStyle}>Butiker</a>
          <a href="#kundcase" style={navLinkStyle}>Kundcase</a>
        </nav>

        <div style={{ display: "flex", gap: 10 }}>
          <a href="#kontakt" className="c-btn c-btn--ghost" style={{ padding: "10px 18px", fontSize: 14 }}>
            Logga in
          </a>
          <a href="#kontakt" className="c-btn c-btn--primary" style={{ padding: "10px 18px", fontSize: 14 }}>
            Boka demo
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .nav-desktop { display: none !important; }
        }
      `}</style>
    </header>
  );
}
