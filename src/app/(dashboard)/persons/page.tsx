"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  { slug: "", label: "Alla" },
  { slug: "sales-promotion", label: "Sales Promotion" },
  { slug: "customer-care", label: "Customer Care" },
  { slug: "clearing-solutions", label: "Clearing Solutions" },
  { slug: "send-a-gift", label: "Send a Gift" },
  { slug: "kuponger", label: "Kuponger" },
];

// Beteende-mönster — endast event-härledda. Inga inferenser om titel/roll.
const PATTERNS = [
  { slug: "", label: "Alla" },
  { slug: "form_converted", label: "Skickat formulär" },
  { slug: "pricing_intent", label: "Besökt pris/kontakt" },
  { slug: "product_evaluator", label: "Tittat på produkter" },
  { slug: "returning_visitor", label: "Återkommit" },
  { slug: "mail_engaged", label: "Mail-engagerad" },
  { slug: "ad_responder", label: "Klickat annons" },
  { slug: "customer_active", label: "Kund aktiv" },
  { slug: "dormant_returning", label: "Vaknat" },
  { slug: "stalled", label: "Stagnerar" },
];

const PATTERN_COLOR: Record<string, string> = {
  form_converted: "#8bb347",
  pricing_intent: "#ff6b35",
  product_evaluator: "#e8864c",
  returning_visitor: "#4a9df0",
  mail_engaged: "#c8a44c",
  ad_responder: "#a363d9",
  customer_active: "#8bb347",
  dormant_returning: "#c8a44c",
  stalled: "#aaa",
  new_visitor: "#999",
};

const PATTERN_LABELS: Record<string, string> = {
  form_converted: "Formulär",
  pricing_intent: "Pris/kontakt",
  product_evaluator: "Produkter",
  returning_visitor: "Återkommer",
  mail_engaged: "Mail",
  ad_responder: "Annons",
  customer_active: "Kund aktiv",
  dormant_returning: "Vaknat",
  stalled: "Stagnerar",
  new_visitor: "Ny",
};

interface PersonRow {
  id: string;
  name?: string;
  email?: string;
  title?: string;
  account?: { name?: string; industry?: string; website?: string } | null;
  segment?: string;
  lifecycle?: string;
  is_customer?: boolean;
  score?: number;
  intent?: number;
  demo_readiness?: number;
  top_product?: string;
  top_product_score?: number;
  visits_count?: number;
  total_events?: number;
  product_score?: number;
  behavior_pattern?: string;
  identification_method?: string;
  is_identified?: boolean;
}

const segmentColors: Record<string, string> = {
  hot: "text-[#ff6b35]",
  warm: "text-[#8bb347]",
  curious: "text-[#4a9df0]",
  cold: "text-text-muted",
};

export default function PersonsPage() {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [segment, setSegment] = useState("");
  const [pattern, setPattern] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (product) params.set("product", product);
    if (lifecycle) params.set("lifecycle", lifecycle);
    if (segment) params.set("segment", segment);
    if (pattern) params.set("pattern", pattern);
    params.set("limit", "200");
    params.set("days", "365");
    const res = await fetch(`/api/persons/hot?${params}`);
    const data = await res.json();
    setPersons(data.people || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, lifecycle, segment, pattern]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <UserCircle className="h-6 w-6 text-accent" />
          Leads & Personer
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Alla identifierade och anonyma individer i ett — clearon.live + clearon.se + mail + ads + Upsales-aktiviteter samlat per person. Scoring, buying-intent och beteende-mönster baseras på events-tabellen.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Filter className="h-3.5 w-3.5" />
        </div>
        <FilterChips label="Produkt" value={product} onChange={setProduct} options={PRODUCTS} />
        <FilterChips
          label="Segment"
          value={segment}
          onChange={setSegment}
          options={[
            { slug: "", label: "Alla" },
            { slug: "hot", label: "Hot" },
            { slug: "warm", label: "Warm" },
            { slug: "curious", label: "Curious" },
          ]}
        />
        <FilterChips
          label="Typ"
          value={lifecycle}
          onChange={setLifecycle}
          options={[
            { slug: "", label: "Alla" },
            { slug: "prospect", label: "Prospects" },
            { slug: "customer", label: "Kunder" },
            { slug: "at_risk", label: "Vid risk" },
            { slug: "dormant", label: "Sovande" },
          ]}
        />
        <FilterChips
          label="Beteende"
          value={pattern}
          onChange={setPattern}
          options={PATTERNS}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Laddar...
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-elevated text-[10px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="p-3 text-left font-medium">Person</th>
                <th className="p-3 text-left font-medium">Företag</th>
                <th className="p-3 text-left font-medium">Beteende</th>
                <th className="p-3 text-left font-medium">Segment</th>
                <th className="p-3 text-left font-medium">Lifecycle</th>
                <th className="p-3 text-right font-medium">Score</th>
                <th className="p-3 text-right font-medium">Intent</th>
                <th className="p-3 text-right font-medium">Demo</th>
                <th className="p-3 text-left font-medium">Top produkt</th>
                <th className="p-3 text-right font-medium">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {persons.map((p) => {
                const score = product ? p.product_score : p.score;
                return (
                  <tr key={p.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-3">
                      <Link
                        href={`/persons/${p.id}`}
                        className="block font-medium text-text-primary hover:text-accent"
                      >
                        {p.name || "okänd"}
                      </Link>
                      {p.email && (
                        <div className="text-[10px] text-text-muted">{p.email}</div>
                      )}
                      {p.title && (
                        <div className="text-[10px] text-text-secondary">{p.title}</div>
                      )}
                    </td>
                    <td className="p-3">
                      {p.account?.name ? (
                        <div className="text-xs text-text-secondary">{p.account.name}</div>
                      ) : (
                        <span className="text-[10px] text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.behavior_pattern ? (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{
                            background: `${PATTERN_COLOR[p.behavior_pattern] || "#888"}1A`,
                            color: PATTERN_COLOR[p.behavior_pattern] || "#888",
                          }}
                        >
                          {PATTERN_LABELS[p.behavior_pattern] || p.behavior_pattern}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase",
                          segmentColors[p.segment || "cold"]
                        )}
                      >
                        {p.segment || "cold"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase text-text-muted">
                        {p.lifecycle === "at_risk" ? "at risk" : p.lifecycle || "prospect"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums text-text-primary">
                      {score || 0}
                    </td>
                    <td className="p-3 text-right tabular-nums text-text-secondary">
                      {p.intent || 0}
                    </td>
                    <td
                      className={cn(
                        "p-3 text-right tabular-nums",
                        (p.demo_readiness || 0) >= 60
                          ? "font-bold text-[#8bb347]"
                          : "text-text-secondary"
                      )}
                    >
                      {p.demo_readiness || 0}
                    </td>
                    <td className="p-3 text-[11px] text-text-secondary">
                      {p.top_product || "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums text-text-muted">
                      {p.total_events || 0}
                    </td>
                  </tr>
                );
              })}
              {persons.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-sm text-text-muted">
                    Inga personer matchar filtren.
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
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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
