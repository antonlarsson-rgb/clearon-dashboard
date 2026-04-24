// Time-decayed person scoring. Läser events-tabellen, applicerar halveringstid
// per event-typ, räknar totalt + per-produkt + per-segment. Sparar tillbaka
// i persons + person_product_scores.

import type { SupabaseClient } from "@supabase/supabase-js";
import { halflifeFor } from "@/lib/event-weights";

function decay(value: number, daysAgo: number, halflifeDays: number): number {
  if (halflifeDays === Infinity) return value;
  return value * Math.pow(0.5, daysAgo / halflifeDays);
}

export function segmentFor(score: number): "hot" | "warm" | "curious" | "cold" {
  if (score >= 80) return "hot";
  if (score >= 40) return "warm";
  if (score >= 15) return "curious";
  return "cold";
}

export function computeDemoReadiness(params: {
  intent: number;
  engagement: number;
  productTopScore: number;
  hasIdentified: boolean;
  isCustomer: boolean;
  eventCount: number;
  returnVisitor: boolean;
}): number {
  const intent = Math.min(35, params.intent);
  const eng = Math.min(15, params.engagement / 4);
  const product = Math.min(15, params.productTopScore / 2);
  const ident = params.hasIdentified ? 10 : 0;
  const cust = params.isCustomer ? 10 : 0;
  const recur = params.returnVisitor ? 10 : 0;
  const vol = Math.min(5, params.eventCount / 10);
  return Math.min(100, Math.round(intent + eng + product + ident + cust + recur + vol));
}

interface EventRow {
  event_type: string;
  product_slug: string | null;
  weight: number;
  intent_weight: number;
  occurred_at: string;
}

export interface PersonScoreResult {
  score: number;
  engagement: number;
  intent: number;
  demo_readiness: number;
  segment: "hot" | "warm" | "curious" | "cold";
  top_product: { slug: string; score: number } | null;
  product_scores: Array<{
    slug: string;
    score: number;
    engagement: number;
    intent: number;
    count: number;
    first: string;
    last: string;
  }>;
  event_count: number;
  first_event_at: string | null;
  last_event_at: string | null;
  has_purchased: boolean;
  visits_count: number;
}

export function computeScoresForEvents(events: EventRow[]): PersonScoreResult {
  if (events.length === 0) {
    return {
      score: 0,
      engagement: 0,
      intent: 0,
      demo_readiness: 0,
      segment: "cold",
      top_product: null,
      product_scores: [],
      event_count: 0,
      first_event_at: null,
      last_event_at: null,
      has_purchased: false,
      visits_count: 0,
    };
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let totalEngagement = 0;
  let totalIntent = 0;
  let hasPurchased = false;
  let visits = 0;

  // per-produkt: { slug: { engagement, intent, count, first, last } }
  const productAgg: Record<
    string,
    { engagement: number; intent: number; count: number; first: string; last: string }
  > = {};

  for (const ev of events) {
    const occurredAt = new Date(ev.occurred_at).getTime();
    const daysAgo = Math.max(0, (now - occurredAt) / dayMs);
    const hl = halflifeFor(ev.event_type);

    const engDecayed = decay(ev.weight || 0, daysAgo, hl);
    const intentDecayed = decay(ev.intent_weight || 0, daysAgo, hl);

    totalEngagement += engDecayed;
    totalIntent += intentDecayed;

    if (ev.event_type === "order_placed" || ev.event_type === "opportunity_won") {
      hasPurchased = true;
    }
    if (
      ev.event_type === "upsales_visit_page" ||
      ev.event_type === "upsales_visit_contact_page" ||
      ev.event_type === "upsales_visit_product_page" ||
      ev.event_type === "upsales_visit_return" ||
      ev.event_type === "page_view"
    ) {
      visits++;
    }

    if (ev.product_slug) {
      const agg = productAgg[ev.product_slug] || {
        engagement: 0,
        intent: 0,
        count: 0,
        first: ev.occurred_at,
        last: ev.occurred_at,
      };
      agg.engagement += engDecayed;
      agg.intent += intentDecayed;
      agg.count++;
      if (ev.occurred_at < agg.first) agg.first = ev.occurred_at;
      if (ev.occurred_at > agg.last) agg.last = ev.occurred_at;
      productAgg[ev.product_slug] = agg;
    }
  }

  const total = Math.round(totalEngagement + totalIntent);
  const engagement = Math.round(totalEngagement);
  const intent = Math.round(totalIntent);

  const productScores = Object.entries(productAgg)
    .map(([slug, v]) => ({
      slug,
      score: Math.round(v.engagement + v.intent),
      engagement: Math.round(v.engagement),
      intent: Math.round(v.intent),
      count: v.count,
      first: v.first,
      last: v.last,
    }))
    .sort((a, b) => b.score - a.score);

  const topProduct = productScores[0]
    ? { slug: productScores[0].slug, score: productScores[0].score }
    : null;

  const first = events.reduce(
    (acc, e) => (e.occurred_at < acc ? e.occurred_at : acc),
    events[0].occurred_at
  );
  const last = events.reduce(
    (acc, e) => (e.occurred_at > acc ? e.occurred_at : acc),
    events[0].occurred_at
  );

  return {
    score: total,
    engagement,
    intent,
    demo_readiness: computeDemoReadiness({
      intent,
      engagement,
      productTopScore: topProduct?.score || 0,
      hasIdentified: true,
      isCustomer: hasPurchased,
      eventCount: events.length,
      returnVisitor: visits > 3,
    }),
    segment: segmentFor(total),
    top_product: topProduct,
    product_scores: productScores,
    event_count: events.length,
    first_event_at: first,
    last_event_at: last,
    has_purchased: hasPurchased,
    visits_count: visits,
  };
}

/**
 * Klassificera en person's lifecycle baserat på events + current stage.
 */
export function classifyLifecycle(params: {
  hasPurchased: boolean;
  lastEventAt: string | null;
  hasOpenOpportunity: boolean;
  hasLostOpportunity: boolean;
}): "prospect" | "customer" | "at_risk" | "dormant" | "churned" {
  const now = Date.now();
  const lastMs = params.lastEventAt ? new Date(params.lastEventAt).getTime() : 0;
  const daysSince = lastMs ? (now - lastMs) / (24 * 60 * 60 * 1000) : Infinity;

  if (params.hasPurchased) {
    if (daysSince > 365) return "dormant";
    if (daysSince > 180) return "at_risk";
    return "customer";
  }
  if (params.hasLostOpportunity && daysSince > 90) return "churned";
  return "prospect";
}

/**
 * Recompute scoring för en specifik person. Läser ALLA events för personen,
 * applicerar decay, sparar i persons + person_product_scores.
 */
export async function recomputePerson(
  supabase: SupabaseClient,
  personId: string
): Promise<PersonScoreResult | null> {
  const { data: events, error } = await supabase
    .from("events")
    .select("event_type, product_slug, weight, intent_weight, occurred_at")
    .eq("person_id", personId)
    .order("occurred_at", { ascending: true })
    .limit(5000);

  if (error) {
    console.error("recomputePerson error:", error.message);
    return null;
  }

  const result = computeScoresForEvents((events as EventRow[]) || []);

  // hasOpenOpportunity / hasLostOpportunity
  const hasOpenOpp = events?.some(
    (e) => e.event_type === "opportunity_created" || e.event_type === "opportunity_stage_change"
  );
  const hasLostOpp = events?.some((e) => e.event_type === "opportunity_lost");

  const lifecycle = classifyLifecycle({
    hasPurchased: result.has_purchased,
    lastEventAt: result.last_event_at,
    hasOpenOpportunity: !!hasOpenOpp,
    hasLostOpportunity: !!hasLostOpp,
  });

  await supabase
    .from("persons")
    .update({
      score: result.score,
      engagement_score: result.engagement,
      intent_score: result.intent,
      demo_readiness: result.demo_readiness,
      segment: result.segment,
      top_product_slug: result.top_product?.slug || null,
      top_product_score: result.top_product?.score || 0,
      total_events: result.event_count,
      visits_count: result.visits_count,
      first_event_at: result.first_event_at,
      last_event_at: result.last_event_at,
      has_purchased: result.has_purchased,
      is_customer: lifecycle === "customer",
      lifecycle_stage: lifecycle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId);

  // Upsert product scores
  if (result.product_scores.length > 0) {
    const rows = result.product_scores.map((ps) => ({
      person_id: personId,
      product_slug: ps.slug,
      score: ps.score,
      engagement_score: ps.engagement,
      intent_score: ps.intent,
      event_count: ps.count,
      first_event_at: ps.first,
      last_event_at: ps.last,
      updated_at: new Date().toISOString(),
    }));
    await supabase
      .from("person_product_scores")
      .upsert(rows, { onConflict: "person_id,product_slug" });
  }

  return result;
}

/**
 * Batch recompute — används av /api/recompute-scores och cron.
 * Processar persons som haft events senaste N dagar (eller alla om fresh=false).
 */
export async function recomputeAll(
  supabase: SupabaseClient,
  options: { limit?: number; onlyRecent?: boolean } = {}
): Promise<{ processed: number; topHotCount: number }> {
  const { limit = 10000, onlyRecent = false } = options;

  let query = supabase
    .from("persons")
    .select("id, last_event_at")
    .order("last_event_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (onlyRecent) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("last_event_at", since);
  }

  const { data: persons } = await query;
  if (!persons) return { processed: 0, topHotCount: 0 };

  let processed = 0;
  let hot = 0;

  // Process i batcher parallellt (10 åt gången)
  for (let i = 0; i < persons.length; i += 10) {
    const batch = persons.slice(i, i + 10);
    const results = await Promise.all(
      batch.map((p) => recomputePerson(supabase, p.id))
    );
    processed += results.filter((r) => r !== null).length;
    hot += results.filter((r) => r && r.segment === "hot").length;
  }

  return { processed, topHotCount: hot };
}
