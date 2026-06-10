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
      conversion_value?: number;
      roas?: number | null;
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

type AccountTab = "clearon" | "mobila";

const ACCOUNT_TABS: Array<{ value: AccountTab; label: string; platforms: Platform[] }> = [
  { value: "clearon", label: "ClearOn", platforms: ["meta", "linkedin", "google", "email"] },
  { value: "mobila", label: "Mobila Presentkort", platforms: ["meta", "linkedin", "google"] },
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
  // Google rapporterar "ENABLED", Meta/LinkedIn "ACTIVE"
  if (t.includes("active") || t.includes("enabled") || t.includes("live")) return "active";
  if (t.includes("paus")) return "paused";
  if (t.includes("completed") || t.includes("avslutad")) return "completed";
  if (t.includes("library")) return "library";
  // Plattformen kan returnera status=null. Om spend > 0 är kampanjen aktiv;
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
  const [account, setAccount] = useState<AccountTab>("clearon");
  const [view, setView] = useState<"campaigns" | "ads">("campaigns");
  const [dbCampaigns, setDbCampaigns] = useState<DbCampaign[]>([]);
  const [adsData, setAdsData] = useState<AdsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "paused" | "library" | "completed"
  >("all");

  useEffect(() => {
    const ctrl = { cancelled: false };
    setLoading(true);
    (async () => {
      try {
        const [dbRes, adsRes] = await Promise.all([
          fetch("/api/campaigns").then((r) => r.json()),
          fetch(`/api/ads/overview?lookback=${period}&account=${account}`).then((r) => r.json()),
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
  }, [period, account]);

  const tabPlatforms = ACCOUNT_TABS.find((t) => t.value === account)!.platforms;

  // Bygg unified campaigns från båda källor
  const unified = useMemo<UnifiedCampaign[]>(() => {
    const result: UnifiedCampaign[] = [];
    const usedDbKeys = new Set<string>();

    // 1. Lägg in alla live-kampanjer från Windsor
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

    // 2. Lägg in DB-kampanjer som inte matchades (kreativ-bibliotek + email).
    // Bara på ClearOn-fliken — Mobila Presentkort visar enbart live-data,
    // kreativ används endast där den matchat en live-kampanj ovan.
    // Viktigt: kalla dem inte "Live" — vi har ingen plattforms-bekräftelse på
    // att de faktiskt körs i Meta/LinkedIn just nu. Email är annorlunda
    // (faktiska utskick från Upsales).
    for (const d of account === "clearon" ? dbCampaigns : []) {
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
  }, [dbCampaigns, adsData, account]);

  // Filtrera
  const visible = useMemo(() => {
    return unified.filter((c) => {
      if (platformFilter !== "all" && c.platform !== platformFilter) return false;
      if (statusFilter !== "all" && unifyStatus(c.status, c.spend) !== statusFilter)
        return false;
      return true;
    });
  }, [unified, platformFilter, statusFilter]);

  // Per-plattform-sammanfattning. Spend räknas BARA från Adspirer-bekräftade
  // kampanjer (live/paused med period-bunden data). DB-library-kampanjer har
  // statisk spend som inte är period-bunden — räknas inte in.
  const platformSummary = useMemo(() => {
    const result: Record<
      Platform,
      {
        live: number;
        paused: number;
        library: number;
        spend: number;
        conv: number;
        roas: number | null;
        status: string;
      }
    > = {
      meta: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, roas: null, status: "—" },
      linkedin: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, roas: null, status: "—" },
      google: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, roas: null, status: "—" },
      email: { live: 0, paused: 0, library: 0, spend: 0, conv: 0, roas: null, status: "—" },
    };
    for (const c of unified) {
      const p = c.platform;
      const st = unifyStatus(c.status, c.spend);
      if (st === "active") result[p].live++;
      else if (st === "paused") result[p].paused++;
      else if (st === "library") result[p].library++;
      // Bara period-bunden spend: Adspirer-bekräftade kampanjer (source =
      // 'live' eller 'merged'). Library-spend är historisk total, inte i
      // perioden → skulle bara dölja periodförändringen.
      if (c.source === "live" || c.source === "merged") {
        result[p].spend += c.spend || 0;
        result[p].conv += c.conversions || 0;
      }
    }
    // Plattforms-totalsumman är auktoritativ för spend i perioden (täcker även
    // kampanjer som rapporteras utan kreativ-match).
    if (adsData) {
      for (const ap of adsData.platforms) {
        if (result[ap.platform]) {
          result[ap.platform].status = ap.status;
          result[ap.platform].spend = ap.totals.spend;
          result[ap.platform].conv = ap.totals.conversions;
          result[ap.platform].roas = ap.totals.roas ?? null;
        }
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
          Status och spend kommer live från annonsplattformarna via Windsor.ai
          (Google, Meta, LinkedIn). Kreativ syns där det matchas mot en sparad
          annons. Kampanjer som endast finns som sparad kreativ — utan
          live-bekräftelse från plattformen — märks som{" "}
          <strong className="text-[#a363d9]">Sparad</strong>, inte Live.
        </p>
      </div>

      {/* Konto-flikar: ClearOn (default) och Mobila Presentkort */}
      <div className="flex items-center gap-1 border-b border-border">
        {ACCOUNT_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setAccount(tab.value);
              setPlatformFilter("all");
              setStatusFilter("all");
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              account === tab.value
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Period-väljare + vy-växel */}
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
        <span className="text-[10px] uppercase tracking-wide text-text-muted ml-2">
          Visa
        </span>
        <div className="flex gap-1">
          {(
            [
              { value: "campaigns", label: "Kampanjer" },
              { value: "ads", label: "Annonser" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                view === opt.value
                  ? "bg-text-primary text-surface"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-text-muted">
          Visar: {periodLabel}
          {view === "campaigns" && <> · {visible.length} kampanjer</>}
        </span>
      </div>

      {/* Plattform-summary: visar bara LIVE-kampanjer (plattforms-bekräftade),
          pausade och sparade-kreativ separat. Inga inflations-siffror. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabPlatforms.map((p) => {
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
                {s.conv > 0 && <span>· {Math.round(s.conv)} konv.</span>}
                {s.roas != null && s.roas > 0 && (
                  <span className="font-medium text-[#8bb347]">
                    · ROAS {s.roas.toFixed(1)}x
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status-filter (bara kampanj-vyn) */}
      {view === "campaigns" && (
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
      )}

      {view === "ads" ? (
        <AdsGrid lookback={period} account={account} platformFilter={platformFilter} />
      ) : loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Laddar live-kampanjer från annonsplattformarna...
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

      {/* Lead-attribution: bara pa ClearOn-fliken — leads kommer fran
          clearon.live, inte fran Mobila Presentkorts trattar */}
      {account === "clearon" && <AttributionPanel lookback={period} />}
    </div>
  );
}

// ---- Faktiska annonser (ads/creatives) ----

interface AdInfo {
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
  conversion_types: Array<{ label: string; value: number }>;
  ctr: number | null;
  cpc: number | null;
  currency: string;
}

interface KeywordRow {
  text: string;
  campaign_name: string | null;
  clicks: number;
  spend: number;
  conversions: number;
  cost_per_conversion: number | null;
}

interface NamedConversion {
  platform: "google" | "meta" | "linkedin";
  campaign_name: string | null;
  conversion_name: string;
  value: number;
}

interface AdsResponse {
  platforms: Array<{
    platform: "google" | "meta" | "linkedin";
    status: string;
    reason: string | null;
    ads: AdInfo[];
  }>;
  googleKeywords?: { keywords: KeywordRow[]; searchTerms: KeywordRow[] };
  namedConversions?: NamedConversion[];
}

type AdWithPlatform = AdInfo & { platform: "google" | "meta" | "linkedin" };

interface AdGroup {
  key: string;
  platform: "google" | "meta" | "linkedin";
  name: string;
  campaignName: string | null;
  ads: AdWithPlatform[];
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  currency: string;
}

function AdsGrid({
  lookback,
  account,
  platformFilter,
}: {
  lookback: number;
  account: AccountTab;
  platformFilter: Platform | "all";
}) {
  const [data, setData] = useState<AdsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [grouping, setGrouping] = useState<"adset" | "flat">("adset");

  useEffect(() => {
    const ctrl = { cancelled: false };
    setLoading(true);
    fetch(`/api/ads/creatives?lookback=${lookback}&account=${account}`)
      .then((r) => r.json())
      .then((json) => {
        if (!ctrl.cancelled) {
          setData(json && !json.error ? json : null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ctrl.cancelled) {
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      ctrl.cancelled = true;
    };
  }, [lookback, account]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
        Laddar annonser från plattformarna...
      </div>
    );
  }

  const ads: AdWithPlatform[] = (data?.platforms || [])
    .filter((p) => platformFilter === "all" || p.platform === platformFilter)
    .flatMap((p) => p.ads.map((a) => ({ ...a, platform: p.platform })))
    .sort((a, b) => b.spend - a.spend);

  if (ads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-text-muted">
        Inga live-annonser i aktiva kampanjer just nu.
      </div>
    );
  }

  // Gruppera per ad set (Meta) / annonsgrupp (Google) / kampanj (LinkedIn)
  const groups: AdGroup[] = [];
  if (grouping === "adset") {
    const map = new Map<string, AdGroup>();
    for (const a of ads) {
      const key = `${a.platform}-${a.group_id || a.campaign_id || "ovrigt"}`;
      const g = map.get(key) || {
        key,
        platform: a.platform,
        name: a.group_name || a.campaign_name || "Övrigt",
        campaignName: a.campaign_name,
        ads: [],
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        currency: a.currency,
      };
      g.ads.push(a);
      g.spend += a.spend;
      g.impressions += a.impressions;
      g.clicks += a.clicks;
      g.conversions += a.conversions;
      map.set(key, g);
    }
    groups.push(...Array.from(map.values()).sort((a, b) => b.spend - a.spend));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">
          Gruppering
        </span>
        {(
          [
            { value: "adset", label: "Per ad set" },
            { value: "flat", label: "Alla annonser" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGrouping(opt.value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              grouping === opt.value
                ? "bg-text-primary text-surface"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-text-muted">
          {ads.length} live-annonser
          {grouping === "adset" && <> i {groups.length} ad sets</>}
        </span>
      </div>

      {/* Konverteringar i perioden, per plattform och namn */}
      <ConversionSummary
        conversions={(data?.namedConversions || []).filter(
          (n) => platformFilter === "all" || n.platform === platformFilter,
        )}
      />

      {grouping === "flat" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ads.map((a) => (
            <AdCard key={`${a.platform}-${a.ad_id}`} a={a} />
          ))}
        </div>
      ) : (
        groups.map((g) => <AdSetSection key={g.key} g={g} />)
      )}

      {/* Google ar sok snarare an visuellt - visa vilka sokord som
          konverterar nar Google ingar i vyn */}
      {(platformFilter === "all" || platformFilter === "google") &&
        data?.googleKeywords &&
        (data.googleKeywords.keywords.length > 0 ||
          data.googleKeywords.searchTerms.length > 0) && (
          <GoogleKeywordsPanel gk={data.googleKeywords} />
        )}
    </div>
  );
}

function ConversionSummary({ conversions }: { conversions: NamedConversion[] }) {
  if (conversions.length === 0) return null;

  // Summera per plattform + konverteringsnamn (over kampanjer)
  const byName = new Map<string, NamedConversion & { campaigns: number }>();
  for (const c of conversions) {
    const key = `${c.platform}::${c.conversion_name}`;
    const existing = byName.get(key);
    if (existing) {
      existing.value += c.value;
      existing.campaigns++;
    } else {
      byName.set(key, { ...c, campaigns: 1 });
    }
  }
  const rows = Array.from(byName.values()).sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wide text-text-muted">
        Konverteringar i perioden
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.map((r, i) => {
          const meta = PLATFORM_META[r.platform];
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface-elevated px-2.5 py-1 text-[11px]"
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span className="text-text-secondary">{r.conversion_name}</span>
              <span className="font-bold tabular-nums text-[#8bb347]">
                {r.value >= 100 ? formatInt(Math.round(r.value)) : r.value.toFixed(r.value % 1 === 0 ? 0 : 1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoogleKeywordsPanel({
  gk,
}: {
  gk: { keywords: KeywordRow[]; searchTerms: KeywordRow[] };
}) {
  const [tab, setTab] = useState<"keywords" | "searchTerms">("keywords");
  const rows = tab === "keywords" ? gk.keywords : gk.searchTerms;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <Search className="h-4 w-4" style={{ color: PLATFORM_META.google.color }} />
          Sökord som konverterar (Google)
        </h2>
        <div className="flex gap-1 ml-auto">
          {(
            [
              { value: "keywords", label: `Sökord (${gk.keywords.length})` },
              { value: "searchTerms", label: `Faktiska söktermer (${gk.searchTerms.length})` },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTab(opt.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                tab === opt.value
                  ? "bg-text-primary text-surface"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        {tab === "keywords"
          ? "Sökorden ni bjuder på, sorterade på konverteringar i perioden."
          : "Vad folk faktiskt sökte på när annonsen visades - bra för att hitta nya sökord och negativa sökord."}
      </p>

      {rows.length === 0 ? (
        <div className="py-4 text-center text-xs text-text-muted">
          Ingen sökordsdata i perioden.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-[9px] uppercase tracking-wide text-text-muted">
                <th className="py-1.5 pr-3 font-medium">Sökord</th>
                <th className="py-1.5 pr-3 font-medium">Kampanj</th>
                <th className="py-1.5 pr-3 font-medium text-right">Klick</th>
                <th className="py-1.5 pr-3 font-medium text-right">Spend</th>
                <th className="py-1.5 pr-3 font-medium text-right">Konv</th>
                <th className="py-1.5 font-medium text-right">Kostnad/konv</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((r, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1.5 pr-3 font-medium text-text-primary">{r.text}</td>
                  <td className="py-1.5 pr-3 text-text-muted truncate max-w-[200px]">
                    {r.campaign_name || "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{formatInt(r.clicks)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{formatKr(r.spend)}</td>
                  <td
                    className={cn(
                      "py-1.5 pr-3 text-right tabular-nums font-bold",
                      r.conversions > 0 ? "text-[#8bb347]" : "text-text-muted",
                    )}
                  >
                    {r.conversions > 0 ? r.conversions.toFixed(1) : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-text-secondary">
                    {r.cost_per_conversion != null ? `${Math.round(r.cost_per_conversion)} kr` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdSetSection({ g }: { g: AdGroup }) {
  const platformMeta = PLATFORM_META[g.platform];
  const ctr = g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0;
  const groupKind =
    g.platform === "google" ? "Annonsgrupp" : g.platform === "linkedin" ? "Kampanj" : "Ad set";

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/50 bg-surface-elevated/40 px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: platformMeta.color }}
          />
          <span className="text-[9px] uppercase tracking-wide text-text-muted shrink-0">
            {groupKind}
          </span>
          <span className="text-xs font-bold text-text-primary truncate">{g.name}</span>
          {g.campaignName && g.campaignName !== g.name && (
            <span className="text-[10px] text-text-muted truncate">
              · {g.campaignName}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] tabular-nums shrink-0">
          <span className="font-bold">{formatKr(g.spend, g.currency)}</span>
          <span className="text-text-muted">{formatInt(g.impressions)} impr</span>
          <span className="text-text-muted">{formatInt(g.clicks)} klick</span>
          <span className="text-text-muted">{ctr > 0 ? `${ctr.toFixed(1)}% CTR` : "—"}</span>
          {g.conversions > 0 && (
            <span className="text-[#8bb347] font-medium">{formatInt(g.conversions)} konv</span>
          )}
          <span className="text-text-muted">
            {g.ads.length} {g.ads.length === 1 ? "annons" : "annonser"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
        {g.ads
          .slice()
          .sort((a, b) => b.spend - a.spend)
          .map((a) => (
            <AdCard key={`${a.platform}-${a.ad_id}`} a={a} />
          ))}
      </div>
    </div>
  );
}

function AdCard({ a }: { a: AdInfo & { platform: "google" | "meta" | "linkedin" } }) {
  const platformMeta = PLATFORM_META[a.platform];
  const status = unifyStatus(a.status, a.spend);
  const isActive = status === "active";
  const statusBg =
    status === "active"
      ? "bg-[#8bb347]/15 text-[#8bb347]"
      : status === "paused"
        ? "bg-[#e8864c]/15 text-[#e8864c]"
        : "bg-text-muted/15 text-text-muted";
  const statusLabel =
    status === "active" ? "Live" : status === "paused" ? "Pausad" : "Inaktiv";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-surface flex flex-col text-xs",
        isActive ? "border-border" : "border-border/50",
      )}
    >
      {a.thumbnail_url ? (
        <div
          className="w-full flex items-center justify-center overflow-hidden bg-black/5"
          style={{ maxHeight: 280, minHeight: 140 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.thumbnail_url}
            alt={a.name}
            className={cn(
              "max-w-full max-h-[280px] object-contain",
              isActive ? "" : "grayscale opacity-90",
            )}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="w-full flex flex-col items-center justify-center bg-surface-elevated gap-1"
          style={{ aspectRatio: "16 / 9" }}
        >
          <platformMeta.Icon className="h-7 w-7" style={{ color: platformMeta.color }} />
          <div className="text-[9px] text-text-muted">
            {a.platform === "google" ? "Textannons" : "Ingen förhandsbild"}
          </div>
        </div>
      )}

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: platformMeta.color }}
            />
            <span className="text-[10px] font-semibold text-text-secondary">
              {platformMeta.label}
            </span>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase shrink-0",
              statusBg,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="text-xs font-semibold text-text-primary line-clamp-2 leading-tight">
          {a.name}
        </div>
        {a.headline && a.headline !== a.name && (
          <div className="text-[11px] font-medium text-text-primary leading-snug line-clamp-2">
            {a.headline}
          </div>
        )}
        {a.body && (
          <div className="text-[10px] text-text-secondary leading-snug line-clamp-2">
            {a.body}
          </div>
        )}
        {a.campaign_name && (
          <div className="text-[10px] text-text-muted truncate">
            Kampanj: {a.campaign_name}
          </div>
        )}
        {a.destination_url && (
          <Link
            href={a.destination_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] font-medium hover:underline w-fit truncate max-w-full"
            style={{ color: platformMeta.color }}
          >
            <span className="truncate">{a.destination_url.replace(/^https?:\/\//, "")}</span>
            <ExternalLink className="h-2 w-2 shrink-0" />
          </Link>
        )}

        <div className="mt-auto pt-1.5 border-t border-border/50 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-text-muted">
              Spend
            </span>
            <span className="text-xs font-bold tabular-nums">
              {formatKr(a.spend, a.currency)}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <Metric label="Impr" value={formatInt(a.impressions)} />
            <Metric label="Klick" value={formatInt(a.clicks)} />
            <Metric label="CTR" value={a.ctr ? `${a.ctr.toFixed(1)}%` : "—"} />
            <Metric
              label="Konv"
              value={
                a.conversions > 0
                  ? a.conversions >= 100
                    ? formatInt(Math.round(a.conversions))
                    : a.conversions.toFixed(a.conversions % 1 === 0 ? 0 : 1)
                  : "—"
              }
              highlight={a.conversions > 0}
            />
          </div>
          {a.conversion_types.length > 0 && (
            <div className="flex flex-wrap gap-x-2 text-[10px] text-text-muted">
              {a.conversion_types.map((ct, i) => (
                <span key={i}>
                  {ct.label}:{" "}
                  <span className="font-medium text-[#8bb347]">
                    {formatInt(Math.round(ct.value)) === "—" ? ct.value : formatInt(Math.round(ct.value))}
                  </span>
                </span>
              ))}
            </div>
          )}
          {a.conversions > 0 && a.spend > 0 && (
            <div className="text-[10px] text-text-muted">
              Kostnad/konv:{" "}
              <span className="text-text-secondary font-medium">
                {Math.round(a.spend / a.conversions)} {a.currency}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Lead-attribution ----

interface AttributionGroup {
  platform: string;
  utm_source: string | null;
  utm_campaign: string | null;
  count: number;
  leads: Array<{
    person_id: string | null;
    name: string | null;
    company: string | null;
    occurred_at: string;
  }>;
}

interface AttributionData {
  total_leads: number;
  attributed_leads: number;
  groups: AttributionGroup[];
}

const ATTRIBUTION_PLATFORM_STYLE: Record<string, { label: string; color: string }> = {
  google: { label: "Google", color: "#EA4335" },
  meta: { label: "Meta", color: "#1877F2" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  organic: { label: "Organiskt / okänd källa", color: "#8b8b8b" },
};

function AttributionPanel({ lookback }: { lookback: number }) {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = { cancelled: false };
    setLoading(true);
    fetch(`/api/ads/attribution?lookback=${lookback}`)
      .then((r) => r.json())
      .then((json) => {
        if (!ctrl.cancelled) {
          setData(json && !json.error ? json : null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ctrl.cancelled) {
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      ctrl.cancelled = true;
    };
  }, [lookback]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <Users className="h-4 w-4 text-accent" />
          Leads per annonskälla
        </h2>
        {data && (
          <span className="text-xs text-text-muted">
            {data.attributed_leads} av {data.total_leads} leads attribuerade till annons
            (senaste {lookback}d)
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-text-secondary">
        Kopplar inkomna leads till plattform och kampanj via UTM-parametrar och
        klick-id (gclid, fbclid, li_fat_id) från annonsklicket.
      </p>

      {loading ? (
        <div className="py-6 text-center text-xs text-text-muted">Laddar attribution...</div>
      ) : !data || data.total_leads === 0 ? (
        <div className="py-6 text-center text-xs text-text-muted">
          Inga leads i perioden.
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {data.groups.map((g, i) => {
            const style =
              ATTRIBUTION_PLATFORM_STYLE[g.platform] || {
                label: g.platform,
                color: "#8b8b8b",
              };
            return (
              <div key={i} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: style.color }}
                    />
                    <span className="text-xs font-semibold text-text-primary">
                      {style.label}
                    </span>
                    {g.utm_campaign && (
                      <span className="text-xs text-text-secondary truncate">
                        · {g.utm_campaign}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-text-muted">
                    {g.leads.slice(0, 5).map((l, j) =>
                      l.person_id ? (
                        <Link
                          key={j}
                          href={`/persons/${l.person_id}`}
                          className="hover:underline text-text-secondary"
                        >
                          {l.name || l.company || "Okänd"}
                        </Link>
                      ) : (
                        <span key={j}>{l.name || l.company || "Okänd"}</span>
                      ),
                    )}
                    {g.leads.length > 5 && <span>+{g.leads.length - 5} till</span>}
                  </div>
                </div>
                <span className="shrink-0 font-display text-lg tabular-nums">{g.count}</span>
              </div>
            );
          })}
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
            <span className="text-[#8bb347]">● Live-bekräftad + kreativ</span>
          )}
          {c.source === "live" && <span>● Live plattformsdata</span>}
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
