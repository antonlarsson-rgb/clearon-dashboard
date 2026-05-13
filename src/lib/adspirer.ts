/**
 * Adspirer MCP-klient (server-side).
 *
 * Adspirer exponerar Meta + Google Ads + LinkedIn (+ TikTok) genom en MCP-endpoint
 * som svarar pa JSON-RPC over Streamable HTTP. Vi anropar tools/call direkt utan
 * initialize-handshake - det funkar for stateless calls.
 *
 * Endpoint svarar med text/event-stream (en single event-frame) eller application/json.
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
  raw: McpResponse | null;
}

function parseSseOrJson(body: string): McpResponse | null {
  // SSE-format: "data: {json}\n\n" possibly med "event: message\n" pa raden ovanfor
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
 * Anropa ett Adspirer MCP-tool. Cachar svaret i Next.js fetch-cache.
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
      raw: null,
    };
  }

  const requestId = Math.floor(Math.random() * 1_000_000);
  const payload = {
    jsonrpc: "2.0",
    id: requestId,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  };

  // Cache-key bygger pa tool + args + revalidate-fonster
  const revalidate = options.revalidateSeconds ?? 1800; // 30 min default

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
      raw: null,
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
      raw: null,
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
      raw: parsed,
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
    raw: parsed,
  };
}

/**
 * Hamtar status for alla kopplade plattformar (Meta, Google, LinkedIn, TikTok).
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
 * Plattformsspecifika campaign-performance fetchers.
 *
 * Adspirer-tools tar lookback_days (7, 14, 30, 60, 90 typiskt). Custom datum-intervall
 * stods inte direkt - vi mappar UI:s "manad/period" till narmaste lookback.
 */

export interface PlatformPerformance {
  platform: "google" | "meta" | "linkedin";
  available: boolean;
  reason: string | null;
  reportText: string | null;
  structured: unknown;
  quota: McpToolResult["_quota_data"] | null;
}

export async function getGooglePerformance(
  lookbackDays: number,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  const result = await callAdspirerTool(
    "get_campaign_performance",
    { lookback_days: lookbackDays },
    { revalidateSeconds },
  );
  if (result.toolNotFound) {
    return platformUnavailable("google", "Verktyget inte tillgangligt i din Adspirer-tier");
  }
  if (result.isError) {
    return platformUnavailable("google", result.errorMessage || "Okant fel");
  }
  return {
    platform: "google",
    available: true,
    reason: null,
    reportText: result.text,
    structured: result.structured,
    quota: result.quota,
  };
}

export async function getMetaPerformance(
  lookbackDays: number,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  const result = await callAdspirerTool(
    "get_meta_campaign_performance",
    { lookback_days: lookbackDays },
    { revalidateSeconds },
  );
  if (result.toolNotFound) {
    return platformUnavailable("meta", "Verktyget inte tillgangligt i din Adspirer-tier");
  }
  if (result.isError) {
    return platformUnavailable("meta", result.errorMessage || "Okant fel");
  }
  // Meta returnerar text "no data yet" tills initial sync ar klar
  const isStillSyncing =
    result.text?.toLowerCase().includes("not completed its initial data sync") ||
    result.text?.toLowerCase().includes("no campaign data available yet");
  if (isStillSyncing) {
    return {
      platform: "meta",
      available: true,
      reason:
        "Meta-kontot ar kopplat men Adspirer slutfor fortfarande initial datasynk. Detta tar typiskt nagra timmar efter forsta anslutningen.",
      reportText: result.text,
      structured: result.structured,
      quota: result.quota,
    };
  }
  return {
    platform: "meta",
    available: true,
    reason: null,
    reportText: result.text,
    structured: result.structured,
    quota: result.quota,
  };
}

export async function getLinkedInPerformance(
  lookbackDays: number,
  revalidateSeconds = 1800,
): Promise<PlatformPerformance> {
  const result = await callAdspirerTool(
    "get_linkedin_campaign_performance",
    { lookback_days: lookbackDays },
    { revalidateSeconds },
  );
  if (result.toolNotFound) {
    return platformUnavailable(
      "linkedin",
      "Adspirer exponerar inga LinkedIn-verktyg pa nuvarande tier. LinkedIn-kontot ar kopplat men data hamtas inte automatiskt.",
    );
  }
  if (result.isError) {
    return platformUnavailable("linkedin", result.errorMessage || "Okant fel");
  }
  return {
    platform: "linkedin",
    available: true,
    reason: null,
    reportText: result.text,
    structured: result.structured,
    quota: result.quota,
  };
}

function platformUnavailable(
  platform: PlatformPerformance["platform"],
  reason: string,
): PlatformPerformance {
  return {
    platform,
    available: false,
    reason,
    reportText: null,
    structured: null,
    quota: null,
  };
}

/**
 * Parsa Adspirers Markdown-rapport for att extrahera nyckelsiffror.
 * Adspirer formaterar rapporter konsekvent med "**Key:** value" och tabeller.
 */
export interface ParsedReport {
  totalSpend: number | null;
  totalImpressions: number | null;
  totalClicks: number | null;
  totalConversions: number | null;
  totalCampaigns: number | null;
  ctr: number | null;
  cpc: number | null;
  conversionRate: number | null;
  costPerConversion: number | null;
  topCampaign: string | null;
  currency: string;
  rawSnippet: string;
}

export function parseAdspirerReport(text: string | null): ParsedReport | null {
  if (!text) return null;
  const num = (re: RegExp): number | null => {
    const m = text.match(re);
    if (!m) return null;
    const cleaned = m[1].replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  };
  const str = (re: RegExp): string | null => {
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };

  // Heuristisk valutadetektering (USD/SEK/EUR)
  const currencyMatch = text.match(/Total Spend:\*\*\s*([\$€])/i) || text.match(/(\bSEK\b|\bUSD\b|\bEUR\b)/);
  const currency =
    currencyMatch?.[1] === "$" || currencyMatch?.[1] === "USD"
      ? "USD"
      : currencyMatch?.[1] === "€" || currencyMatch?.[1] === "EUR"
        ? "EUR"
        : currencyMatch?.[1]
          ? currencyMatch[1].toUpperCase()
          : "USD";

  return {
    totalSpend: num(/Total Spend:\*\*\s*[\$€]?([0-9,]+\.?[0-9]*)/i),
    totalImpressions: num(/Total Impressions:\*\*\s*([0-9,]+)/i),
    totalClicks: num(/Total Clicks:\*\*\s*([0-9,]+)/i),
    totalConversions: num(/Total Conversions:\*\*\s*([0-9.,]+)/i),
    totalCampaigns: num(/Total Campaigns:\*\*\s*([0-9,]+)/i),
    ctr: num(/CTR.*?:\*\*\s*([0-9.,]+)\s*%/i),
    cpc: num(/CPC.*?:\*\*\s*[\$€]?([0-9.,]+)/i),
    conversionRate: num(/Conversion Rate:\*\*\s*([0-9.,]+)\s*%/i),
    costPerConversion: num(/Cost Per Conversion:\*\*\s*[\$€]?([0-9.,]+)/i),
    topCampaign: str(/## .*?Top Performing Campaign\s*\n+\*\*\[?([^\]\n*]+?)\]?\*\*/i),
    currency,
    rawSnippet: text.slice(0, 3000),
  };
}
