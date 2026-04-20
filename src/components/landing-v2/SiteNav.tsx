"use client";

import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Produkter", href: "#produkter", hasDropdown: true },
  { label: "Sa fungerar det", href: "#hur-det-fungerar" },
  { label: "ROI", href: "#roi" },
  { label: "Butiker", href: "#butiker" },
  { label: "Kundcase", href: "#kundcase" },
];

const PRODUCT_DROPDOWN = [
  { label: "Sales Promotion", href: "/sales-promotion" },
  { label: "Interactive Engage", href: "/interactive-engage" },
  { label: "Customer Care", href: "/customer-care" },
  { label: "Kampanja", href: "/kampanja" },
  { label: "Send a Gift", href: "/send-a-gift" },
  { label: "Personalbeloning", href: "/personalbeloning" },
  { label: "Kuponger", href: "/kuponger" },
  { label: "Mobila Presentkort", href: "/mobila-presentkort" },
  { label: "Clearing", href: "/clearing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled
          ? "rgba(244,241,233,0.92)"
          : "rgba(244,241,233,0.6)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled
          ? "1px solid var(--clr-line)"
          : "1px solid transparent",
        transition: "all 0.3s var(--ease-out)",
      }}
    >
      <div
        className="c-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <img
            src="/clearon-logo.png"
            alt="ClearOn"
            style={{ height: 32, width: "auto" }}
          />
        </a>

        {/* Desktop nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              style={{ position: "relative" }}
              onMouseEnter={() =>
                link.hasDropdown && setDropdownOpen(true)
              }
              onMouseLeave={() =>
                link.hasDropdown && setDropdownOpen(false)
              }
            >
              <a
                href={link.href}
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--clr-ink-2)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) =>
                  ((e.target as HTMLElement).style.color =
                    "var(--clr-green)")
                }
                onMouseOut={(e) =>
                  ((e.target as HTMLElement).style.color =
                    "var(--clr-ink-2)")
                }
              >
                {link.label}
                {link.hasDropdown && (
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </a>
              {link.hasDropdown && dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: -16,
                    paddingTop: 8,
                  }}
                >
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid var(--clr-line)",
                      borderRadius: "var(--r-md)",
                      padding: 12,
                      boxShadow: "var(--sh-lg)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                      width: 460,
                    }}
                  >
                    {PRODUCT_DROPDOWN.map((p) => (
                      <a
                        key={p.href}
                        href={p.href}
                        style={{
                          display: "block",
                          padding: "10px 12px",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--clr-ink)",
                          textDecoration: "none",
                          transition: "background 0.15s",
                          borderRadius: "var(--r-sm)",
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                        onMouseOver={(e) =>
                          ((e.target as HTMLElement).style.background =
                            "var(--clr-beige-warm)")
                        }
                        onMouseOut={(e) =>
                          ((e.target as HTMLElement).style.background =
                            "transparent")
                        }
                      >
                        {p.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 12 }}
          className="desktop-nav"
        >
          <a
            href="https://dashboard.clearon.live"
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--clr-ink-2)",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "var(--r-pill)",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              ((e.target as HTMLElement).style.background =
                "var(--clr-green-tint)")
            }
            onMouseOut={(e) =>
              ((e.target as HTMLElement).style.background = "transparent")
            }
          >
            Logga in
          </a>
          <a
            href="#kontakt"
            className="c-btn c-btn--primary"
            style={{ fontSize: 13, padding: "8px 20px" }}
          >
            Boka demo
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: "var(--clr-ink)",
          }}
          aria-label="Meny"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="mobile-menu"
          style={{
            background: "var(--clr-beige)",
            borderTop: "1px solid var(--clr-line)",
            padding: "16px 24px 24px",
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--clr-ink)",
                textDecoration: "none",
                borderBottom: "1px solid var(--clr-line-soft)",
                fontFamily: "var(--font-open-sans), sans-serif",
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <a
              href="https://dashboard.clearon.live"
              className="c-btn c-btn--ghost"
              style={{ flex: 1, justifyContent: "center", fontSize: 14 }}
            >
              Logga in
            </a>
            <a
              href="#kontakt"
              className="c-btn c-btn--primary"
              style={{ flex: 1, justifyContent: "center", fontSize: 14 }}
              onClick={() => setMobileOpen(false)}
            >
              Boka demo
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-toggle { display: block !important; }
        }
        @media (min-width: 961px) {
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
