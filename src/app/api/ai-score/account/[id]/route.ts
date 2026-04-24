import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { evaluateAccount } from "@/lib/ai-evaluation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();

    const { data: account } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!account) return NextResponse.json({ error: "not found" }, { status: 404 });

    const [productScores, events, personsCount, vainu] = await Promise.all([
      supabase
        .from("account_product_scores")
        .select("product_slug, score, intent_score, event_count")
        .eq("account_id", id)
        .order("score", { ascending: false }),
      supabase
        .from("events")
        .select("source, event_type, product_slug, metadata, occurred_at")
        .eq("account_id", id)
        .order("occurred_at", { ascending: false })
        .limit(30),
      supabase.from("persons").select("id", { count: "exact", head: true }).eq("account_id", id),
      account.name
        ? supabase
            .from("vainu_companies")
            .select("employees, revenue, description, city")
            .ilike("name", account.name)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const pageCounts = new Map<string, { count: number; duration: number }>();
    for (const ev of events.data || []) {
      const md = ev.metadata as { url?: string; duration_seconds?: number };
      if (!md?.url) continue;
      const pg = pageCounts.get(md.url) || { count: 0, duration: 0 };
      pg.count++;
      pg.duration += md.duration_seconds || 0;
      pageCounts.set(md.url, pg);
    }
    const topPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([url, v]) => ({ url, visits: v.count, duration: v.duration }));

    const evaluation = await evaluateAccount({
      name: account.name,
      industry: account.industry,
      website: account.website,
      score: account.score || 0,
      lifecycle_stage: account.lifecycle_stage || "prospect",
      is_customer: !!account.is_customer,
      has_purchased: !!account.has_purchased,
      total_events: account.total_events || 0,
      identified_persons_count: personsCount.count || 0,
      product_scores: productScores.data || [],
      recent_events: events.data || [],
      top_pages: topPages,
      vainu: vainu.data || null,
    });

    await supabase
      .from("accounts")
      .update({
        ai_score: evaluation.ai_score,
        ai_segment: evaluation.ai_segment,
        ai_buy_probability: evaluation.ai_buy_probability,
        ai_urgency: evaluation.ai_urgency,
        ai_best_fit_product: evaluation.ai_best_fit_product,
        ai_reasoning: evaluation.ai_reasoning,
        ai_next_action: evaluation.ai_next_action,
        ai_evaluated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ success: true, evaluation });
  } catch (e) {
    console.error("ai-score/account error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "failed" },
      { status: 500 }
    );
  }
}

export const GET = POST;
