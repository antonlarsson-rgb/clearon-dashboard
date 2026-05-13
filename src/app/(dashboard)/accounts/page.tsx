"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Filter, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountRow {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  segment?: string;
  lifecycle_stage?: string;
  is_customer?: boolean;
  has_purchased?: boolean;
  score?: number;
  intent_score?: number;
  engagement_score?: number;
  demo_readiness?: number;
  top_product_slug?: string;
  identified_persons_count?: number;
  total_events?: number;
  last_event_at?: string;
  ai_score?: number;
  ai_segment?: string;
}

const LIFECYCLES = [
  { slug: "", label: "Alla" },
  { slug: "prospect", label: "Prospect" },
  { slug: "customer", label: "Kund" },
  { slug: "at_risk", label: "At risk" },
  { slug: "dormant", label: "Vilande" },
];

const SEGMENTS = [
  { slug: "", label: "Alla" },
  { slug: "hot", label: "Hot" },
  { slug: "warm", label: "Warm" },
  { slug: "cold", label: "Cold" },
];

const SEGMENT_COLOR: Record<string, string> = {
  hot: "bg-[#ff6b35]/15 text-[#ff6b35]",
  warm: "bg-[#c8e66b]/15 text-[#8bb347]",
  cold: "bg-text-muted/10 text-text-muted",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifecycle, setLifecycle] = useState("");
  const [segment, setSegment] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (lifecycle) params.set("lifecycle", lifecycle);
      if (segment) params.set("segment", segment);
      params.set("limit", "200");
      try {
        const res = await fetch(`/api/accounts/hot?${params}`);
        const data = await res.json();
        if (!cancelled) setAccounts(data.accounts || []);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lifecycle, segment]);

  const filtered = search
    ? accounts.filter((a) =>
        (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.industry || "").toLowerCase().includes(search.toLowerCase()),
      )
    : accounts;

  const customerCount = accounts.filter((a) => a.is_customer).length;
  const prospectCount = accounts.filter((a) => a.lifecycle_stage === "prospect").length;
  const totalPersons = accounts.reduce((sum, a) => sum + (a.identified_persons_count || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Building2 className="h-6 w-6 text-accent" />
          Företag
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Identifierade företag från clearon.live + clearon.se. Sortera, filtrera och oppna 360-vy.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Företag totalt" value={accounts.length} />
        <Stat label="Kunder" value={customerCount} color="#8bb347" />
        <Stat label="Prospects" value={prospectCount} color="#ff6b35" />
        <Stat label="Identifierade personer" value={totalPersons} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <Filter className="h-3.5 w-3.5 text-text-muted" />
        <FilterChips label="Lifecycle" value={lifecycle} onChange={setLifecycle} options={LIFECYCLES} />
        <FilterChips label="Segment" value={segment} onChange={setSegment} options={SEGMENTS} />
        <div className="flex items-center gap-2 ml-auto">
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök företag..."
            className="rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Laddar...
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-surface-elevated text-[10px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="p-3 text-left font-medium">Företag</th>
                <th className="p-3 text-left font-medium">Lifecycle</th>
                <th className="p-3 text-left font-medium">Segment</th>
                <th className="p-3 text-right font-medium">Score</th>
                <th className="p-3 text-right font-medium">Intent</th>
                <th className="p-3 text-right font-medium">Personer</th>
                <th className="p-3 text-right font-medium">Events</th>
                <th className="p-3 text-left font-medium">Sist aktiv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="p-3">
                    <Link
                      href={`/accounts/${a.id}`}
                      className="flex items-center gap-2 font-medium text-text-primary hover:text-accent"
                    >
                      <Building2 className="h-3.5 w-3.5 text-text-muted shrink-0" />
                      <span className="truncate max-w-[260px]">{a.name}</span>
                    </Link>
                    {(a.industry || a.website) && (
                      <div className="ml-5 mt-0.5 flex items-center gap-2 text-[10px] text-text-muted">
                        {a.industry && <span className="truncate max-w-[180px]">{a.industry}</span>}
                        {a.website && (
                          <a
                            href={a.website.startsWith("http") ? a.website : `https://${a.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 hover:text-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            {a.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-text-secondary">
                    {a.lifecycle_stage || "-"}
                    {a.is_customer && (
                      <span className="ml-1 rounded bg-[#8bb347]/15 px-1.5 py-0.5 text-[9px] font-medium uppercase text-[#8bb347]">
                        Kund
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {a.segment ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                          SEGMENT_COLOR[a.segment] || SEGMENT_COLOR.cold,
                        )}
                      >
                        {a.segment}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums font-semibold">
                    {a.score != null ? a.score : <span className="text-text-muted">-</span>}
                  </td>
                  <td className="p-3 text-right tabular-nums text-text-secondary">
                    {a.intent_score != null ? a.intent_score : "-"}
                  </td>
                  <td className="p-3 text-right tabular-nums text-text-secondary">
                    {a.identified_persons_count || 0}
                  </td>
                  <td className="p-3 text-right tabular-nums text-text-muted">
                    {a.total_events || 0}
                  </td>
                  <td className="p-3 text-[11px] text-text-muted">
                    {a.last_event_at ? formatRelative(a.last_event_at) : "-"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-sm text-text-muted">
                    {accounts.length === 0
                      ? "Inga företag i Supabase än. Kör tracking-pipeline för att populera."
                      : "Inga företag matchar filter eller sökning."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums" style={{ color }}>
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
  options: Array<{ slug: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wide text-text-muted">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.slug}
            onClick={() => onChange(opt.slug)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              value === opt.slug
                ? "bg-accent text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just nu";
  if (minutes < 60) return `${minutes} min sedan`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h sedan`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d sedan`;
  return new Date(iso).toLocaleDateString("sv-SE");
}
