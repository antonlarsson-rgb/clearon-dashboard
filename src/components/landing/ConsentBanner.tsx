"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  visible: boolean;
}

export function ConsentBanner({ onAccept, onDecline, visible }: ConsentBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div
            className="max-w-md mx-auto border border-[#3a453a]/15 rounded-xl shadow-lg p-5"
            style={{ backgroundColor: "#f4f1e9", fontFamily: "Carlito, sans-serif" }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-[#416125]/10 rounded-full">
                <Cookie className="w-5 h-5 text-[#416125]" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#3a453a] text-sm mb-1">
                  Vi använder cookies
                </h3>
                <p className="text-xs text-[#3a453a]/60 mb-3 leading-relaxed">
                  Vi använder cookies för att förbättra din upplevelse och samla in anonym statistik.
                  Du kan välja att acceptera eller avböja sparning utöver nödvändiga cookies.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onAccept();
                      setShow(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#416125] rounded-lg hover:bg-[#416125]/90 transition-colors cursor-pointer"
                    data-testid="button-accept-cookies"
                  >
                    Acceptera alla
                  </button>
                  <button
                    onClick={() => {
                      onDecline();
                      setShow(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#3a453a] border border-[#3a453a]/20 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    data-testid="button-decline-cookies"
                  >
                    Endast nödvändiga
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  onDecline();
                  setShow(false);
                }}
                className="flex-shrink-0 p-1 text-[#3a453a]/40 hover:text-[#3a453a] transition-colors cursor-pointer"
                data-testid="button-close-consent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
