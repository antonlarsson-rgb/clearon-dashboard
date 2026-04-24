"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  RefreshCw,
  Filter,
  Sparkles,
  Building2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  { slug: "", label: "Alla produkter" },
  { slug: "sales-promotion", label: "Sales Promotion" },
  { slug: "clearing-solutions", label: "Clearing Solutions" },
  { slug: "customer-care", label: "Customer Care" },
  { slug: "send-a-gift", label: "Send a Gift" },
  { slug: "kuponger", label: "Kuponger" },
  { slug: "interactive-engage", label: "Engage" },
];

const AI_SEGMENTS = [
  { slug: "", label: "Alla" },
  { slug: "qualified", label: "Qualified" },
  { slug: "evaluating", label: "Evaluating" },
  { slug: "browsing", label: "Browsing" },
  { slug: "noise", label: "Noise" },
];

const URGENCY_COLOR: Record<string, string> = {
  high: "bg-[#ff6b35]/15 text-[#ff6b35]",
  medium: "bg-[#c8e66b]/15 text-[#8bb347]",
  low: "bg-text-muted/10 text-text-muted",
};

const AI_SEGMENT_COLOR: Record<string, string> = {
  qualified: "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/40",
  evaluating: "bg-[#c8e66b]/15 text-[#8bb347] border-[#c8e66b]/30",
  browsing: "bg-[#4a9df0]/10 text-[#4a9df0] border-[#4a9df0]/25",
  noise: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

interface AccountRow {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  segment?: string;
  lifecycle_stage?: string;
  is_customer?: boolean;
  score?: number;
  intent_score?: number;
  demo_readiness?: number;
  top_product_slug?: string;
  identified_persons_count?: number;
  total_events?: number;
  last_event_at?: string;
  ai_score?: number;
  ai_segment?: string;
  ai_buy_probability?: number;
  ai_urgency?: string;
  ai_best_fit_product?: string;
  ai_reasoning?: string;
  ai_next_action?: string;
  ai_evaluated_at?: string;
}

export default function HotPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiProgress, setAiProgress] = useState<string>("");
  const [product, setProduct] = useState("");
  const [aiSegment, setAiSegment] = useState("");
  const [segment, setSegment] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (product) params.set("product", product);
    if (segment) params.set("segment", segment);
    params.set("limit", "100");
    const res = await fetch(`/api/accounts/hot?${params}`);
    const data = await res.json();
    let list: AccountRow[] = (data.accounts || []).map((a: AccountRow & { product_score?: number }) => ({
      ...a,
      score: (a as AccountRow & { product_score?: number }).product_score || a.score,
    }));
    if (aiSegment) list = list.filter((a) => a.ai_segment === aiSegment);
    setAccounts(list);
    setLoading(false);
  }

  async function runAi() {
    setAiRunning(true);
    setAiProgress("Claude värderar top-20...");
    const res = await fetch("/api/ai-score/batch?limit=20&force=1", {
      method: "POST",
    });
    const json = await res.json();
    setAiProgress(`Klar — ${json.processed || 0} accounts värderade`);
    setTimeout(() => setAiProgress(""), 3000);
    await load();
    setAiRunning(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, aiSegment, segment]);

  const qualifiedCount = accounts.filter((a) => a.ai_segment === "qualified").length;
  const evaluatingCount = accounts.filter((a) => a.ai_segment === "evaluating").length;
  const highUrgency = accounts.filter((a) => a.ai_urgency === "high").length;
  const aiEvaluated = accounts.filter((a) => a.ai_evaluated_at).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Flame className="h-6 w-6 text-[#ff6b35]" />
            Hot Now — AI-värderad trafik
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Identifierade företag, beteende-scored + Claude-klassificerade efter segment, urgency och best-fit produkt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aiProgress && (
            <span className="text-xs text-accent">{aiProgress}</span>
          )}
          <button
            onClick={runAi}
            disabled={aiRunning}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className={cn("h-3.5 w-3.5", aiRunning && "animate-pulse")} />
            {aiRunning ? "Claude tänker..." : "Kör AI-värdering på top 20"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat label="Qualified (AI)" value={qualifiedCount} color="#ff6b35" />
        <Stat label="Evaluating (AI)" value={evaluatingCount} color="#c8e66b" />
        <Stat label="High urgency" value={highUrgency} color="#e8864c" />
        <Stat label="AI-värderade" value={aiEvaluated} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <Filter className="h-3.5 w-3.5 text-text-muted" />
        <FilterChips label="Produkt" value={product} onChange={setProduct} options={PRODUCTS} />
        <FilterChips
          label="AI-segment"
          value={aiSegment}
          onChange={setAiSegment}
          options={AI_SEGMENTS}
        />
        <FilterChips
          label="Rule-segment"
          value={segment}
          onChange={setSegment}
          options={[
            { slug: "", label: "Alla" },
            { slug: "hot", label: "Hot" },
            { slug: "warm", label: "Warm" },
          ]}
        />
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
                <th className="p-3 text-left font-medium">AI-segment</th>
                <th className="p-3 text-right font-medium">AI-score</th>
                <th className="p-3 text-right font-medium">Köp-sannolikhet</th>
                <th className="p-3 text-left font-medium">Best-fit</th>
                <th className="p-3 text-left font-medium">Urgency</th>
                <th className="p-3 text-right font-medium">Rule-score</th>
                <th className="p-3 text-right font-medium">Events</th>
                <th className="p-3 text-left font-medium">AI-analys</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="p-3">
                    <Link
                      href={`/accounts/${a.id}`}
                      className="flex items-center gap-2 font-medium text-text-primary hover:text-accent"
                    >
                      <Building2 className="h-3.5 w-3.5 text-text-muted shrink-0" />
                      <span className="truncate max-w-[220px]">{a.name}</span>
                    </Link>
                    {a.industry && (
                      <div className="ml-5 mt-0.5 truncate max-w-[220px] text-[10px] text-text-muted">
                        {a.industry}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {a.ai_segment ? (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                          AI_SEGMENT_COLOR[a.ai_segment] || AI_SEGMENT_COLOR.noise
                        )}
                      >
                        {a.ai_segment}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold tabular-nums">
                    {a.ai_score != null ? (
                      <span className={cn(a.ai_score >= 70 ? "text-[#ff6b35]" : "text-text-primary")}>
                        {a.ai_score}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {a.ai_buy_probability != null ? (
                      <span
                        className={cn(
                          a.ai_buy_probability >= 0.5 ? "text-[#8bb347] font-semibold" : "text-text-secondary"
                        )}
                      >
                        {Math.round(a.ai_buy_probability * 100)}%
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-text-secondary">
                    {a.ai_best_fit_product || "—"}
                  </td>
                  <td className="p-3">
                    {a.ai_urgency ? (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          URGENCY_COLOR[a.ai_urgency] || URGENCY_COLOR.low
                        )}
                      >
                        {a.ai_urgency}
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums text-text-secondary">{a.score || 0}</td>
                  <td className="p-3 text-right tabular-nums text-text-muted">
                    {a.total_events || 0}
                  </td>
                  <td className="p-3 max-w-[320px]">
                    {a.ai_reasoning ? (
                      <div className="text-[11px] leading-tight text-text-secondary">
                        {a.ai_reasoning}
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted italic">
                        inte AI-värderad än
                      </span>
                    )}
                    {a.ai_next_action && (
                      <div className="mt-1 text-[10px] leading-tight text-accent">
                        → {a.ai_next_action}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-sm text-text-muted">
                    Inga företag matchar filtren.
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
      <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </div>
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
