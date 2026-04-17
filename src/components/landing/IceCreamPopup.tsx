"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, IceCream } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trackIceCreamCoupon, trackClick } from "@/lib/meta-pixel";
import { trackLinkedIn, LINKEDIN_CONVERSIONS } from "@/lib/tracking";
import confetti from "canvas-confetti";

interface IceCreamPopupProps {
  sessionId: string;
  variant: string;
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
  collectEmail?: boolean;
  delayMs?: number;
}

export function IceCreamPopup({
  sessionId,
  variant,
  trackEvent,
  collectEmail = false,
  delayMs = 4000,
}: IceCreamPopupProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [popupCompany, setPopupCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(`popup_shown_${variant}`);
    if (alreadyShown) {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(`popup_shown_${variant}`, "true");
      trackEvent("popup_shown", { variant, popup: "ice_cream" });
    }, delayMs);
    return () => clearTimeout(timer);
  }, [variant, trackEvent, delayMs]);

  const handleClose = () => {
    trackClick("close_popup", variant, "popup");
    setDismissed(true);
    setVisible(false);
    trackEvent("popup_dismissed", { variant, popup: "ice_cream" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackClick("submit_popup", variant, "popup");
    if (!email) return;

    setIsSubmitting(true);
    try {
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email,
          company: popupCompany || null,
          role: "unknown",
          source: "popup",
          interests: [
            `variant:${variant}`,
            `source:popup`,
            `email:${email}`,
            ...(popupCompany ? [`company:${popupCompany}`] : []),
          ],
        }),
      }).catch(() => {});

      trackEvent("lead_submitted", { variant, source: "popup", has_email: true });
      trackIceCreamCoupon(variant, "popup");
      trackLinkedIn(LINKEDIN_CONVERSIONS.PHONE_LEAD_CAPTURED);
      setIsSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.45 },
        colors: ["#739B36", "#8BB347", "#A3C55E"],
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  if (dismissed && !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleClose}
            data-testid="popup-overlay"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 28, stiffness: 400 }}
              className="pointer-events-auto w-[calc(100%-48px)] max-w-[320px]"
              data-testid="popup-ice-cream"
            >
              <div
                className="relative rounded-2xl px-5 py-5 border border-[#3a453a]/15 shadow-2xl"
                style={{ backgroundColor: "#f4f1e9", fontFamily: "Carlito, sans-serif" }}
              >
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 text-[#3a453a]/40 hover:text-[#3a453a] transition-colors cursor-pointer"
                  data-testid="button-close-popup"
                >
                  <X className="w-4 h-4" />
                </button>

                {!isSubmitted ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#416125]/10 flex items-center justify-center mx-auto mb-3">
                        <IceCream className="w-8 h-8 text-[#416125]" />
                      </div>
                      <h2
                        className="text-lg font-bold text-[#3a453a] leading-snug"
                        style={{ fontFamily: "Carlito, sans-serif" }}
                        data-testid="text-popup-heading"
                      >
                        Vill du ha en gratis glass?
                      </h2>
                      <p
                        className="text-xs text-[#3a453a]/60 mt-1 leading-relaxed"
                        style={{ fontFamily: "Carlito, sans-serif" }}
                      >
                        Ange din jobb-email och företag så skickar vi en glasskupong.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2">
                      <Input
                        type="email"
                        placeholder="Din jobb-email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base h-10"
                        style={{ fontFamily: "Carlito, sans-serif" }}
                        data-testid="input-popup-email"
                      />
                      <Input
                        type="text"
                        placeholder="Företag"
                        value={popupCompany}
                        onChange={(e) => setPopupCompany(e.target.value)}
                        className="rounded-xl bg-white border-[#3a453a]/20 text-[#3a453a] placeholder:text-[#3a453a]/40 focus:border-[#416125] text-base h-10"
                        style={{ fontFamily: "Carlito, sans-serif" }}
                        data-testid="input-popup-company"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 text-sm font-semibold text-white bg-[#416125] rounded-xl hover:bg-[#416125]/90 transition-colors disabled:opacity-50 cursor-pointer"
                        style={{ fontFamily: "Carlito, sans-serif" }}
                        disabled={isSubmitting || !email}
                        data-testid="button-popup-submit"
                      >
                        {isSubmitting ? "Skickar..." : "Skicka min glass"}
                      </button>
                    </form>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-2"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#416125]/10 flex items-center justify-center mx-auto mb-3">
                      <IceCream className="w-8 h-8 text-[#416125]" />
                    </div>
                    <p
                      className="font-bold text-lg text-[#416125]"
                      style={{ fontFamily: "Carlito, sans-serif" }}
                      data-testid="text-popup-success"
                    >
                      Glassen är på väg!
                    </p>
                    <p
                      className="text-xs text-[#3a453a]/70 mt-1.5 leading-relaxed"
                      style={{ fontFamily: "Carlito, sans-serif" }}
                    >
                      Vi skickar kupongen till din e-post inom kort.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-3 text-xs text-[#3a453a]/40 hover:text-[#3a453a]/70 transition-colors cursor-pointer"
                      style={{ fontFamily: "Carlito, sans-serif" }}
                      data-testid="button-popup-close-success"
                    >
                      Stäng
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
