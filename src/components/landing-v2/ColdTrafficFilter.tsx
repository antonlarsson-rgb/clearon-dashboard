"use client";

import { useState, useEffect } from "react";
import { useSignal } from "./SignalProvider";

export function ColdTrafficFilter() {
  const { track } = useSignal();
  const [visible, setVisible] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("clr_b2c_filter");
    if (stored) {
      setAnswer(stored);
    } else {
      setVisible(true);
    }
  }, []);

  const handleAnswer = (val: "ja" | "nej") => {
    localStorage.setItem("clr_b2c_filter", val);
    setAnswer(val);
    setVisible(false);
    track("filter:b2c", { answer: val });
  };

  if (!visible || answer) return null;

  return (
    <div
      style={{
        background: "var(--clr-green)",
        color: "#fff",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "var(--font-open-sans), sans-serif",
        fontSize: 14,
        fontWeight: 600,
        position: "relative",
        zIndex: 60,
      }}
    >
      <span>Saljer ni till konsument i Sverige?</span>
      <button
        onClick={() => handleAnswer("ja")}
        style={{
          background: "#fff",
          color: "var(--clr-green-deep)",
          border: "none",
          borderRadius: "var(--r-pill)",
          padding: "5px 18px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Ja
      </button>
      <button
        onClick={() => handleAnswer("nej")}
        style={{
          background: "transparent",
          color: "#fff",
          border: "1.5px solid rgba(255,255,255,0.5)",
          borderRadius: "var(--r-pill)",
          padding: "5px 18px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Nej
      </button>
      <button
        onClick={() => setVisible(false)}
        style={{
          position: "absolute",
          right: 16,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          fontSize: 18,
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Stang"
      >
        x
      </button>
    </div>
  );
}
