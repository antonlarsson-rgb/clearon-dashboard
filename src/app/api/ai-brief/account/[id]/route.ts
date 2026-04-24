import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateAccountBrief } from "@/lib/ai-brief";

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

    const [productScores, events, persons, vainu] = await Promise.all([
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
        .limit(40),
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

    // Aggregera top pages från events
    const pageCounts = new Map<string, { count: number; duration: number }>();
    for (const ev of events.data || []) {
      const md = ev.metadata as { url?: string; duration_seconds?: number };
      const url = md?.url;
      if (!url) continue;
      const pg = pageCounts.get(url) || { count: 0, duration: 0 };
      pg.count++;
      pg.duration += md.duration_seconds || 0;
      pageCounts.set(url, pg);
    }
    const topPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([url, v]) => ({ url, visits: v.count, duration: v.duration }));

    const brief = await generateAccountBrief({
      name: account.name,
      industry: account.industry,
      website: account.website,
      score: account.score || 0,
      demo_readiness: account.demo_readiness || 0,
      segment: account.segment || "cold",
      lifecycle_stage: account.lifecycle_stage || "prospect",
      is_customer: !!account.is_customer,
      total_events: account.total_events || 0,
      identified_persons_count: persons.count || 0,
      top_product_slug: account.top_product_slug,
      vainu: vainu.data || null,
      product_scores: productScores.data || [],
      recent_events: events.data || [],
      top_pages: topPages,
    });

    return NextResponse.json({ brief });
  } catch (e) {
    console.error("ai-brief/account error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "AI-brief failed" },
      { status: 500 }
    );
  }
}
