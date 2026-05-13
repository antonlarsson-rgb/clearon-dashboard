"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Briefcase,
  Mail,
  Search,
  Building2,
  Activity,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelHealth {
  id: string;
  name: string;
  category: "web" | "ads" | "email";
  status: "live" | "paused" | "inactive" | "unknown";
  spend: number | null;
  currency: string;
  visitors: number | null;
  leads: number | null;
  clicks: number | null;
  conversions: number | null;
  campaigns_active: number | null;
  campaigns_total: number | null;
  note: string | null;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  clearon_live: Globe,
  clearon_se: Building2,
  email: Mail,
  ads_google: Search,
  ads_meta: Sparkles,
  ads_linkedin: Briefcase,
};

const COLOR_MAP: Record<string, string> = {
  clearon_live: "#4a9df0",
  clearon_se: "#4a9df0",
  email: "#8bb347",
  ads_google: "#EA4335",
  ads_meta: "#1877F2",
  ads_linkedin: "#0A66C2",
};

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dagar" },
  { value: 30, label: "30 dagar" },
  { value: 60, label: "60 dagar" },
  { value: 90, label: "90 dagar" },
];

function formatKr(n: number | null, currency = "SEK"): string {
  if (n == null) return "—";
  if (n === 0) return `0 ${currency}`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M${currency}`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k ${currency}`;
  return `${Math.round(n)} ${currency}`;
}

function formatInt(n: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toLocaleString("sv-SE");
}

function StatusDot({ status }: { status: ChannelHealth["status"] }) {
  if (status === "live") {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8bb347] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8bb347]" />
      </span>
    );
  }
  if (status === "paused") {
    return <span className="inline-flex h-2 w-2 rounded-full bg-[#e8864c]" />;
  }
  return <span className="inline-flex h-2 w-2 rounded-full bg-text-muted/40" />;
}

function StatusLabel({ status }: { status: ChannelHealth["status"] }) {
  if (status === "live") {
    return <span className="text-[10px] font-bold uppercase tracking-wide text-[#8bb347]">Live</span>;
  }
  if (status === "paused") {
    return (
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#e8864c]">Pausad</span>
    );
  }
  if (status === "unknown") {
    return <span className="text-[10px] uppercase text-text-muted">Okänd</span>;
  }
  return <span className="text-[10px] uppercase text-text-muted">Inaktiv</span>;
}

export function ChannelHealth({
  defaultLookback = 30,
}: {
  defaultLookback?: number;
}) {
  const [lookback, setLookback] = useState(defaultLookback);
  const [data, setData] = useState<ChannelHealth[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = { cancelled: false };
    (async () => {
      try {
        const res = await fetch(`/api/channels/health?lookback=${lookback}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!ctrl.cancelled) {
          setData(json.channels || []);
          setLoading(false);
        }
      } catch {
        if (!ctrl.cancelled) {
          setData([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      ctrl.cancelled = true;
    };
  }, [lookback]);

  // Gruppera per category
  const grouped = {
    web: data?.filter((c) => c.category === "web") || [],
    email: data?.filter((c) => c.category === "email") || [],
    ads: data?.filter((c) => c.category === "ads") || [],
  };

  // Totaler
  const totalSpend = (data || [])
    .filter((c) => c.category === "ads")
    .reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalConv = (data || [])
    .filter((c) => c.category === "ads")
    .reduce((sum, c) => sum + (c.conversions || 0), 0);
  const totalLiveCount = (data || []).filter((c) => c.status === "live").length;
  const totalCount = data?.length || 0;

  return (
    <div className="space-y-4">
      {/* Period-väljare + totaler */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-text-muted">
            Period
          </span>
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLookback(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  lookback === opt.value
                    ? "bg-text-primary text-surface"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {!loading && data && (
          <div className="ml-auto flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[#8bb347]" />
              <span className="text-text-secondary">
                <strong className="text-text-primary">{totalLiveCount}</strong> av {totalCount} kanaler live
              </span>
            </div>
            <div className="text-text-secondary">
              Total ad-spend: <strong className="text-text-primary">{formatKr(totalSpend)}</strong>
            </div>
            {totalConv > 0 && (
              <div className="text-text-secondary">
                Konv: <strong className="text-text-primary">{totalConv}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kanal-grid */}
      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Hämtar status från alla kanaler...
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Ingen kanaldata.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Web */}
          {grouped.web.length > 0 && (
            <ChannelGroup title="Webb" channels={grouped.web} />
          )}
          {/* Email */}
          {grouped.email.length > 0 && (
            <ChannelGroup title="E-post" channels={grouped.email} />
          )}
          {/* Ads */}
          {grouped.ads.length > 0 && (
            <ChannelGroup title="Annonser" channels={grouped.ads} />
          )}
        </div>
      )}
    </div>
  );
}

function ChannelGroup({
  title,
  channels,
}: {
  title: string;
  channels: ChannelHealth[];
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-wide text-text-muted">
        {title}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {channels.map((c) => (
          <ChannelCard key={c.id} channel={c} />
        ))}
      </div>
    </div>
  );
}

function ChannelCard({ channel: c }: { channel: ChannelHealth }) {
  const Icon = ICON_MAP[c.id] || Globe;
  const color = COLOR_MAP[c.id] || "#888";

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-4 transition-colors",
        c.status === "live" ? "border-border" : "border-border/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
            style={{ background: `${color}1A`, color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary truncate">{c.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusDot status={c.status} />
              <StatusLabel status={c.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Primär metrik per kategori */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {c.category === "ads" ? (
          <>
            <Metric label="Spend" value={formatKr(c.spend, c.currency)} bold />
            <Metric label="Konv" value={formatInt(c.conversions)} highlight={(c.conversions || 0) > 0} />
            <Metric label="Klick" value={formatInt(c.clicks)} />
            <Metric
              label="Kampanjer"
              value={
                c.campaigns_total != null
                  ? `${c.campaigns_active || 0}/${c.campaigns_total}`
                  : "—"
              }
            />
          </>
        ) : c.category === "web" ? (
          <>
            <Metric label="Besökare" value={formatInt(c.visitors)} bold />
            {c.leads != null ? (
              <Metric label="Leads" value={formatInt(c.leads)} highlight={(c.leads || 0) > 0} />
            ) : (
              <Metric label="Källa" value="IP-match" />
            )}
          </>
        ) : (
          <>
            <Metric label="Klick" value={formatInt(c.clicks)} bold />
            <Metric
              label="Kampanjer"
              value={
                c.campaigns_total != null
                  ? `${c.campaigns_active || 0}/${c.campaigns_total}`
                  : "—"
              }
            />
          </>
        )}
      </div>

      {c.note && (
        <p className="mt-2 text-[10px] text-text-muted leading-snug">{c.note}</p>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div
        className={cn(
          "tabular-nums",
          bold ? "text-base font-bold text-text-primary" : "text-sm font-medium",
          highlight ? "text-[#8bb347]" : "text-text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}
