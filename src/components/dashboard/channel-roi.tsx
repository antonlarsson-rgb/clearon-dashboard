"use client";

// ROI per kanal: annons-spend mot leads, pipeline och vunna affarer.
// Datakedjan: annonsklick (utm/klick-id) -> lead -> person -> Upsales
// opportunity/order. Visar vad annonskronorna ger i affarer, inte bara leads.

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelRoiRow {
  channel: string;
  ad_spend: number | null;
  leads: number;
  opportunities_open: number;
  pipeline_value: number;
  opportunities_won: number;
  won_value: number;
  opportunities_lost: number;
  roi: number | null;
  pipeline_per_spend: number | null;
}

interface RoiData {
  lookback_days: number;
  channels: ChannelRoiRow[];
  totals: {
    ad_spend: number;
    pipeline_value: number;
    won_value: number;
    opportunities: number;
  };
  note: string;
}

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  google: { label: "Google Ads", color: "#EA4335" },
  meta: { label: "Meta Ads", color: "#1877F2" },
  linkedin: { label: "LinkedIn Ads", color: "#0A66C2" },
  email: { label: "Email", color: "#c8a44c" },
  direkt: { label: "Direkt/organiskt", color: "#8bb347" },
  upsales: { label: "Upsales (sälj)", color: "#888" },
  okand: { label: "Okänd källa", color: "#aaa" },
};

const PERIOD_OPTIONS = [
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 180, label: "180d" },
  { value: 365, label: "1 år" },
];

function kr(n: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "0 kr";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mkr`;
  if (n >= 1000) return `${Math.round(n / 1000)}k kr`;
  return `${Math.round(n)} kr`;
}

export function ChannelRoi({ defaultLookback = 90 }: { defaultLookback?: number }) {
  const [lookback, setLookback] = useState(defaultLookback);
  const [data, setData] = useState<RoiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = { cancelled: false };
    setLoading(true);
    fetch(`/api/roi?lookback=${lookback}`, { cache: "no-store" })
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
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <TrendingUp className="h-4 w-4 text-accent" />
          ROI per kanal — från annonskrona till affär
        </h2>
        <div className="flex gap-1 ml-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLookback(opt.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
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
      <p className="mb-3 text-xs text-text-secondary">
        Varje opportunity i Upsales kopplas till källan personen kom ifrån.
        Spend gäller ClearOns annonskonton i samma period.
      </p>

      {loading ? (
        <div className="py-8 text-center text-xs text-text-muted">
          Kopplar opportunities till källor...
        </div>
      ) : !data || data.channels.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">
          Inga opportunities i perioden.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-left text-[9px] uppercase tracking-wide text-text-muted">
                  <th className="py-1.5 pr-3 font-medium">Kanal</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Ad-spend</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Leads</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Öppna opps</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Pipeline</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Vunnet</th>
                  <th className="py-1.5 font-medium text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((c) => {
                  const meta = CHANNEL_META[c.channel] || {
                    label: c.channel,
                    color: "#888",
                  };
                  return (
                    <tr key={c.channel} className="border-b border-border/30">
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-1.5 font-medium text-text-primary">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: meta.color }}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.ad_spend != null ? kr(c.ad_spend) : "—"}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.leads || "—"}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.opportunities_open || "—"}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium">
                        {c.pipeline_value > 0 ? kr(c.pipeline_value) : "—"}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-3 text-right tabular-nums font-bold",
                          c.won_value > 0 ? "text-[#8bb347]" : "text-text-muted",
                        )}
                      >
                        {c.won_value > 0
                          ? `${kr(c.won_value)} (${c.opportunities_won})`
                          : "—"}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {c.ad_spend != null && c.ad_spend > 0 ? (
                          c.roi != null && c.roi > 0 ? (
                            <span className="font-bold text-[#8bb347]">
                              {c.roi.toFixed(1)}x
                            </span>
                          ) : c.pipeline_per_spend != null && c.pipeline_per_spend > 0 ? (
                            <span
                              className="text-text-secondary"
                              title="Inget vunnet än, men pipeline-värde per spenderad krona"
                            >
                              {c.pipeline_per_spend.toFixed(1)}x pipeline
                            </span>
                          ) : (
                            <span className="text-[#e8864c]">0x</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-medium">
                  <td className="py-2 pr-3 text-[9px] uppercase tracking-wide">Totalt</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{kr(data.totals.ad_spend)}</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 pr-3" />
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {kr(data.totals.pipeline_value)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-[#8bb347]">
                    {kr(data.totals.won_value)}
                  </td>
                  <td className="py-2" />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-text-muted leading-snug">{data.note}</p>
        </>
      )}
    </div>
  );
}
