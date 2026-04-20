"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useTracking } from "@/hooks/use-tracking";

interface SignalContextValue {
  track: (event: string, data?: Record<string, unknown>) => void;
  sessionId: string;
  scrollDepth: number;
  dwellTime: number;
  segment: string;
  score: number;
}

const SignalContext = createContext<SignalContextValue>({
  track: () => {},
  sessionId: "",
  scrollDepth: 0,
  dwellTime: 0,
  segment: "unknown",
  score: 0,
});

export function useSignal() {
  return useContext(SignalContext);
}

const EVENT_MAP: Record<string, string> = {
  "problem:pick": "hero:role",
  "role:pick": "hero:role",
  "product:hover": "product:expand",
  "product:expand": "product:expand",
  "product:cta": "product:expand",
  "game:open": "game:start",
  "game:spin": "game:start",
  "game:scratch": "game:start",
  "game:win": "game:win",
  "game:quiz-answer": "game:start",
  "quiz:answer": "quiz:answer",
  "quiz:result": "quiz:complete",
  "quiz:cta": "quiz:complete",
  "usecase:open": "usecase:expand",
  "sms:send": "sms-demo:send",
  "roi:compute": "roi:adjust",
  "filter:b2c": "cold-traffic:answer",
  "module:engage": "module:engage",
};

function computeSegment(score: number): string {
  if (score >= 60) return "hot";
  if (score >= 30) return "warm";
  if (score >= 10) return "curious";
  return "cold";
}

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const { sessionId, trackEvent } = useTracking();
  const [scrollDepth, setScrollDepth] = useState(0);
  const [dwellTime, setDwellTime] = useState(0);
  const [score, setScore] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const eventsRef = useRef<string[]>([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShowPanel(params.get("debug") === "1");
  }, []);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const depth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      setScrollDepth((prev) => Math.max(prev, depth));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dwell time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setDwellTime(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll milestones
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (scrollDepth >= m && !eventsRef.current.includes(`scroll:${m}`)) {
        eventsRef.current.push(`scroll:${m}`);
        trackEvent("scroll_depth", { depth: m });
      }
    }
  }, [scrollDepth, trackEvent]);

  const track = useCallback(
    (event: string, data?: Record<string, unknown>) => {
      const mappedEvent = EVENT_MAP[event] || event;
      trackEvent(mappedEvent, data || {});

      // Score events
      const scoreMap: Record<string, number> = {
        "hero:role": 10,
        "product:expand": 5,
        "game:start": 8,
        "game:win": 12,
        "quiz:answer": 6,
        "quiz:complete": 15,
        "usecase:expand": 5,
        "sms-demo:send": 10,
        "roi:adjust": 8,
        "cold-traffic:answer": 3,
      };
      const points = scoreMap[mappedEvent] || 2;
      setScore((prev) => prev + points);
    },
    [trackEvent]
  );

  const segment = computeSegment(score);

  return (
    <SignalContext.Provider
      value={{ track, sessionId, scrollDepth, dwellTime, segment, score }}
    >
      {children}
      {showPanel && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 9999,
            background: "rgba(42,51,38,0.95)",
            color: "#c8e66b",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            padding: "12px 16px",
            borderRadius: "var(--r-sm)",
            minWidth: 200,
            boxShadow: "var(--sh-xl)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>
            Signal Panel
          </div>
          <div>Session: {sessionId.slice(0, 8)}...</div>
          <div>Scroll: {scrollDepth}%</div>
          <div>Dwell: {dwellTime}s</div>
          <div>Score: {score}</div>
          <div>
            Segment:{" "}
            <span
              style={{
                color:
                  segment === "hot"
                    ? "#e8864c"
                    : segment === "warm"
                    ? "#c8e66b"
                    : "#a8b896",
              }}
            >
              {segment}
            </span>
          </div>
        </div>
      )}
    </SignalContext.Provider>
  );
}
