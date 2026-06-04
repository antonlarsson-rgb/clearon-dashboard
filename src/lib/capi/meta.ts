import { sha256, sha256Phone } from "./hash";

/** Indata fran /api/tracking nar ett event ska relayas till Meta CAPI. */
export interface MetaCapiEvent {
  /** UUID som matchar klient-pixelns eventID for dedup. */
  eventId: string;
  /** Meta-event-namn fran taxonomin (PageView, ViewContent, Lead, custom...). */
  eventName: string;
  /** Sekunder sedan epoch. */
  eventTime: number;
  /** Full URL dar eventet skedde (https://clearon.live/...). */
  eventSourceUrl: string;
  /** Klient-IP (fran x-forwarded-for). */
  clientIpAddress?: string;
  /** Klient-UA. */
  clientUserAgent?: string;
  /** Meta browser-id (_fbp-cookie). */
  fbp?: string;
  /** Meta click-id (_fbc-cookie eller fb.1.<ts>.<fbclid>). */
  fbc?: string;
  /** Email (klartext, vi hashar). */
  email?: string;
  /** Telefon (klartext, vi hashar). */
  phone?: string;
  /** Externt id (vart visitor_id) - hjalper Meta korsmatcha. */
  externalId?: string;
  /** Skickas i custom_data, fritt definierat (funnel_stage, source_event, ...). */
  customData?: Record<string, unknown>;
}

interface MetaCapiConfig {
  pixelId: string;
  accessToken: string;
  /** Test Event Code fran Events Manager - om satt hamnar event i Test Events. */
  testEventCode?: string;
}

function readConfig(): MetaCapiConfig | null {
  const pixelId = (process.env.META_PIXEL_ID || "").trim();
  const accessToken = (process.env.META_CAPI_ACCESS_TOKEN || "").trim();
  if (!pixelId || !accessToken) return null;
  const testEventCode = (process.env.META_TEST_EVENT_CODE || "").trim() || undefined;
  return { pixelId, accessToken, testEventCode };
}

/**
 * Skicka ett event till Meta Conversions API. Returnerar true om POST gick igenom.
 * Tysta no-op om env saknas - sa build/dev inte kraschar.
 */
export async function sendToMetaCapi(event: MetaCapiEvent): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;

  const userData: Record<string, unknown> = {};
  const em = sha256(event.email);
  const ph = sha256Phone(event.phone);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  if (event.clientIpAddress) userData.client_ip_address = event.clientIpAddress;
  if (event.clientUserAgent) userData.client_user_agent = event.clientUserAgent;
  if (event.externalId) userData.external_id = [sha256(event.externalId)];

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime,
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: event.customData || {},
      },
    ],
  };
  if (config.testEventCode) {
    payload.test_event_code = config.testEventCode;
  }

  const url = `https://graph.facebook.com/v21.0/${config.pixelId}/events?access_token=${encodeURIComponent(
    config.accessToken
  )}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `Meta CAPI ${res.status} ${event.eventName}:`,
        text.slice(0, 300)
      );
      return false;
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Meta CAPI fetch error ${event.eventName}:`, msg);
    return false;
  }
}
