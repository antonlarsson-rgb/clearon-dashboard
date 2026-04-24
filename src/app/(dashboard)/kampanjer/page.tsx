"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Briefcase,
  Search,
  Play,
  Pause,
  Check,
  ExternalLink,
  Target,
  Users,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  platform: "meta" | "linkedin" | "google";
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
    label: "Meta Ads",
    color: "#1877F2",
    bg: "rgba(24,119,242,0.08)",
    Icon: Globe,
    logo: "M",
  },
  linkedin: {
    label: "LinkedIn Ads",
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.08)",
    Icon: Briefcase,
    logo: "in",
  },
  google: {
    label: "Google Ads",
    color: "#EA4335",
    bg: "rgba(234,67,53,0.08)",
    Icon: Search,
    logo: "G",
  },
} as const;

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  active: {
    label: "LIVE",
    color: "#8bb347",
    bg: "rgba(139,179,71,0.15)",
    Icon: Play,
  },
  paused: {
    label: "Pausad",
    color: "#e8864c",
    bg: "rgba(232,134,76,0.15)",
    Icon: Pause,
  },
  completed: {
    label: "Avslutad",
    color: "#888",
    bg: "rgba(136,136,136,0.15)",
    Icon: Check,
  },
};

function money(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function pct(a: number | null, b: number | null): string {
  if (!a || !b) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
}

export default function KampanjerPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (productFilter !== "all" && c.product_slug !== productFilter) return false;
      return true;
    });
  }, [campaigns, statusFilter, productFilter]);

  const byPlatform = useMemo(() => {
    const out: Record<string, Campaign[]> = { meta: [], linkedin: [], google: [] };
    for (const c of filtered) {
      if (out[c.platform]) out[c.platform].push(c);
    }
    return out;
  }, [filtered]);

  // KPIs
  const totals = useMemo(() => {
    const active = filtered.filter((c) => c.status === "active");
    return {
      active: active.length,
      paused: filtered.filter((c) => c.status === "paused").length,
      spend: filtered.reduce((s, c) => s + (c.spend || 0), 0),
      leads: filtered.reduce((s, c) => s + (c.leads_generated || 0), 0),
      impressions: filtered.reduce((s, c) => s + (c.impressions || 0), 0),
      clicks: filtered.reduce((s, c) => s + (c.clicks || 0), 0),
    };
  }, [filtered]);

  const cpl = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : 0;

  const uniqueProducts = Array.from(
    new Set(campaigns.map((c) => c.product_slug).filter(Boolean))
  ) as string[];

  if (loading) {
    return <div className="p-12 text-center text-sm text-text-muted">Laddar...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Megaphone className="h-6 w-6 text-accent" />
          Kampanjer — live-översikt
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Alla annonser fördelat per plattform, mappat mot produkter på clearon.live.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <KpiBox label="Live" value={totals.active} color="#8bb347" />
        <KpiBox label="Pausade" value={totals.paused} color="#e8864c" />
        <KpiBox label="Totala intryck" value={`${(totals.impressions / 1000).toFixed(0)}k`} />
        <KpiBox label="Totala klick" value={totals.clicks.toLocaleString("sv-SE")} />
        <KpiBox label="Snitt-CPL" value={`${cpl} kr`} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <FilterChips
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { v: "all", label: "Alla" },
            { v: "active", label: "Live" },
            { v: "paused", label: "Pausade" },
            { v: "completed", label: "Avslutade" },
          ]}
        />
        <FilterChips
          label="Produkt"
          value={productFilter}
          onChange={setProductFilter}
          options={[
            { v: "all", label: "Alla" },
            ...uniqueProducts.map((p) => ({ v: p, label: PRODUCT_LABELS[p] || p })),
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PlatformColumn platform="meta" campaigns={byPlatform.meta} />
        <PlatformColumn platform="linkedin" campaigns={byPlatform.linkedin} />
        <PlatformColumn platform="google" campaigns={byPlatform.google} />
      </div>
    </div>
  );
}

function PlatformColumn({
  platform,
  campaigns,
}: {
  platform: keyof typeof PLATFORM_META;
  campaigns: Campaign[];
}) {
  const meta = PLATFORM_META[platform];
  const active = campaigns.filter((c) => c.status === "active");
  const paused = campaigns.filter((c) => c.status === "paused");
  const completed = campaigns.filter((c) => c.status === "completed");
  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_generated || 0), 0);

  // Gruppera per produkt
  const byProduct = new Map<string, Campaign[]>();
  for (const c of campaigns) {
    const key = c.product_slug || "other";
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key)!.push(c);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: `${meta.color}33`, background: meta.bg }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md font-bold text-white text-xs"
              style={{ background: meta.color }}
            >
              {meta.logo}
            </div>
            <span className="font-bold text-text-primary">{meta.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {active.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 font-semibold uppercase"
                style={{ background: "rgba(139,179,71,0.15)", color: "#8bb347" }}
              >
                {active.length} live
              </span>
            )}
            {paused.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 uppercase"
                style={{ background: "rgba(232,134,76,0.15)", color: "#e8864c" }}
              >
                {paused.length} pausad
              </span>
            )}
            {completed.length > 0 && (
              <span className="rounded-full px-2 py-0.5 text-text-muted bg-surface-elevated uppercase">
                {completed.length} avsl.
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
          <span>{totalSpend.toLocaleString("sv-SE")} kr spend</span>
          <span className="h-1 w-1 rounded-full bg-text-muted/30" />
          <span>{totalLeads} leads</span>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-text-muted">
          Inga kampanjer
        </div>
      )}

      {Array.from(byProduct.entries()).map(([slug, camps]) => (
        <div key={slug} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Target className="h-3 w-3 text-text-muted" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {PRODUCT_LABELS[slug] || slug}
            </span>
            <span className="text-[10px] text-text-muted">({camps.length})</span>
          </div>
          {camps.map((c) => (
            <CampaignCard key={c.id} campaign={c} accentColor={meta.color} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CampaignCard({ campaign: c, accentColor }: { campaign: Campaign; accentColor: string }) {
  const statusMeta = STATUS_META[c.status] || STATUS_META.completed;
  const isActive = c.status === "active";
  const ctr = c.clicks && c.impressions ? (c.clicks / c.impressions) * 100 : 0;
  const cpl = c.leads_generated && c.spend ? Math.round(c.spend / c.leads_generated) : 0;
  const spendPct = c.budget ? Math.min(100, ((c.spend || 0) / c.budget) * 100) : 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface transition-all",
        isActive ? "border-border hover:border-accent/40" : "border-border/50 opacity-90"
      )}
    >
      {/* Status pill i hörnet */}
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

      {/* Creative image */}
      {c.creative_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.creative_image_url}
          alt={c.campaign_name}
          className={cn(
            "w-full object-cover",
            isActive ? "" : "grayscale",
          )}
          style={{ aspectRatio: "800 / 420" }}
        />
      )}

      <div className="p-3 space-y-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {c.campaign_name}
          </div>
          {c.headline && (
            <div className="mt-1 text-sm font-bold leading-tight text-text-primary">
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
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
            style={{ color: accentColor }}
          >
            {c.cta_text} <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        )}

        {c.audience_name && (
          <div className="flex items-start gap-1 text-[10px] text-text-muted">
            <Users className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="leading-tight">{c.audience_name}</span>
          </div>
        )}

        {/* Budget bar */}
        {c.budget && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-text-muted mb-0.5">
              <span>
                {(c.spend || 0).toLocaleString("sv-SE")} / {c.budget.toLocaleString("sv-SE")} kr
              </span>
              <span>{spendPct.toFixed(0)}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${spendPct}%`, background: accentColor }}
              />
            </div>
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
          <Metric label="Impr" value={money(c.impressions)} />
          <Metric label="Klick" value={money(c.clicks)} />
          <Metric label="CTR" value={ctr > 0 ? `${ctr.toFixed(1)}%` : "—"} />
          <Metric label="CPL" value={cpl > 0 ? `${cpl}kr` : "—"} highlight={cpl > 0 && cpl < 500} />
        </div>

        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>{c.leads_generated || 0} leads</span>
          {c.creative_format && (
            <span className="uppercase text-[9px]">{c.creative_format}</span>
          )}
        </div>
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-text-muted">{label}</span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          highlight ? "text-[#8bb347]" : "text-text-primary"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function KpiBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function FilterChips({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ v: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wide text-text-muted">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              value === opt.v
                ? "bg-accent text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
