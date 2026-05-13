"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Building2,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentPerson {
  person_id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  company: string | null;
  account_id: string | null;
  is_identified: boolean;
  score: number;
  intent: {
    intent_score: number;
    trend: "rising" | "stable" | "falling" | "new";
    reasons: string[];
    top_product_slug: string | null;
    recent_event_count: number;
    recent_high_intent_count: number;
    has_open_opportunity: boolean;
    channels_used: string[];
    next_action_hint: string;
    behavior_pattern: string;
    event_tags: Array<{ label: string; type: string; count?: number }>;
  };
}

const PRODUCT_LABELS: Record<string, string> = {
  "sales-promotion": "Sales Promotion",
  "customer-care": "Customer Care",
  "interactive-engage": "Interactive Engage",
  kampanja: "Kampanja",
  "send-a-gift": "Send a Gift",
  "clearing-solutions": "Clearing Solutions",
  kuponger: "Kuponger",
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ring_nu: { label: "Ring nu", color: "#ff6b35" },
  boka_mote: { label: "Boka möte", color: "#e8864c" },
  skicka_relevant_case: { label: "Skicka case", color: "#c8a44c" },
  varma_upp: { label: "Värm upp", color: "#8bb347" },
  bevaka: { label: "Bevaka", color: "#888" },
};

// Färgkodning per event-typ för taggchips. Färgen säger inte "hur het" utan
// vilken sorts signal det är så ögat snabbt kan skanna.
function tagColor(type: string): string {
  if (type === "form_submit" || type === "lead_submitted") return "#8bb347";
  if (type === "order_placed" || type === "opportunity_won") return "#8bb347";
  if (type === "upsales_visit_contact_page" || type === "upsales_visit_pricing_page")
    return "#ff6b35";
  if (type === "demo_booked" || type === "appointment_scheduled") return "#ff6b35";
  if (type === "opportunity_created" || type === "opportunity_stage_change")
    return "#ff6b35";
  if (type === "mail_click") return "#e8864c";
  if (type === "mail_open") return "#c8a44c";
  if (type === "meta_ad_click") return "#1877F2";
  if (type === "linkedin_ad_click") return "#0A66C2";
  if (type === "google_ad_click") return "#EA4335";
  if (type === "roi:compute" || type === "quiz:complete" || type === "quiz:cta")
    return "#a363d9";
  if (type === "sms-demo:send") return "#a363d9";
  return "#888";
}

function intentColor(score: number): string {
  if (score >= 75) return "#ff6b35";
  if (score >= 55) return "#e8864c";
  if (score >= 35) return "#c8a44c";
  return "#888";
}

function IdentificationBadge({
  isIdentified,
  hasCompany,
}: {
  isIdentified: boolean;
  hasCompany: boolean;
}) {
  if (isIdentified) {
    return (
      <span
        title="Identifierad person (email/CRM)"
        className="inline-flex items-center gap-0.5 rounded-full bg-[#8bb347]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#8bb347]"
      >
        <ShieldCheck className="h-2.5 w-2.5" />
        Identifierad
      </span>
    );
  }
  if (hasCompany) {
    return (
      <span
        title="Anonym person, men företaget är känt (IP-match)"
        className="inline-flex items-center gap-0.5 rounded-full bg-[#4a9df0]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#4a9df0]"
      >
        <Building2 className="h-2.5 w-2.5" />
        Företag känt
      </span>
    );
  }
  return (
    <span
      title="Helt anonym besökare"
      className="inline-flex items-center gap-0.5 rounded-full bg-text-muted/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-text-muted"
    >
      <EyeOff className="h-2.5 w-2.5" />
      Anonym
    </span>
  );
}

export function IntentLeaderboard() {
  const [people, setPeople] = useState<IntentPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/buying-intent/top?limit=8&days=14");
        const data = await res.json();
        if (!cancelled) setPeople(data.results || []);
      } catch {
        if (!cancelled) setPeople([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#ff6b35]" />
          <span className="section-prefix">/ MEST TROLIGA ATT KÖPA NU</span>
        </div>
        <Link
          href="/persons"
          className="text-xs text-text-secondary hover:text-accent transition-colors flex items-center gap-1"
        >
          Visa alla <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-text-muted">
          Beräknar buying-intent...
        </div>
      ) : people.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-muted">
          Ingen identifierad aktivitet senaste 14 dagarna än.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {people.map((p) => {
            const action = ACTION_LABELS[p.intent.next_action_hint] || ACTION_LABELS.bevaka;
            const color = intentColor(p.intent.intent_score);
            const TrendIcon =
              p.intent.trend === "rising"
                ? TrendingUp
                : p.intent.trend === "falling"
                  ? TrendingDown
                  : null;

            return (
              <Link
                key={p.person_id}
                href={`/persons/${p.person_id}`}
                className="flex items-start gap-4 px-5 py-3 hover:bg-surface-elevated transition-colors group"
              >
                <div
                  className="flex h-12 w-12 flex-col items-center justify-center rounded-md font-bold tabular-nums shrink-0"
                  style={{ background: `${color}1A`, color }}
                >
                  <span className="text-base leading-none">{p.intent.intent_score}</span>
                  <span className="text-[8px] uppercase tracking-wide opacity-70">intent</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                      {p.name || p.email || "Okänd person"}
                    </span>
                    {TrendIcon && (
                      <TrendIcon
                        className={cn(
                          "h-3 w-3 shrink-0",
                          p.intent.trend === "rising" ? "text-[#8bb347]" : "text-text-muted",
                        )}
                      />
                    )}
                    <IdentificationBadge
                      isIdentified={p.is_identified}
                      hasCompany={!!p.company}
                    />
                    {p.intent.has_open_opportunity && (
                      <span className="rounded-full bg-[#ff6b35]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#ff6b35]">
                        Open opp
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-text-muted truncate">
                      {p.title ? `${p.title}, ` : ""}{p.company || "okänt företag"}
                    </span>
                    {p.intent.top_product_slug && (
                      <span className="text-[10px] text-accent shrink-0">
                        · {PRODUCT_LABELS[p.intent.top_product_slug] || p.intent.top_product_slug}
                      </span>
                    )}
                  </div>

                  {p.intent.event_tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.intent.event_tags.map((tag, i) => {
                        const tc = tagColor(tag.type);
                        return (
                          <span
                            key={`${tag.type}-${i}`}
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: `${tc}1A`, color: tc }}
                          >
                            {tag.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded"
                  style={{ background: `${action.color}1A`, color: action.color }}
                >
                  {action.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
