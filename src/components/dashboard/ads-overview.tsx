"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Megaphone,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Loader2,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Target,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { lookback: 7, label: "7 dagar" },
  { lookback: 30, label: "30 dagar" },
  { lookback: 60, label: "60 dagar" },
  { lookback: 90, label: "90 dagar" },
];

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  google: { label: "Google Ads", color: "#4285f4" },
  meta: { label: "Meta Ads", color: "#0866ff" },
  linkedin: { label: "LinkedIn Ads", color: "#0a66c2" },
};

interface ParsedReport {
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
}

interface PlatformBlock {
  platform: "google" | "meta" | "linkedin";
  available: boolean;
  reason: string | null;
  reportText: string | null;
  parsed: ParsedReport | null;
}

interface OverviewData {
  lookback_days: number;
  fetched_at: string;
  connections: Array<{ platform: string; account_name: string; status: string }>;
  platforms: PlatformBlock[];
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    campaigns: number;
  };
  quota: {
    used: number;
    limit: number;
    tier: string;
    period_end: string;
    usage_percent: number;
  } | null;
}

function formatNumber(n: number | null | undefined, decimals = 0): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return n.toLocaleString("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(n: number | null | undefined, currency = "USD"): string {
  if (n == null || !Number.isFinite(n)) return "-";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency + " ";
  return `${symbol}${n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })}`;
}

export function AdsOverview() {
  const [lookback, setLookback] = useState(30);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/ads/overview?lookback=${lookback}${refresh ? "&_t=" + Date.now() : ""}`;
        const res = await fetch(url, { cache: refresh ? "no-store" : "default" });
        if (res.status === 503) {
          setError("not-configured");
          setData(null);
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as OverviewData;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Okant fel");
      } finally {
        setLoading(false);
      }
    },
    [lookback],
  );

  useEffect(() => {
    load();
  }, [load]);

  const currency = data?.platforms.find((p) => p.parsed?.currency)?.parsed?.currency || "USD";

  if (error === "not-configured") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-medium text-text-primary">Adspirer ar inte anslutet</div>
            <div className="text-xs text-text-secondary leading-relaxed">
              Lagg till <code className="font-mono">ADSPIRER_TOKEN</code> i Vercel-env och .env.local.
              Hamta token pa{" "}
              <a
                href="https://adspirer.ai/account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                adspirer.ai/account
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header med period + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-text-muted">Period:</span>
          <div className="flex flex-wrap gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.lookback}
                onClick={() => setLookback(p.lookback)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  lookback === p.lookback
                    ? "bg-accent text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data?.fetched_at && (
            <span className="text-[11px] text-text-muted">
              Hamtat {new Date(data.fetched_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Uppdatera
          </button>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={DollarSign}
          label="Total spend"
          value={data ? formatCurrency(data.totals.spend, currency) : "-"}
          loading={loading}
        />
        <StatCard
          icon={Layers}
          label="Kampanjer"
          value={data ? formatNumber(data.totals.campaigns) : "-"}
          loading={loading}
        />
        <StatCard
          icon={MousePointerClick}
          label="Klick"
          value={data ? formatNumber(data.totals.clicks) : "-"}
          loading={loading}
        />
        <StatCard
          icon={Target}
          label="Konverteringar"
          value={data ? formatNumber(data.totals.conversions) : "-"}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Impressions"
          value={data ? formatNumber(data.totals.impressions) : "-"}
          loading={loading}
        />
      </div>

      {/* Per-plattform cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {data?.platforms.map((p) => (
          <PlatformCard
            key={p.platform}
            block={p}
            currency={currency}
            expanded={expanded[p.platform] || false}
            onToggle={() =>
              setExpanded((prev) => ({ ...prev, [p.platform]: !prev[p.platform] }))
            }
          />
        ))}
      </div>

      {/* Quota + source-info */}
      {data?.quota && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-elevated/50 px-4 py-2.5 text-xs text-text-secondary">
          <Megaphone className="h-3.5 w-3.5 text-text-muted" />
          <span>
            Live via Adspirer ({data.quota.tier}-tier). Anvandning:{" "}
            <span className="font-mono font-medium text-text-primary">
              {data.quota.used} / {data.quota.limit}
            </span>{" "}
            anrop denna manad ({data.quota.usage_percent.toFixed(1)}%).
          </span>
          <span className="text-text-muted">
            Cache 30 min - tryck Uppdatera for fardig hamtning.
          </span>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-text-muted">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={cn("mt-2 text-xl font-bold tabular-nums", loading && "opacity-40")}>
        {value}
      </div>
    </div>
  );
}

function PlatformCard({
  block,
  currency,
  expanded,
  onToggle,
}: {
  block: PlatformBlock;
  currency: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = PLATFORM_META[block.platform];

  if (!block.available) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 opacity-70">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-semibold">{meta.label}</span>
          <span className="ml-auto rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] uppercase text-text-muted">
            Ej tillganglig
          </span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{block.reason}</p>
      </div>
    );
  }

  if (block.reason) {
    // Available men data ej redo (Meta sync pagar)
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-semibold">{meta.label}</span>
          <span className="ml-auto rounded bg-warning/15 px-1.5 py-0.5 text-[10px] uppercase text-warning">
            Synkar
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{block.reason}</p>
      </div>
    );
  }

  const parsed = block.parsed;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-semibold">{meta.label}</span>
          <span className="ml-auto rounded bg-success/15 px-1.5 py-0.5 text-[10px] uppercase text-success">
            Live
          </span>
        </div>

        {parsed && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Metric label="Spend" value={formatCurrency(parsed.totalSpend, currency)} />
            <Metric label="Kampanjer" value={formatNumber(parsed.totalCampaigns)} />
            <Metric label="Klick" value={formatNumber(parsed.totalClicks)} />
            <Metric label="Konv." value={formatNumber(parsed.totalConversions)} />
            <Metric
              label="CTR"
              value={parsed.ctr != null ? `${parsed.ctr.toFixed(2)}%` : "-"}
            />
            <Metric
              label="CPC"
              value={parsed.cpc != null ? formatCurrency(parsed.cpc, currency) : "-"}
            />
            <Metric
              label="Conv. rate"
              value={parsed.conversionRate != null ? `${parsed.conversionRate.toFixed(2)}%` : "-"}
            />
            <Metric
              label="Cost / conv."
              value={parsed.costPerConversion != null ? formatCurrency(parsed.costPerConversion, currency) : "-"}
            />
          </div>
        )}

        {parsed?.topCampaign && (
          <div className="mt-3 rounded-md bg-surface-elevated/60 px-2 py-1.5 text-[11px] text-text-secondary">
            <span className="text-text-muted uppercase tracking-wide text-[9px]">Top:</span>{" "}
            <span className="font-medium text-text-primary">{parsed.topCampaign}</span>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="px-4 py-2 text-left text-xs text-accent hover:bg-surface-elevated/50 border-b border-border"
      >
        {expanded ? "Dolj" : "Visa"} fullstandig rapport <ExternalLink className="inline h-2.5 w-2.5 ml-1" />
      </button>

      {expanded && block.reportText && (
        <div className="adspirer-report p-4 bg-surface-elevated/30 text-xs leading-relaxed overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.reportText}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="font-mono font-semibold text-text-primary tabular-nums">{value}</div>
    </div>
  );
}
