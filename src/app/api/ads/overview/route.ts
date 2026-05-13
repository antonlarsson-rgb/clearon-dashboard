import { NextResponse } from "next/server";
import {
  getConnections,
  getGooglePerformance,
  getMetaPerformance,
  getLinkedInPerformance,
  parseAdspirerReport,
} from "@/lib/adspirer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_LOOKBACKS = [7, 14, 30, 60, 90];

export async function GET(request: Request) {
  if (!process.env.ADSPIRER_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "not-configured", message: "ADSPIRER_TOKEN saknas" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("lookback")) || 30;
  const lookback = ALLOWED_LOOKBACKS.includes(requested) ? requested : 30;

  // Hamta data parallellt for alla plattformar
  // Cache 30 min for performance, 60 min for connections
  const [connectionsResult, google, meta, linkedin] = await Promise.all([
    getConnections(3600),
    getGooglePerformance(lookback, 1800),
    getMetaPerformance(lookback, 1800),
    getLinkedInPerformance(lookback, 1800),
  ]);

  const platforms = [google, meta, linkedin].map((p) => {
    const parsed = p.available && !p.reason ? parseAdspirerReport(p.reportText) : null;
    return {
      platform: p.platform,
      available: p.available,
      reason: p.reason,
      reportText: p.reportText,
      parsed,
      structured: p.structured,
    };
  });

  // Aggregera totals over plattformar dar parsed-data finns
  const totals = platforms.reduce(
    (acc, p) => {
      if (!p.parsed) return acc;
      acc.spend += p.parsed.totalSpend || 0;
      acc.impressions += p.parsed.totalImpressions || 0;
      acc.clicks += p.parsed.totalClicks || 0;
      acc.conversions += p.parsed.totalConversions || 0;
      acc.campaigns += p.parsed.totalCampaigns || 0;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: 0 },
  );

  // Quota fran nagon av platform-svaren (alla gar mot samma quota)
  const quota =
    google.quota || meta.quota || linkedin.quota || null;

  return NextResponse.json({
    lookback_days: lookback,
    fetched_at: new Date().toISOString(),
    connections: connectionsResult.connections,
    platforms,
    totals,
    quota,
  });
}
