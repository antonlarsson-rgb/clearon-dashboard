import { NextResponse } from "next/server";
import {
  getPlatformAds,
  getGoogleKeywords,
  getNamedConversions,
  resolveAccountSet,
} from "@/lib/windsor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_LOOKBACKS = [7, 14, 30, 60, 90];

/**
 * Faktiska annonser (ads/creatives) per plattform med kreativ + metrics,
 * aggregerade over vald period. ?account=clearon|mobila, ?lookback=30.
 */
export async function GET(request: Request) {
  if (!process.env.WINDSOR_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "not-configured", message: "WINDSOR_API_KEY saknas" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const account = resolveAccountSet(url.searchParams.get("account"));
  const requestedLookback = Number(url.searchParams.get("lookback")) || 30;
  const lookback = ALLOWED_LOOKBACKS.includes(requestedLookback) ? requestedLookback : 30;
  const period = { lookback_days: lookback };

  const [google, meta, linkedin, googleKeywords, namedConversions] = await Promise.all([
    getPlatformAds("google", period, 1800, account),
    getPlatformAds("meta", period, 1800, account),
    getPlatformAds("linkedin", period, 1800, account),
    getGoogleKeywords(period, 1800, account),
    getNamedConversions(period, 1800, account),
  ]);

  return NextResponse.json({
    account,
    period: { label: `senaste ${lookback} dagarna`, lookback_days: lookback },
    fetched_at: new Date().toISOString(),
    platforms: [google, meta, linkedin],
    googleKeywords,
    namedConversions,
  });
}
