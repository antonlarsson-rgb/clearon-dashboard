"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Mail,
  Globe,
  ShoppingCart,
  Sparkles,
  UserCircle,
  Building2,
  TrendingUp,
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

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  web: Globe,
  upsales_visit: Globe,
  upsales_mail: Mail,
  upsales_order: ShoppingCart,
  upsales_opportunity: TrendingUp,
  form: UserCircle,
};

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{
    person: Record<string, unknown>;
    product_scores: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    identities: Array<Record<string, unknown>>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/persons/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  async function runAi() {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai-brief/person/${id}`, { method: "POST" });
      const json = await res.json();
      setAiBrief(json.brief || json.error || "Ingen brief kunde genereras.");
    } catch {
      setAiBrief("Fel vid AI-anrop.");
    }
    setAiLoading(false);
  }

  if (loading) return <div className="p-12 text-center text-sm text-text-muted">Laddar...</div>;
  if (!data) return <div className="p-12 text-center text-sm text-text-muted">Hittades inte.</div>;

  const p = data.person;
  const acc = p.account as Record<string, unknown> | null;
  const isHot = p.segment === "hot";
  const isCustomer = p.is_customer;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/persons"
        className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-3 w-3" />
        Tillbaka till Personer
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
              <UserCircle
                className={cn("h-7 w-7", isHot ? "text-[#ff6b35]" : "text-text-secondary")}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {(p.name as string) || "Okänd person"}
              </h1>
              <div className="mt-1 space-y-0.5 text-sm text-text-muted">
                {(p.title as string) && <div>{p.title as string}</div>}
                {(p.primary_email as string) && (
                  <div className="font-mono text-xs">{p.primary_email as string}</div>
                )}
                {(acc?.name as string | undefined) && (
                  <Link
                    href={`/accounts/${acc?.id as string}`}
                    className="inline-flex items-center gap-1 hover:text-text-primary"
                  >
                    <Building2 className="h-3 w-3" />
                    {acc?.name as string}
                  </Link>
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
                  {(p.segment as string) || "cold"}
                </span>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                  {(p.lifecycle_stage as string) || "prospect"}
                </span>
                {(isCustomer as boolean) && (
                  <span className="rounded-full bg-[#416125]/15 px-2 py-0.5 text-[10px] font-medium uppercase text-[#8bb347]">
                    Kund
                  </span>
                )}
                {(p.journey_step as string) && (
                  <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                    {p.journey_step as string}
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
          <Kpi label="Score" value={p.score as number} />
          <Kpi label="Intent" value={p.intent_score as number} />
          <Kpi label="Engagement" value={p.engagement_score as number} />
          <Kpi
            label="Demo-readiness"
            value={p.demo_readiness as number}
            suffix="%"
            highlight={(p.demo_readiness as number) >= 60}
          />
          <Kpi label="Events" value={p.total_events as number} />
        </div>
      </div>

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
        <div className="flex flex-col gap-4">
          <Panel title="Per produkt">
            {data.product_scores.length === 0 ? (
              <div className="text-xs text-text-muted">Inga produktsignaler än</div>
            ) : (
              <div className="space-y-2">
                {data.product_scores.map((ps) => {
                  const slug = ps.product_slug as string;
                  const score = ps.score as number;
                  const max = Math.max(...data.product_scores.map((x) => x.score as number));
                  return (
                    <div key={slug}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-text-primary">
                          {productLabels[slug] || slug}
                        </span>
                        <span className="tabular-nums text-text-secondary">{score}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(score / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title={`Identiteter (${data.identities.length})`}>
            <ul className="space-y-1.5">
              {data.identities.map((id, i) => (
                <li key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">{id.identity_type as string}</span>
                  <span className="font-mono text-text-primary truncate ml-2">
                    {String(id.identity_value).slice(0, 30)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title={`Event-timeline (${data.events.length})`}>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {data.events.map((e) => {
                const Icon = sourceIcons[e.source as string] || Globe;
                const md = (e.metadata as Record<string, unknown>) || {};
                const subject = md.subject as string;
                const url = md.url as string;
                const eventType = e.event_type as string;

                return (
                  <div
                    key={e.id as string}
                    className="flex items-start gap-3 rounded-md border border-border/50 bg-surface-elevated/30 p-2.5 text-xs"
                  >
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-text-muted">
                          {new Date(e.occurred_at as string).toISOString().slice(0, 10)}
                        </span>
                        <span className="font-medium text-text-primary">
                          {eventType.replace(/^upsales_visit_/, "").replace(/^mail_/, "")}
                        </span>
                        {(e.product_slug as string) && (
                          <span className="text-[10px] text-accent">
                            · {productLabels[e.product_slug as string] || (e.product_slug as string)}
                          </span>
                        )}
                        {(e.weight as number) > 0 && (
                          <span className="text-[10px] text-text-muted">
                            +{e.weight as number} pts
                          </span>
                        )}
                      </div>
                      {subject && (
                        <div className="mt-0.5 truncate text-[11px] text-text-secondary">
                          {subject}
                        </div>
                      )}
                      {url && !subject && (
                        <div className="mt-0.5 truncate text-[10px] text-text-muted">{url}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {data.events.length === 0 && (
                <div className="p-8 text-center text-xs text-text-muted">
                  Inga events ännu
                </div>
              )}
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
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
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
  highlight,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-surface-elevated/50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
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
