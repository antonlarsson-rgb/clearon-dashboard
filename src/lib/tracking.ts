import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "clearon_session_id";
const CONSENT_KEY = "clearon_consent";
const VISITOR_COOKIE = "clearon_vid";
const VISITOR_LOCAL_KEY = "clearon_vid";
const VISITOR_MAX_AGE_DAYS = 400;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; max-age=${maxAge}; path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

/**
 * Long-lived visitor_id (400 dagar). Sätts av proxy.ts server-side, men vi
 * fallback-skapar här om cookien saknas (t.ex. vid /api-anrop eller testing).
 * localStorage fungerar som backup om cookien skulle rensas men localStorage
 * finns kvar.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let vid = readCookie(VISITOR_COOKIE);
  if (!vid) vid = localStorage.getItem(VISITOR_LOCAL_KEY);
  if (!vid) vid = uuidv4();
  writeCookie(VISITOR_COOKIE, vid, VISITOR_MAX_AGE_DAYS);
  localStorage.setItem(VISITOR_LOCAL_KEY, vid);
  return vid;
}

export interface TrackingProperties {
  role?: string;
  choice?: string;
  step?: number;
  page_section?: string;
  page_path?: string;
  host?: string;
  product?: string;
  variant?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  device_type?: string;
  [key: string]: unknown;
}

export interface TrackEvent {
  event_name: string;
  properties?: TrackingProperties;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export function setConsent(consent: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, consent ? "true" : "false");
}

export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });

  return utm;
}

/**
 * Identifierings-token från mail-länkar.
 *   ?clearon_pid=12345     → upsales_contact_id för stitching
 *   ?clearon_email=base64  → email base64-encoded
 *   ?clearon_sig=...       → optional HMAC (verifieras server-side om MAIL_LINK_SECRET satt)
 *
 * När en känd Upsales-kontakt klickar på ett mail-länk till clearon.live
 * stitchas visitor_cookie → person så att framtida anonym aktivitet är
 * identifierad. Tokenen persisteras i sessionStorage så att efterföljande
 * page_views i samma session också identifieras (URL kan ändras vid nav).
 */
export function getIdentificationToken(): {
  clearon_pid?: string;
  clearon_email?: string;
  clearon_sig?: string;
} {
  if (typeof window === "undefined") return {};

  const out: { clearon_pid?: string; clearon_email?: string; clearon_sig?: string } = {};
  const params = new URLSearchParams(window.location.search);

  const pid = params.get("clearon_pid");
  const email = params.get("clearon_email");
  const sig = params.get("clearon_sig");

  if (pid || email) {
    if (pid) out.clearon_pid = pid;
    if (email) out.clearon_email = email;
    if (sig) out.clearon_sig = sig;
    // Persistera token i sessionStorage så efterföljande events identifierar
    try {
      sessionStorage.setItem("clearon_idtoken", JSON.stringify(out));
    } catch {
      // ignore quota errors
    }
    return out;
  }

  try {
    const stored = sessionStorage.getItem("clearon_idtoken");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return {};
}

export function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";

  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function getReferrer(): string {
  if (typeof window === "undefined") return "";
  return document.referrer || "";
}

declare global {
  interface Window {
    lintrk?: (action: string, data: Record<string, unknown>) => void;
  }
}

export const LINKEDIN_CONVERSIONS = {
  LEAD_FORM_SUBMITTED: 26457801,
  PHONE_LEAD_CAPTURED: 26457809,
};

export function trackLinkedIn(conversionId: number): void {
  if (!conversionId) return;
  try {
    if (window.lintrk) {
      window.lintrk("track", { conversion_id: conversionId });
    }
  } catch (e) {
    console.warn("LinkedIn tracking error:", e);
  }
}

export async function track(eventName: string, properties: TrackingProperties = {}): Promise<void> {
  const sessionId = getSessionId();
  const visitorId = getVisitorId();
  const utmParams = getUtmParams();
  const pageContext =
    typeof window !== "undefined"
      ? {
          page_path: window.location.pathname,
          host: window.location.host,
        }
      : {};

  const idToken = getIdentificationToken();

  const enrichedProperties = {
    ...properties,
    ...pageContext,
    ...utmParams,
    ...idToken,
    referrer: getReferrer(),
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        visitorId,
        eventName,
        properties: enrichedProperties,
      }),
    });
  } catch (error) {
    console.error("Tracking error:", error);
  }
}

export const trackingEvents = {
  pageView: (section: string) => track("page_view", { page_section: section }),
  pageLoad: (product?: string) =>
    track("page_load", product ? { product } : {}),
  roleSelected: (role: string) => track("role_selected", { role }),
  scenarioChoice: (scenarioId: string, choice: string, step: number) =>
    track("scenario_choice", { choice, step, page_section: scenarioId }),
  toolboxSelected: (tools: string[]) =>
    track("toolbox_selected", { choice: tools.join(",") }),
  infoOpened: (section: string) => track("info_opened", { page_section: section }),
  ctaClicked: (cta: string, section: string) =>
    track("cta_clicked", { choice: cta, page_section: section }),
  sliderChanged: (slider: string, value: number) =>
    track("slider_changed", { choice: slider, page_section: "calculator", value }),
  leadSubmitted: (role: string) => track("lead_submitted", { role }),
  consentGiven: () => track("consent_given", {}),
  consentDenied: () => track("consent_denied", {}),
};
