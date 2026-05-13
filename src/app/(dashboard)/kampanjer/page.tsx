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
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types ----

interface DbCampaign {
  id: string;
  platform: "meta" | "linkedin" | "google" | "email";
  campaign_id: string | null;
  campaign_name: string;
  product_slug: string | null;
  status: string;
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

interface AdspirerCampaign {
  campaign_id: string;
  name: string;
  status: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  cost_per_conversion: number | null;
  daily_budget?: number | null;
}

interface AdsOverview {
  period: { label: string; lookback_days?: number };
  platforms: Array<{
    platform: "google" | "meta" | "linkedin";
    status: string;
    currency: string;
    reason: string | null;
    dateRange: { start: string | null; end: string | null };
    totals: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      campaigns: number;
    };
    campaigns: AdspirerCampaign[];
  }>;
}

/** Unified campaign view — kan komma från Adspirer (live), DB (kreativ-bibliotek) eller båda. */
interface UnifiedCampaign {
  key: string;
  platform: "meta" | "linkedin" | "google" | "email";
  name: string;
  status: string;
  source: "live" | "library" | "merged";
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  budget: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  headline: string | null;
  body: string | null;
  cta: string | null;
  creativeImageUrl: string | null;
  destinationUrl: string | null;
  audienceName: string | null;
  productSlug: string | null;
  campaignId: string | null;
}

// ---- Helpers ----

const PLATFORM_META = {
  meta: { label: "Meta", color: "#1877F2", Icon: Globe },
  linkedin: { label: "LinkedIn", color: "#0A66C2", Icon: Briefcase },
  google: { label: "Google", color: "#EA4335", Icon: Search },
  email: { label: "Upsales Mail", color: "#8bb347", Icon: Mail },
} as const;

const PRODUCT_LABELS: Record<string, string> = {
  "sales-promotion": "Sales Promotion",
  "customer-care": "Customer Care",
  "interactive-engage": "Interactive Engage",
  kampanja: "Kampanja",
  "send-a-gift": "Send a Gift",
  "clearing-solutions": "Clearing Solutions",
  kuponger: "Kuponger",
};

type Platform = keyof typeof PLATFORM_META;

const PERIOD_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 60, label: "60d" },
  { value: 90, label: "90d" },
];

function formatKr(n: number | null, currency = "SEK"): string {
  if (n == null || n === 0) return "—";
  const suffix = currency === "SEK" ? "kr" : currency;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M${currency === "SEK" ? "SEK" : currency}`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k ${suffix}`;
  return `${n.toFixed(0)} ${suffix}`;
}

function formatInt(n: number | null): string {
  if (n == null || n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toLocaleString("sv-SE");
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

function dateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  if (start && end) return `${formatDateShort(start)} – ${formatDateShort(end)}`;
  if (start) return `från ${formatDateShort(start)}`;
  return `till ${formatDateShort(end)}`;
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zåäö0-9]/g, "")
    .slice(0, 50);
}

function unifyStatus(
  s: string | null,
  spend?: number | null,
): "active" | "paused" | "completed" | "library" | "unknown" {
  const t = (s || "").toLowerCase();
  if (t.includes("active") || t.includes("live")) return "active";
  if (t.includes("paus")) return "paused";
  if (t.includes("completed") || t.includes("avslutad")) return "completed";
  if (t.includes("library")) return "library";
  // Adspirer kan returnera status=null. Om spend > 0 är kampanjen aktiv;
  // annars osäker.
  if (!s) {
    if ((spend || 0) > 0) return "active";
    return "unknown";
  }
  return "completed";
}

// ---- Component ----

export default function KampanjerPage() {
  const [period, setPeriod] = useState(30);
  const [dbCampaigns, setDbCampaigns] = useState<DbCampaign[]>([]);
  const [adsData, setAdsData] = useState<AdsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "paused" | "library" | "completed"
  >("all");

  useEffect(() => {
    const ctrl = { cancelled: false };
    (async () => {
      try {
        const [dbRes, adsRes] = await Promise.all([
          fetch("/api/campaigns").then((r) => r.json()),
          fetch(`/api/ads/overview?lookback=${period}`).then((r) => r.json()),
        ]);
        if (!ctrl.cancelled) {
          setDbCampaigns(dbRes.campaigns || []);
          setAdsData(adsRes && !adsRes.error ? adsRes : null);
          setLoading(false);
        }
      } catch {
        if (!ctrl.cancelled) {
          setDbCampaigns([]);
          setAdsData(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      ctrl.cancelled = true;
    };
  }, [period]);

  // Bygg unified campaigns från båda källor
  const unified = useMemo<UnifiedCampaign[]>(() => {
    const result: UnifiedCampaign[] = [];
    const usedDbKeys = new Set<string>();

    // 1. Lägg in alla Adspirer-kampanjer (live data)
    if (adsData) {
      for (const platform of adsData.platforms) {
        for (const c of platform.campaigns) {
          // Försök matcha till en DB-kampanj på liknande namn för att hämta kreativ
          const cNorm = normalizeName(c.name);
          const matchedDb = dbCampaigns.find(
            (d) =>
              d.platform === platform.platform &&
              (d.campaign_id === c.campaign_id ||
                normalizeName(d.campaign_name).includes(cNorm.slice(0, 12)) ||
                cNorm.includes(normalizeName(d.campaign_name).slice(0, 12))),
          );
          if (matchedDb) usedDbKeys.add(matchedDb.id);

          result.push({
            key: `${platform.platform}-${c.campaign_id}`,
            platform: platform.platform,
            name: c.name,
            status: c.status || "active",
            source: matchedDb ? "merged" : "live",
            spend: c.spend,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            budget: matchedDb?.budget ?? c.daily_budget ?? null,
            currency: platform.currency,
            startDate: matchedDb?.start_date ?? platform.dateRange.start,
            endDate: matchedDb?.end_date ?? platform.dateRange.end,
            headline: matchedDb?.headline ?? null,
            body: matchedDb?.body_copy ?? null,
            cta: matchedDb?.cta_text ?? null,
            creativeImageUrl: matchedDb?.creative_image_url ?? null,
            destinationUrl: matchedDb?.destination_url ?? null,
            audienceName: matchedDb?.audience_name ?? null,
            productSlug: matchedDb?.product_slug ?? null,
            campaignId: c.campaign_id,
          });
        }
      }
    }

    // 2. Lägg in DB-kampanjer som inte matchades (kreativ-bibliotek + email)
    // Viktigt: kalla dem inte "Live" — vi har ingen Adspirer-bekräftelse på
    // att de faktiskt körs i Meta/LinkedIn just nu. Email är annorlunda
    // (faktiska utskick från Upsales).
    for (const d of dbCampaigns) {
      if (usedDbKeys.has(d.id)) continue;
      // Email-mailings är historiska utskick — markera som completed.
      // Övriga DB-kampanjer som vi inte hittat i Adspirer: status "library"
      // (kreativ utan live-bekräftelse) snarare än de ursprungliga active/paused.
      const isEmail = d.platform === "email";
      const trustedStatus = isEmail
        ? d.status
        : "library";
      result.push({
        key: `db-${d.id}`,
        platform: d.platform,
        name: d.campaign_name,
        status: trustedStatus,
        source: "library",
        spend: d.spend,
        impressions: d.impressions,
        clicks: d.clicks,
        conversions: d.conversions,
        budget: d.budget,
        currency: "SEK",
        startDate: d.start_date,
        endDate: d.end_date,
        headline: d.headline,
        body: d.body_copy,
        cta: d.cta_text,
        creativeImageUrl: d.creative_image_url,
        destinationUrl: d.destination_url,
        audienceName: d.audience_name,
        productSlug: d.product_slug,
        campaignId: d.campaign_id,
      });
    }

    // Sortera: aktiva först, sen pausade, sen sparade, sen efter spend desc
    const statusRank = (s: string | null, spend?: number | null): number => {
      const t = unifyStatus(s, spend);
      if (t === "active") return 0;
      if (t === "paused") return 1;
      if (t === "library") return 2;
      if (t === "unknown") return 3;
      return 4;
    };
    return result.sort((a, b) => {
      const r = statusRank(a.status, a.spend) - statusRank(b.status, b.spend);
      if (r !== 0) return r;
      return (b.spend || 0) - (a.spend || 0);
    });
  }, [dbCampaigns, adsData]);

  // Filtrera
  const visible = useMemo(() => {
    return unified.filter((c) => {
      if (platformFilter !== "all" && c.platform !== platformFilter) return false;
      if (statusFilter !== "all" && unifyStatus(c.status, c.spend) !== statusFilter)
        return false;
      return true;
    });
  }, [unified, platformFilter, statusFilter]);

  // Per-plattform-sammanfattning. Räknar bara live-kampanjer (status active
  // bekräftad av Adspirer), inte "sparad kreativ" från DB. Spend kommer från
  // Adspirers period så det är pengar som FAKTISKT spenderats i perioden.
  const platformSummary = useMemo(() => {
    const result: Record<
      Platform,
      {
        live: number;
        paused: number;
        library: number;
        spend: number;
        conv: number;
        status: string;
      }
    > = {
      meta: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, status: "—" },
      linkedin: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, status: "—" },
      google: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, status: "—" },
      email: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, status: "—" },
    };
    for (const c of unified) {
      const p = c.platform;
      const st = unifyStatus(c.status, c.spend);
      if (st === "active") result[p].live++;
      else if (st === "paused") result[p].paused++;
      else if (st === "library") result[p].library++;
      result[p].spend += c.spend || 0;
      result[p].conv += c.conversions || 0;
    }
    if (adsData) {
      for (const ap of adsData.platforms) {
        if (result[ap.platform]) result[ap.platform].status = ap.status;
      }
    }
    return result;
  }, [unified, adsData]);

  const periodLabel = adsData?.period.label || `senaste ${period} dagarna`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Megaphone className="h-6 w-6 text-accent" />
          Kampanjer
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Status och spend kommer live från Adspirer (Google, Meta, LinkedIn).
          Kreativ syns där det matchas mot en sparad annons. Kampanjer som
          endast finns som sparad kreativ — utan live-bekräftelse från
          plattformen — märks som <strong className="text-[#a363d9]">Sparad</strong>,
          inte Live.
        </p>
      </div>

      {/* Period-väljare */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">
          Period
        </span>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                period === opt.value
                  ? "bg-text-primary text-surface"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-text-muted">
          Visar: {periodLabel} · {visible.length} kampanjer
        </span>
      </div>

      {/* Plattform-summary: visar bara LIVE-kampanjer (Adspirer-bekräftade),
          pausade och sparade-kreativ separat. Inga inflations-siffror. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(PLATFORM_META) as Platform[]).map((p) => {
          const meta = PLATFORM_META[p];
          const s = platformSummary[p];
          const total = s.live + s.paused + s.library;
          const isFilterActive = platformFilter === p;
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter((cur) => (cur === p ? "all" : p))}
              disabled={total === 0}
              className={cn(
                "text-left rounded-lg border p-3 transition-all",
                isFilterActive
                  ? "border-text-primary bg-surface-elevated"
                  : total > 0
                    ? "border-border bg-surface hover:bg-surface-elevated/50"
                    : "border-border/50 bg-surface opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-xs font-semibold">{meta.label}</span>
                </div>
                <StatusPill liveCount={s.live} pausedCount={s.paused} />
              </div>
              <div className="text-[9px] uppercase tracking-wide text-text-muted">
                Spend i perioden
              </div>
              <div className="font-display text-xl tabular-nums">
                {formatKr(s.spend)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-text-muted">
                {s.live > 0 && <span className="text-[#8bb347]">{s.live} live</span>}
                {s.paused > 0 && <span className="text-[#e8864c]">{s.paused} pausad</span>}
                {s.library > 0 && (
                  <span className="text-[#a363d9]">{s.library} sparad</span>
                )}
                {s.conv > 0 && <span>· {s.conv} konv.</span>}
              </div>
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
          {(["all", "active", "paused", "library", "completed"] as const).map((s) => (
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
                    : s === "library"
                      ? "Sparad kreativ"
                      : "Avslutad"}
            </button>
          ))}
        </div>
        {(platformFilter !== "all" || statusFilter !== "all") && (
          <button
            onClick={() => {
              setPlatformFilter("all");
              setStatusFilter("all");
            }}
            className="text-xs text-accent hover:underline"
          >
            Återställ filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Laddar kampanjer från Adspirer + DB...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-text-muted">
          Inga kampanjer matchar valt filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((c) => (
            <CampaignCard key={c.key} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ liveCount, pausedCount }: { liveCount: number; pausedCount: number }) {
  if (liveCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#8bb347]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#8bb347]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8bb347] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8bb347]" />
        </span>
        Live
      </span>
    );
  }
  if (pausedCount > 0) {
    return (
      <span
        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
        style={{ background: "rgba(232,134,76,0.15)", color: "#e8864c" }}
      >
        Pausad
      </span>
    );
  }
  return <span className="text-[9px] text-text-muted">Inaktiv</span>;
}

function CampaignCard({ c }: { c: UnifiedCampaign }) {
  const platformMeta = PLATFORM_META[c.platform];
  const status = unifyStatus(c.status, c.spend);
  const isActive = status === "active";
  const isLibrary = status === "library";
  const StatusIcon =
    status === "active"
      ? Play
      : status === "paused"
        ? Pause
        : status === "library"
          ? ImageIcon
          : Check;
  const ctr = c.clicks && c.impressions ? (c.clicks / c.impressions) * 100 : 0;
  const cpl = c.conversions && c.spend ? Math.round(c.spend / c.conversions) : 0;

  // Status-styling
  const statusBg =
    status === "active"
      ? "bg-[#8bb347]/15 text-[#8bb347]"
      : status === "paused"
        ? "bg-[#e8864c]/15 text-[#e8864c]"
        : status === "library"
          ? "bg-[#a363d9]/15 text-[#a363d9]"
          : status === "unknown"
            ? "bg-text-muted/15 text-text-muted"
            : "bg-text-muted/15 text-text-muted";
  const statusLabel =
    status === "active"
      ? "Live"
      : status === "paused"
        ? "Pausad"
        : status === "library"
          ? "Sparad"
          : status === "unknown"
            ? "Okänd"
            : "Avsl.";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface flex flex-col text-xs",
        isActive ? "border-border" : "border-border/50",
      )}
    >
      {/* Creative — visa i sitt naturliga aspekt-förhållande mot mörk
          bakgrund så stående annonser inte beskärs. Begränsa höjd så kortet
          inte blir överdrivet långt. */}
      {c.creativeImageUrl ? (
        <div
          className={cn(
            "w-full flex items-center justify-center overflow-hidden",
            isLibrary ? "bg-[#a363d9]/5" : "bg-black/5",
          )}
          style={{ maxHeight: 340, minHeight: 160 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.creativeImageUrl}
            alt={c.name}
            className={cn(
              "max-w-full max-h-[340px] object-contain",
              isActive ? "" : "grayscale opacity-90",
            )}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="w-full flex flex-col items-center justify-center bg-surface-elevated relative gap-1"
          style={{ aspectRatio: "16 / 9" }}
        >
          <platformMeta.Icon className="h-7 w-7" style={{ color: platformMeta.color }} />
          <div className="text-[9px] text-text-muted">Ingen kreativ tillgänglig</div>
        </div>
      )}

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: platformMeta.color }}
            />
            <span className="text-[10px] font-semibold text-text-secondary">
              {platformMeta.label}
            </span>
            {c.productSlug && (
              <>
                <span className="text-[9px] text-text-muted">·</span>
                <span className="text-[9px] text-text-muted truncate">
                  {PRODUCT_LABELS[c.productSlug] || c.productSlug}
                </span>
              </>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase shrink-0",
              statusBg,
            )}
          >
            <StatusIcon className="h-2 w-2" />
            {statusLabel}
          </span>
        </div>

        {/* Campaign name */}
        <div className="text-xs font-semibold text-text-primary line-clamp-2 leading-tight">
          {c.name}
        </div>

        {/* Headline + body */}
        {c.headline && (
          <div className="text-[11px] font-medium text-text-primary leading-snug line-clamp-2">
            {c.headline}
          </div>
        )}
        {c.body && (
          <div className="text-[10px] text-text-secondary leading-snug line-clamp-2">
            {c.body}
          </div>
        )}

        {/* CTA */}
        {c.cta && c.destinationUrl && (
          <Link
            href={c.destinationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] font-medium hover:underline w-fit"
            style={{ color: platformMeta.color }}
          >
            {c.cta} <ExternalLink className="h-2 w-2" />
          </Link>
        )}

        {/* Period */}
        {(c.startDate || c.endDate) && (
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <Calendar className="h-2.5 w-2.5" />
            {dateRange(c.startDate, c.endDate)}
          </div>
        )}

        {/* Audience */}
        {c.audienceName && (
          <div className="flex items-start gap-1 text-[10px] text-text-muted">
            <Users className="h-2.5 w-2.5 shrink-0 mt-0.5" />
            <span className="leading-tight line-clamp-1">{c.audienceName}</span>
          </div>
        )}

        {/* Spend + metrics */}
        <div className="mt-auto pt-1.5 border-t border-border/50 space-y-1">
          {c.spend != null && c.spend > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-text-muted">
                Spend
              </span>
              <span className="text-xs font-bold tabular-nums">
                {formatKr(c.spend, c.currency)}
                {c.budget && c.platform !== "email" && (
                  <span className="text-[9px] text-text-muted font-normal ml-1">
                    / {formatKr(c.budget, c.currency)}
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1">
            <Metric label="Impr" value={formatInt(c.impressions)} />
            <Metric label="Klick" value={formatInt(c.clicks)} />
            <Metric label="CTR" value={ctr > 0 ? `${ctr.toFixed(1)}%` : "—"} />
            <Metric
              label="Konv"
              value={formatInt(c.conversions)}
              highlight={(c.conversions || 0) > 0}
            />
          </div>
          {cpl > 0 && (
            <div className="text-[10px] text-text-muted">
              CPK: <span className="text-text-secondary font-medium">{cpl} {c.currency}</span>
            </div>
          )}
        </div>

        {/* Source-indicator — tydlig om datan är live från Adspirer eller
            historisk kreativ utan live-bekräftelse */}
        <div className="flex items-center gap-1 pt-1 border-t border-border/30 text-[9px] text-text-muted">
          {c.source === "merged" && (
            <span className="text-[#8bb347]">● Adspirer-bekräftad + kreativ</span>
          )}
          {c.source === "live" && <span>● Adspirer live-data</span>}
          {c.source === "library" && (
            <span className="text-[#a363d9]">● Kreativ utan live-bekräftelse</span>
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
    <div className="flex flex-col">
      <span className="text-[8px] uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-[11px] font-semibold tabular-nums",
          highlight ? "text-[#8bb347]" : "text-text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}
