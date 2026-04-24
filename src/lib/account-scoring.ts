// Account-level scoring. Aggregerar events för ett konto OCH alla persons
// kopplade till kontot. Detta är nyckelvyn för B2B eftersom de flesta
// Upsales-visits är IP-identifierade på företagsnivå.

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeScoresForEvents, classifyLifecycle } from "@/lib/person-scoring";

interface EventRow {
  event_type: string;
  product_slug: string | null;
  weight: number;
  intent_weight: number;
  occurred_at: string;
}

export async function recomputeAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<{ score: number; segment: string } | null> {
  // Hämta alla events kopplade till kontot — direkt och via persons
  const [directRes, personPersonsRes] = await Promise.all([
    supabase
      .from("events")
      .select("event_type, product_slug, weight, intent_weight, occurred_at")
      .eq("account_id", accountId)
      .order("occurred_at", { ascending: true })
      .limit(5000),
    supabase
      .from("persons")
      .select("id")
      .eq("account_id", accountId),
  ]);

  let events: EventRow[] = (directRes.data as EventRow[]) || [];

  // Hämta events från personerna också
  const personIds = (personPersonsRes.data || []).map((p) => p.id);
  if (personIds.length > 0) {
    const { data: personEvents } = await supabase
      .from("events")
      .select("event_type, product_slug, weight, intent_weight, occurred_at")
      .in("person_id", personIds)
      .order("occurred_at", { ascending: true })
      .limit(5000);
    events = events.concat((personEvents as EventRow[]) || []);
  }

  const result = computeScoresForEvents(events);

  const hasOpenOpp = events.some(
    (e) => e.event_type === "opportunity_created" || e.event_type === "opportunity_stage_change"
  );
  const hasLostOpp = events.some((e) => e.event_type === "opportunity_lost");

  const lifecycle = classifyLifecycle({
    hasPurchased: result.has_purchased,
    lastEventAt: result.last_event_at,
    hasOpenOpportunity: hasOpenOpp,
    hasLostOpportunity: hasLostOpp,
  });

  await supabase
    .from("accounts")
    .update({
      score: result.score,
      engagement_score: result.engagement,
      intent_score: result.intent,
      demo_readiness: result.demo_readiness,
      segment: result.segment,
      top_product_slug: result.top_product?.slug || null,
      top_product_score: result.top_product?.score || 0,
      total_events: result.event_count,
      first_event_at: result.first_event_at,
      last_event_at: result.last_event_at,
      has_purchased: result.has_purchased,
      is_customer: lifecycle === "customer",
      lifecycle_stage: lifecycle,
      identified_persons_count: personIds.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId);

  // product scores per account
  if (result.product_scores.length > 0) {
    const rows = result.product_scores.map((ps) => ({
      account_id: accountId,
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
      .from("account_product_scores")
      .upsert(rows, { onConflict: "account_id,product_slug" });
  }

  return { score: result.score, segment: result.segment };
}

export async function recomputeAllAccounts(
  supabase: SupabaseClient,
  options: { limit?: number; onlyRecent?: boolean } = {}
): Promise<{ processed: number; hot: number; t: number }> {
  const t0 = Date.now();
  const { limit = 10000, onlyRecent = false } = options;

  let query = supabase
    .from("accounts")
    .select("id")
    .limit(limit);

  // Om onlyRecent: bara accounts med event senaste 90 dagarna
  if (onlyRecent) {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    // vi kan inte enkelt join:a — kör alla accounts som har events sen since
    const { data: eventAccounts } = await supabase
      .from("events")
      .select("account_id")
      .gte("occurred_at", since)
      .not("account_id", "is", null)
      .limit(10000);
    const ids = Array.from(
      new Set((eventAccounts || []).map((e) => e.account_id).filter(Boolean))
    );
    if (ids.length === 0) return { processed: 0, hot: 0, t: 0 };
    query = supabase.from("accounts").select("id").in("id", ids).limit(limit);
  }

  const { data: accounts } = await query;
  if (!accounts) return { processed: 0, hot: 0, t: 0 };

  let processed = 0;
  let hot = 0;

  for (let i = 0; i < accounts.length; i += 10) {
    const batch = accounts.slice(i, i + 10);
    const results = await Promise.all(
      batch.map((a) => recomputeAccount(supabase, a.id))
    );
    processed += results.filter((r) => r !== null).length;
    hot += results.filter((r) => r && r.segment === "hot").length;
  }

  return { processed, hot, t: Date.now() - t0 };
}
