"use client";

import { useEffect, useState } from "react";
import { IceCreamPopup } from "@/components/landing/IceCreamPopup";
import { useVisitor } from "@/hooks/use-visitor";
import { useSignal } from "@/components/landing-v2/SignalProvider";
import { motion, AnimatePresence } from "framer-motion";
import { IceCream, Sparkles } from "lucide-react";

/**
 * Popup-strategi:
 * 1. Om besökaren redan är identifierad (contact_id satt) → visa aldrig popupen,
 *    visa istället en subtil "välkommen tillbaka"-toast.
 * 2. Om besökaren är okänd men har engagerat sig (scroll 25% ELLER score >= 10) →
 *    trigga popupen efter kort fördröjning.
 * 3. Max 1 visning per cookie-baserad session (sessionStorage).
 */
export function SmartIdentifyPopup() {
  const visitor = useVisitor();
  const signal = useSignal();
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    if (signal.scrollDepth >= 25 || signal.score >= 10 || signal.dwellTime >= 20) {
      setEngaged(true);
    }
  }, [signal.scrollDepth, signal.score, signal.dwellTime]);

  // Returning user som redan är identifierad — visa toast, ingen popup
  if (!visitor.loading && visitor.identified) {
    return <WelcomeBackToast visitor={visitor} />;
  }

  // Okänd + tillräckligt engagerad → trigga popup
  if (!visitor.loading && !visitor.identified && engaged) {
    return (
      <IceCreamPopup
        sessionId={signal.sessionId}
        variant="site"
        trackEvent={signal.track}
        delayMs={800}
      />
    );
  }

  return null;
}

function WelcomeBackToast({ visitor }: { visitor: ReturnType<typeof useVisitor> }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("clearon_welcome_shown");
    if (shown) {
      setDismissed(true);
      return;
    }
    const t = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("clearon_welcome_shown", "true");
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(t);
  }, [visible]);

  if (dismissed && !visible) return null;

  const firstName = visitor.name?.split(" ")[0] || "dig";
  const topSlug = visitor.topProduct?.slug || null;
  const topLabel = topSlug ? prettyProduct(topSlug) : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 360 }}
          className="fixed bottom-5 right-5 z-50 max-w-[320px]"
          onClick={() => setVisible(false)}
          style={{ cursor: "pointer" }}
        >
          <div
            className="rounded-2xl border shadow-2xl px-4 py-3"
            style={{
              background: "#f4f1e9",
              borderColor: "rgba(58,69,58,0.15)",
              fontFamily: "Carlito, sans-serif",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(65,97,37,0.1)" }}
              >
                <Sparkles className="w-5 h-5" style={{ color: "#416125" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-sm leading-tight"
                  style={{ color: "#3a453a" }}
                >
                  Välkommen tillbaka, {firstName}
                </div>
                {topLabel ? (
                  <div
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: "rgba(58,69,58,0.65)" }}
                  >
                    Senast visade du intresse för <b>{topLabel}</b>. Vi har nytt att visa.
                  </div>
                ) : (
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(58,69,58,0.65)" }}
                  >
                    Kul att se dig igen. Klicka för att stänga.
                  </div>
                )}
              </div>
              <IceCream className="w-4 h-4 flex-shrink-0" style={{ color: "#416125" }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function prettyProduct(slug: string): string {
  const map: Record<string, string> = {
    "sales-promotion": "Sales Promotion",
    "customer-care": "Customer Care",
    "interactive-engage": "Interactive Engage",
    kampanja: "Kampanja",
    "send-a-gift": "Send a Gift",
    "clearing-solutions": "Clearing Solutions",
    personalbeloning: "Personalbelöning",
    kuponger: "Kuponger",
    "mobila-presentkort": "Mobila Presentkort",
  };
  return map[slug] || slug;
}
