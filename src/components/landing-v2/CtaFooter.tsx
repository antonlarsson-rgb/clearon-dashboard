"use client";

import { useState, useRef } from "react";
import { useSignal } from "./SignalProvider";
import { trackClick, trackLead } from "@/lib/meta-pixel";

export function CtaFooter() {
  const { track, sessionId, segment, score, scrollDepth, dwellTime } =
    useSignal();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    trackClick("submit_form", "landing-v2", "cta_footer");
    setIsSubmitting(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email,
          company: company || null,
          interests: [
            `name:${name || "ej angiven"}`,
            `phone:${phone || "ej angiven"}`,
            `message:${message || "ingen"}`,
            `variant:landing-v2`,
            `segment:${segment}`,
            `score:${score}`,
          ],
        }),
      });

      track("lead:submit", {
        has_phone: !!phone,
        has_company: !!company,
        segment,
        score,
      });
      trackLead("landing-v2", {
        segment,
        has_phone: !!phone,
      });

      setIsSubmitted(true);
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section
        id="kontakt"
        style={{
          padding: "80px 0",
          background: "var(--clr-green-dark)",
        }}
      >
        <div className="c-container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              className="c-eyebrow"
              style={{ color: "var(--clr-lime)", marginBottom: 12 }}
            >
              Kom igang
            </div>
            <h2 className="c-h2" style={{ color: "#fff" }}>
              Redo att oka er forsaljning?
            </h2>
            <p
              className="c-body"
              style={{
                maxWidth: 480,
                margin: "12px auto 0",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Lamna era uppgifter sa kontaktar vi er inom en arbetsdag med ett
              skraddarsytt forslag.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 32,
              justifyContent: "center",
              alignItems: "flex-start",
              flexWrap: "wrap",
              maxWidth: 900,
              margin: "0 auto",
            }}
          >
            {/* Contact form */}
            <div style={{ flex: "1 1 400px", maxWidth: 460 }}>
              {!isSubmitted ? (
                <form ref={formRef} onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Namn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 14,
                        fontFamily: "var(--font-open-sans), sans-serif",
                        outline: "none",
                      }}
                    />
                    <input
                      type="email"
                      placeholder="E-post *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 14,
                        fontFamily: "var(--font-open-sans), sans-serif",
                        outline: "none",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Foretag"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 14,
                        fontFamily: "var(--font-open-sans), sans-serif",
                        outline: "none",
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Telefon (valfritt)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 14,
                        fontFamily: "var(--font-open-sans), sans-serif",
                        outline: "none",
                      }}
                    />
                    <textarea
                      placeholder="Meddelande (valfritt)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 14,
                        fontFamily: "var(--font-open-sans), sans-serif",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="c-btn c-btn--accent"
                      style={{
                        justifyContent: "center",
                        width: "100%",
                        fontSize: 15,
                        padding: "14px 28px",
                        opacity: isSubmitting || !email ? 0.6 : 1,
                      }}
                    >
                      {isSubmitting ? "Skickar..." : "Boka demo"}
                    </button>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "var(--font-open-sans), sans-serif",
                        textAlign: "center",
                      }}
                    >
                      Genom att skicka godkanner du var{" "}
                      <a
                        href="https://www.clearon.se/behandling-av-personuppgifter/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--clr-lime)", textDecoration: "underline" }}
                      >
                        personuppgiftspolicy
                      </a>
                      .
                    </p>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <h3
                    style={{
                      fontFamily: "var(--font-open-sans), sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "var(--clr-lime)",
                      marginBottom: 8,
                    }}
                  >
                    Tack for ert intresse!
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-open-sans), sans-serif",
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Vi aterkommer inom en arbetsdag med ett skraddarsytt forslag.
                  </p>
                </div>
              )}
            </div>

            {/* "What we know" panel */}
            <div
              style={{
                flex: "0 0 260px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "var(--r-md)",
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--clr-lime)",
                  marginBottom: 16,
                }}
              >
                Vad vi vet om er
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { label: "Segment", value: segment },
                  { label: "Score", value: `${score} poang` },
                  { label: "Scroll", value: `${scrollDepth}%` },
                  { label: "Tid pa sidan", value: `${dwellTime}s` },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "var(--font-open-sans), sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "32px 0",
          background: "var(--clr-ink)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="c-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-open-sans), sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            &copy; 2026 ClearOn AB. Alla rattigheter forbehallna.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              {
                label: "Integritetspolicy",
                href: "https://www.clearon.se/behandling-av-personuppgifter/",
              },
              { label: "clearon.se", href: "https://www.clearon.se" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-open-sans), sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
