import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/persons/hot
 *   ?product=sales-promotion  (filter)
 *   ?lifecycle=prospect       (prospect|customer|at_risk|dormant|churned)
 *   ?limit=50
 *   ?days=30                  (aktivitet inom senaste N dagar)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const product = url.searchParams.get("product");
    const lifecycle = url.searchParams.get("lifecycle");
    const segment = url.searchParams.get("segment");
    const limit = Math.min(500, Number(url.searchParams.get("limit")) || 50);
    const days = Number(url.searchParams.get("days")) || 30;

    const supabase = getServiceClient();

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    if (product) {
      // Rank by per-product score
      const { data: pps } = await supabase
        .from("person_product_scores")
        .select(
          "score, engagement_score, intent_score, event_count, last_event_at, person:persons!inner(id, name, primary_email, title, segment, lifecycle_stage, is_customer, has_purchased, demo_readiness, visits_count, last_event_at, account:accounts(name, industry, website))"
        )
        .eq("product_slug", product)
        .gte("last_event_at", since)
        .order("score", { ascending: false })
        .limit(limit);

      return NextResponse.json({
        product,
        days,
        people:
          pps?.map((row) => {
            const person = Array.isArray(row.person) ? row.person[0] : row.person;
            const account = Array.isArray(person?.account) ? person.account[0] : person?.account;
            return {
              id: person?.id,
              name: person?.name,
              email: person?.primary_email,
              title: person?.title,
              account: account
                ? { name: account.name, industry: account.industry, website: account.website }
                : null,
              segment: person?.segment,
              lifecycle: person?.lifecycle_stage,
              is_customer: person?.is_customer,
              has_purchased: person?.has_purchased,
              demo_readiness: person?.demo_readiness,
              product_score: row.score,
              product_intent: row.intent_score,
              product_engagement: row.engagement_score,
              product_events: row.event_count,
              last_event_at: row.last_event_at,
            };
          }) || [],
      });
    }

    // General hot list
    let q = supabase
      .from("persons")
      .select(
        "id, name, primary_email, title, segment, lifecycle_stage, is_customer, has_purchased, score, engagement_score, intent_score, demo_readiness, top_product_slug, top_product_score, visits_count, last_event_at, total_events, account:accounts(name, industry, website)"
      )
      .order("score", { ascending: false })
      .gte("last_event_at", since)
      .limit(limit);

    if (lifecycle) q = q.eq("lifecycle_stage", lifecycle);
    if (segment) q = q.eq("segment", segment);

    const { data: persons } = await q;

    return NextResponse.json({
      days,
      filters: { lifecycle, segment },
      people:
        persons?.map((p) => {
          const account = Array.isArray(p.account) ? p.account[0] : p.account;
          return {
            id: p.id,
            name: p.name,
            email: p.primary_email,
            title: p.title,
            account: account
              ? { name: account.name, industry: account.industry, website: account.website }
              : null,
            segment: p.segment,
            lifecycle: p.lifecycle_stage,
            is_customer: p.is_customer,
            has_purchased: p.has_purchased,
            score: p.score,
            intent: p.intent_score,
            engagement: p.engagement_score,
            demo_readiness: p.demo_readiness,
            top_product: p.top_product_slug,
            top_product_score: p.top_product_score,
            visits_count: p.visits_count,
            total_events: p.total_events,
            last_event_at: p.last_event_at,
          };
        }) || [],
    });
  } catch (e) {
    console.error("persons/hot error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
