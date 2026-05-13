"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Globe,
  Mail,
  FileText,
  TrendingUp,
  Phone,
  Eye,
  Tag,
  Briefcase,
  ShoppingCart,
  Zap,
} from "lucide-react";

interface FeedEvent {
  id: string;
  occurred_at: string;
  source: string;
  event_type: string;
  product_slug: string | null;
  weight: number;
  intent_weight: number;
  metadata: Record<string, unknown> | null;
  person: { id: string; name: string | null; email: string | null; title: string | null } | null;
  account: { id: string; name: string; industry: string | null } | null;
}

const PRODUCT_LABELS: Record<string, string> = {
  "sales-promotion": "Sales Promotion",
  "customer-care": "Customer Care",
  "interactive-engage": "Engage",
  kampanja: "Kampanja",
  "send-a-gift": "Send a Gift",
  "clearing-solutions": "Clearing",
  kuponger: "Kuponger",
};

function iconFor(eventType: string, source: string) {
  if (eventType === "mail_open" || eventType === "mail_click") return Mail;
  if (eventType === "form_submit" || eventType === "lead_submitted") return FileText;
  if (eventType.startsWith("opportunity")) return TrendingUp;
  if (eventType === "order_placed") return ShoppingCart;
  if (eventType.includes("contact_page") || eventType.includes("pricing_page")) return Phone;
  if (eventType === "appointment_scheduled" || eventType === "demo_booked") return Briefcase;
  if (eventType.includes("visit") || source === "web") return Globe;
  return Eye;
}

function describe(ev: FeedEvent): string {
  const md = ev.metadata || {};
  const url = (md.url as string) || (md.page_path as string) || "";
  switch (ev.event_type) {
    case "upsales_visit_contact_page":
      return "besökte kontaktsidan";
    case "upsales_visit_pricing_page":
      return "besökte prissidan";
    case "upsales_visit_product_page": {
      const path = url ? extractPath(url) : "";
      return `besökte produktsida ${path}`.trim();
    }
    case "upsales_visit_return":
      return "återkom till sajten";
    case "upsales_visit_page":
      return `besökte ${url ? extractPath(url) : "sajten"}`;
    case "page_view":
      return `besökte ${url ? extractPath(url) : "sidan"}`;
    case "lead_submitted":
    case "form_submit":
      return "skickade in formulär";
    case "mail_open":
      return `öppnade mail "${(md.subject as string)?.slice(0, 40) || ""}"`;
    case "mail_click":
      return `klickade i mail "${(md.subject as string)?.slice(0, 40) || ""}"`;
    case "opportunity_created":
      return `ny opportunity skapad (${formatValue(md.value)})`;
    case "opportunity_stage_change":
      return `opportunity bytte stage till ${md.stage_name || "?"}`;
    case "opportunity_won":
      return `vann opportunity (${formatValue(md.value)})`;
    case "opportunity_lost":
      return "förlorade opportunity";
    case "order_placed":
      return `lade order (${formatValue(md.value)})`;
    case "demo_booked":
    case "appointment_scheduled":
      return "bokade möte";
    case "product:cta":
      return "klickade CTA på produktsida";
    case "quiz:cta":
      return "slutförde quiz med CTA";
    case "roi:compute":
      return "räknade ROI";
    case "sms-demo:send":
      return "testade SMS-demo";
    default:
      return ev.event_type.replace(/_/g, " ");
  }
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.length < 30 ? url : url.slice(0, 30) + "...";
  }
}

function formatValue(v: unknown): string {
  if (typeof v !== "number" || v === 0) return "";
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k kr`;
  return `${v} kr`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function EventsFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/buying-intent/feed?limit=25&minutes=2880");
        const data = await res.json();
        if (!cancelled) setEvents(data.events || []);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000); // refresh varje min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <span className="section-prefix">/ LIVE EVENTS</span>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent pulse-live" />
          <span className="text-xs text-text-muted">
            Web · Mail · CRM
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-text-muted">Laddar...</div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-muted">
          Inga events senaste 48h. Sync-jobben kanske inte körts än.
        </div>
      ) : (
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {events.map((ev) => {
            const Icon = iconFor(ev.event_type, ev.source);
            const highIntent = (ev.intent_weight || 0) >= 6;
            return (
              <div
                key={ev.id}
                className="flex items-start gap-3 px-5 py-2.5 hover:bg-surface-elevated transition-colors"
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5"
                  style={{
                    background: highIntent ? "rgba(255,107,53,0.12)" : "var(--surface-elevated, #f3f3f3)",
                  }}
                >
                  <Icon className={highIntent ? "h-3 w-3 text-[#ff6b35]" : "h-3 w-3 text-text-muted"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary leading-snug">
                    {ev.person?.id ? (
                      <Link
                        href={`/persons/${ev.person.id}`}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {ev.person.name || ev.person.email || "Okänd"}
                      </Link>
                    ) : ev.account?.id ? (
                      <Link
                        href={`/accounts/${ev.account.id}`}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {ev.account.name}
                      </Link>
                    ) : (
                      <span className="text-text-muted">Anonym</span>
                    )}{" "}
                    <span className="text-text-secondary">{describe(ev)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                    {ev.account?.name && ev.person && (
                      <Link
                        href={`/accounts/${ev.account.id}`}
                        className="hover:text-accent flex items-center gap-1"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {ev.account.name}
                      </Link>
                    )}
                    {ev.product_slug && (
                      <span className="text-accent">
                        {PRODUCT_LABELS[ev.product_slug] || ev.product_slug}
                      </span>
                    )}
                    {highIntent && (
                      <span className="flex items-center gap-0.5 font-medium text-[#ff6b35]">
                        <Zap className="h-2.5 w-2.5" />
                        +{ev.intent_weight}
                      </span>
                    )}
                    <span className="ml-auto font-mono">{formatRelative(ev.occurred_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
