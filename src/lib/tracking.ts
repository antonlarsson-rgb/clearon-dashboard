import { v4 as uuidv4 } from "uuid";
import { matchEvent, FUNNEL_LABELS } from "@/lib/event-taxonomy";

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
 * Annons-attribution: UTM-parametrar + plattformarnas klick-id:n.
 *   gclid     -> Google Ads (auto-tagging, alltid med pa annonsklick)
 *   fbclid    -> Meta (alltid med pa annonsklick)
 *   li_fat_id -> LinkedIn (med pa annonsklick om enablat)
 *   msclkid   -> Microsoft/Bing
 *
 * Parametrarna finns bara i URL:en pa landningssidan och tappas vid
 * navigering, sa vi persisterar: forsta beroring i localStorage (overlever
 * sessioner, 400d-cookien ar anda var identitet) och senaste beroring i
 * sessionStorage. Lead-submit skickar med bada sa varje lead kan knytas
 * till plattform + kampanj.
 */
const ATTR_FIRST_KEY = "clearon_attr_first";
const ATTR_LAST_KEY = "clearon_attr_last";

const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "li_fat_id",
  "msclkid",
] as const;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  li_fat_id?: string;
  msclkid?: string;
  referrer?: string;
  landing_page?: string;
  captured_at?: string;
}

/**
 * Las attribution fran aktuell URL och persistera. Anropas implicit av
 * track() sa varje sidladdning med annons-parametrar fangas.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const attr: Attribution = {};
  let hasAdParams = false;
  for (const key of ATTRIBUTION_PARAMS) {
    const value = params.get(key);
    if (value) {
      attr[key] = value;
      hasAdParams = true;
    }
  }
  if (!hasAdParams) return;

  attr.referrer = document.referrer || undefined;
  attr.landing_page = window.location.pathname;
  attr.captured_at = new Date().toISOString();

  try {
    sessionStorage.setItem(ATTR_LAST_KEY, JSON.stringify(attr));
    if (!localStorage.getItem(ATTR_FIRST_KEY)) {
      localStorage.setItem(ATTR_FIRST_KEY, JSON.stringify(attr));
    }
  } catch {
    // storage full/blocked - ignore
  }
}

export function getAttribution(): { first: Attribution | null; last: Attribution | null } {
  if (typeof window === "undefined") return { first: null, last: null };
  captureAttribution();
  const read = (storage: Storage, key: string): Attribution | null => {
    try {
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as Attribution) : null;
    } catch {
      return null;
    }
  };
  return {
    first: read(localStorage, ATTR_FIRST_KEY),
    last: read(sessionStorage, ATTR_LAST_KEY),
  };
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
    fbq?: (...args: unknown[]) => void;
  }
}

// Speglar LINKEDIN_RULES i src/lib/event-taxonomy.ts. Anvands av legacy
// client-side trackLinkedIn() - server-side CAPI ar primar kanal nu.
export const LINKEDIN_CONVERSIONS = {
  POPUP_FILLED: 26457809, // Glass Popup, SIGN_UP
  LEAD_FORM_SUBMITTED: 23533217, // Lead formular, LEAD
  QUALIFIED_LEAD: 20994401, // Tack-sida
  PHONE_LEAD_CAPTURED: 23533217, // fallback till LEAD_FORM tills egen telefonregel finns
};

/**
 * Fyr Meta Pixel klient-side med samma eventID som server-sidan anvander mot
 * Conversions API. Da dedupliserar Meta automatiskt och vi far full tackning
 * aven om en av kanalerna fallerar (adblock, fetch-fel, etc).
 */
function fireMetaPixel(
  internalEventName: string,
  properties: Record<string, unknown>,
  eventId: string
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const match = matchEvent(internalEventName, { properties });
  const customData: Record<string, unknown> = {
    funnel_stage: match.funnelStage,
    funnel_label: FUNNEL_LABELS[match.funnelStage],
    source_event: internalEventName,
  };
  if (properties.product || properties.product_slug) {
    customData.content_name = properties.product ?? properties.product_slug;
    customData.content_category = "product";
  }
  if (properties.page_section) customData.page_section = properties.page_section;
  if (properties.variant) customData.variant = properties.variant;

  try {
    const command = match.metaIsStandard ? "track" : "trackCustom";
    window.fbq(command, match.metaEventName, customData, { eventID: eventId });
  } catch (e) {
    console.warn("Meta pixel fire error:", e);
  }
}

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
  // Persisterad last-touch som bas, aktuella URL-parametrar vinner. Da bar
  // events utm/klick-id aven efter navigering bort fran landnings-URL:en.
  const { last: lastAttribution } = getAttribution();
  const utmParams = { ...(lastAttribution || {}), ...getUtmParams() };
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

  // Samma eventId pa klient-pixel och server-CAPI -> Meta dedupliserar.
  const eventId = uuidv4();

  fireMetaPixel(eventName, enrichedProperties, eventId);

  try {
    await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        visitorId,
        eventName,
        eventId,
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
