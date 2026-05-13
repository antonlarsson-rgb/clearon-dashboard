"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  RefreshCw,
  AlertCircle,
  Loader2,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Target,
  Layers,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  google: { label: "Google Ads", color: "#4285f4" },
  meta: { label: "Meta Ads", color: "#0866ff" },
  linkedin: { label: "LinkedIn Ads", color: "#0a66c2" },
};

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  live: { label: "Live", bg: "bg-success/15", text: "text-success" },
  syncing: { label: "Synkar", bg: "bg-warning/15", text: "text-warning" },
  structure_only: { label: "Struktur", bg: "bg-warning/15", text: "text-warning" },
  no_data: { label: "Ingen data", bg: "bg-text-muted/15", text: "text-text-muted" },
  unavailable: { label: "Ej tillganglig", bg: "bg-text-muted/15", text: "text-text-muted" },
  error: { label: "Fel", bg: "bg-danger/15", text: "text-danger" },
};

interface CampaignRow {
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

interface PlatformBlock {
  platform: "google" | "meta" | "linkedin";
  available: boolean;
  status: string;
  reason: string | null;
  currency: string;
  currencyNote?: string | null;
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
}

interface CurrencyTotals {
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  campaigns: number;
  ctr: number | null;
  cpc: number | null;
  cost_per_conversion: number | null;
}

interface OverviewData {
  period: {
    label: string;
    lookback_days: number | null;
    start_date: string | null;
    end_date: string | null;
  };
  fetched_at: string;
  connections: Array<{ platform: string; account_name: string; status: string }>;
  platforms: PlatformBlock[];
  totalsByCurrency: CurrencyTotals[];
  quota: {
    used: number;
    limit: number;
    tier: string;
    period_end: string;
    usage_percent: number;
  } | null;
}

const SWEDISH_MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

interface PeriodSelection {
  type: "lookback" | "month" | "custom";
  lookback?: number;
  year?: number;
  month?: number; // 0-11
  startDate?: string;
  endDate?: string;
  label: string;
}

function buildMonthOptions(): PeriodSelection[] {
  const now = new Date();
  const options: PeriodSelection[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const fmt = (x: Date) => x.toISOString().slice(0, 10);
    options.push({
      type: "month",
      year,
      month,
      startDate: fmt(start),
      endDate: fmt(end),
      label: `${SWEDISH_MONTHS[month]} ${year}`,
    });
  }
  return options;
}

const LOOKBACK_OPTIONS: PeriodSelection[] = [
  { type: "lookback", lookback: 7, label: "7 dagar" },
  { type: "lookback", lookback: 30, label: "30 dagar" },
  { type: "lookback", lookback: 60, label: "60 dagar" },
  { type: "lookback", lookback: 90, label: "90 dagar" },
];

function formatNumber(n: number | null | undefined, decimals = 0): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return n.toLocaleString("sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(n: number | null | undefined, currency = "SEK"): string {
  if (n == null || !Number.isFinite(n)) return "-";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency + " ";
  const sep = currency === "USD" || currency === "EUR" ? "" : "";
  return `${symbol}${sep}${n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })}`;
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

function effectivePeriodLabel(data: OverviewData, period: PeriodSelection): string {
  if (period.type === "month") return period.label;
  if (period.type === "lookback") return `Senaste ${period.lookback} dagarna`;
  if (period.startDate && period.endDate) {
    return `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`;
  }
  return data.period.label;
}

function effectiveDateRange(data: OverviewData): string | null {
  // Plocka faktiskt datum-intervall fran forsta plattformen som har en dateRange
  const ranges = data.platforms
    .map((p) => p.dateRange)
    .filter((r) => r.start && r.end);
  if (ranges.length === 0) {
    if (data.period.start_date && data.period.end_date) {
      return `Adspirer-data: ${formatDate(data.period.start_date)} - ${formatDate(data.period.end_date)}`;
    }
    return null;
  }
  // Bredaste range over plattformar
  const start = ranges.reduce((min, r) => (r.start! < min ? r.start! : min), ranges[0].start!);
  const end = ranges.reduce((max, r) => (r.end! > max ? r.end! : max), ranges[0].end!);
  return `Faktisk datatid: ${formatDate(start)} - ${formatDate(end)}`;
}

export function AdsOverview() {
  const monthOptions = useMemo(buildMonthOptions, []);
  const [period, setPeriod] = useState<PeriodSelection>(LOOKBACK_OPTIONS[1]); // 30 dagar default
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (period.type === "lookback") {
          params.set("lookback", String(period.lookback));
        } else if (period.startDate && period.endDate) {
          params.set("start_date", period.startDate);
          params.set("end_date", period.endDate);
        }
        if (refresh) params.set("_t", String(Date.now()));
        const res = await fetch(`/api/ads/overview?${params.toString()}`, {
          cache: refresh ? "no-store" : "default",
        });
        if (res.status === 503) {
          setError("not-configured");
          setData(null);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as OverviewData;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Okant fel");
      } finally {
        setLoading(false);
      }
    },
    [period],
  );

  useEffect(() => {
    load();
  }, [load]);

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
      {/* Period-valjare */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-text-muted">Period:</span>
          <div className="flex flex-wrap gap-1">
            {LOOKBACK_OPTIONS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setPeriod(p);
                  setShowMonthPicker(false);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  period.type === "lookback" && period.lookback === p.lookback
                    ? "bg-accent text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary",
                )}
              >
                {p.label}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker((s) => !s)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium transition-colors inline-flex items-center gap-1",
                  period.type === "month"
                    ? "bg-accent text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary",
                )}
              >
                <Calendar className="h-3 w-3" />
                {period.type === "month" ? period.label : "Manad"}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showMonthPicker && (
                <div className="absolute z-20 mt-1 right-0 max-h-72 overflow-y-auto rounded-md border border-border bg-surface shadow-lg min-w-[180px]">
                  {monthOptions.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => {
                        setPeriod(m);
                        setShowMonthPicker(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-xs hover:bg-surface-elevated transition-colors",
                        period.type === "month" && period.label === m.label
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-text-secondary",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data?.fetched_at && (
            <span className="text-[11px] text-text-muted">
              Hamtat{" "}
              {new Date(data.fetched_at).toLocaleTimeString("sv-SE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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

      {/* Effektiv period-banner med exakta datum som plattformarna returnerade */}
      {data && (
        <div className="rounded-lg border border-accent/25 bg-accent-subtle/30 px-4 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-text-muted">
                Period som visas
              </div>
              <div className="text-sm font-semibold text-text-primary mt-0.5">
                {effectivePeriodLabel(data, period)}
              </div>
              {effectiveDateRange(data) && (
                <div className="text-xs text-text-secondary mt-0.5 font-mono">
                  {effectiveDateRange(data)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">
                Total spend i perioden
              </div>
              <div className="text-lg font-bold text-text-primary mt-0.5">
                {data.totalsByCurrency.length === 0
                  ? "-"
                  : data.totalsByCurrency
                      .map((t) => formatCurrency(t.spend, t.currency))
                      .join(" + ")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aggregerade totals per valuta */}
      {data && data.totalsByCurrency.length > 0 && (
        <div className="space-y-2">
          {data.totalsByCurrency.map((t) => (
            <div key={t.currency}>
              {data.totalsByCurrency.length > 1 && (
                <div className="text-[10px] uppercase tracking-wide text-text-muted mb-2">
                  Totalt i {t.currency}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard
                  icon={DollarSign}
                  label="Spenderat"
                  value={formatCurrency(t.spend, t.currency)}
                  loading={loading}
                />
                <StatCard
                  icon={Layers}
                  label="Aktiva kampanjer"
                  value={formatNumber(t.campaigns)}
                  loading={loading}
                />
                <StatCard
                  icon={MousePointerClick}
                  label="Klick"
                  value={formatNumber(t.clicks)}
                  loading={loading}
                />
                <StatCard
                  icon={Target}
                  label="Konverteringar"
                  value={formatNumber(t.conversions)}
                  loading={loading}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Visningar"
                  value={formatNumber(t.impressions)}
                  loading={loading}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <SecondaryStat
                  label="CTR (klick / visning)"
                  value={t.ctr != null ? `${t.ctr.toFixed(2)}%` : "-"}
                />
                <SecondaryStat
                  label="CPC (kostnad / klick)"
                  value={t.cpc != null ? formatCurrency(t.cpc, t.currency) : "-"}
                />
                <SecondaryStat
                  label="Kostnad per konvertering"
                  value={
                    t.cost_per_conversion != null
                      ? formatCurrency(t.cost_per_conversion, t.currency)
                      : "-"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalsByCurrency.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
          Ingen live-data for vald period an. Prova en annan period.
        </div>
      )}

      {/* Per-plattform-sektioner med kampanjlistor */}
      <div className="space-y-3">
        {data?.platforms.map((p) => (
          <PlatformSection
            key={p.platform}
            block={p}
            expanded={expandedCampaigns[p.platform] !== false}
            onToggle={() =>
              setExpandedCampaigns((prev) => ({
                ...prev,
                [p.platform]: prev[p.platform] === false ? true : false,
              }))
            }
          />
        ))}
      </div>

      {/* Quota + kalla */}
      {data?.quota && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-elevated/50 px-4 py-2.5 text-xs text-text-secondary">
          <span className="text-text-muted">Live via Adspirer ({data.quota.tier}-tier).</span>
          <span>
            Anvandning:{" "}
            <span className="font-mono font-medium text-text-primary">
              {data.quota.used} / {data.quota.limit}
            </span>{" "}
            anrop denna manad ({data.quota.usage_percent.toFixed(1)}%).
          </span>
          <span className="text-text-muted">Cache 30 min.</span>
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

function SecondaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-elevated/40 px-3 py-2">
      <div className="text-[9px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-sm font-mono font-medium tabular-nums text-text-primary">{value}</div>
    </div>
  );
}

function InlineMetric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={cn(
          "font-mono tabular-nums",
          emphasis ? "text-base font-bold text-text-primary" : "text-sm font-medium text-text-secondary",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PlatformSection({
  block,
  expanded,
  onToggle,
}: {
  block: PlatformBlock;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = PLATFORM_META[block.platform];
  const badge = STATUS_BADGE[block.status] || STATUS_BADGE.error;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated/30 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
            <span className="text-sm font-semibold">{meta.label}</span>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] uppercase font-medium", badge.bg, badge.text)}>
              {badge.label}
            </span>
            {block.dateRange.start && block.dateRange.end && (
              <span className="text-[10px] text-text-muted font-mono">
                {formatDate(block.dateRange.start)} - {formatDate(block.dateRange.end)}
              </span>
            )}
          </div>
          {block.status === "live" && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <InlineMetric
                label="Spenderat"
                value={formatCurrency(block.totals.spend, block.currency)}
                emphasis
              />
              <InlineMetric label="Klick" value={formatNumber(block.totals.clicks)} />
              <InlineMetric label="Konverteringar" value={formatNumber(block.totals.conversions)} />
              <InlineMetric
                label="CTR"
                value={block.totals.ctr != null ? `${block.totals.ctr.toFixed(2)}%` : "-"}
              />
            </div>
          )}
          {block.status === "structure_only" && (
            <div className="mt-2 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{block.campaigns.length}</span>{" "}
              kampanjer i kontot - se status nedan
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform shrink-0 ml-3 mt-1",
            expanded ? "rotate-180" : "",
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-border">
          {block.currencyNote && (
            <div className="px-4 py-2 bg-warning/5 border-b border-warning/15 text-[11px] text-text-secondary">
              <span className="font-medium text-warning">Notera valuta:</span>{" "}
              {block.currencyNote}
            </div>
          )}
          {(block.status === "syncing" || block.status === "no_data" || block.status === "structure_only" || block.status === "error" || block.status === "unavailable") && block.reason && (
            <div className="p-4 text-xs text-text-secondary leading-relaxed">{block.reason}</div>
          )}
          {block.status === "live" && block.campaigns.length === 0 && (
            <div className="p-4 text-xs text-text-muted text-center">
              Inga kampanjer for vald period.
            </div>
          )}
          {(block.status === "live" || block.status === "structure_only") && block.campaigns.length > 0 && (
            <CampaignTable
              campaigns={block.campaigns}
              currency={block.currency}
              showStructureOnly={block.status === "structure_only"}
            />
          )}
        </div>
      )}
    </div>
  );
}

type SortKey = "spend" | "clicks" | "conversions" | "ctr" | "cpc" | "name" | "daily_budget" | "status";

function CampaignTable({
  campaigns,
  currency,
  showStructureOnly = false,
}: {
  campaigns: CampaignRow[];
  currency: string;
  showStructureOnly?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(showStructureOnly ? "name" : "spend");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const sorted = useMemo(() => {
    const arr = [...campaigns];
    arr.sort((a, b) => {
      const av = a[sortKey as keyof CampaignRow];
      const bv = b[sortKey as keyof CampaignRow];
      if (sortKey === "name" || sortKey === "status") {
        return sortDir === "desc"
          ? String(bv ?? "").localeCompare(String(av ?? ""))
          : String(av ?? "").localeCompare(String(bv ?? ""));
      }
      const aN = typeof av === "number" ? av : av === null ? -Infinity : 0;
      const bN = typeof bv === "number" ? bv : bv === null ? -Infinity : 0;
      return sortDir === "desc" ? bN - aN : aN - bN;
    });
    return arr;
  }, [campaigns, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const Th = ({ k, children, align = "left" }: { k: SortKey; children: React.ReactNode; align?: "left" | "right" }) => (
    <th
      onClick={() => handleSort(k)}
      className={cn(
        "py-2 px-3 text-[10px] uppercase tracking-wide font-medium text-text-muted cursor-pointer hover:text-text-primary select-none",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
      {sortKey === k && <span className="ml-1">{sortDir === "desc" ? "▼" : "▲"}</span>}
    </th>
  );

  if (showStructureOnly) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface-elevated/40 border-b border-border">
            <tr>
              <Th k="name">Kampanj</Th>
              <Th k="status">Status</Th>
              <Th k="daily_budget" align="right">Dagsbudget</Th>
              <th className="py-2 px-3 text-[10px] uppercase tracking-wide font-medium text-text-muted text-right">
                Skapad
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.campaign_id || c.name} className="border-b border-border/40 last:border-0 hover:bg-surface-elevated/20">
                <td className="py-2 px-3">
                  <div className="text-text-primary font-medium">{c.name}</div>
                  {c.type && <div className="text-[10px] text-text-muted">{c.type}</div>}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
                      c.status === "ACTIVE"
                        ? "bg-success/15 text-success"
                        : "bg-text-muted/15 text-text-muted",
                    )}
                  >
                    {c.status || "-"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono tabular-nums">
                  {c.daily_budget != null ? `${formatCurrency(c.daily_budget, currency)} / dag` : "-"}
                </td>
                <td className="py-2 px-3 text-right text-[11px] text-text-muted font-mono">
                  {c.created_at ? formatDate(c.created_at) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-surface-elevated/40 border-b border-border">
          <tr>
            <Th k="name">Kampanj</Th>
            <Th k="spend" align="right">Spenderat</Th>
            <Th k="clicks" align="right">Klick</Th>
            <Th k="conversions" align="right">Konv.</Th>
            <Th k="ctr" align="right">CTR</Th>
            <Th k="cpc" align="right">CPC</Th>
            <th className="py-2 px-3 text-[10px] uppercase tracking-wide font-medium text-text-muted text-right">
              Kostnad / konv.
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.campaign_id || c.name} className="border-b border-border/40 last:border-0 hover:bg-surface-elevated/20">
              <td className="py-2 px-3">
                <div className="text-text-primary font-medium">{c.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {c.status && (
                    <span
                      className={cn(
                        "rounded px-1 py-0.5 text-[9px] font-medium",
                        c.status === "ACTIVE" || c.status === "ENABLED"
                          ? "bg-success/15 text-success"
                          : "bg-text-muted/15 text-text-muted",
                      )}
                    >
                      {c.status}
                    </span>
                  )}
                  {c.type && <span className="text-[10px] text-text-muted">{c.type}</span>}
                </div>
              </td>
              <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-text-primary">
                {formatCurrency(c.spend, currency)}
              </td>
              <td className="py-2 px-3 text-right font-mono tabular-nums">
                {formatNumber(c.clicks)}
              </td>
              <td className="py-2 px-3 text-right font-mono tabular-nums">
                {c.conversions > 0 ? (
                  <span className="text-accent font-medium">{formatNumber(c.conversions)}</span>
                ) : (
                  formatNumber(c.conversions)
                )}
              </td>
              <td className="py-2 px-3 text-right font-mono tabular-nums">
                {c.ctr != null ? `${c.ctr.toFixed(2)}%` : "-"}
              </td>
              <td className="py-2 px-3 text-right font-mono tabular-nums">
                {c.cpc != null ? formatCurrency(c.cpc, currency) : "-"}
              </td>
              <td className="py-2 px-3 text-right font-mono tabular-nums">
                {c.cost_per_conversion != null
                  ? formatCurrency(c.cost_per_conversion, currency)
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
