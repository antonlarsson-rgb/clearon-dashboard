"use client";

import { useState, useRef } from "react";
import { useSignal } from "./SignalProvider";
import { trackClick, trackLead } from "@/lib/meta-pixel";

export function CtaFooter() {
  const { track, sessionId, segment, score, scrollDepth, dwellTime } = useSignal();

  return (
    <>
      <section id="kontakt" style={{ padding: "120px 0 80px", background: "var(--clr-navy)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", bottom: -120, right: -120, width: 400, height: 400,
          borderRadius: "50%", background: "var(--clr-coral)", opacity: 0.2, filter: "blur(60px)",
        }} />
        <div className="c-container" style={{ position: "relative" }}>
          <div style={{ maxWidth: 820, marginBottom: 56 }}>
            <div className="c-eyebrow" style={{ color: "var(--clr-yellow)", marginBottom: 16 }}>Redo att komma igång?</div>
            <h2 className="c-h2" style={{ color: "#fff", marginBottom: 24 }}>
              En timmes setup.<br/>Resten sköter vi.
            </h2>
            <p className="c-body-lg" style={{ color: "rgba(255,255,255,0.75)", maxWidth: 560 }}>
              Boka ett kort möte. Vi lyssnar på vad ni vill uppnå och visar exakt hur ClearOn löser det, med riktiga exempel från er bransch.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "start" }} className="cta-grid">
            <ContactForm track={track} sessionId={sessionId} segment={segment} score={score} />
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "var(--r-lg)",
              padding: 32,
            }}>
              <div className="c-eyebrow" style={{ color: "var(--clr-yellow)", marginBottom: 14 }}>Det vi redan vet om er</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
                <FactRow label="Segment" value={segment || "ännu okänd"} />
                <FactRow label="Score" value={`${score} poäng`} />
                <FactRow label="Scroll" value={`${scrollDepth}%`} />
                <FactRow label="Tid på sidan" value={`${dwellTime}s`} />
              </div>
              <div style={{ marginTop: 20, padding: 14, background: "rgba(255, 199, 44, 0.12)", borderRadius: "var(--r-sm)", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.8)" }}>
                Vi har märkt vad du läst. Så slipper du upprepa det i mötet.
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </section>

      <style>{`
        @media (max-width: 960px) {
          .cta-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ContactForm({ track, sessionId, segment, score }: {
  track: (event: string, data?: Record<string, unknown>) => void;
  sessionId: string;
  segment: string;
  score: number;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", msg: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;

    trackClick("submit_form", "landing-v2", "cta_footer");
    setIsSubmitting(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email: form.email,
          company: form.company || null,
          interests: [
            `name:${form.name || "ej angiven"}`,
            `message:${form.msg || "ingen"}`,
            `variant:landing-v2`,
            `segment:${segment}`,
            `score:${score}`,
          ],
        }),
      });

      track("lead:submit", { has_company: !!form.company, segment, score });
      trackLead("landing-v2", { segment });
      setSubmitted(true);
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: 40, background: "rgba(255,255,255,0.08)", borderRadius: "var(--r-lg)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, color: "var(--clr-yellow)" }}>&#x2713;</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Tack!</div>
        <div style={{ color: "rgba(255,255,255,0.7)" }}>En säljare hör av sig inom en arbetsdag.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Namn" value={form.name} onChange={v => setForm({ ...form, name: v })} />
      <Field label="E-post" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <Field label="Företag" value={form.company} onChange={v => setForm({ ...form, company: v })} />
      <Field label="Vad vill ni lösa?" multiline value={form.msg} onChange={v => setForm({ ...form, msg: v })} />
      <button type="submit" disabled={isSubmitting || !form.email} className="c-btn" style={{
        background: "var(--clr-yellow)", color: "var(--clr-navy)",
        justifyContent: "center", padding: "16px", fontSize: 15, fontWeight: 600, marginTop: 6,
        opacity: isSubmitting || !form.email ? 0.6 : 1,
        border: "none", borderRadius: "var(--r-md)", cursor: "pointer",
      }}>
        {isSubmitting ? "Skickar..." : "Boka demo \u2192"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", multiline }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean;
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
      <Tag
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={multiline ? 3 : undefined}
        style={{
          width: "100%", padding: "14px 16px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "var(--r-sm)",
          color: "#fff", fontSize: 15, fontFamily: "inherit", resize: "vertical",
        }}
      />
    </label>
  );
}

function Footer() {
  return (
    <footer style={{ marginTop: 96, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="footer-grid">
        <div>
          <img src="/clearon-logo.png" alt="ClearOn" style={{ height: 34, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.7 }} />
          <p style={{ marginTop: 16, color: "rgba(255,255,255,0.6)", fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>
            Digitala kupong- och belöningslösningar för kundförvärv, kundvård och personalbelöning.
          </p>
        </div>
        <FooterCol title="Produkter" items={["Digitala kuponger", "Mobila presentkort", "Sverigechecken", "Customer Care", "Clearing Solutions"]} />
        <FooterCol title="Företag" items={["Om ClearOn", "Karriär", "Event", "Artiklar", "Hållbarhet"]} />
        <FooterCol title="Kontakt" items={["Kontakta oss", "Frågor och svar", "Hitta butik", "Kontrollera värdebärare", "Logga in"]} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.4)", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <span>&copy; 2026 ClearOn AB &middot; Liljeholmsstranden 3, 117 61 Stockholm</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>Integritet &middot; Cookies</span>

      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 14, textTransform: "uppercase" }}>{title}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(i => (
          <li key={i} style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
