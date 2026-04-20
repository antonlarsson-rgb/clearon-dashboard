"use client";

import { useState, useEffect } from "react";
import { useSignal } from "./SignalProvider";

export function ColdTrafficFilter() {
  const [answered, setAnswered] = useState<string | null>(null);
  const { track } = useSignal();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("clearon-ctf");
      if (stored) setAnswered(stored);
    } catch {
      // ignore
    }
  }, []);

  const answer = (v: string) => {
    setAnswered(v);
    try { localStorage.setItem("clearon-ctf", v); } catch {}
    track("filter:b2c", { answer: v });
  };

  if (answered === "yes") return null;

  if (answered === "no") {
    return (
      <div style={{
        position: "sticky", top: 64, zIndex: 50,
        background: "var(--clr-beige-warm)",
        borderBottom: "1px solid var(--clr-line)",
        padding: "12px 0",
      }}>
        <div className="c-container" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
          <span style={{ color: "var(--clr-ink-2)", flex: 1, minWidth: 200 }}>
            Tack för att du tittade. ClearOn hjälper företag som säljer till konsument i Sverige, kanske är vi inte rätt match idag, men vi gör det gärna om något ändras.
          </span>
          <button onClick={() => answer("yes")} style={{
            background: "transparent", border: "none", fontSize: 13, color: "var(--clr-green-dark)",
            textDecoration: "underline", cursor: "pointer",
          }}>
            Fortsätt ändå &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--clr-green-dark)", color: "#fff",
      padding: "14px 0",
    }}>
      <div className="c-container" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", opacity: 0.7 }}>
          SNABB KOLL
        </span>
        <span style={{ flex: 1, minWidth: 240 }}>
          Säljer ni till konsument i Sverige? Det är där ClearOn fungerar bäst.
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => answer("yes")} style={{
            padding: "8px 16px", background: "var(--clr-lime)", color: "var(--clr-green-dark)",
            border: "none", borderRadius: "var(--r-pill)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Ja</button>
          <button onClick={() => answer("no")} style={{
            padding: "8px 16px", background: "transparent", color: "#fff",
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: "var(--r-pill)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>Nej</button>
        </div>
      </div>
    </div>
  );
}
