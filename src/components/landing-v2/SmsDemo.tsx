"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const campaigns: Record<string, { brand: string; offer: string; color: string; icon: string }> = {
  ica: { brand: "ICA", offer: "20 kr på OATLY Havredryck", color: "#e70713", icon: "ICA" },
  hm: { brand: "H&M Home", offer: "150 kr välkomstcheck", color: "#222", icon: "H&M" },
  apoteket: { brand: "Apoteket", offer: "Gratis Multivitamin (50 st)", color: "#00994d", icon: "Apo" },
};

export function SmsDemo() {
  const { track } = useSignal();
  const [phone, setPhone] = useState("070-123 45 67");
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState("ica");

  const c = campaigns[campaign];

  const send = () => {
    track("sms:send", { phone, campaign });
    setStep(1);
    setTimeout(() => setStep(2), 900);
    setTimeout(() => setStep(3), 3800);
  };

  const reset = () => setStep(0);

  return (
    <section id="sms-demo" style={{ padding: "120px 0", background: "var(--clr-surface-alt)", borderTop: "1px solid var(--clr-line)", borderBottom: "1px solid var(--clr-line)" }}>
      <div className="c-container">
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }} className="smsdemo-grid">
          <div>
            <div className="c-eyebrow" style={{ marginBottom: 14 }}>Live demo, prova själv</div>
            <h2 className="c-h2" style={{ marginBottom: 20 }}>Från kampanj till kassa.<br/>Prova flödet.</h2>
            <p className="c-body-lg" style={{ marginBottom: 32, maxWidth: 520 }}>
              Skriv in ett (fiktivt) telefonnummer och skicka ett exempel-erbjudande.
              Se hur mottagaren får SMS, öppnar sin värdebärare och löser in i butik.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--clr-ink-2)", marginBottom: 8 }}>
                Välj kampanj
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(campaigns).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setCampaign(k); reset(); }}
                    style={{
                      padding: "10px 16px",
                      background: campaign === k ? "var(--clr-navy)" : "#fff",
                      color: campaign === k ? "#fff" : "var(--clr-ink)",
                      border: `1px solid ${campaign === k ? "var(--clr-navy)" : "var(--clr-line)"}`,
                      borderRadius: "var(--r-pill)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}
                  >{v.brand}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--clr-ink-2)", marginBottom: 8 }}>
                  Telefonnummer
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    width: "100%", padding: "14px 16px",
                    border: "1px solid var(--clr-line)", background: "#fff",
                    borderRadius: "var(--r-sm)", fontSize: 15, fontFamily: "var(--font-mono)",
                  }}
                />
              </div>
              <button
                onClick={send}
                disabled={step > 0 && step < 3}
                className="c-btn c-btn--primary"
                style={{ height: 48, minWidth: 150, justifyContent: "center", opacity: step > 0 && step < 3 ? 0.5 : 1 }}
              >
                {step === 0 ? "Skicka SMS" : step < 3 ? "Skickar..." : "Skicka igen"}
              </button>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 24, color: "var(--clr-muted)", fontSize: 13, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              <StepIndicator n="1" label="SKICKA" active={step >= 1} />
              <StepIndicator n="2" label="SMS" active={step >= 2} />
              <StepIndicator n="3" label="ÖPPNA" active={step >= 3} />
              <StepIndicator n="4" label="BUTIK" active={step >= 4} />
            </div>
          </div>

          {/* Phone mock */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 300, height: 600,
              background: "#0b1220",
              borderRadius: 48,
              padding: 10,
              boxShadow: "var(--sh-xl)",
              position: "relative",
              border: "1px solid #222",
            }}>
              <div style={{
                width: "100%", height: "100%",
                background: "#f5f5f7",
                borderRadius: 38,
                overflow: "hidden",
                position: "relative",
              }}>
                {/* Notch */}
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 110, height: 28, background: "#0b1220",
                  borderRadius: "0 0 16px 16px", zIndex: 10,
                }} />

                {step <= 1 && <HomeScreen />}
                {step === 2 && <SmsScreen campaign={c} onOpen={() => setStep(3)} />}
                {step === 3 && <LandingScreen campaign={c} onRedeem={() => setStep(4)} />}
                {step === 4 && <RedeemedScreen campaign={c} onBack={() => setStep(0)} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .smsdemo-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

function StepIndicator({ n, label, active }: { n: string; label: string; active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: active ? 1 : 0.4, transition: "opacity 0.3s" }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        background: active ? "var(--clr-teal)" : "var(--clr-line)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 10, fontWeight: 700,
      }}>{n}</span>
      <span>{label}</span>
    </div>
  );
}

function HomeScreen() {
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(180deg, #a5b8d6 0%, #4c6ea0 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0 0",
      color: "#fff",
    }}>
      <div style={{ fontSize: 14, marginTop: 6 }}>fredag 20 april</div>
      <div style={{ fontSize: 72, fontWeight: 200, letterSpacing: "-0.04em", marginTop: -4 }}>{hh}:{mm}</div>
    </div>
  );
}

function SmsScreen({ campaign, onOpen }: { campaign: { brand: string; offer: string; color: string }; onOpen: () => void }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#f5f5f7", padding: "36px 16px 16px" }}>
      <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
        SMS &middot; nu
      </div>
      <div style={{
        background: "#fff", padding: 14, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{campaign.brand}</div>
          <div style={{ fontSize: 11, color: "#888" }}>nu</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: "#222" }}>
          Tack för att du är kund! Här är en värdecheck på {campaign.offer.toLowerCase()}. Gäller i 30 dagar i 5 000+ butiker.
          <br/><br/>
          <span style={{ color: campaign.color, textDecoration: "underline", cursor: "pointer" }}
            onClick={onOpen}>
            clearon.se/v/7A3F9X
          </span>
        </div>
      </div>
      <button
        onClick={onOpen}
        style={{
          marginTop: 20, width: "100%",
          padding: 12, background: "var(--clr-navy)", color: "#fff",
          border: "none", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
        }}>
        Öppna länken &rarr;
      </button>
    </div>
  );
}

function LandingScreen({ campaign, onRedeem }: { campaign: { brand: string; offer: string; color: string }; onRedeem: () => void }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#fff", padding: "36px 16px 16px", overflow: "auto" }}>
      <div style={{
        background: campaign.color, color: "#fff",
        padding: 14, borderRadius: 12, marginBottom: 14, textAlign: "center",
        fontWeight: 700, fontSize: 16,
      }}>
        {campaign.brand}
      </div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontFamily: "var(--font-mono)" }}>DIN VÄRDECHECK</div>
      <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, marginBottom: 14 }}>{campaign.offer}</div>

      <div style={{
        padding: 16, background: "#fafaf7",
        border: "2px dashed var(--clr-line)", borderRadius: 12,
        textAlign: "center", marginBottom: 14,
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#888", letterSpacing: "0.1em" }}>EAN</div>
        <svg width="100%" height="60" viewBox="0 0 200 60" style={{ marginTop: 6 }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <rect key={i} x={i * 5} y="0" width={i % 3 === 0 ? 3 : 1.5} height="50" fill="#0b1220" />
          ))}
        </svg>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, marginTop: 6 }}>7 300123 45678 9</div>
      </div>

      <button onClick={onRedeem} style={{
        width: "100%", padding: 14, background: "var(--clr-navy)", color: "#fff",
        border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer",
      }}>
        Visa i kassan &rarr;
      </button>
      <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 10 }}>
        Giltig i 5 000+ butiker &middot; t.o.m. 20 maj
      </div>
    </div>
  );
}

function RedeemedScreen({ campaign, onBack }: { campaign: { brand: string }; onBack: () => void }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(160deg, var(--clr-teal) 0%, var(--clr-navy) 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, color: "#fff", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32"><path d="M8 16 l5 5 L24 10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.02em" }}>Inlöst!</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>Clearingen sker automatiskt mellan butik och {campaign.brand}.</div>
      <button onClick={onBack} style={{
        padding: "10px 18px", background: "rgba(255,255,255,0.2)", color: "#fff",
        border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, fontSize: 13, cursor: "pointer",
      }}>
        Börja om
      </button>
    </div>
  );
}
