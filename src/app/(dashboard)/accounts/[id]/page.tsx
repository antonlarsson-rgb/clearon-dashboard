"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  TrendingUp,
  Users,
  ExternalLink,
  Sparkles,
  Target,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const productLabels: Record<string, string> = {
  "sales-promotion": "Sales Promotion",
  "customer-care": "Customer Care",
  "interactive-engage": "Interactive Engage",
  kampanja: "Kampanja",
  "send-a-gift": "Send a Gift",
  "clearing-solutions": "Clearing Solutions",
  kuponger: "Kuponger",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AccountPage({ params }: PageProps) {
  const { id } = use(params);
  const [data, setData] = useState<{
    account: Record<string, unknown>;
    persons: Array<Record<string, unknown>>;
    product_scores: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    top_pages: Array<{ url: string; visits: number; duration: number }>;
    vainu: Record<string, unknown> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/accounts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  async function runAi() {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai-brief/account/${id}`, { method: "POST" });
      const json = await res.json();
      setAiBrief(json.brief || json.error || "Ingen brief kunde genereras.");
    } catch {
      setAiBrief("Fel vid AI-anrop.");
    }
    setAiLoading(false);
  }

  if (loading) {
    return <div className="p-12 text-center text-sm text-text-muted">Laddar...</div>;
  }
  if (!data) {
    return <div className="p-12 text-center text-sm text-text-muted">Hittades inte.</div>;
  }

  const a = data.account as Record<string, unknown>;
  const segment = (a.segment as string) || "cold";
  const isHot = segment === "hot";
  const isCustomer = a.is_customer;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/hot"
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-3 w-3" />
        Tillbaka till Hot Now
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-lg",
                isHot ? "bg-[#ff6b35]/15" : "bg-surface-elevated"
              )}
            >
              <Building2
                className={cn("h-7 w-7", isHot ? "text-[#ff6b35]" : "text-text-secondary")}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{a.name as string}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-text-muted">
                {(a.industry as string) && <span>{a.industry as string}</span>}
                {(a.website as string) && (
                  <a
                    href={a.website as string}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {(a.website as string).replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {isHot && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b35] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <Flame className="h-2.5 w-2.5" />
                    Hot
                  </span>
                )}
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                  {segment}
                </span>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                  {(a.lifecycle_stage as string) || "prospect"}
                </span>
                {isCustomer ? (
                  <span className="rounded-full bg-[#416125]/15 px-2 py-0.5 text-[10px] font-medium uppercase text-[#8bb347]">
                    Kund
                  </span>
                ) : (
                  <span className="rounded-full bg-[#4a9df0]/10 px-2 py-0.5 text-[10px] font-medium uppercase text-[#4a9df0]">
                    Prospect
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={runAi}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className={cn("h-4 w-4", aiLoading && "animate-pulse")} />
            {aiLoading ? "Claude tänker..." : "Kör AI-brief"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-3">
          <Kpi label="Total score" value={a.score as number} />
          <Kpi label="Intent" value={a.intent_score as number} icon={TrendingUp} />
          <Kpi label="Engagement" value={a.engagement_score as number} />
          <Kpi
            label="Demo-readiness"
            value={a.demo_readiness as number}
            suffix="%"
            highlight={(a.demo_readiness as number) >= 60}
          />
          <Kpi
            label="Identifierade"
            value={a.identified_persons_count as number}
            icon={Users}
          />
        </div>
      </div>

      {/* AI Brief panel */}
      {aiBrief && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Claude brief
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
            {aiBrief}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: product affinity + Vainu */}
        <div className="flex flex-col gap-4">
          <Panel title="Per produkt">
            {data.product_scores.length === 0 ? (
              <div className="text-xs text-text-muted">Inga produktsignaler än</div>
            ) : (
              <div className="space-y-2">
                {data.product_scores.map((ps) => {
                  const slug = ps.product_slug as string;
                  const score = ps.score as number;
                  const maxScore = Math.max(...data.product_scores.map((x) => x.score as number));
                  return (
                    <Link
                      key={slug}
                      href={`/hot?product=${slug}`}
                      className="block"
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-text-primary">
                          {productLabels[slug] || slug}
                        </span>
                        <span className="tabular-nums text-text-secondary">
                          {score}
                          <span className="ml-1 text-text-muted">
                            · {ps.event_count as number} events
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(score / maxScore) * 100}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>

          {data.vainu && (
            <Panel title="Vainu-data">
              <div className="space-y-1.5 text-xs">
                {(data.vainu.employees as number) != null && (
                  <Field label="Anställda" value={String(data.vainu.employees)} />
                )}
                {(data.vainu.revenue as number) != null && (
                  <Field
                    label="Omsättning"
                    value={`${Math.round(((data.vainu.revenue as number) || 0) / 1_000_000)} MSEK`}
                  />
                )}
                {(data.vainu.city as string) && (
                  <Field label="Stad" value={data.vainu.city as string} />
                )}
                {(data.vainu.industry as string) && (
                  <Field label="Bransch" value={data.vainu.industry as string} />
                )}
              </div>
              {(data.vainu.description as string | null) && (
                <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                  {(data.vainu.description as string).slice(0, 280)}
                </p>
              )}
            </Panel>
          )}

          {/* Top pages */}
          <Panel title="Mest besökta sidor">
            {data.top_pages.length === 0 ? (
              <div className="text-xs text-text-muted">Inga visits än</div>
            ) : (
              <ul className="space-y-2">
                {data.top_pages.slice(0, 8).map((p, i) => (
                  <li key={i} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-text-primary font-mono">
                        {p.url.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                      </span>
                      <span className="shrink-0 tabular-nums text-text-muted">
                        {p.visits}x
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-text-muted">
                      {Math.round(p.duration / 60)} min totalt
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Middle+right: timeline */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Panel title={`Identifierade personer (${data.persons.length})`}>
            {data.persons.length === 0 ? (
              <div className="text-xs text-text-muted">
                Inga kontakter stitchade ännu — besöken är bara IP-identifierade på företagsnivå.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.persons.slice(0, 10).map((p) => (
                  <Link
                    key={p.id as string}
                    href={`/persons/${p.id}`}
                    className="flex items-center justify-between rounded-md border border-border/50 bg-surface-elevated/50 p-2.5 hover:border-accent/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-text-primary">
                        {(p.name as string) || "okänd"}
                      </div>
                      {(p.title as string) && (
                        <div className="truncate text-[10px] text-text-muted">
                          {p.title as string}
                        </div>
                      )}
                      {(p.primary_email as string) && (
                        <div className="truncate text-[10px] text-text-muted">
                          {p.primary_email as string}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 text-right">
                      <div className="text-xs font-bold tabular-nums text-text-primary">
                        {(p.score as number) || 0}
                      </div>
                      <div className="text-[9px] uppercase tracking-wide text-text-muted">
                        score
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={`Event-timeline (${data.events.length})`}>
            <div className="space-y-2">
              {data.events.slice(0, 40).map((e) => {
                const md = (e.metadata as Record<string, unknown>) || {};
                const url = (md.url as string) || "";
                return (
                  <div
                    key={e.id as string}
                    className="flex items-start gap-2 border-l-2 border-accent/30 pl-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-text-muted">
                          {new Date(e.occurred_at as string).toISOString().slice(0, 10)}
                        </span>
                        <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                          {(e.source as string).replace("upsales_", "")}
                        </span>
                        <span className="font-medium text-text-primary">
                          {(e.event_type as string).replace(/^upsales_visit_/, "")}
                        </span>
                        {(e.product_slug as string) && (
                          <span className="text-[10px] text-accent">
                            · {productLabels[e.product_slug as string] || (e.product_slug as string)}
                          </span>
                        )}
                      </div>
                      {url && (
                        <div className="truncate text-[10px] text-text-muted">{url}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        <Target className="h-3 w-3" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix = "",
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-surface-elevated/50 p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-text-muted">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          highlight ? "text-[#8bb347]" : "text-text-primary"
        )}
      >
        {value || 0}
        {suffix}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary text-right">{value}</span>
    </div>
  );
}

