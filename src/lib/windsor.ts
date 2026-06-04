/**
 * Windsor.ai-adapter. Drop-in for src/lib/adspirer.ts - exporterar samma typer
 * och funktionsnamn (getGooglePerformance, getMetaPerformance,
 * getLinkedInPerformance, getConnections) sa /api/ads/overview m.fl. bara
 * byter import-path.
 *
 * Windsor levererar data fran flera ad-plattformar via en enda API-nyckel
 * (WINDSOR_API_KEY). Vi filtrerar pa account_name per plattform sa bara
 * ClearOn-data kommer med.
 *
 * Connectors i ClearOn-kontot:
 *  - google_ads (account_name "Clearon")
 *  - linkedin   (account_name "ClearOn", enda kontot)
 *  - facebook   (ej anslutet for ClearOn - returnerar status "unavailable")
 */

const WINDSOR_BASE = "https://connectors.windsor.ai";

// ClearOns konton hos respektive plattform. Bytas ut om kontonamn andras.
// Google: server-side filter funkar (account_name).
// LinkedIn: server-side filter funkar (account_name, case-sensitive).
// Facebook: server-side _filter ar OPALITLIG, vi filtrerar klient-side pa account_id.
const CLEARON_GOOGLE_ACCOUNT_NAME = "Clearon";
const CLEARON_LINKEDIN_ACCOUNT_NAME = "ClearOn";
const CLEARON_META_ACCOUNT_ID = "1771733670071985";

// ---- Typer (matchar adspirer.ts exakt) ----

export interface PeriodArgs {
  lookback_days?: number;
  date_range?: "last_7_days" | "last_14_days" | "last_30_days" | "last_60_days" | "last_90_days";
  start_date?: string;
  end_date?: string;
}

export interface CampaignRow {
  campaign_id: string;
  name: string;
  status?: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  conversion_rate: number | null;
  cost_per_conversion: number | null;
  conversion_value?: number | null;
  roas?: number | null;
  leads?: number | null;
  engagement_rate?: number | null;
  type?: string | null;
  daily_budget?: number | null;
  created_at?: string | null;
}

export interface PlatformPerformance {
  platform: "google" | "meta" | "linkedin";
  available: boolean;
  status: "live" | "no_data" | "syncing" | "unavailable" | "error" | "structure_only";
  reason: string | null;
  currency: string;
  currencyNote: string | null;
  dateRange: { start: string | null; end: string | null };
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    campaigns: number;
    ctr: number | null;
    cpc: number | null;
    cpm: number | null;
    conversion_rate: number | null;
    cost_per_conversion: number | null;
    roas: number | null;
  };
  campaigns: CampaignRow[];
  rawJson: unknown;
  quota: null; // Windsor har ingen Adspirer-liknande quota - alltid null
}

export interface ConnectionInfo {
  platform: string;
  account_id: string;
  account_name: string;
  account_tier: string;
  status: string;
}

// ---- Interna helpers ----

interface WindsorRow {
  date?: string;
  account_name?: string;
  account_id?: string;
  campaign?: string;
  campaign_id?: string;
  campaign_status?: string;
  status?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  currency?: string;
}

interface WindsorResponse {
  data?: WindsorRow[];
}

function getApiKey(): string | null {
  const k = (process.env.WINDSOR_API_KEY || "").trim();
  return k || null;
}

function dateRangeParams(period: PeriodArgs): { date_from?: string; date_to?: string; date_preset?: string } {
  if (period.start_date && period.end_date) {
    return { date_from: period.start_date, date_to: period.end_date };
  }
  if (period.lookback_days) {
    return { date_preset: `last_${period.lookback_days}d` };
  }
  const map: Record<string, string> = {
    last_7_days: "last_7d",
    last_14_days: "last_14d",
    last_30_days: "last_30d",
    last_60_days: "last_60d",
    last_90_days: "last_90d",
  };
  return { date_preset: period.date_range ? map[period.date_range] || "last_30d" : "last_30d" };
}

async function fetchWindsor(
  connector: "google_ads" | "facebook" | "linkedin",
  filter: string | null,
  period: PeriodArgs,
  revalidateSeconds: number,
): Promise<WindsorRow[]> {
  const key = getApiKey();
  if (!key) return [];

  const params = new URLSearchParams({
    api_key: key,
    fields:
      "date,account_name,account_id,campaign,campaign_id,campaign_status,spend,impressions,clicks,conversions,currency",
    _limit: "5000",
  });
  if (filter) params.set("_filter", filter);

  const dates = dateRangeParams(period);
  for (const [k, v] of Object.entries(dates)) if (v) params.set(k, v);

  const url = `${WINDSOR_BASE}/${connector}?${params}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`Windsor ${connector} HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as WindsorResponse;
    return json.data || [];
  } catch (e) {
    console.warn(`Windsor ${connector} fetch error:`, e instanceof Error ? e.message : e);
    return [];
  }
}

function aggregateByCampaign(rows: WindsorRow[]): CampaignRow[] {
  const map = new Map<string, CampaignRow>();
  for (const r of rows) {
    const id = r.campaign_id || r.campaign || "unknown";
    const name = r.campaign || r.campaign_id || "Okand kampanj";
    const existing = map.get(id);
    const spend = (r.spend || 0) + (existing?.spend || 0);
    const impressions = (r.impressions || 0) + (existing?.impressions || 0);
    const clicks = (r.clicks || 0) + (existing?.clicks || 0);
    const conversions = (r.conversions || 0) + (existing?.conversions || 0);
    map.set(id, {
      campaign_id: id,
      name,
      status: r.campaign_status || r.status || existing?.status || null,
      spend,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
      cpc: clicks > 0 ? spend / clicks : null,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
      conversion_rate: clicks > 0 ? (conversions / clicks) * 100 : null,
      cost_per_conversion: conversions > 0 ? spend / conversions : null,
      roas: null,
      leads: null,
    });
  }
  return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
}

function totalsOf(campaigns: CampaignRow[]): PlatformPerformance["totals"] {
  const t = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    campaigns: campaigns.length,
  };
  for (const c of campaigns) {
    t.spend += c.spend;
    t.impressions += c.impressions;
    t.clicks += c.clicks;
    t.conversions += c.conversions;
  }
  return {
    ...t,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : null,
    cpc: t.clicks > 0 ? t.spend / t.clicks : null,
    cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : null,
    conversion_rate: t.clicks > 0 ? (t.conversions / t.clicks) * 100 : null,
    cost_per_conversion: t.conversions > 0 ? t.spend / t.conversions : null,
    roas: null,
  };
}

function dateExtent(rows: WindsorRow[]): { start: string | null; end: string | null } {
  let start: string | null = null;
  let end: string | null = null;
  for (const r of rows) {
    if (!r.date) continue;
    if (!start || r.date < start) start = r.date;
    if (!end || r.date > end) end = r.date;
  }
  return { start, end };
}

function detectCurrency(rows: WindsorRow[], fallback = "SEK"): string {
  for (const r of rows) if (r.currency) return r.currency;
  return fallback;
}

function emptyPlatform(
  platform: PlatformPerformance["platform"],
  status: PlatformPerformance["status"],
  reason: string,
): PlatformPerformance {
  return {
    platform,
    available: false,
    status,
    reason,
    currency: "SEK",
    currencyNote: null,
    dateRange: { start: null, end: null },
    totals: {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      campaigns: 0,
      ctr: null,
      cpc: null,
      cpm: null,
      conversion_rate: null,
      cost_per_conversion: null,
      roas: null,
    },
    campaigns: [],
    rawJson: null,
    quota: null,
  };
}

// ---- Publika funktioner ----

export async function getConnections(_revalidateSeconds = 3600): Promise<{
  connections: ConnectionInfo[];
  error: string | null;
}> {
  // Windsor har inte ett "connections"-API som Adspirer. Vi returnerar en
  // syntetisk lista baserat pa kanda ClearOn-konton sa /api/integrations/status
  // m.fl. ar oforandrade. Live-checken sker via de individuella performance-
  // anropen.
  if (!getApiKey()) {
    return { connections: [], error: "WINDSOR_API_KEY saknas" };
  }
  return {
    connections: [
      {
        platform: "google_ads",
        account_id: "Clearon",
        account_name: "Clearon",
        account_tier: "primary",
        status: "connected",
      },
      {
        platform: "linkedin_ads",
        account_id: "ClearOn",
        account_name: "ClearOn",
        account_tier: "primary",
        status: "connected",
      },
      {
        platform: "meta_ads",
        account_id: "",
        account_name: "ClearOn",
        account_tier: "primary",
        status: "needs_reauth",
      },
    ],
    error: null,
  };
}

export async function getGooglePerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  if (!getApiKey()) {
    return emptyPlatform("google", "unavailable", "WINDSOR_API_KEY saknas");
  }
  const rows = await fetchWindsor(
    "google_ads",
    `account_name::EQUAL::${CLEARON_GOOGLE_ACCOUNT_NAME}`,
    period,
    revalidateSeconds,
  );
  if (rows.length === 0) {
    return emptyPlatform("google", "no_data", "Ingen Google-data fran Windsor for valt intervall.");
  }
  const campaigns = aggregateByCampaign(rows);
  return {
    platform: "google",
    available: true,
    status: "live",
    reason: null,
    currency: detectCurrency(rows, "SEK"),
    currencyNote: null,
    dateRange: dateExtent(rows),
    totals: totalsOf(campaigns),
    campaigns,
    rawJson: { source: "windsor", connector: "google_ads", account: "Clearon", rowCount: rows.length },
    quota: null,
  };
}

export async function getLinkedInPerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  if (!getApiKey()) {
    return emptyPlatform("linkedin", "unavailable", "WINDSOR_API_KEY saknas");
  }
  const rows = await fetchWindsor(
    "linkedin",
    `account_name::EQUAL::${CLEARON_LINKEDIN_ACCOUNT_NAME}`,
    period,
    revalidateSeconds,
  );
  if (rows.length === 0) {
    return emptyPlatform("linkedin", "no_data", "Ingen LinkedIn-data fran Windsor for valt intervall.");
  }
  const campaigns = aggregateByCampaign(rows);
  return {
    platform: "linkedin",
    available: true,
    status: "live",
    reason: null,
    currency: detectCurrency(rows, "SEK"),
    currencyNote: null,
    dateRange: dateExtent(rows),
    totals: totalsOf(campaigns),
    campaigns,
    rawJson: { source: "windsor", connector: "linkedin", account: "ClearOn", rowCount: rows.length },
    quota: null,
  };
}

export async function getMetaPerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  if (!getApiKey()) {
    return emptyPlatform("meta", "unavailable", "WINDSOR_API_KEY saknas");
  }
  // Windsors _filter ar opalitlig pa facebook-connectorn (returnerar alla
  // konton oavsett filter), sa vi hamtar utan filter och filtrerar
  // klient-side pa account_id = ClearOns Meta-konto.
  const allRows = await fetchWindsor("facebook", null, period, revalidateSeconds);
  const rows = allRows.filter(
    (r) => String(r.account_id || "") === CLEARON_META_ACCOUNT_ID,
  );

  if (rows.length === 0) {
    return emptyPlatform(
      "meta",
      "unavailable",
      `ClearOns Meta-konto (${CLEARON_META_ACCOUNT_ID}) ar inte anslutet till Windsor an. Anslut det via app.windsor.ai > Connectors > Facebook for att fa live-data. Foljande konton ar idag uppkopplade: ${[
        ...new Set(allRows.map((r) => r.account_name).filter(Boolean)),
      ].join(", ") || "inga"}.`,
    );
  }

  const campaigns = aggregateByCampaign(rows);
  return {
    platform: "meta",
    available: true,
    status: "live",
    reason: null,
    currency: detectCurrency(rows, "SEK"),
    currencyNote: null,
    dateRange: dateExtent(rows),
    totals: totalsOf(campaigns),
    campaigns,
    rawJson: {
      source: "windsor",
      connector: "facebook",
      account_id: CLEARON_META_ACCOUNT_ID,
      rowCount: rows.length,
    },
    quota: null,
  };
}
