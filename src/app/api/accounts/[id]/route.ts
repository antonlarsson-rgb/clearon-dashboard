import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/accounts/[id] — account 360: all identified persons, full event timeline,
 * per-product scores, top pages visited.
 */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();

    const { data: account } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!account) return NextResponse.json({ error: "not found" }, { status: 404 });

    const [persons, productScores, events, vainu] = await Promise.all([
      supabase
        .from("persons")
        .select(
          "id, name, primary_email, title, role_category, score, demo_readiness, segment, lifecycle_stage, has_purchased, last_event_at, top_product_slug"
        )
        .eq("account_id", id)
        .order("score", { ascending: false }),

      supabase
        .from("account_product_scores")
        .select("*")
        .eq("account_id", id)
        .order("score", { ascending: false }),

      supabase
        .from("events")
        .select("id, source, event_type, product_slug, metadata, occurred_at")
        .eq("account_id", id)
        .order("occurred_at", { ascending: false })
        .limit(200),

      account.name
        ? supabase
            .from("vainu_companies")
            .select("industry, employees, revenue, description, city, phone, raw")
            .ilike("name", account.name)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // Aggregera top besökta sidor
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

    return NextResponse.json({
      account,
      persons: persons.data || [],
      product_scores: productScores.data || [],
      events: events.data || [],
      top_pages: topPages,
      vainu: vainu.data || null,
    });
  } catch (e) {
    console.error("accounts/[id] error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
