"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Briefcase,
  Mail,
  Search,
  Play,
  Pause,
  Check,
  ExternalLink,
  Users,
  Megaphone,
  Calendar,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  platform: "meta" | "linkedin" | "google" | "email";
  campaign_id: string | null;
  campaign_name: string;
  product_slug: string | null;
  status: "active" | "paused" | "completed" | string;
  budget: number | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  leads_generated: number | null;
  conversions: number | null;
  headline: string | null;
  body_copy: string | null;
  cta_text: string | null;
  creative_image_url: string | null;
  destination_url: string | null;
  start_date: string | null;
  end_date: string | null;
  creative_format: string | null;
  audience_name: string | null;
}

const PRODUCT_LABELS: Record<string, string> = {
  "sales-promotion": "Sales Promotion",
  "customer-care": "Customer Care",
  "interactive-engage": "Interactive Engage",
  kampanja: "Kampanja",
  "send-a-gift": "Send a Gift",
  "clearing-solutions": "Clearing Solutions",
  kuponger: "Kuponger",
  "mobila-presentkort": "Mobila Presentkort",
};

const PLATFORM_META = {
  meta: {
    label: "Meta",
    color: "#1877F2",
    bg: "rgba(24,119,242,0.08)",
    Icon: Globe,
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.08)",
    Icon: Briefcase,
  },
  google: {
    label: "Google",
    color: "#EA4335",
    bg: "rgba(234,67,53,0.08)",
    Icon: Search,
  },
  email: {
    label: "Upsales Mail",
    color: "#8bb347",
    bg: "rgba(139,179,71,0.08)",
    Icon: Mail,
  },
} as const;

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  active: { label: "LIVE", color: "#8bb347", bg: "rgba(139,179,71,0.15)", Icon: Play },
  paused: { label: "Pausad", color: "#e8864c", bg: "rgba(232,134,76,0.15)", Icon: Pause },
  completed: { label: "Avslutad", color: "#888", bg: "rgba(136,136,136,0.15)", Icon: Check },
};

type Platform = keyof typeof PLATFORM_META;

function formatKr(n: number | null): string {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MSEK`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k kr`;
  return `${n} kr`;
}

function formatInt(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toLocaleString("sv-SE");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

function dateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `från ${formatDate(start)}`;
  return `till ${formatDate(end)}`;
}

export default function KampanjerPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform>("meta");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/campaigns");
        const data = await res.json();
        if (!cancelled) setCampaigns(data.campaigns || []);
      } catch {
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Plattform-aggregat
  const byPlatform = useMemo(() => {
    const out: Record<Platform, Campaign[]> = {
      meta: [],
      linkedin: [],
      google: [],
      email: [],
    };
    for (const c of campaigns) {
      if (out[c.platform as Platform]) out[c.platform as Platform].push(c);
    }
    return out;
  }, [campaigns]);

  const platformSummary = useMemo(() => {
    const result: Record<
      Platform,
      {
        count: number;
        active: number;
        paused: number;
        spend: number;
        impressions: number;
        clicks: number;
        firstStart: string | null;
        lastEnd: string | null;
      }
    > = {
      meta: emptySummary(),
      linkedin: emptySummary(),
      google: emptySummary(),
      email: emptySummary(),
    };
    for (const c of campaigns) {
      const p = c.platform as Platform;
      if (!result[p]) continue;
      result[p].count++;
      if (c.status === "active") result[p].active++;
      if (c.status === "paused") result[p].paused++;
      result[p].spend += c.spend || 0;
      result[p].impressions += c.impressions || 0;
      result[p].clicks += c.clicks || 0;
      if (c.start_date && (!result[p].firstStart || c.start_date < result[p].firstStart!)) {
        result[p].firstStart = c.start_date;
      }
      if (c.end_date && (!result[p].lastEnd || c.end_date > result[p].lastEnd!)) {
        result[p].lastEnd = c.end_date;
      }
    }
    return result;
  }, [campaigns]);

  // Filtrerade kampanjer för aktiv plattform
  const visibleCampaigns = useMemo(() => {
    const list = byPlatform[platform] || [];
    return list
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .sort((a, b) => (b.spend || 0) - (a.spend || 0));
  }, [byPlatform, platform, statusFilter]);

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-text-muted">
        Laddar kampanjer...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-text-muted">
          Inga kampanjer i databasen. Kor sync-jobben for att hamta fran Meta/LinkedIn/Upsales.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      {/* Plattform-sammanfattning: spend + period + antal kampanjer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
          const meta = PLATFORM_META[p];
          const s = platformSummary[p];
          const isActive = platform === p;
          const hasData = s.count > 0;
          return (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              disabled={!hasData}
              className={cn(
                "text-left rounded-lg border p-4 transition-all",
                isActive
                  ? "border-text-primary bg-surface-elevated"
                  : hasData
                    ? "border-border bg-surface hover:bg-surface-elevated/50"
                    : "border-border/50 bg-surface opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm font-semibold">{meta.label}</span>
                </div>
                {s.active > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{ background: "rgba(139,179,71,0.15)", color: "#8bb347" }}
                  >
                    {s.active} live
                  </span>
                )}
              </div>
              {hasData ? (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-text-muted">
                    Spenderat
                  </div>
                  <div className="mt-0.5 font-display text-2xl tabular-nums">
                    {p === "email" ? "—" : formatKr(s.spend)}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-text-muted">
                    <span>{s.count} kampanjer</span>
                    {(s.firstStart || s.lastEnd) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {dateRange(s.firstStart, s.lastEnd)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[10px] text-text-muted">Ingen data</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Status-filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-text-muted">
            Status
          </span>
          {["all", "active", "paused", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                statusFilter === s
                  ? "bg-text-primary text-surface"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary",
              )}
            >
              {s === "all"
                ? "Alla"
                : s === "active"
                  ? "Live"
                  : s === "paused"
                    ? "Pausad"
                    : "Avslutad"}
            </button>
          ))}
        </div>
        <div className="text-xs text-text-muted">
          {visibleCampaigns.length} kampanjer pa {PLATFORM_META[platform].label}
        </div>
      </div>

      {/* Kampanj-grid för aktiv plattform */}
      {visibleCampaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-text-muted">
          Inga kampanjer matchar valt filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCampaigns.map((c) => (
            <CampaignCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
        <Megaphone className="h-6 w-6 text-accent" />
        Kampanjer
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Annonser per plattform med kreativ, period och spend. Valj plattform overst,
        filter pa status, klick pa kampanj for landningssida.
      </p>
    </div>
  );
}

function CampaignCard({ c }: { c: Campaign }) {
  const platformMeta = PLATFORM_META[c.platform as Platform] || PLATFORM_META.meta;
  const statusMeta = STATUS_META[c.status] || STATUS_META.completed;
  const isActive = c.status === "active";
  const ctr = c.clicks && c.impressions ? (c.clicks / c.impressions) * 100 : 0;
  const cpl = c.leads_generated && c.spend ? Math.round(c.spend / c.leads_generated) : 0;
  const spendPct = c.budget ? Math.min(100, ((c.spend || 0) / c.budget) * 100) : 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface transition-all flex flex-col",
        isActive ? "border-border hover:border-accent/40" : "border-border/50",
      )}
    >
      {/* Status-pill */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm"
          style={{ background: statusMeta.bg, color: statusMeta.color }}
        >
          {isActive && (
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full"
                style={{ background: statusMeta.color, opacity: 0.75 }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: statusMeta.color }}
              />
            </span>
          )}
          <statusMeta.Icon className="h-2.5 w-2.5" />
          {statusMeta.label}
        </div>
      </div>

      {/* Creative-bild */}
      {c.creative_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.creative_image_url}
          alt={c.campaign_name}
          className={cn("w-full object-cover", isActive ? "" : "grayscale")}
          style={{ aspectRatio: "16 / 9" }}
        />
      ) : (
        <div
          className="w-full flex items-center justify-center bg-surface-elevated"
          style={{ aspectRatio: "16 / 9" }}
        >
          <platformMeta.Icon className="h-8 w-8 text-text-muted" />
        </div>
      )}

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: platformMeta.color }}
            />
            <span className="font-medium">{platformMeta.label}</span>
            {c.product_slug && (
              <>
                <span>·</span>
                <span>{PRODUCT_LABELS[c.product_slug] || c.product_slug}</span>
              </>
            )}
          </div>
          <div className="mt-1 text-xs font-semibold text-text-primary truncate">
            {c.campaign_name}
          </div>
          {c.headline && (
            <div className="mt-1 text-sm font-bold leading-tight text-text-primary line-clamp-2">
              {c.headline}
            </div>
          )}
          {c.body_copy && (
            <div className="mt-1 text-[11px] leading-snug text-text-secondary line-clamp-2">
              {c.body_copy}
            </div>
          )}
        </div>

        {c.cta_text && c.destination_url && (
          <Link
            href={c.destination_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline w-fit"
            style={{ color: platformMeta.color }}
          >
            {c.cta_text} <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        )}

        {/* Period */}
        {(c.start_date || c.end_date) && (
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <Calendar className="h-2.5 w-2.5" />
            {dateRange(c.start_date, c.end_date)}
          </div>
        )}

        {c.audience_name && (
          <div className="flex items-start gap-1 text-[10px] text-text-muted">
            <Users className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="leading-tight line-clamp-2">{c.audience_name}</span>
          </div>
        )}

        {/* Spend */}
        {c.spend != null && c.spend > 0 && (
          <div className="mt-auto pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-text-muted">
                <DollarSign className="h-2.5 w-2.5" />
                Spend
              </div>
              <div className="text-sm font-bold tabular-nums text-text-primary">
                {formatKr(c.spend)}
                {c.budget && (
                  <span className="text-[10px] text-text-muted font-normal ml-1">
                    / {formatKr(c.budget)}
                  </span>
                )}
              </div>
            </div>
            {c.budget && (
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${spendPct}%`, background: platformMeta.color }}
                />
              </div>
            )}
          </div>
        )}

        {/* Metrics-rad */}
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <Metric label="Impr" value={formatInt(c.impressions)} />
          <Metric label="Klick" value={formatInt(c.clicks)} />
          <Metric label="CTR" value={ctr > 0 ? `${ctr.toFixed(1)}%` : "—"} />
          <Metric
            label="CPL"
            value={cpl > 0 ? `${cpl}kr` : "—"}
            highlight={cpl > 0 && cpl < 500}
          />
        </div>

        {(c.leads_generated || 0) > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <Users className="h-2.5 w-2.5" />
            {c.leads_generated} leads
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wide text-text-muted">{label}</span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          highlight ? "text-[#8bb347]" : "text-text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function emptySummary() {
  return {
    count: 0,
    active: 0,
    paused: 0,
    spend: 0,
    impressions: 0,
    clicks: 0,
    firstStart: null,
    lastEnd: null,
  };
}
