import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/accounts/hot — topp identifierade företag efter score
 *   ?product=sales-promotion
 *   ?lifecycle=prospect | customer | at_risk | dormant
 *   ?limit=50
 *   ?days=30
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
      const { data: aps } = await supabase
        .from("account_product_scores")
        .select(
          "score, engagement_score, intent_score, event_count, last_event_at, account:accounts!inner(id, name, industry, website, segment, lifecycle_stage, is_customer, has_purchased, demo_readiness, identified_persons_count, total_events, last_event_at)"
        )
        .eq("product_slug", product)
        .gte("last_event_at", since)
        .order("score", { ascending: false })
        .limit(limit);

      return NextResponse.json({
        product,
        days,
        accounts:
          aps?.map((row) => {
            const a = Array.isArray(row.account) ? row.account[0] : row.account;
            return {
              id: a?.id,
              name: a?.name,
              industry: a?.industry,
              website: a?.website,
              segment: a?.segment,
              lifecycle: a?.lifecycle_stage,
              is_customer: a?.is_customer,
              has_purchased: a?.has_purchased,
              demo_readiness: a?.demo_readiness,
              identified_persons: a?.identified_persons_count,
              total_events: a?.total_events,
              product_score: row.score,
              product_intent: row.intent_score,
              product_engagement: row.engagement_score,
              product_events: row.event_count,
              last_event_at: row.last_event_at,
            };
          }) || [],
      });
    }

    let q = supabase
      .from("accounts")
      .select(
        "id, name, industry, website, segment, lifecycle_stage, is_customer, has_purchased, score, engagement_score, intent_score, demo_readiness, top_product_slug, top_product_score, identified_persons_count, total_events, last_event_at, ai_score, ai_segment, ai_buy_probability, ai_urgency, ai_best_fit_product, ai_reasoning, ai_next_action, ai_evaluated_at"
      )
      .gt("score", 0)
      .order("ai_score", { ascending: false, nullsFirst: false })
      .order("score", { ascending: false })
      .limit(limit);

    if (lifecycle) q = q.eq("lifecycle_stage", lifecycle);
    if (segment) q = q.eq("segment", segment);

    const { data: accounts } = await q;

    return NextResponse.json({
      days,
      filters: { lifecycle, segment },
      accounts: accounts || [],
    });
  } catch (e) {
    console.error("accounts/hot error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
