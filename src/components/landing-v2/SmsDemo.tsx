"use client";

import { useState } from "react";
import { useSignal } from "./SignalProvider";

const CAMPAIGNS = [
  {
    id: "ica",
    brand: "ICA",
    color: "#e3000b",
    message: "Hej! Har ar din kupong pa 25 kr rabatt pa ditt nasta kop hos ICA. Klicka for att aktivera:",
    landingTitle: "25 kr rabatt",
    landingDesc: "Giltig i alla ICA-butiker",
  },
  {
    id: "hm",
    brand: "H&M",
    color: "#222",
    message: "Valkomstpresent fran H&M! 50 kr rabatt pa kop over 300 kr. Aktivera har:",
    landingTitle: "50 kr rabatt",
    landingDesc: "Kop over 300 kr",
  },
  {
    id: "apoteket",
    brand: "Apoteket",
    color: "#00843d",
    message: "Tack for ditt kop! Har ar 20% rabatt pa din nasta bestallning. Oppna kupong:",
    landingTitle: "20% rabatt",
    landingDesc: "Nasta bestallning",
  },
];

type DemoStep = "select" | "sms" | "landing" | "redeemed";

export function SmsDemo() {
  const { track } = useSignal();
  const [campaign, setCampaign] = useState(CAMPAIGNS[0]);
  const [step, setStep] = useState<DemoStep>("select");
  const [phone, setPhone] = useState("");

  const handleSend = () => {
    if (!phone) return;
    track("sms:send", { campaign: campaign.id, phone_length: phone.length });
    setStep("sms");
  };

  const advance = () => {
    const steps: DemoStep[] = ["select", "sms", "landing", "redeemed"];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1]);
    }
  };

  const reset = () => {
    setStep("select");
    setPhone("");
  };

  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--clr-surface-alt)",
      }}
    >
      <div className="c-container">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="c-eyebrow" style={{ marginBottom: 12 }}>
            Prova sjalv
          </div>
          <h2 className="c-h2">Se hur en SMS-kupong fungerar</h2>
          <p
            className="c-body"
            style={{
              maxWidth: 480,
              margin: "12px auto 0",
              color: "var(--clr-muted)",
            }}
          >
            Valj ett varumarke, fyll i ett telefonnummer (sparas ej) och se
            hela flodet.
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
          {/* Left: controls */}
          <div style={{ maxWidth: 360, flex: "1 1 320px" }}>
            {/* Campaign selector */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--clr-muted)",
                  marginBottom: 8,
                  fontFamily: "var(--font-open-sans), sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Valj varumarke
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {CAMPAIGNS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCampaign(c);
                      reset();
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--r-pill)",
                      border:
                        campaign.id === c.id
                          ? `2px solid ${c.color}`
                          : "1.5px solid var(--clr-line)",
                      background:
                        campaign.id === c.id
                          ? c.color
                          : "var(--clr-cl-surface)",
                      color: campaign.id === c.id ? "#fff" : "var(--clr-ink)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-open-sans), sans-serif",
                    }}
                  >
                    {c.brand}
                  </button>
                ))}
              </div>
            </div>

            {step === "select" && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--clr-muted)",
                    marginBottom: 8,
                    fontFamily: "var(--font-open-sans), sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Telefonnummer (demo)
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="tel"
                    placeholder="070 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "var(--r-sm)",
                      border: "1.5px solid var(--clr-line)",
                      fontFamily: "var(--font-open-sans), sans-serif",
                      fontSize: 14,
                      outline: "none",
                      background: "var(--clr-cl-surface)",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!phone}
                    className="c-btn c-btn--primary"
                    style={{
                      padding: "10px 20px",
                      fontSize: 13,
                      opacity: phone ? 1 : 0.5,
                    }}
                  >
                    Skicka
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--clr-muted)",
                    marginTop: 8,
                    fontFamily: "var(--font-open-sans), sans-serif",
                  }}
                >
                  Inget SMS skickas. Det ar en visuell demo.
                </p>
              </div>
            )}

            {step !== "select" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {(["sms", "landing", "redeemed"] as DemoStep[]).map((s, i) => (
                    <div
                      key={s}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "6px 0",
                        borderBottom: `2px solid ${
                          step === s
                            ? "var(--clr-green)"
                            : "var(--clr-line)"
                        }`,
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          step === s
                            ? "var(--clr-green)"
                            : "var(--clr-muted)",
                        fontFamily: "var(--font-open-sans), sans-serif",
                        cursor: "pointer",
                      }}
                      onClick={() => setStep(s)}
                    >
                      {i + 1}. {s === "sms" ? "SMS" : s === "landing" ? "Kupong" : "Inlost"}
                    </div>
                  ))}
                </div>
                <button
                  onClick={step === "redeemed" ? reset : advance}
                  className="c-btn c-btn--primary"
                  style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                >
                  {step === "redeemed" ? "Borja om" : "Nasta steg →"}
                </button>
              </div>
            )}
          </div>

          {/* Right: iPhone mock */}
          <div
            style={{
              width: 280,
              minHeight: 500,
              background: "#1a1a1a",
              borderRadius: 36,
              padding: "48px 16px 32px",
              position: "relative",
              boxShadow: "var(--sh-xl)",
              flex: "0 0 280px",
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: 80,
                height: 24,
                borderRadius: 12,
                background: "#000",
              }}
            />

            {/* Screen content */}
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                minHeight: 400,
                overflow: "hidden",
              }}
            >
              {step === "select" && (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#999",
                    fontSize: 14,
                    fontFamily: "var(--font-open-sans), sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 400,
                  }}
                >
                  Skriv in ett nummer och klicka Skicka for att starta demon
                </div>
              )}

              {step === "sms" && (
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 11,
                      color: "#999",
                      marginBottom: 16,
                      fontFamily: "var(--font-open-sans), sans-serif",
                    }}
                  >
                    SMS fran {campaign.brand}
                  </div>
                  <div
                    style={{
                      background: "#e8e8e8",
                      borderRadius: 16,
                      padding: "12px 14px",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#333",
                      fontFamily: "var(--font-open-sans), sans-serif",
                      maxWidth: "80%",
                    }}
                  >
                    {campaign.message}
                    <div
                      style={{
                        color: "#007AFF",
                        fontSize: 13,
                        marginTop: 8,
                        textDecoration: "underline",
                      }}
                    >
                      clearon.live/k/{campaign.id}
                    </div>
                  </div>
                </div>
              )}

              {step === "landing" && (
                <div>
                  <div
                    style={{
                      background: campaign.color,
                      padding: "32px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 4,
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      {campaign.brand}
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 28,
                        fontWeight: 800,
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      {campaign.landingTitle}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 13,
                        marginTop: 4,
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      {campaign.landingDesc}
                    </div>
                  </div>
                  <div style={{ padding: 16, textAlign: "center" }}>
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        margin: "16px auto",
                        background: "#f0f0f0",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "#999",
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      [QR-kod]
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#666",
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      Visa denna QR-kod i kassan
                    </p>
                  </div>
                </div>
              )}

              {step === "redeemed" && (
                <div
                  style={{
                    padding: 32,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 400,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#2D6A4F",
                      fontFamily: "var(--font-open-sans), sans-serif",
                      marginBottom: 8,
                    }}
                  >
                    Inlost!
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#666",
                      fontFamily: "var(--font-open-sans), sans-serif",
                    }}
                  >
                    Kupongen ar inlost och avraknad automatiskt via ClearOns
                    clearing-infrastruktur.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
