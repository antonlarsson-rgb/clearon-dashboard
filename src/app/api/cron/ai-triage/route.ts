// Cron: varje timme. Kör AI-evaluering på accounts som RÖRT SIG sedan senaste
// AI-värdering (eller aldrig värderats och har score > 0).
//
// Strategi:
//  1. Hämta accounts där (a) senaste event > ai_evaluated_at, eller (b) aldrig
//     värderats men har activity senaste 7 dagarna och score > threshold.
//  2. Max 20 per körning för kostnadskontroll. Med 1-timmes-takt = ~480/dag,
//     vilket är mer än ClearOn någonsin behöver per 24h.
//  3. Anropar samma /api/ai-score/batch-logik (Claude Sonnet 4.6 tool-use).

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { evaluateAccount } from "@/lib/ai-evaluation";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PER_RUN_LIMIT = 20;
const MIN_SCORE_FOR_TRIAGE = 5;
const RECENT_DAYS = 7;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const t0 = Date.now();
  const recentSince = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Kandidater: (a) aldrig värderats men har aktivitet senaste 7d och score > 5,
  // eller (b) sist värderats >= 24h sedan + nyare events än senaste värdering.
  const { data: candidates } = await supabase
    .from("accounts")
    .select("id, name, score, last_event_at, ai_evaluated_at")
    .gte("score", MIN_SCORE_FOR_TRIAGE)
    .gte("last_event_at", recentSince)
    .order("score", { ascending: false })
    .limit(80);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({
      success: true,
      elapsedMs: Date.now() - t0,
      candidates: 0,
      processed: 0,
    });
  }

  // Filtrera till de som faktiskt behöver om-värdering
  const needsEval = candidates
    .filter((a) => {
      if (!a.ai_evaluated_at) return true;
      const evAt = new Date(a.ai_evaluated_at).getTime();
      const lastEv = a.last_event_at ? new Date(a.last_event_at).getTime() : 0;
      const ageHours = (Date.now() - evAt) / (60 * 60 * 1000);
      return lastEv > evAt || ageHours >= 24;
    })
    .slice(0, PER_RUN_LIMIT);

  const results: Array<{ id: string; ok: boolean; segment?: string; error?: string }> = [];

  for (let i = 0; i < needsEval.length; i += 3) {
    const batch = needsEval.slice(i, i + 3);
    const settled = await Promise.allSettled(
      batch.map(async (a) => {
        const { data: account } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", a.id)
          .maybeSingle();
        if (!account) return { id: a.id, ok: false, error: "not found" };

        const [productScores, events, personsCount, vainu] = await Promise.all([
          supabase
            .from("account_product_scores")
            .select("product_slug, score, intent_score, event_count")
            .eq("account_id", a.id)
            .order("score", { ascending: false }),
          supabase
            .from("events")
            .select("source, event_type, product_slug, metadata, occurred_at")
            .eq("account_id", a.id)
            .order("occurred_at", { ascending: false })
            .limit(30),
          supabase
            .from("persons")
            .select("id", { count: "exact", head: true })
            .eq("account_id", a.id),
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
          .sort((x, y) => y[1].count - x[1].count)
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
          .eq("id", a.id);

        return { id: a.id, ok: true, segment: evaluation.ai_segment };
      }),
    );

    for (const r of settled) {
      if (r.status === "fulfilled") results.push(r.value);
      else results.push({ id: "?", ok: false, error: String(r.reason).slice(0, 200) });
    }
  }

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    candidates: candidates.length,
    needs_eval: needsEval.length,
    processed: results.length,
    qualified: results.filter((r) => r.segment === "qualified").length,
    results,
  });
}

export const POST = GET;
