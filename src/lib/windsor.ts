/**
 * Windsor.ai-adapter. Drop-in for src/lib/adspirer.ts - exporterar samma typer
 * och funktionsnamn (getGooglePerformance, getMetaPerformance,
 * getLinkedInPerformance, getConnections) sa /api/ads/overview m.fl. bara
 * byter import-path.
 *
 * Windsor levererar data fran flera ad-plattformar via en enda API-nyckel
 * (WINDSOR_API_KEY). Nyckeln ar kopplad till Stellars hela kontostruktur
 * (9 Google-konton, 6 Meta-konton), sa ALL filtrering sker klient-side pa
 * account_id. Windsors _filter-param ar verifierat trasig pa samtliga
 * connectors (returnerar alla konton oavsett filter) - anvand den inte.
 *
 * Tva kontoset stods:
 *  - clearon: ClearOns egna konton (Google + LinkedIn + Meta)
 *  - mobila:  Mobila Presentkort (Google + Meta, ingen LinkedIn)
 *
 * OBS: facebook-connectorn returnerar spend/impressions/clicks som STRANGAR.
 * All aggregering maste ga via num() for att undvika strangkonkatenering.
 */

const WINDSOR_BASE = "https://connectors.windsor.ai";

export type AccountSet = "clearon" | "mobila";

// Account-id per plattform och kontoset. Verifierade mot Windsor 2026-06-10.
const ACCOUNTS: Record<
  AccountSet,
  { google?: string; linkedin?: string; meta?: string; label: string }
> = {
  clearon: {
    google: "103-319-6174",
    linkedin: "514197293",
    meta: "1771733670071985",
    label: "ClearOn",
  },
  mobila: {
    google: "217-792-7318",
    linkedin: "514407816",
    meta: "1265886504462453",
    label: "Mobila Presentkort",
  },
};

export function resolveAccountSet(value: string | null | undefined): AccountSet {
  return value === "mobila" ? "mobila" : "clearon";
}

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
    conversion_value: number;
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

/** En faktisk annons (ad/creative) med kreativ + period-aggregerade metrics.
 * group = mellannivan: Meta ad set, Google annonsgrupp, LinkedIn kampanj
 * (LinkedIns hierarki ar Campaign Group > Campaign > Creative, sa dar blir
 * campaign_name = campaign group). */
export interface AdInfo {
  ad_id: string;
  name: string;
  headline: string | null;
  body: string | null;
  group_id: string | null;
  group_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  status: string | null;
  thumbnail_url: string | null;
  destination_url: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  /** Konverteringar per typ, t.ex. [{label: "Leads", value: 11}] */
  conversion_types: Array<{ label: string; value: number }>;
  ctr: number | null;
  cpc: number | null;
  currency: string;
}

export interface PlatformAds {
  platform: "google" | "meta" | "linkedin";
  status: "live" | "no_data" | "unavailable";
  reason: string | null;
  ads: AdInfo[];
}

// ---- Interna helpers ----

interface WindsorRow {
  date?: string;
  account_name?: string;
  account_id?: string | number;
  campaign?: string;
  campaign_id?: string | number;
  campaign_status?: string;
  status?: string;
  spend?: number | string;
  impressions?: number | string;
  clicks?: number | string;
  conversions?: number | string;
  currency?: string;
  // Plattformsspecifika konverteringsfalt. Det generiska "conversions" ar
  // tomt/fel pa facebook (null) och linkedin (share conversions) - ratt
  // varden ligger i action-falten nedan.
  actions_lead?: number | string;
  actions_purchase?: number | string;
  externalwebsiteconversions?: number | string;
  oneclickleads?: number | string;
  // Konverteringsvarde (intakt) per plattform
  conversions_value?: number | string;
  action_values_omni_purchase?: number | string;
  conversionvalueinlocalcurrency?: number | string;
}

interface WindsorResponse {
  data?: WindsorRow[];
}

function getApiKey(): string | null {
  const k = (process.env.WINDSOR_API_KEY || "").trim();
  return k || null;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
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

// Kampanjniva-falt per connector. Konverteringar hamtas fran ratt falt:
// google = conversions, facebook = actions_lead + actions_purchase,
// linkedin = externalwebsiteconversions + oneclickleads.
const CAMPAIGN_FIELDS = {
  google_ads:
    "date,account_name,account_id,campaign,campaign_id,campaign_status,spend,impressions,clicks,conversions,conversions_value,currency",
  facebook:
    "date,account_name,account_id,campaign,campaign_id,campaign_status,spend,impressions,clicks,actions_lead,actions_purchase,action_values_omni_purchase,currency",
  linkedin:
    "date,account_name,account_id,campaign,campaign_id,campaign_status,spend,impressions,clicks,externalwebsiteconversions,oneclickleads,conversionvalueinlocalcurrency,currency",
} as const;

function rowConversions(
  connector: "google_ads" | "facebook" | "linkedin",
  r: WindsorRow,
): number {
  if (connector === "facebook") return num(r.actions_lead) + num(r.actions_purchase);
  if (connector === "linkedin")
    return num(r.externalwebsiteconversions) + num(r.oneclickleads);
  return num(r.conversions);
}

/** Konverteringsvarde (intakt) som plattformen sjalv rapporterar. */
function rowConversionValue(
  connector: "google_ads" | "facebook" | "linkedin",
  r: WindsorRow,
): number {
  if (connector === "facebook") return num(r.action_values_omni_purchase);
  if (connector === "linkedin") return num(r.conversionvalueinlocalcurrency);
  return num(r.conversions_value);
}

async function fetchWindsor(
  connector: "google_ads" | "facebook" | "linkedin",
  accountId: string,
  period: PeriodArgs,
  revalidateSeconds: number,
): Promise<{ rows: WindsorRow[]; allAccountNames: string[] }> {
  const key = getApiKey();
  if (!key) return { rows: [], allAccountNames: [] };

  const params = new URLSearchParams({
    api_key: key,
    fields: CAMPAIGN_FIELDS[connector],
    // Hogt tak: nyckeln tacker hela Stellar-portfoljen sa dagsrader for alla
    // konton kan bli manga - truncering ger tyst fel data.
    _limit: "30000",
  });

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
      return { rows: [], allAccountNames: [] };
    }
    const json = (await res.json()) as WindsorResponse;
    const all = json.data || [];
    const rows = all.filter((r) => String(r.account_id || "") === accountId);
    const allAccountNames = [...new Set(all.map((r) => r.account_name).filter(Boolean))] as string[];
    return { rows, allAccountNames };
  } catch (e) {
    console.warn(`Windsor ${connector} fetch error:`, e instanceof Error ? e.message : e);
    return { rows: [], allAccountNames: [] };
  }
}

function aggregateByCampaign(
  rows: WindsorRow[],
  connector: "google_ads" | "facebook" | "linkedin",
): CampaignRow[] {
  const map = new Map<string, CampaignRow>();
  for (const r of rows) {
    const id = String(r.campaign_id || r.campaign || "unknown");
    const name = r.campaign || String(r.campaign_id || "") || "Okand kampanj";
    const existing = map.get(id);
    const spend = num(r.spend) + (existing?.spend || 0);
    const impressions = num(r.impressions) + (existing?.impressions || 0);
    const clicks = num(r.clicks) + (existing?.clicks || 0);
    const conversions = rowConversions(connector, r) + (existing?.conversions || 0);
    const conversionValue =
      rowConversionValue(connector, r) + (existing?.conversion_value || 0);
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
      conversion_value: conversionValue,
      roas: conversionValue > 0 && spend > 0 ? conversionValue / spend : null,
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
  let conversionValue = 0;
  for (const c of campaigns) {
    t.spend += c.spend;
    t.impressions += c.impressions;
    t.clicks += c.clicks;
    t.conversions += c.conversions;
    conversionValue += c.conversion_value || 0;
  }
  return {
    ...t,
    ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : null,
    cpc: t.clicks > 0 ? t.spend / t.clicks : null,
    cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : null,
    conversion_rate: t.clicks > 0 ? (t.conversions / t.clicks) * 100 : null,
    cost_per_conversion: t.conversions > 0 ? t.spend / t.conversions : null,
    conversion_value: conversionValue,
    roas: conversionValue > 0 && t.spend > 0 ? conversionValue / t.spend : null,
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
      conversion_value: 0,
      roas: null,
    },
    campaigns: [],
    rawJson: null,
    quota: null,
  };
}

function livePlatform(
  platform: PlatformPerformance["platform"],
  connector: "google_ads" | "facebook" | "linkedin",
  accountId: string,
  rows: WindsorRow[],
): PlatformPerformance {
  const campaigns = aggregateByCampaign(rows, connector);
  return {
    platform,
    available: true,
    status: "live",
    reason: null,
    currency: detectCurrency(rows, "SEK"),
    currencyNote: null,
    dateRange: dateExtent(rows),
    totals: totalsOf(campaigns),
    campaigns,
    rawJson: { source: "windsor", connector, account_id: accountId, rowCount: rows.length },
    quota: null,
  };
}

// ---- Annonsniva (faktiska annonser med kreativ) ----

// Falt per connector for annonsniva. Utan "date" aggregerar Windsor hela
// perioden till en rad per annons - mycket farre rader och ratt granularitet
// for en annonslista.
const AD_FIELDS = {
  google_ads:
    "account_id,campaign,campaign_id,campaign_status,ad_group_id,ad_group_name,ad_id,ad_name,ad_status,ad_group_status,ad_final_urls,ad_type,spend,impressions,clicks,conversions,currency",
  facebook:
    "account_id,campaign,campaign_id,campaign_status,adset_id,adset_name,ad_id,ad_name,title,body,thumbnail_url,link_url,effective_status,adset_status,spend,impressions,clicks,actions_lead,actions_purchase,currency",
  linkedin:
    "account_id,campaign,campaign_id,campaign_status,campaign_group_id,campaign_group_name,creative_id,sponsored_creative_content_title,sponsored_creative_content_description,creative_thumbnail,creative_status,landing_page,spend,impressions,clicks,externalwebsiteconversions,oneclickleads,currency",
} as const;

interface WindsorAdRow extends WindsorRow {
  ad_id?: string | number;
  ad_name?: string;
  ad_status?: string | null;
  ad_group_status?: string | null;
  ad_final_urls?: string;
  ad_type?: string;
  title?: string;
  body?: string;
  thumbnail_url?: string;
  link_url?: string;
  effective_status?: string;
  adset_status?: string | null;
  adset_id?: string | number;
  adset_name?: string;
  ad_group_id?: string | number;
  ad_group_name?: string;
  campaign_group_id?: string | number;
  campaign_group_name?: string;
  creative_id?: string | number;
  sponsored_creative_content_title?: string;
  sponsored_creative_content_description?: string;
  creative_thumbnail?: string;
  creative_status?: string;
  landing_page?: string;
}

async function fetchWindsorAds(
  connector: keyof typeof AD_FIELDS,
  accountId: string,
  period: PeriodArgs,
  revalidateSeconds: number,
): Promise<WindsorAdRow[]> {
  const key = getApiKey();
  if (!key) return [];

  const params = new URLSearchParams({
    api_key: key,
    fields: AD_FIELDS[connector],
    _limit: "30000",
  });
  const dates = dateRangeParams(period);
  for (const [k, v] of Object.entries(dates)) if (v) params.set(k, v);

  try {
    const res = await fetch(`${WINDSOR_BASE}/${connector}?${params}`, {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`Windsor ads ${connector} HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as { data?: WindsorAdRow[] };
    return (json.data || []).filter((r) => String(r.account_id || "") === accountId);
  } catch (e) {
    console.warn(`Windsor ads ${connector} fetch error:`, e instanceof Error ? e.message : e);
    return [];
  }
}

/**
 * Live pa riktigt = annonsen OCH dess adset/annonsgrupp OCH kampanjen ar
 * aktiva. Plattformarna rapporterar gamla annonser som "ACTIVE" trots att
 * kampanjen ovanfor ar pausad - de ska inte visas som live.
 * null/undefined raknas som live (Google rapporterar t.ex. alltid
 * ad_status=null) - bara ett explicit icke-aktivt varde diskvalificerar.
 */
function isLiveStatus(s: string | null | undefined): boolean {
  if (!s) return true;
  const t = s.toUpperCase();
  return t === "ACTIVE" || t === "ENABLED";
}

function isFullyLive(platform: PlatformAds["platform"], r: WindsorAdRow): boolean {
  if (platform === "google") {
    return (
      isLiveStatus(r.ad_status) &&
      isLiveStatus(r.ad_group_status) &&
      isLiveStatus(r.campaign_status)
    );
  }
  if (platform === "meta") {
    // effective_status fangar redan ADSET_PAUSED/CAMPAIGN_PAUSED, men vi
    // kraver alla tre for sakerhets skull
    return (
      isLiveStatus(r.effective_status) &&
      isLiveStatus(r.adset_status) &&
      isLiveStatus(r.campaign_status)
    );
  }
  return isLiveStatus(r.creative_status) && isLiveStatus(r.campaign_status);
}

function parseGoogleFinalUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as string[];
    return arr[0] || null;
  } catch {
    return raw || null;
  }
}

function normalizeAd(
  platform: PlatformAds["platform"],
  r: WindsorAdRow,
): AdInfo | null {
  const spend = num(r.spend);
  const impressions = num(r.impressions);
  const clicks = num(r.clicks);
  // Skippa annonser utan aktivitet i perioden (gamla utkast/avstangda
  // annonser ligger kvar som nollrader hos plattformarna)
  if (impressions === 0 && spend === 0) return null;

  let conversions: number;
  const conversionTypes: Array<{ label: string; value: number }> = [];
  if (platform === "meta") {
    const leads = num(r.actions_lead);
    const purchases = num(r.actions_purchase);
    conversions = leads + purchases;
    if (leads > 0) conversionTypes.push({ label: "Leads", value: leads });
    if (purchases > 0) conversionTypes.push({ label: "Köp", value: purchases });
  } else if (platform === "linkedin") {
    const web = num(r.externalwebsiteconversions);
    const forms = num(r.oneclickleads);
    conversions = web + forms;
    if (web > 0) conversionTypes.push({ label: "Webbplatskonv.", value: web });
    if (forms > 0) conversionTypes.push({ label: "Lead gen-formulär", value: forms });
  } else {
    conversions = num(r.conversions);
  }

  let base: Pick<
    AdInfo,
    | "ad_id"
    | "name"
    | "headline"
    | "body"
    | "status"
    | "thumbnail_url"
    | "destination_url"
    | "group_id"
    | "group_name"
    | "campaign_id"
    | "campaign_name"
  >;
  if (platform === "google") {
    // Google RSA: ad_name = alla headlines separerade med " | "
    const headlines = (r.ad_name || "").split(" | ");
    base = {
      ad_id: String(r.ad_id || ""),
      name: headlines[0] || String(r.ad_id || "Okand annons"),
      headline: headlines.slice(0, 3).join(" | ") || null,
      body: r.ad_type || null,
      status: r.ad_status || null,
      thumbnail_url: null,
      destination_url: parseGoogleFinalUrl(r.ad_final_urls),
      group_id: r.ad_group_id ? String(r.ad_group_id) : null,
      group_name: r.ad_group_name || null,
      campaign_id: r.campaign_id ? String(r.campaign_id) : null,
      campaign_name: r.campaign || null,
    };
  } else if (platform === "meta") {
    base = {
      ad_id: String(r.ad_id || ""),
      name: r.ad_name || String(r.ad_id || "Okand annons"),
      headline: r.title || null,
      body: r.body || null,
      status: r.effective_status || null,
      thumbnail_url: r.thumbnail_url || null,
      destination_url: r.link_url || null,
      group_id: r.adset_id ? String(r.adset_id) : null,
      group_name: r.adset_name || null,
      campaign_id: r.campaign_id ? String(r.campaign_id) : null,
      campaign_name: r.campaign || null,
    };
  } else {
    // LinkedIn: Campaign Group > Campaign > Creative. Kampanjen ar
    // adset-nivan, campaign group ar kampanj-nivan.
    base = {
      ad_id: String(r.creative_id || ""),
      name:
        (r.sponsored_creative_content_title || "").trim() ||
        String(r.creative_id || "Okand annons"),
      headline: (r.sponsored_creative_content_title || "").trim() || null,
      body: (r.sponsored_creative_content_description || "").trim() || null,
      status: r.creative_status || null,
      thumbnail_url: r.creative_thumbnail || null,
      destination_url: r.landing_page || null,
      group_id: r.campaign_id ? String(r.campaign_id) : null,
      group_name: r.campaign || null,
      campaign_id: r.campaign_group_id ? String(r.campaign_group_id) : null,
      campaign_name: r.campaign_group_name || null,
    };
  }

  return {
    ...base,
    spend,
    impressions,
    clicks,
    conversions,
    conversion_types: conversionTypes,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    cpc: clicks > 0 ? spend / clicks : null,
    currency: r.currency || "SEK",
  };
}

// ---- Google sokord + namngivna konverteringar ----

export interface KeywordRow {
  text: string;
  campaign_name: string | null;
  clicks: number;
  spend: number;
  conversions: number;
  cost_per_conversion: number | null;
}

export interface GoogleKeywords {
  keywords: KeywordRow[];
  searchTerms: KeywordRow[];
}

async function fetchKeywordRows(
  accountId: string,
  textField: "keyword_text" | "search_term",
  period: PeriodArgs,
  revalidateSeconds: number,
): Promise<KeywordRow[]> {
  const key = getApiKey();
  if (!key) return [];
  const params = new URLSearchParams({
    api_key: key,
    fields: `account_id,campaign,${textField},clicks,spend,conversions`,
    _limit: "30000",
  });
  const dates = dateRangeParams(period);
  for (const [k, v] of Object.entries(dates)) if (v) params.set(k, v);

  try {
    const res = await fetch(`${WINDSOR_BASE}/google_ads?${params}`, {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<WindsorRow & { keyword_text?: string; search_term?: string }>;
    };
    const map = new Map<string, KeywordRow>();
    for (const r of json.data || []) {
      if (String(r.account_id || "") !== accountId) continue;
      const text = (textField === "keyword_text" ? r.keyword_text : r.search_term) || "";
      if (!text) continue;
      const k = `${text}::${r.campaign || ""}`;
      const existing = map.get(k);
      const clicks = num(r.clicks) + (existing?.clicks || 0);
      const spend = num(r.spend) + (existing?.spend || 0);
      const conversions = num(r.conversions) + (existing?.conversions || 0);
      map.set(k, {
        text,
        campaign_name: r.campaign || null,
        clicks,
        spend,
        conversions,
        cost_per_conversion: conversions > 0 ? spend / conversions : null,
      });
    }
    return Array.from(map.values())
      .filter((r) => r.clicks > 0 || r.conversions > 0)
      .sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)
      .slice(0, 30);
  } catch (e) {
    console.warn(`Windsor ${textField} fetch error:`, e instanceof Error ? e.message : e);
    return [];
  }
}

/** Sokord (keywords) + faktiska soktermer for ett Google Ads-konto. */
export async function getGoogleKeywords(
  period: PeriodArgs,
  revalidateSeconds = 1800,
  account: AccountSet = "clearon",
): Promise<GoogleKeywords> {
  const accountId = ACCOUNTS[account].google;
  if (!accountId || !getApiKey()) return { keywords: [], searchTerms: [] };
  const [keywords, searchTerms] = await Promise.all([
    fetchKeywordRows(accountId, "keyword_text", period, revalidateSeconds),
    fetchKeywordRows(accountId, "search_term", period, revalidateSeconds),
  ]);
  return { keywords, searchTerms };
}

/** Namngiven konvertering per kampanj, t.ex. "Sign-up | Clearon.live": 11. */
export interface NamedConversion {
  platform: PlatformAds["platform"];
  campaign_name: string | null;
  conversion_name: string;
  value: number;
}

export async function getNamedConversions(
  period: PeriodArgs,
  revalidateSeconds = 1800,
  account: AccountSet = "clearon",
): Promise<NamedConversion[]> {
  const key = getApiKey();
  if (!key) return [];
  const acc = ACCOUNTS[account];
  const out: NamedConversion[] = [];

  const fetchRows = async (connector: string, fields: string) => {
    const params = new URLSearchParams({ api_key: key, fields, _limit: "30000" });
    const dates = dateRangeParams(period);
    for (const [k, v] of Object.entries(dates)) if (v) params.set(k, v);
    try {
      const res = await fetch(`${WINDSOR_BASE}/${connector}?${params}`, {
        next: { revalidate: revalidateSeconds },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
      return json.data || [];
    } catch {
      return [];
    }
  };

  const [googleRows, linkedinRows, metaRows] = await Promise.all([
    acc.google
      ? fetchRows("google_ads", "account_id,campaign,conversion_action_name,conversions")
      : Promise.resolve([]),
    acc.linkedin
      ? fetchRows(
          "linkedin",
          "account_id,campaign,conversion_name,externalwebsiteconversions,oneclickleads",
        )
      : Promise.resolve([]),
    acc.meta
      ? fetchRows("facebook", "account_id,campaign,actions_lead,actions_purchase")
      : Promise.resolve([]),
  ]);

  const push = (
    platform: PlatformAds["platform"],
    campaign: unknown,
    name: string,
    value: number,
  ) => {
    if (value <= 0 || !name) return;
    const existing = out.find(
      (n) =>
        n.platform === platform &&
        n.campaign_name === (campaign || null) &&
        n.conversion_name === name,
    );
    if (existing) existing.value += value;
    else
      out.push({
        platform,
        campaign_name: (campaign as string) || null,
        conversion_name: name,
        value,
      });
  };

  for (const r of googleRows) {
    if (String(r.account_id || "") !== acc.google) continue;
    push("google", r.campaign, String(r.conversion_action_name || ""), num(r.conversions as number));
  }
  for (const r of linkedinRows) {
    if (String(r.account_id || "") !== acc.linkedin) continue;
    const name = String(r.conversion_name || "");
    push(
      "linkedin",
      r.campaign,
      name,
      num(r.externalwebsiteconversions as number) + num(r.oneclickleads as number),
    );
  }
  for (const r of metaRows) {
    if (String(r.account_id || "") !== acc.meta) continue;
    push("meta", r.campaign, "Leads", num(r.actions_lead as number));
    push("meta", r.campaign, "Köp", num(r.actions_purchase as number));
  }

  return out.sort((a, b) => b.value - a.value);
}

export async function getPlatformAds(
  platform: PlatformAds["platform"],
  period: PeriodArgs,
  revalidateSeconds = 1800,
  account: AccountSet = "clearon",
): Promise<PlatformAds> {
  const connectorMap = { google: "google_ads", meta: "facebook", linkedin: "linkedin" } as const;
  const accountId = ACCOUNTS[account][platform];
  if (!getApiKey()) {
    return { platform, status: "unavailable", reason: "WINDSOR_API_KEY saknas", ads: [] };
  }
  if (!accountId) {
    return {
      platform,
      status: "unavailable",
      reason: `${ACCOUNTS[account].label} har inget ${platform}-konto i Windsor.`,
      ads: [],
    };
  }
  const rows = await fetchWindsorAds(connectorMap[platform], accountId, period, revalidateSeconds);
  const ads = rows
    .filter((r) => isFullyLive(platform, r))
    .map((r) => normalizeAd(platform, r))
    .filter((a): a is AdInfo => a !== null)
    .sort((a, b) => b.spend - a.spend);
  if (ads.length === 0) {
    return { platform, status: "no_data", reason: "Inga live-annonser i aktiva kampanjer just nu.", ads: [] };
  }
  return { platform, status: "live", reason: null, ads };
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
        account_id: ACCOUNTS.clearon.google!,
        account_name: "Clearon",
        account_tier: "primary",
        status: "connected",
      },
      {
        platform: "linkedin_ads",
        account_id: ACCOUNTS.clearon.linkedin!,
        account_name: "ClearOn",
        account_tier: "primary",
        status: "connected",
      },
      {
        platform: "meta_ads",
        account_id: ACCOUNTS.clearon.meta!,
        account_name: "ClearOn",
        account_tier: "primary",
        status: "connected",
      },
    ],
    error: null,
  };
}

export async function getGooglePerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
  account: AccountSet = "clearon",
): Promise<PlatformPerformance> {
  if (!getApiKey()) {
    return emptyPlatform("google", "unavailable", "WINDSOR_API_KEY saknas");
  }
  const accountId = ACCOUNTS[account].google;
  if (!accountId) {
    return emptyPlatform("google", "unavailable", `${ACCOUNTS[account].label} har inget Google Ads-konto i Windsor.`);
  }
  const { rows } = await fetchWindsor("google_ads", accountId, period, revalidateSeconds);
  if (rows.length === 0) {
    return emptyPlatform("google", "no_data", `Ingen Google-data for ${ACCOUNTS[account].label} (${accountId}) i valt intervall.`);
  }
  return livePlatform("google", "google_ads", accountId, rows);
}

export async function getLinkedInPerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
  account: AccountSet = "clearon",
): Promise<PlatformPerformance> {
  if (!getApiKey()) {
    return emptyPlatform("linkedin", "unavailable", "WINDSOR_API_KEY saknas");
  }
  const accountId = ACCOUNTS[account].linkedin;
  if (!accountId) {
    return emptyPlatform("linkedin", "unavailable", `${ACCOUNTS[account].label} har inget LinkedIn-konto i Windsor.`);
  }
  const { rows } = await fetchWindsor("linkedin", accountId, period, revalidateSeconds);
  if (rows.length === 0) {
    return emptyPlatform("linkedin", "no_data", `Ingen LinkedIn-data for ${ACCOUNTS[account].label} (${accountId}) i valt intervall.`);
  }
  return livePlatform("linkedin", "linkedin", accountId, rows);
}

export async function getMetaPerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
  account: AccountSet = "clearon",
): Promise<PlatformPerformance> {
  if (!getApiKey()) {
    return emptyPlatform("meta", "unavailable", "WINDSOR_API_KEY saknas");
  }
  const accountId = ACCOUNTS[account].meta;
  if (!accountId) {
    return emptyPlatform("meta", "unavailable", `${ACCOUNTS[account].label} har inget Meta-konto i Windsor.`);
  }
  const { rows, allAccountNames } = await fetchWindsor("facebook", accountId, period, revalidateSeconds);
  if (rows.length === 0) {
    return emptyPlatform(
      "meta",
      "no_data",
      `Ingen Meta-data for ${ACCOUNTS[account].label} (${accountId}) i valt intervall. Anslutna konton: ${allAccountNames.join(", ") || "inga"}.`,
    );
  }
  return livePlatform("meta", "facebook", accountId, rows);
}
