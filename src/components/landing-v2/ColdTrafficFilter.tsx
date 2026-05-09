"use client";

import { useState, useEffect } from "react";
import { useSignal } from "./SignalProvider";

type Step = "company" | "b2c" | "done";

export function ColdTrafficFilter() {
  const [step, setStep] = useState<Step>("company");
  const [softMessage, setSoftMessage] = useState<string | null>(null);
  const { track } = useSignal();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("clearon-ctf-v2");
      if (stored === "qualified") setStep("done");
      if (stored === "soft-private") {
        setStep("done");
        setSoftMessage(
          "ClearOn är för företag. Söker du en kupong eller presentkort? Besök clearon.se."
        );
      }
      if (stored === "soft-b2b") {
        setStep("done");
        setSoftMessage(
          "ClearOn fungerar bäst mot konsument i Sverige. Hör gärna av er ändå."
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = (value: string) => {
    try { localStorage.setItem("clearon-ctf-v2", value); } catch {}
  };

  const onCompany = (answer: "yes" | "no") => {
    track("filter:company", { answer });
    if (answer === "no") {
      persist("soft-private");
      setSoftMessage(
        "ClearOn är för företag. Söker du en kupong eller presentkort? Besök clearon.se."
      );
      setStep("done");
      return;
    }
    setStep("b2c");
  };

  const onB2C = (answer: "yes" | "no") => {
    track("filter:b2c", { answer });
    if (answer === "no") {
      persist("soft-b2b");
      setSoftMessage(
        "ClearOn fungerar bäst mot konsument i Sverige. Hör gärna av er ändå."
      );
      setStep("done");
      return;
    }
    persist("qualified");
    setStep("done");
  };

  if (step === "done" && !softMessage) return null;

  if (step === "done" && softMessage) {
    return (
      <SoftBar
        text={softMessage}
        onContinue={() => {
          persist("qualified");
          setSoftMessage(null);
          setStep("done");
        }}
      />
    );
  }

  return (
    <div style={{
      background: "var(--clr-green-dark)", color: "#fff",
      padding: "14px 0",
    }}>
      <div className="c-container" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, opacity: 0.75 }}>
          {step === "company" ? "1 / 2" : "2 / 2"}
        </span>
        <span style={{ flex: 1, minWidth: 240 }}>
          {step === "company"
            ? "Söker du för er verksamhet?"
            : "Säljer ni mot konsument i Sverige?"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => (step === "company" ? onCompany("yes") : onB2C("yes"))}
            style={pillStyle("yes")}
          >
            Ja
          </button>
          <button
            onClick={() => (step === "company" ? onCompany("no") : onB2C("no"))}
            style={pillStyle("no")}
          >
            Nej
          </button>
        </div>
      </div>
    </div>
  );
}

function SoftBar({ text, onContinue }: { text: string; onContinue: () => void }) {
  return (
    <div style={{
      position: "sticky", top: 64, zIndex: 50,
      background: "var(--clr-beige-warm)",
      borderBottom: "1px solid var(--clr-line)",
      padding: "12px 0",
    }}>
      <div className="c-container" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
        <span style={{ color: "var(--clr-ink-2)", flex: 1, minWidth: 200 }}>
          {text}
        </span>
        <button onClick={onContinue} style={{
          background: "transparent", border: "none", fontSize: 13,
          color: "var(--clr-green-deep)", textDecoration: "underline", cursor: "pointer",
        }}>
          Fortsätt ändå &rarr;
        </button>
      </div>
    </div>
  );
}

function pillStyle(variant: "yes" | "no"): React.CSSProperties {
  if (variant === "yes") {
    return {
      padding: "8px 16px", background: "var(--clr-lime)", color: "var(--clr-green-dark)",
      border: "none", borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 600, cursor: "pointer",
    };
  }
  return {
    padding: "8px 16px", background: "transparent", color: "#fff",
    border: "1px solid rgba(255,255,255,0.4)", borderRadius: "var(--r-pill)",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
  };
}
