// KPI:er räknade på person-grafen, inte Upsales.
// Hot accounts, qualified-by-AI, persons to contact now, pipeline value.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = getServiceClient();
    const since24h = new Date(Date.now() - DAY).toISOString();
    const since7d = new Date(Date.now() - 7 * DAY).toISOString();

    const [
      hotAccounts,
      qualifiedAccounts,
      activePersons,
      newOpps24h,
      openOpps,
    ] = await Promise.all([
      // Hot accounts: segment=hot ELLER ai_segment=qualified
      supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .or("segment.eq.hot,ai_segment.eq.qualified"),

      // Just AI-qualified
      supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .eq("ai_segment", "qualified"),

      // Aktiva personer senaste 7d
      supabase
        .from("persons")
        .select("id", { count: "exact", head: true })
        .gte("last_event_at", since7d),

      // Nya opportunity-events senaste 24h
      supabase
        .from("events")
        .select("metadata", { count: "exact" })
        .in("event_type", ["opportunity_created", "opportunity_stage_change"])
        .gte("occurred_at", since24h),

      // Pågående opportunities-värde (summa value från events där det inte finns won/lost senare)
      supabase
        .from("events")
        .select("metadata, account_id, occurred_at, event_type")
        .in("event_type", [
          "opportunity_created",
          "opportunity_stage_change",
          "opportunity_won",
          "opportunity_lost",
        ])
        .gte("occurred_at", new Date(Date.now() - 90 * DAY).toISOString())
        .order("occurred_at", { ascending: false })
        .limit(500),
    ]);

    // Räkna pågående opps + summa
    const oppLatestByAccount = new Map<
      string,
      { value: number; status: "open" | "won" | "lost" }
    >();
    for (const ev of openOpps.data || []) {
      const aid = ev.account_id as string | null;
      if (!aid) continue;
      if (oppLatestByAccount.has(aid)) continue; // ordered DESC, så första vinner
      const md = (ev.metadata as { value?: number }) || {};
      const status: "open" | "won" | "lost" =
        ev.event_type === "opportunity_won"
          ? "won"
          : ev.event_type === "opportunity_lost"
            ? "lost"
            : "open";
      oppLatestByAccount.set(aid, { value: md.value || 0, status });
    }
    const openOppCount = [...oppLatestByAccount.values()].filter(
      (o) => o.status === "open",
    ).length;
    const openOppValue = [...oppLatestByAccount.values()]
      .filter((o) => o.status === "open")
      .reduce((sum, o) => sum + o.value, 0);
    const wonCount = [...oppLatestByAccount.values()].filter((o) => o.status === "won").length;
    const totalOppsCount = oppLatestByAccount.size;
    const winRate = totalOppsCount > 0 ? (wonCount / totalOppsCount) * 100 : 0;

    return NextResponse.json({
      hot_accounts: hotAccounts.count || 0,
      qualified_accounts: qualifiedAccounts.count || 0,
      active_persons_7d: activePersons.count || 0,
      new_opps_24h: newOpps24h.count || 0,
      open_opp_count: openOppCount,
      open_opp_value: openOppValue,
      win_rate_pct: Math.round(winRate * 10) / 10,
    });
  } catch (e) {
    console.error("dashboard/kpis error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
