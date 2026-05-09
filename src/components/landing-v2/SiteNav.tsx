"use client";

const navLinkStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "var(--r-sm)",
  textDecoration: "none",
  color: "var(--clr-ink-2)",
  fontWeight: 500,
  transition: "color 0.15s",
  fontSize: 14,
};

const NAV_ITEMS = [
  { href: "#hur", label: "Så fungerar det" },
  { href: "#for-er", label: "För er" },
  { href: "#cases", label: "Cases" },
  { href: "#nar", label: "När det passar" },
  { href: "#roi", label: "ROI" },
];

export function SiteNav() {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clearon-logo.png" alt="ClearOn" style={{ height: 34, width: "auto" }} />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }} className="nav-desktop">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} style={navLinkStyle}>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="https://www.clearon.se"
            target="_blank"
            rel="noopener noreferrer"
            className="c-btn c-btn--ghost"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            clearon.se
          </a>
          <a href="#kontakt" className="c-btn c-btn--cta" style={{ padding: "10px 18px", fontSize: 14 }}>
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
