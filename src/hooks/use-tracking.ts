"use client";

import { useState, useEffect, useCallback } from "react";
import {
  track,
  getSessionId,
  hasConsent,
  setConsent as setStoredConsent,
  TrackingProperties,
} from "@/lib/tracking";

interface TrackingState {
  sessionId: string;
  consent: boolean | null;
  events: Array<{ eventName: string; properties: TrackingProperties; timestamp: string }>;
}

export function useTracking() {
  const [state, setState] = useState<TrackingState>({
    sessionId: "",
    consent: null,
    events: [],
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      sessionId: getSessionId(),
      consent: hasConsent() ? true : null,
    }));
  }, []);

  const trackEvent = useCallback(async (eventName: string, properties: TrackingProperties = {}) => {
    await track(eventName, properties);

    setState((prev) => ({
      ...prev,
      events: [
        { eventName, properties, timestamp: new Date().toISOString() },
        ...prev.events.slice(0, 9),
      ],
    }));
  }, []);

  const setConsent = useCallback((consent: boolean) => {
    setStoredConsent(consent);
    setState((prev) => ({ ...prev, consent }));

    if (consent) {
      track("consent_given", {});
    } else {
      track("consent_denied", {});
    }
  }, []);

  return {
    sessionId: state.sessionId,
    consent: state.consent,
    events: state.events,
    trackEvent,
    setConsent,
  };
}
