/**
 * Adspirer MCP-klient (server-side).
 *
 * Adspirer exponerar Meta + Google Ads + LinkedIn (+ TikTok) genom en MCP-endpoint
 * som svarar pa JSON-RPC over Streamable HTTP. Vi anropar tools/call direkt utan
 * initialize-handshake - det funkar for stateless calls.
 *
 * Tre kritiska detaljer:
 * 1. LinkedIn ar bakom ett router-tool kallat "linkedin_ads" som kraver
 *    {action: "execute", tool_name, arguments} for varje verklig operation.
 * 2. Med raw_data: true returnerar performance-tools en JSON-kodblock istallet
 *    for formaterad Markdown - vi parsar JSON for strukturerad dashboard-data.
 * 3. Custom date ranges via start_date + end_date (YYYY-MM-DD) overrider
 *    lookback_days. Ger oss exakt manadsfilter.
 *
 * Quota: Plus tier = 150 calls/manad. Cache aggressivt.
 */

const ADSPIRER_URL = "https://mcp.adspirer.com/mcp";

interface McpToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
  _quota_data?: {
    used: number;
    limit: number;
    tier: string;
    period_end: string;
    usage_percent: number;
  };
  _meta?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: McpToolResult;
  error?: { code: number; message: string; data?: unknown };
}

export interface AdspirerCallResult {
  text: string | null;
  structured: unknown;
  isError: boolean;
  errorMessage: string | null;
  toolNotFound: boolean;
  quota: McpToolResult["_quota_data"] | null;
}

function parseSseOrJson(body: string): McpResponse | null {
  const dataLine = body
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"));
  const json = dataLine ? dataLine.slice(5).trim() : body.trim();
  if (!json) return null;
  try {
    return JSON.parse(json) as McpResponse;
  } catch {
    return null;
  }
}

/**
 * Lagniva-anrop mot MCP. Tar tool-namn + args, returnerar normaliserat svar.
 */
export async function callAdspirerTool(
  toolName: string,
  args: Record<string, unknown> = {},
  options: { revalidateSeconds?: number; signal?: AbortSignal } = {},
): Promise<AdspirerCallResult> {
  const token = process.env.ADSPIRER_TOKEN?.trim();
  if (!token) {
    return {
      text: null,
      structured: null,
      isError: true,
      errorMessage: "ADSPIRER_TOKEN saknas",
      toolNotFound: false,
      quota: null,
    };
  }

  const requestId = Math.floor(Math.random() * 1_000_000);
  const payload = {
    jsonrpc: "2.0",
    id: requestId,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  };

  const revalidate = options.revalidateSeconds ?? 1800;

  const res = await fetch(ADSPIRER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(payload),
    signal: options.signal,
    next: { revalidate },
  });

  if (!res.ok) {
    return {
      text: null,
      structured: null,
      isError: true,
      errorMessage: `Adspirer HTTP ${res.status}: ${res.statusText}`,
      toolNotFound: false,
      quota: null,
    };
  }

  const body = await res.text();
  const parsed = parseSseOrJson(body);

  if (!parsed) {
    return {
      text: null,
      structured: null,
      isError: true,
      errorMessage: "Kunde inte parsa Adspirer-svar",
      toolNotFound: false,
      quota: null,
    };
  }

  if (parsed.error) {
    const isToolNotFound = parsed.error.code === -32601;
    return {
      text: null,
      structured: null,
      isError: true,
      errorMessage: parsed.error.message,
      toolNotFound: isToolNotFound,
      quota: null,
    };
  }

  const result = parsed.result;
  const text =
    result?.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text || "")
      .join("\n") || null;

  return {
    text,
    structured: result?.structuredContent ?? null,
    isError: Boolean(result?.isError),
    errorMessage: null,
    toolNotFound: false,
    quota: result?._quota_data ?? null,
  };
}

/**
 * Kor ett LinkedIn-tool genom router-wrappern "linkedin_ads".
 */
export async function callLinkedInTool(
  toolName: string,
  args: Record<string, unknown> = {},
  options: { revalidateSeconds?: number; signal?: AbortSignal } = {},
): Promise<AdspirerCallResult> {
  return callAdspirerTool(
    "linkedin_ads",
    { action: "execute", tool_name: toolName, arguments: args },
    options,
  );
}

/**
 * Connections-status (vilka konton som ar kopplade).
 */
export interface ConnectionInfo {
  platform: string;
  account_id: string;
  account_name: string;
  account_tier: string;
  status: string;
}

export async function getConnections(revalidateSeconds = 3600): Promise<{
  connections: ConnectionInfo[];
  error: string | null;
}> {
  const result = await callAdspirerTool("get_connections_status", {}, { revalidateSeconds });
  if (result.isError) {
    return { connections: [], error: result.errorMessage };
  }
  const structured = result.structured as { connections?: ConnectionInfo[] } | null;
  return { connections: structured?.connections || [], error: null };
}

/**
 * Period-konfiguration. Stoder antingen lookback_days, date_range-preset,
 * eller exakta start_date + end_date (YYYY-MM-DD).
 */
export interface PeriodArgs {
  lookback_days?: number;
  date_range?: "last_7_days" | "last_14_days" | "last_30_days" | "last_60_days" | "last_90_days";
  start_date?: string;
  end_date?: string;
}

function buildPeriodArgs(period: PeriodArgs, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = { raw_data: true, ...extra };
  if (period.start_date && period.end_date) {
    out.start_date = period.start_date;
    out.end_date = period.end_date;
  } else if (period.date_range) {
    out.date_range = period.date_range;
  } else {
    out.lookback_days = period.lookback_days ?? 30;
  }
  return out;
}

/**
 * Plattformsspecifika typer.
 */

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
}

export interface PlatformPerformance {
  platform: "google" | "meta" | "linkedin";
  available: boolean;
  status: "live" | "no_data" | "syncing" | "unavailable" | "error";
  reason: string | null;
  currency: string;
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
  quota: McpToolResult["_quota_data"] | null;
}

/**
 * Extrahera JSON-blocket ur ett ```json ... ``` Markdown-svar.
 */
function extractJsonBlock(text: string | null): unknown {
  if (!text) return null;
  const match = text.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) {
    // Forsok parsa hela texten (vissa svar har ren JSON utan code fence)
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

interface RawPerformanceShape {
  account_summary?: {
    total_spend?: number;
    total_impressions?: number;
    total_clicks?: number;
    total_conversions?: number;
    total_campaigns?: number;
    active_campaigns?: number;
    avg_ctr?: number;
    avg_cpc?: number;
    avg_cpm?: number;
    avg_conversion_rate?: number;
    avg_cost_per_conversion?: number;
    overall_roas?: number;
    total_conversion_value?: number;
  };
  totals?: {
    spend?: number;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
  };
  average_metrics?: {
    ctr?: number;
    cpc?: number;
    cpm?: number;
    conversion_rate?: number;
    cost_per_conversion?: number;
  };
  account_overview?: Record<string, unknown>;
  campaigns?: Array<Record<string, unknown>>;
  best_campaign?: Record<string, unknown>;
  campaign_count?: number;
  currency?: string;
  date_range?: { start?: string; end?: string };
  analysis_period?: string;
  status?: string;
  message?: string;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function nullableNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeCampaign(c: Record<string, unknown>): CampaignRow {
  return {
    campaign_id: str(c.campaign_id || c.id || ""),
    name: str(c.name || c.campaign_name || "Unnamed"),
    status: (c.status as string) || null,
    spend: num(c.spend ?? c.cost),
    impressions: num(c.impressions),
    clicks: num(c.clicks),
    conversions: num(c.conversions),
    ctr: nullableNum(c.ctr),
    cpc: nullableNum(c.cpc),
    cpm: nullableNum(c.cpm),
    conversion_rate: nullableNum(c.conversion_rate ?? c.conv_rate),
    cost_per_conversion: nullableNum(c.cost_per_conversion ?? c.cpa),
    conversion_value: nullableNum(c.conversion_value),
    roas: nullableNum(c.roas),
    leads: nullableNum(c.leads),
    engagement_rate: nullableNum(c.engagement_rate),
    type: (c.type as string) || null,
  };
}

function buildPerformance(
  platform: PlatformPerformance["platform"],
  raw: RawPerformanceShape | null,
  defaultCurrency: string,
  result: AdspirerCallResult,
): PlatformPerformance {
  // Empty / no_data response
  if (!raw || raw.status === "no_data" || raw.campaign_count === 0) {
    return {
      platform,
      available: true,
      status: raw?.status === "no_data" ? "syncing" : "no_data",
      reason: raw?.message || "Ingen kampanjdata for vald period.",
      currency: raw?.currency || defaultCurrency,
      dateRange: { start: raw?.date_range?.start || null, end: raw?.date_range?.end || null },
      totals: emptyTotals(),
      campaigns: [],
      rawJson: raw,
      quota: result.quota,
    };
  }

  const summary = raw.account_summary || {};
  const avg = raw.average_metrics || {};
  let campaigns = (raw.campaigns || []).map(normalizeCampaign);

  // Google har inte campaigns-array i raw_data - falla tillbaka till best_campaign.
  // best_campaign har bara namn/ctr/conv, sa nar det bara finns 1 kampanj
  // fyller vi i resten fran account_summary sa raden inte ar mestadels nollor.
  if (campaigns.length === 0 && raw.best_campaign) {
    const c = normalizeCampaign(raw.best_campaign);
    const onlyOne = (summary.total_campaigns ?? raw.campaign_count ?? 0) === 1;
    if (onlyOne) {
      c.spend = c.spend || num(summary.total_spend);
      c.impressions = c.impressions || num(summary.total_impressions);
      c.clicks = c.clicks || num(summary.total_clicks);
      c.conversions = c.conversions || num(summary.total_conversions);
      c.cpc = c.cpc ?? avg.cpc ?? null;
      c.cpm = c.cpm ?? avg.cpm ?? null;
      c.cost_per_conversion = c.cost_per_conversion ?? avg.cost_per_conversion ?? null;
    }
    campaigns = [c];
  }

  // Falla tillbaka till summa over campaigns om account_summary saknas
  const totalSpend = summary.total_spend ?? campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = summary.total_impressions ?? campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = summary.total_clicks ?? campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = summary.total_conversions ?? campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalCampaigns = summary.total_campaigns ?? raw.campaign_count ?? campaigns.length;

  const ctr =
    avg.ctr ??
    summary.avg_ctr ??
    (totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null);
  const cpc = avg.cpc ?? summary.avg_cpc ?? (totalClicks > 0 ? totalSpend / totalClicks : null);
  const cpm =
    avg.cpm ??
    summary.avg_cpm ??
    (totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : null);
  const conversionRate =
    avg.conversion_rate ??
    summary.avg_conversion_rate ??
    (totalClicks > 0 ? (totalConversions / totalClicks) * 100 : null);
  const costPerConversion =
    avg.cost_per_conversion ??
    summary.avg_cost_per_conversion ??
    (totalConversions > 0 ? totalSpend / totalConversions : null);

  return {
    platform,
    available: true,
    status: "live",
    reason: null,
    currency: raw.currency || defaultCurrency,
    dateRange: { start: raw.date_range?.start || null, end: raw.date_range?.end || null },
    totals: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      campaigns: totalCampaigns,
      ctr,
      cpc,
      cpm,
      conversion_rate: conversionRate,
      cost_per_conversion: costPerConversion,
      roas: summary.overall_roas ?? null,
    },
    campaigns,
    rawJson: raw,
    quota: result.quota,
  };
}

function emptyTotals(): PlatformPerformance["totals"] {
  return {
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
  };
}

function unavailable(
  platform: PlatformPerformance["platform"],
  reason: string,
): PlatformPerformance {
  return {
    platform,
    available: false,
    status: "unavailable",
    reason,
    currency: "SEK",
    dateRange: { start: null, end: null },
    totals: emptyTotals(),
    campaigns: [],
    rawJson: null,
    quota: null,
  };
}

function errorResult(
  platform: PlatformPerformance["platform"],
  reason: string,
): PlatformPerformance {
  return {
    platform,
    available: true,
    status: "error",
    reason,
    currency: "SEK",
    dateRange: { start: null, end: null },
    totals: emptyTotals(),
    campaigns: [],
    rawJson: null,
    quota: null,
  };
}

export async function getGooglePerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  // Google's get_campaign_performance har en backend-bug for custom dates
  // ("'str' object has no attribute 'isoformat'"). Falla tillbaka till
  // narmaste lookback_days nar custom dates ges.
  let safePeriod = period;
  if (period.start_date && period.end_date) {
    const days = Math.max(
      7,
      Math.min(
        90,
        Math.ceil(
          (Date.parse(period.end_date) - Date.parse(period.start_date)) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      ),
    );
    const allowed = [7, 30, 60, 90];
    const closest = allowed.reduce((prev, curr) =>
      Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev,
    );
    safePeriod = { lookback_days: closest };
  }
  const args = buildPeriodArgs(safePeriod);
  const result = await callAdspirerTool("get_campaign_performance", args, { revalidateSeconds });
  if (result.toolNotFound) return unavailable("google", "Verktyget inte tillgangligt");
  if (result.isError) return errorResult("google", result.errorMessage || "Okant fel");
  const raw = extractJsonBlock(result.text) as RawPerformanceShape | null;
  return buildPerformance("google", raw, "USD", result);
}

export async function getMetaPerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  const args = buildPeriodArgs(period);
  const result = await callAdspirerTool(
    "get_meta_campaign_performance",
    args,
    { revalidateSeconds },
  );
  if (result.toolNotFound) return unavailable("meta", "Verktyget inte tillgangligt");
  if (result.isError) return errorResult("meta", result.errorMessage || "Okant fel");
  const raw = extractJsonBlock(result.text) as RawPerformanceShape | null;
  return buildPerformance("meta", raw, "SEK", result);
}

export async function getLinkedInPerformance(
  period: PeriodArgs,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  const args = buildPeriodArgs(period);
  const result = await callLinkedInTool(
    "get_linkedin_campaign_performance",
    args,
    { revalidateSeconds },
  );
  if (result.toolNotFound) return unavailable("linkedin", "LinkedIn router-tool saknas");
  if (result.isError) return errorResult("linkedin", result.errorMessage || "Okant fel");
  const raw = extractJsonBlock(result.text) as RawPerformanceShape | null;
  return buildPerformance("linkedin", raw, "SEK", result);
}
