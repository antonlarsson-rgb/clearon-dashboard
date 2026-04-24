// Canonical event → scoring vikt-tabell. Används både server-side tracking
// och av backfill-scripten. Varje event har (weight, intent_weight).
// Decay appliceras senare i scoring-motorn.

export interface EventWeight {
  weight: number;          // engagement
  intent_weight: number;   // intent (stark signal)
}

// Halflife per event-typ i dagar. Orders/demo har ingen decay (Infinity).
export const HALFLIFE_DAYS = {
  engagement: 30,
  intent: 60,
  order: Infinity,
  demo: Infinity,
};

export function halflifeFor(eventType: string): number {
  if (eventType === "order_placed" || eventType === "demo_booked") return Infinity;
  if (eventType.endsWith("_click") || eventType === "lead_submitted") return HALFLIFE_DAYS.intent;
  if (eventType.includes("opportunity")) return HALFLIFE_DAYS.intent;
  return HALFLIFE_DAYS.engagement;
}

export const EVENT_WEIGHTS: Record<string, EventWeight> = {
  // Web events (våra)
  page_view: { weight: 1, intent_weight: 0 },
  scroll_depth: { weight: 1, intent_weight: 0 },
  "hero:role": { weight: 8, intent_weight: 2 },
  "product:hover": { weight: 2, intent_weight: 0 },
  "product:expand": { weight: 5, intent_weight: 2 },
  "product:cta": { weight: 10, intent_weight: 10 },
  "game:start": { weight: 6, intent_weight: 1 },
  "game:win": { weight: 12, intent_weight: 3 },
  "quiz:answer": { weight: 4, intent_weight: 1 },
  "quiz:complete": { weight: 12, intent_weight: 8 },
  "quiz:cta": { weight: 12, intent_weight: 12 },
  "usecase:expand": { weight: 4, intent_weight: 1 },
  "sms-demo:send": { weight: 8, intent_weight: 6 },
  "roi:adjust": { weight: 6, intent_weight: 4 },
  "roi:compute": { weight: 8, intent_weight: 8 },
  "module:engage": { weight: 8, intent_weight: 6 },
  cta_clicked: { weight: 4, intent_weight: 5 },
  lead_submitted: { weight: 25, intent_weight: 20 },
  popup_shown: { weight: 1, intent_weight: 0 },
  popup_dismissed: { weight: -2, intent_weight: 0 },

  // Upsales visits (clearon.se)
  upsales_visit_page: { weight: 3, intent_weight: 1 },
  upsales_visit_contact_page: { weight: 8, intent_weight: 10 },
  upsales_visit_pricing_page: { weight: 8, intent_weight: 10 },
  upsales_visit_product_page: { weight: 6, intent_weight: 4 },
  upsales_visit_return: { weight: 10, intent_weight: 8 },

  // Upsales mail
  mail_open: { weight: 2, intent_weight: 0 },
  mail_click: { weight: 8, intent_weight: 6 },
  mail_unsubscribe: { weight: -30, intent_weight: -20 },
  mail_bounce: { weight: -5, intent_weight: 0 },

  // Upsales form
  form_submit: { weight: 20, intent_weight: 15 },

  // Upsales CRM-events
  journey_step_change: { weight: 5, intent_weight: 3 },
  opportunity_created: { weight: 20, intent_weight: 25 },
  opportunity_stage_change: { weight: 10, intent_weight: 15 },
  opportunity_won: { weight: 40, intent_weight: 40 },
  opportunity_lost: { weight: -10, intent_weight: -10 },
  activity_created: { weight: 8, intent_weight: 8 },
  appointment_scheduled: { weight: 30, intent_weight: 35 },

  // Orders
  order_placed: { weight: 50, intent_weight: 50 },
  demo_booked: { weight: 50, intent_weight: 50 },

  // Ads (framtida)
  meta_ad_click: { weight: 4, intent_weight: 3 },
  meta_lead: { weight: 20, intent_weight: 15 },
  linkedin_ad_click: { weight: 5, intent_weight: 4 },
  linkedin_form_submit: { weight: 20, intent_weight: 15 },
  google_ad_click: { weight: 3, intent_weight: 2 },
};

export function weightFor(eventType: string): EventWeight {
  return EVENT_WEIGHTS[eventType] || { weight: 1, intent_weight: 0 };
}

// Mappa URL → produkt-slug (best-effort)
const URL_PRODUCT_PATTERNS: Array<[RegExp, string]> = [
  [/sales[-_ ]?promotion/i, "sales-promotion"],
  [/customer[-_ ]?care/i, "customer-care"],
  [/interactive[-_ ]?engage|engage[-_ ]?ai/i, "interactive-engage"],
  [/kampanja/i, "kampanja"],
  [/send[-_ ]?a[-_ ]?gift|skicka.?presentkort|personalbelon/i, "send-a-gift"],
  [/clearing|vardeavier|v%C3%A4rdeavier/i, "clearing-solutions"],
  [/kupong|coupon/i, "kuponger"],
  [/mobil(a)?[-_ ]?presentkort/i, "mobila-presentkort"],
  [/sverigecheck/i, "send-a-gift"],
  [/checkar/i, "sales-promotion"],
  [/mobilkupong/i, "kuponger"],
];

export function productFromUrl(url: string): string | null {
  if (!url) return null;
  for (const [re, slug] of URL_PRODUCT_PATTERNS) {
    if (re.test(url)) return slug;
  }
  return null;
}

// Klassificera en visit-URL som hög-intent (kontakt/pris/demo) vs product-page vs generic
export function classifyVisitUrl(url: string): {
  eventType: string;
  product_slug: string | null;
} {
  const lower = (url || "").toLowerCase();
  const product = productFromUrl(url);

  if (/kontakt|kontakta-oss|demo|pris|pricing|offert/.test(lower)) {
    return { eventType: "upsales_visit_contact_page", product_slug: product };
  }
  if (product) {
    return { eventType: "upsales_visit_product_page", product_slug: product };
  }
  return { eventType: "upsales_visit_page", product_slug: null };
}
