import { NextResponse } from "next/server";
import { getVisits, type UpsalesVisit } from "@/lib/upsales";

export const dynamic = "force-dynamic";

/**
 * Hämtar clearon.se-trafik via Upsales tracking.
 * ?since=2026-04-17  (default: senaste 7 dagarna)
 * ?onlyIdentified=1  (endast företag som identifierats via IP)
 * ?limit=200
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days")) || 7;
    const since =
      url.searchParams.get("since") ||
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    const onlyIdentified = url.searchParams.get("onlyIdentified") === "1";
    const limit = Number(url.searchParams.get("limit")) || 200;

    const { data: visits, total } = await getVisits({
      sinceDate: since,
      onlyIdentified,
      limit,
    });

    // Aggregera per identifierat företag
    const byCompany = new Map<
      string,
      {
        name: string;
        clientId: number;
        visits: number;
        totalScore: number;
        totalDuration: number;
        pages: Map<string, { count: number; totalDuration: number }>;
        lastVisit: string;
        referers: Set<string>;
        journeyStep: string | null;
      }
    >();

    let anonymousCount = 0;
    let identifiedCount = 0;

    for (const v of visits) {
      if (!v.client) {
        anonymousCount++;
        continue;
      }
      identifiedCount++;
      const key = v.client.name;
      const existing = byCompany.get(key);
      const duration = v.pages.reduce((acc, p) => acc + (p.durationSeconds || 0), 0);

      if (!existing) {
        const pages = new Map<string, { count: number; totalDuration: number }>();
        for (const p of v.pages) {
          pages.set(p.url, { count: 1, totalDuration: p.durationSeconds || 0 });
        }
        byCompany.set(key, {
          name: v.client.name,
          clientId: v.client.id,
          visits: 1,
          totalScore: v.score,
          totalDuration: duration,
          pages,
          lastVisit: v.startDate,
          referers: new Set(v.referer ? [new URL(v.referer).hostname] : []),
          journeyStep: v.client.journeyStep || null,
        });
      } else {
        existing.visits++;
        existing.totalScore += v.score;
        existing.totalDuration += duration;
        if (v.startDate > existing.lastVisit) existing.lastVisit = v.startDate;
        if (v.referer) {
          try {
            existing.referers.add(new URL(v.referer).hostname);
          } catch {}
        }
        for (const p of v.pages) {
          const pg = existing.pages.get(p.url);
          if (pg) {
            pg.count++;
            pg.totalDuration += p.durationSeconds || 0;
          } else {
            existing.pages.set(p.url, { count: 1, totalDuration: p.durationSeconds || 0 });
          }
        }
      }
    }

    const companies = Array.from(byCompany.values())
      .map((c) => ({
        name: c.name,
        clientId: c.clientId,
        visits: c.visits,
        totalScore: c.totalScore,
        avgDuration: Math.round(c.totalDuration / c.visits),
        journeyStep: c.journeyStep,
        lastVisit: c.lastVisit,
        referers: Array.from(c.referers),
        topPages: Array.from(c.pages.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([url, v]) => ({ url, visits: v.count, duration: v.totalDuration })),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      since,
      summary: {
        total_in_period: total,
        returned: visits.length,
        anonymous: anonymousCount,
        identified: identifiedCount,
        unique_companies: companies.length,
      },
      companies,
    });
  } catch (e) {
    console.error("upsales-visits error:", e);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
