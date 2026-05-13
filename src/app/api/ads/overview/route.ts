import { NextResponse } from "next/server";
import {
  getConnections,
  getGooglePerformance,
  getMetaPerformance,
  getLinkedInPerformance,
  type PeriodArgs,
} from "@/lib/adspirer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_LOOKBACKS = [7, 14, 30, 60, 90];

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export async function GET(request: Request) {
  if (!process.env.ADSPIRER_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "not-configured", message: "ADSPIRER_TOKEN saknas" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start_date");
  const endDateRaw = url.searchParams.get("end_date");
  const requestedLookback = Number(url.searchParams.get("lookback")) || 30;
  const lookback = ALLOWED_LOOKBACKS.includes(requestedLookback) ? requestedLookback : 30;

  // Cap end_date till idag - Adspirer avvisar framtida datum med valideringsfel
  const today = new Date().toISOString().slice(0, 10);
  const endDate =
    endDateRaw && isValidDate(endDateRaw) && endDateRaw > today ? today : endDateRaw;

  // Bygg period: prioritera explicita datum, annars lookback_days
  let period: PeriodArgs;
  let label: string;
  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    period = { start_date: startDate, end_date: endDate };
    label =
      endDateRaw !== endDate
        ? `${startDate} till ${endDate} (cap)`
        : `${startDate} till ${endDate}`;
  } else {
    period = { lookback_days: lookback };
    label = `senaste ${lookback} dagarna`;
  }

  // Cache 30 min for performance, 60 min for connections
  const [connectionsResult, google, meta, linkedin] = await Promise.all([
    getConnections(3600),
    getGooglePerformance(period, 1800),
    getMetaPerformance(period, 1800),
    getLinkedInPerformance(period, 1800),
  ]);

  const platforms = [google, meta, linkedin];

  // Aggregera per valuta - undvik mix av SEK + USD
  const liveByCurrency = new Map<string, {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    campaigns: number;
  }>();

  for (const p of platforms) {
    if (p.status !== "live") continue;
    const cur = p.currency || "SEK";
    const acc = liveByCurrency.get(cur) || {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      campaigns: 0,
    };
    acc.spend += p.totals.spend;
    acc.impressions += p.totals.impressions;
    acc.clicks += p.totals.clicks;
    acc.conversions += p.totals.conversions;
    acc.campaigns += p.totals.campaigns;
    liveByCurrency.set(cur, acc);
  }

  const totalsByCurrency = Array.from(liveByCurrency.entries()).map(([currency, t]) => ({
    currency,
    ...t,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : null,
    cpc: t.clicks > 0 ? t.spend / t.clicks : null,
    cost_per_conversion: t.conversions > 0 ? t.spend / t.conversions : null,
  }));

  // Quota fran nagon plattform - alla gar mot samma quota
  const quota = google.quota || meta.quota || linkedin.quota || null;

  return NextResponse.json({
    period: {
      label,
      lookback_days: startDate && endDate ? null : lookback,
      start_date: startDate || null,
      end_date: endDate || null,
    },
    fetched_at: new Date().toISOString(),
    connections: connectionsResult.connections,
    platforms,
    totalsByCurrency,
    quota,
  });
}
