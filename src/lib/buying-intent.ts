// Buying-intent layer — vem är mest trolig att köpa just nu.
//
// Skiljer sig från total_score: total_score är aggregerat över tid med decay.
// buying_intent är ett NU-fönster: vad har hänt senaste 48h/7d, accelererar
// det, vilka high-intent events, är personen identifierad, finns öppen
// opportunity, har AI bedömt qualified. Allt kombinerat till ett 0-100-tal
// som svarar på frågan: "vem ska jag ringa idag?".
//
// Returnerar också reasons[] som driver: säljaren ska kunna förstå VARFÖR
// utan att klicka in på personen. Samt behavior_pattern — vilken typ av
// köpresa de befinner sig i.

import type { SupabaseClient } from "@supabase/supabase-js";

// Event-typer som är starka köp-signaler (BANT-style intent)
const HIGH_INTENT_EVENTS = new Set([
  "upsales_visit_contact_page",
  "upsales_visit_pricing_page",
  "form_submit",
  "lead_submitted",
  "mail_click",
  "demo_booked",
  "opportunity_created",
  "opportunity_stage_change",
  "appointment_scheduled",
  "quiz:cta",
  "product:cta",
  "roi:compute",
  "sms-demo:send",
]);

// Event-typer som tyder på sen-funnel: tittar på pris, kontakt, gör konkreta steg
const LATE_FUNNEL_EVENTS = new Set([
  "upsales_visit_contact_page",
  "upsales_visit_pricing_page",
  "form_submit",
  "lead_submitted",
  "demo_booked",
  "appointment_scheduled",
  "opportunity_created",
  "opportunity_stage_change",
  "quiz:cta",
  "product:cta",
]);

interface EventRow {
  event_type: string;
  product_slug: string | null;
  weight: number;
  intent_weight: number;
  occurred_at: string;
  source: string;
  metadata: Record<string, unknown> | null;
}

// Beteende-pattern — uteslutande härlett från observerade events.
// Inga title-regex, inga inferenser om "beslutsmandat" eller liknande.
// Varje pattern motsvarar ett konkret event-mönster i events-tabellen.
export type BehaviorPattern =
  | "paying_customer" // har order_placed eller opportunity_won
  | "form_converted" // har form_submit / lead_submitted-event senaste 90d
  | "pricing_intent" // har besökt /pricing eller /kontakt
  | "product_evaluator" // har besökt 2+ olika produktsidor
  | "deep_browser" // 10+ produkt/sajt-visits utan annan intent
  | "mail_engaged" // mail_open eller mail_click
  | "ad_responder" // *_ad_click
  | "dormant_returning" // gap 60+ dagar, sen ny aktivitet
  | "stalled" // hade events, inget senaste 90d
  | "new_visitor"; // få events, sannolikt nytt

export const BEHAVIOR_PATTERN_LABELS: Record<BehaviorPattern, string> = {
  paying_customer: "Befintliga kunder",
  form_converted: "Skickat formulär",
  pricing_intent: "Besökt pris/kontakt",
  product_evaluator: "Tittat på produkter",
  deep_browser: "Många sidvisningar",
  mail_engaged: "Engagerat mail",
  ad_responder: "Klickat annons",
  dormant_returning: "Vaknat efter paus",
  stalled: "Stagnerar",
  new_visitor: "Ny besökare",
};

/**
 * Konkret event-tagg som visas på leaderboard. label är vad användaren ser,
 * type är event-typ från events-tabellen.
 */
export interface EventTag {
  label: string;
  type: string;
  count?: number;
}

export interface BuyingIntentResult {
  intent_score: number; // 0-100
  trend: "rising" | "stable" | "falling" | "new";
  reasons: string[]; // 2-4 korta svenska bullets — alla event-härledda
  top_product_slug: string | null;
  recent_event_count: number; // senaste 48h
  recent_high_intent_count: number; // high-intent events senaste 7d
  has_open_opportunity: boolean;
  channels_used: string[]; // ["linkedin", "meta", "direct", ...]
  last_high_intent_at: string | null;
  next_action_hint: "ring_nu" | "boka_mote" | "skicka_relevant_case" | "varma_upp" | "bevaka";
  behavior_pattern: BehaviorPattern;
  event_tags: EventTag[]; // 2-5 konkreta event-observationer senaste 30d
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Kort vänlig beskrivning av en URL-path
function shortPath(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const u = new URL(url, "https://x");
    const p = u.pathname.replace(/\/$/, "");
    if (!p || p === "/") return "/";
    return p.length > 28 ? p.slice(0, 28) + "..." : p;
  } catch {
    return url.length > 28 ? url.slice(0, 28) + "..." : url;
  }
}

/**
 * Klassificera person baserat på OBSERVERADE events — inga title- eller
 * profil-inferenser. Reglerna nedan körs i ordning, första som matchar vinner.
 *
 * Fönster utökade till 90 dagar för att fånga ClearOns långsamma B2B-cykel
 * (orders/conversions kan vara månader gamla men är fortfarande relevanta).
 */
export function classifyBehaviorPattern(
  events: EventRow[],
  context: {
    is_customer: boolean;
    is_identified: boolean;
    days_since_last_event: number;
    days_since_first_event: number;
  },
): BehaviorPattern {
  if (events.length === 0) return "new_visitor";

  const now = Date.now();
  const last90d = events.filter((e) => now - new Date(e.occurred_at).getTime() < 90 * DAY);

  // 1. PAYING CUSTOMER — har någonsin en order eller won-opp (oavsett ålder)
  // Denna är den starkaste signalen; alla med faktisk affär hamnar här.
  if (
    events.some(
      (e) =>
        e.event_type === "order_placed" ||
        e.event_type === "opportunity_won",
    )
  ) {
    return "paying_customer";
  }

  // 2. FORM_CONVERTED — skickat formulär senaste 90 dagar
  if (
    last90d.some(
      (e) =>
        e.event_type === "form_submit" ||
        e.event_type === "lead_submitted" ||
        e.event_type === "lead:submit",
    )
  ) {
    return "form_converted";
  }

  // 3. PRICING_INTENT — besökt pris- eller kontaktsidan senaste 90d
  if (
    last90d.some(
      (e) =>
        e.event_type === "upsales_visit_pricing_page" ||
        e.event_type === "upsales_visit_contact_page",
    )
  ) {
    return "pricing_intent";
  }

  // 4. PRODUCT_EVALUATOR — tittat på 2+ olika produktsidor senaste 90d
  const productSlugs = new Set(
    last90d
      .filter(
        (e) =>
          e.event_type === "upsales_visit_product_page" ||
          e.event_type === "product:expand" ||
          (e.event_type === "page_view" && e.product_slug),
      )
      .map((e) => e.product_slug)
      .filter(Boolean) as string[],
  );
  if (productSlugs.size >= 2) return "product_evaluator";

  // 5. MAIL_ENGAGED — mail_open eller mail_click senaste 90d
  if (
    last90d.some(
      (e) => e.event_type === "mail_open" || e.event_type === "mail_click",
    )
  ) {
    return "mail_engaged";
  }

  // 6. AD_RESPONDER — klickat annons senaste 90d
  if (
    last90d.some(
      (e) =>
        e.event_type === "meta_ad_click" ||
        e.event_type === "google_ad_click" ||
        e.event_type === "linkedin_ad_click",
    )
  ) {
    return "ad_responder";
  }

  // 7. DORMANT_RETURNING — gap 60+ dagar i sin historik och har nu kommit tillbaka
  if (context.days_since_first_event > 60 && context.days_since_last_event < 30) {
    const sortedAsc = [...events].sort(
      (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
    );
    let maxGap = 0;
    for (let i = 1; i < sortedAsc.length; i++) {
      const gap =
        new Date(sortedAsc[i].occurred_at).getTime() -
        new Date(sortedAsc[i - 1].occurred_at).getTime();
      if (gap > maxGap) maxGap = gap;
    }
    if (maxGap > 60 * DAY) return "dormant_returning";
  }

  // 8. DEEP_BROWSER — 10+ sajt-/produktsidvisningar utan annan intent
  const siteVisits = last90d.filter(
    (e) =>
      e.event_type === "upsales_visit_page" ||
      e.event_type === "upsales_visit_product_page" ||
      e.event_type === "page_view",
  );
  if (siteVisits.length >= 10) return "deep_browser";

  // 9. STALLED — hade events tidigare men inget senaste 90d
  if (context.days_since_last_event > 90 && events.length >= 3) {
    return "stalled";
  }

  // 10. NEW_VISITOR — defaultfall, få events eller okänt mönster
  return "new_visitor";
}

/**
 * Bygger 2-5 konkreta event-taggar för att visa VAD personen gjort.
 * Helt event-härlett, ingen inferens. Räknar förekomster per typ.
 */
export function buildEventTags(events: EventRow[], max = 4): EventTag[] {
  if (events.length === 0) return [];

  const now = Date.now();
  const last30d = events.filter((e) => now - new Date(e.occurred_at).getTime() < 30 * DAY);

  // Räkna events per "tagg-grupp"
  const counts = new Map<string, { count: number; sample: EventRow; type: string }>();
  const bump = (key: string, ev: EventRow) => {
    const prev = counts.get(key);
    if (prev) {
      prev.count++;
      // behåll senaste eventet som sample
      if (new Date(ev.occurred_at).getTime() > new Date(prev.sample.occurred_at).getTime()) {
        prev.sample = ev;
      }
    } else {
      counts.set(key, { count: 1, sample: ev, type: ev.event_type });
    }
  };

  for (const ev of last30d) {
    switch (ev.event_type) {
      case "upsales_visit_contact_page":
        bump("contact_page", ev);
        break;
      case "upsales_visit_pricing_page":
        bump("pricing_page", ev);
        break;
      case "upsales_visit_product_page":
        bump(`product_page:${ev.product_slug || "unknown"}`, ev);
        break;
      case "form_submit":
      case "lead_submitted":
        bump("form_submit", ev);
        break;
      case "mail_open":
        bump("mail_open", ev);
        break;
      case "mail_click":
        bump("mail_click", ev);
        break;
      case "meta_ad_click":
        bump("ad_meta", ev);
        break;
      case "google_ad_click":
        bump("ad_google", ev);
        break;
      case "linkedin_ad_click":
        bump("ad_linkedin", ev);
        break;
      case "demo_booked":
      case "appointment_scheduled":
        bump("demo_booked", ev);
        break;
      case "opportunity_created":
      case "opportunity_stage_change":
        bump("opportunity", ev);
        break;
      case "order_placed":
      case "opportunity_won":
        bump("order_placed", ev);
        break;
      case "roi:compute":
        bump("roi_calc", ev);
        break;
      case "quiz:cta":
      case "quiz:complete":
        bump("quiz", ev);
        break;
      case "sms-demo:send":
        bump("sms_demo", ev);
        break;
      case "page_view":
        // Bara om vi har page_path för annars är det inte talande
        if (
          (ev.metadata as { page_path?: string })?.page_path ||
          (ev.metadata as { url?: string })?.url
        ) {
          bump("page_view", ev);
        }
        break;
      default:
        break;
    }
  }

  // Vikt: ge bästa-signaler högre prioritet i visningen
  const PRIORITY: Record<string, number> = {
    form_submit: 100,
    order_placed: 95,
    demo_booked: 90,
    opportunity: 85,
    contact_page: 80,
    pricing_page: 75,
    mail_click: 65,
    roi_calc: 60,
    quiz: 55,
    sms_demo: 50,
    mail_open: 45,
    ad_meta: 40,
    ad_linkedin: 40,
    ad_google: 35,
    page_view: 10,
  };
  const sorted = [...counts.entries()].sort((a, b) => {
    const aKey = a[0].split(":")[0];
    const bKey = b[0].split(":")[0];
    const ap = PRIORITY[aKey] ?? 30;
    const bp = PRIORITY[bKey] ?? 30;
    if (bp !== ap) return bp - ap;
    return b[1].count - a[1].count;
  });

  const tags: EventTag[] = [];
  for (const [key, { count, sample, type }] of sorted) {
    if (tags.length >= max) break;
    const label = formatEventTag(key, count, sample);
    if (label) tags.push({ label, type, count });
  }

  return tags;
}

function formatEventTag(key: string, count: number, sample: EventRow): string {
  const md = sample.metadata || {};
  const url = (md.url as string) || (md.page_path as string) || "";
  const times = count > 1 ? ` (${count}×)` : "";

  if (key === "contact_page") return `Besökt kontakt${times}`;
  if (key === "pricing_page") return `Besökt pris${times}`;
  if (key.startsWith("product_page:")) {
    const slug = key.split(":")[1];
    if (slug && slug !== "unknown") return `Sett ${slug}${times}`;
    return `Sett produktsida${times}`;
  }
  if (key === "form_submit") return "Skickat formulär";
  if (key === "mail_open") return `Öppnat mail${times}`;
  if (key === "mail_click") return `Klickat i mail${times}`;
  if (key === "ad_meta") return `Meta-annons${times}`;
  if (key === "ad_google") return `Google-annons${times}`;
  if (key === "ad_linkedin") return `LinkedIn-annons${times}`;
  if (key === "demo_booked") return "Bokat möte";
  if (key === "opportunity") return "Opportunity skapad";
  if (key === "order_placed") return "Order lagd";
  if (key === "roi_calc") return "Räknat ROI";
  if (key === "quiz") return "Slutfört quiz";
  if (key === "sms_demo") return "Testat SMS-demo";
  if (key === "page_view") {
    const p = shortPath(url);
    return p && p !== "/" ? `Besökt ${p}${times}` : `Besökt sajten${times}`;
  }
  return "";
}

/**
 * Beräkna buying-intent från ett events-array (för en person eller account).
 * Förväntar sig events sorterade DESC på occurred_at, eller sorterar själv.
 */
export function computeBuyingIntent(
  events: EventRow[],
  context: {
    is_customer: boolean;
    has_open_opportunity: boolean;
    ai_segment?: string | null;
    ai_buy_probability?: number | null;
    ai_urgency?: string | null;
    is_identified: boolean;
  },
): BuyingIntentResult {
  if (events.length === 0) {
    return {
      intent_score: 0,
      trend: "new",
      reasons: ["Inga events än"],
      top_product_slug: null,
      recent_event_count: 0,
      recent_high_intent_count: 0,
      has_open_opportunity: false,
      channels_used: [],
      last_high_intent_at: null,
      next_action_hint: "bevaka",
      behavior_pattern: "new_visitor",
      event_tags: [],
    };
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

  const now = Date.now();
  const reasons: string[] = [];

  const last48hEvents = sorted.filter(
    (e) => now - new Date(e.occurred_at).getTime() < 2 * DAY,
  );
  const last7dEvents = sorted.filter(
    (e) => now - new Date(e.occurred_at).getTime() < 7 * DAY,
  );
  const last30dEvents = sorted.filter(
    (e) => now - new Date(e.occurred_at).getTime() < 30 * DAY,
  );

  const highIntent7d = last7dEvents.filter((e) => HIGH_INTENT_EVENTS.has(e.event_type));
  const lateFunnel7d = last7dEvents.filter((e) => LATE_FUNNEL_EVENTS.has(e.event_type));
  const lastHighIntent = highIntent7d[0]?.occurred_at || null;

  let highIntentScore = 0;
  for (const ev of lateFunnel7d.slice(0, 6)) {
    const hoursAgo = (now - new Date(ev.occurred_at).getTime()) / HOUR;
    if (hoursAgo < 12) highIntentScore += 8;
    else if (hoursAgo < 24) highIntentScore += 6;
    else if (hoursAgo < 48) highIntentScore += 4;
    else highIntentScore += 2;
  }
  highIntentScore = Math.min(30, highIntentScore);

  const volumeScore = Math.min(15, last48hEvents.length * 2);

  let accelerationScore = 0;
  let trend: BuyingIntentResult["trend"] = "stable";
  if (last30dEvents.length > 0) {
    const last48h = last48hEvents.length;
    const last30dAvgPer48h = (last30dEvents.length / 30) * 2;
    if (last30dAvgPer48h > 0) {
      const ratio = last48h / Math.max(0.5, last30dAvgPer48h);
      if (ratio >= 3) {
        accelerationScore = 15;
        trend = "rising";
      } else if (ratio >= 1.8) {
        accelerationScore = 10;
        trend = "rising";
      } else if (ratio >= 1.2) {
        accelerationScore = 5;
      } else if (ratio < 0.5 && last30dEvents.length > 4) {
        accelerationScore = -3;
        trend = "falling";
      }
    }
  } else if (last48hEvents.length >= 3) {
    accelerationScore = 12;
    trend = "new";
  }

  let opportunityScore = 0;
  if (context.has_open_opportunity) {
    opportunityScore = 20;
    reasons.push("Öppen opportunity i Upsales");
  } else {
    const oppEvent = last30dEvents.find(
      (e) =>
        e.event_type === "opportunity_created" ||
        e.event_type === "opportunity_stage_change" ||
        e.event_type === "appointment_scheduled",
    );
    if (oppEvent) opportunityScore = 12;
  }

  let aiScore = 0;
  if (context.ai_segment === "qualified") aiScore += 8;
  else if (context.ai_segment === "evaluating") aiScore += 4;
  if (typeof context.ai_buy_probability === "number") {
    aiScore += Math.round(context.ai_buy_probability * 7);
  }
  if (context.ai_urgency === "high") aiScore += 3;
  aiScore = Math.min(15, aiScore);

  const identifiedScore = context.is_identified ? 5 : 0;

  let lifecycleAdj = 0;
  if (context.is_customer && lateFunnel7d.length >= 1) lifecycleAdj = 5;

  let total =
    highIntentScore +
    volumeScore +
    accelerationScore +
    opportunityScore +
    aiScore +
    identifiedScore +
    lifecycleAdj;
  total = Math.max(0, Math.min(100, Math.round(total)));

  if (lateFunnel7d.length > 0) {
    const last = lateFunnel7d[0];
    const desc = describeEvent(last);
    const hoursAgo = (now - new Date(last.occurred_at).getTime()) / HOUR;
    const when =
      hoursAgo < 1
        ? "för mindre än en timme sedan"
        : hoursAgo < 24
          ? `för ${Math.round(hoursAgo)}h sedan`
          : `för ${Math.round(hoursAgo / 24)}d sedan`;
    reasons.unshift(`${desc} ${when}`);
  }

  if (trend === "rising" && accelerationScore >= 10) {
    reasons.push(
      `Aktivitet accelererar (${last48hEvents.length} events senaste 48h vs ${(last30dEvents.length / 15).toFixed(1)} snitt)`,
    );
  }

  if (
    context.ai_segment === "qualified" &&
    context.ai_buy_probability != null &&
    context.ai_buy_probability >= 0.5
  ) {
    reasons.push(
      `Claude: qualified, ${Math.round(context.ai_buy_probability * 100)}% köp-sannolikhet`,
    );
  }

  const productCounts = new Map<string, number>();
  for (const ev of last7dEvents) {
    if (!ev.product_slug) continue;
    const w = HIGH_INTENT_EVENTS.has(ev.event_type) ? 3 : 1;
    productCounts.set(ev.product_slug, (productCounts.get(ev.product_slug) || 0) + w);
  }
  const topProduct =
    [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const channels = new Set<string>();
  for (const ev of last30dEvents) {
    const md = ev.metadata || {};
    const utm = String(md.utm_source || "").toLowerCase();
    if (utm) channels.add(utm);
    else if (ev.source === "upsales_visit" || ev.source === "upsales") channels.add("upsales");
    else if (ev.source === "web") channels.add("direkt");
    else if (ev.source.startsWith("upsales_mail")) channels.add("email");
  }

  if (channels.size >= 2) {
    reasons.push(`Cross-channel: ${[...channels].slice(0, 3).join(" + ")}`);
  }

  let next_action_hint: BuyingIntentResult["next_action_hint"] = "bevaka";
  if (total >= 75) next_action_hint = "ring_nu";
  else if (total >= 60) next_action_hint = "boka_mote";
  else if (total >= 40) next_action_hint = "skicka_relevant_case";
  else if (total >= 20) next_action_hint = "varma_upp";

  const firstEvent = sorted[sorted.length - 1];
  const lastEvent = sorted[0];
  const daysSinceLast = lastEvent
    ? (now - new Date(lastEvent.occurred_at).getTime()) / DAY
    : Infinity;
  const daysSinceFirst = firstEvent
    ? (now - new Date(firstEvent.occurred_at).getTime()) / DAY
    : 0;

  const behavior_pattern = classifyBehaviorPattern(events, {
    is_customer: context.is_customer,
    is_identified: context.is_identified,
    days_since_last_event: daysSinceLast,
    days_since_first_event: daysSinceFirst,
  });

  const event_tags = buildEventTags(events, 4);

  return {
    intent_score: total,
    trend,
    reasons: reasons.slice(0, 4),
    top_product_slug: topProduct,
    recent_event_count: last48hEvents.length,
    recent_high_intent_count: highIntent7d.length,
    has_open_opportunity: context.has_open_opportunity,
    channels_used: [...channels],
    last_high_intent_at: lastHighIntent,
    next_action_hint,
    behavior_pattern,
    event_tags,
  };
}

function describeEvent(ev: EventRow): string {
  const md = ev.metadata || {};
  const url = (md.url as string) || (md.page_path as string) || "";
  switch (ev.event_type) {
    case "upsales_visit_contact_page":
      return "Besökte kontaktsidan";
    case "upsales_visit_pricing_page":
      return "Besökte prissidan";
    case "form_submit":
    case "lead_submitted":
      return "Skickade in formulär";
    case "mail_click":
      return "Klickade i mail";
    case "demo_booked":
      return "Bokade demo";
    case "appointment_scheduled":
      return "Bokade möte";
    case "opportunity_created":
      return "Ny opportunity skapad";
    case "opportunity_stage_change":
      return "Opportunity bytte stage";
    case "product:cta":
      return "Klickade CTA på produktsida";
    case "quiz:cta":
      return "Slutförde quiz med CTA";
    case "roi:compute":
      return "Räknade ROI";
    case "sms-demo:send":
      return "Testade SMS-demo";
    case "upsales_visit_product_page":
      return `Besökte produktsida ${url ? extractPath(url) : ""}`.trim();
    case "upsales_visit_return":
      return "Återkom till sajten";
    default:
      if (ev.event_type.startsWith("page_view")) return "Besökte sidan";
      return ev.event_type.replace(/_/g, " ");
  }
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.length < 40 ? url : url.slice(0, 40) + "...";
  }
}

/**
 * Hämta + beräkna buying-intent för en specifik person.
 */
export async function getPersonBuyingIntent(
  supabase: SupabaseClient,
  personId: string,
): Promise<BuyingIntentResult | null> {
  const { data: person } = await supabase
    .from("persons")
    .select(
      "id, primary_email, title, is_customer, ai_segment, ai_buy_probability, ai_urgency",
    )
    .eq("id", personId)
    .maybeSingle();

  if (!person) return null;

  const { data: events } = await supabase
    .from("events")
    .select("event_type, product_slug, weight, intent_weight, occurred_at, source, metadata")
    .eq("person_id", personId)
    .gte("occurred_at", new Date(Date.now() - 30 * DAY).toISOString())
    .order("occurred_at", { ascending: false })
    .limit(500);

  const hasOpenOpp = (events || []).some(
    (e) =>
      e.event_type === "opportunity_created" || e.event_type === "opportunity_stage_change",
  );
  const hasLostOpp = (events || []).some((e) => e.event_type === "opportunity_lost");

  return computeBuyingIntent((events as EventRow[]) || [], {
    is_customer: !!person.is_customer,
    has_open_opportunity: hasOpenOpp && !hasLostOpp,
    ai_segment: person.ai_segment as string | null,
    ai_buy_probability: person.ai_buy_probability as number | null,
    ai_urgency: person.ai_urgency as string | null,
    is_identified: !!person.primary_email,
  });
}

/**
 * Topp-N personer/accounts som är mest sannolika att köpa just nu.
 */
export async function getTopBuyingIntent(
  supabase: SupabaseClient,
  options: {
    limit?: number;
    lookbackDays?: number;
    productSlug?: string;
    pattern?: BehaviorPattern | null;
  } = {},
): Promise<
  Array<{
    person_id: string;
    name: string | null;
    email: string | null;
    title: string | null;
    company: string | null;
    account_id: string | null;
    is_identified: boolean;
    intent: BuyingIntentResult;
    score: number;
  }>
> {
  const { limit = 25, lookbackDays = 14, productSlug, pattern } = options;

  const since = new Date(Date.now() - lookbackDays * DAY).toISOString();
  // Hämta upp till 2x av limit för att kunna filtrera + sortera korrekt
  const fetchSize = Math.min(500, Math.max(200, limit * 2));
  const { data: recent } = await supabase
    .from("persons")
    .select(
      "id, name, primary_email, title, score, account_id, is_customer, ai_segment, ai_buy_probability, ai_urgency, behavior_pattern, account:accounts!persons_account_id_fkey(name)",
    )
    .gte("last_event_at", since)
    .order("last_event_at", { ascending: false })
    .limit(fetchSize);

  if (!recent || recent.length === 0) return [];

  const personIds = recent.map((p) => p.id);
  // För klassificering måste vi se hela historiken — order_placed kan vara
  // månader gammal men personen är fortfarande "paying_customer". Hämtar
  // upp till 2 år bakåt men cappar antal events per person via order DESC.
  const eventLookbackDays = Math.max(lookbackDays, 730);
  const { data: allEvents } = await supabase
    .from("events")
    .select(
      "person_id, event_type, product_slug, weight, intent_weight, occurred_at, source, metadata",
    )
    .in("person_id", personIds)
    .gte("occurred_at", new Date(Date.now() - eventLookbackDays * DAY).toISOString())
    .order("occurred_at", { ascending: false });

  const eventsByPerson = new Map<string, EventRow[]>();
  for (const ev of allEvents || []) {
    const pid = ev.person_id as string;
    if (!pid) continue;
    if (!eventsByPerson.has(pid)) eventsByPerson.set(pid, []);
    eventsByPerson.get(pid)!.push(ev as EventRow);
  }

  const results = recent
    .map((p) => {
      const events = eventsByPerson.get(p.id) || [];
      const hasOpenOpp = events.some(
        (e) =>
          e.event_type === "opportunity_created" ||
          e.event_type === "opportunity_stage_change",
      );
      const hasLostOpp = events.some((e) => e.event_type === "opportunity_lost");

      const intent = computeBuyingIntent(events, {
        is_customer: !!p.is_customer,
        has_open_opportunity: hasOpenOpp && !hasLostOpp,
        ai_segment: p.ai_segment as string | null,
        ai_buy_probability: p.ai_buy_probability as number | null,
        ai_urgency: p.ai_urgency as string | null,
        is_identified: !!p.primary_email,
      });

      const account = Array.isArray(p.account) ? p.account[0] : p.account;
      return {
        person_id: p.id,
        name: p.name as string | null,
        email: p.primary_email as string | null,
        title: p.title as string | null,
        company: (account?.name as string | null) || null,
        account_id: p.account_id as string | null,
        is_identified: !!p.primary_email,
        intent,
        score: p.score as number,
      };
    })
    .filter((r) => !productSlug || r.intent.top_product_slug === productSlug)
    .filter((r) => !pattern || r.intent.behavior_pattern === pattern)
    .sort((a, b) => b.intent.intent_score - a.intent.intent_score)
    .slice(0, limit);

  return results;
}

/**
 * Samma för accounts (B2B-vyn).
 */
export async function getTopAccountBuyingIntent(
  supabase: SupabaseClient,
  options: { limit?: number; lookbackDays?: number } = {},
): Promise<
  Array<{
    account_id: string;
    name: string;
    industry: string | null;
    website: string | null;
    identified_persons_count: number;
    intent: BuyingIntentResult;
  }>
> {
  const { limit = 25, lookbackDays = 14 } = options;

  const since = new Date(Date.now() - lookbackDays * DAY).toISOString();
  const { data: recent } = await supabase
    .from("accounts")
    .select(
      "id, name, industry, website, identified_persons_count, is_customer, ai_segment, ai_buy_probability, ai_urgency",
    )
    .gte("last_event_at", since)
    .order("last_event_at", { ascending: false })
    .limit(150);

  if (!recent || recent.length === 0) return [];

  const accountIds = recent.map((a) => a.id);
  const { data: allEvents } = await supabase
    .from("events")
    .select(
      "account_id, event_type, product_slug, weight, intent_weight, occurred_at, source, metadata",
    )
    .in("account_id", accountIds)
    .gte("occurred_at", new Date(Date.now() - 30 * DAY).toISOString())
    .order("occurred_at", { ascending: false });

  const eventsByAccount = new Map<string, EventRow[]>();
  for (const ev of allEvents || []) {
    const aid = ev.account_id as string;
    if (!aid) continue;
    if (!eventsByAccount.has(aid)) eventsByAccount.set(aid, []);
    eventsByAccount.get(aid)!.push(ev as EventRow);
  }

  const results = recent
    .map((a) => {
      const events = eventsByAccount.get(a.id) || [];
      const hasOpenOpp = events.some(
        (e) =>
          e.event_type === "opportunity_created" ||
          e.event_type === "opportunity_stage_change",
      );
      const hasLostOpp = events.some((e) => e.event_type === "opportunity_lost");

      const intent = computeBuyingIntent(events, {
        is_customer: !!a.is_customer,
        has_open_opportunity: hasOpenOpp && !hasLostOpp,
        ai_segment: a.ai_segment as string | null,
        ai_buy_probability: a.ai_buy_probability as number | null,
        ai_urgency: a.ai_urgency as string | null,
        is_identified: ((a.identified_persons_count as number) || 0) > 0,
      });

      return {
        account_id: a.id,
        name: a.name as string,
        industry: a.industry as string | null,
        website: a.website as string | null,
        identified_persons_count: (a.identified_persons_count as number) || 0,
        intent,
      };
    })
    .sort((a, b) => b.intent.intent_score - a.intent.intent_score)
    .slice(0, limit);

  return results;
}
