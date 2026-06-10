"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UserCircle,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Building2,
  EyeOff,
  Phone,
  MessageSquare,
  Mail,
  Megaphone,
  Copy,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentPerson {
  person_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
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
    source_platform: string | null;
  };
}

// Var personen kom ifran (first touch). Annonsplattformar i sina varumarkes-
// farger sa man direkt ser vilka leads annonserna levererar.
const SOURCE_PLATFORM_META: Record<string, { label: string; color: string }> = {
  google: { label: "Google Ads", color: "#EA4335" },
  meta: { label: "Meta Ads", color: "#1877F2" },
  linkedin: { label: "LinkedIn Ads", color: "#0A66C2" },
  email: { label: "Email", color: "#c8a44c" },
  direkt: { label: "Direkt/organiskt", color: "#8bb347" },
  upsales: { label: "Upsales CRM", color: "#888" },
};

// Ordnad efter prioritet för säljteamet — beslutsfattare och pris-intent först.
const PATTERN_ORDER = [
  "pricing_intent",
  "form_converted",
  "paying_customer",
  "product_evaluator",
  "dormant_returning",
  "mail_engaged",
  "ad_responder",
  "deep_browser",
  "stalled",
  "new_visitor",
];

const PATTERN_META: Record<
  string,
  { label: string; description: string; color: string; priority: "het" | "varm" | "kall" }
> = {
  pricing_intent: {
    label: "Pris- eller kontaktsida",
    description: "Besökt /pris eller /kontakt — närmast affärsbeslut",
    color: "#ff6b35",
    priority: "het",
  },
  form_converted: {
    label: "Skickat formulär",
    description: "Skickat in form senaste 90 dagar — varmaste leadsen",
    color: "#ff6b35",
    priority: "het",
  },
  paying_customer: {
    label: "Befintlig kund",
    description: "Har order_placed eller opportunity_won i sin historik",
    color: "#8bb347",
    priority: "varm",
  },
  product_evaluator: {
    label: "Utvärderar produkter",
    description: "Tittat på 2+ olika produktsidor",
    color: "#e8864c",
    priority: "varm",
  },
  dormant_returning: {
    label: "Vaknat efter paus",
    description: "Var inaktiva 60+ dagar — nu kommit tillbaka",
    color: "#c8a44c",
    priority: "varm",
  },
  mail_engaged: {
    label: "Mail-engagerade",
    description: "Öppnat eller klickat mail — låg-mid signal",
    color: "#4a9df0",
    priority: "varm",
  },
  ad_responder: {
    label: "Annons-klickare",
    description: "Klickat Meta/Google/LinkedIn-annons",
    color: "#a363d9",
    priority: "kall",
  },
  deep_browser: {
    label: "Många sidvisningar",
    description: "10+ sajt-/produktvisningar utan formulär eller köp",
    color: "#888",
    priority: "kall",
  },
  stalled: {
    label: "Stagnerar",
    description: "Hade aktivitet, inget senaste 90 dagar",
    color: "#aaa",
    priority: "kall",
  },
  new_visitor: {
    label: "Nya / okategoriserade",
    description: "För få signaler för klassning",
    color: "#999",
    priority: "kall",
  },
};

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

// ---- Bulk-actions: mejllista, ringlista, LinkedIn-malgrupp ----

function downloadFile(filename: string, content: string, mime = "text/csv") {
  const blob = new Blob(["﻿" + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number | null): string {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function copyEmailList(people: IntentPerson[]): number {
  const emails = [...new Set(people.map((p) => p.email).filter(Boolean))] as string[];
  if (emails.length > 0) navigator.clipboard?.writeText(emails.join(", "));
  return emails.length;
}

function exportCallListCsv(people: IntentPerson[], groupLabel: string) {
  const rows = people
    .filter((p) => p.phone)
    .map((p) =>
      [p.name, p.company, p.phone, p.email, p.intent.intent_score, p.score]
        .map(csvEscape)
        .join(";"),
    );
  downloadFile(
    `ringlista-${groupLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`,
    ["Namn;Företag;Telefon;Email;Intent;Score", ...rows].join("\n"),
  );
  return rows.length;
}

/**
 * LinkedIn Campaign Manager company list: CSV med kolumnen companyname,
 * laddas upp under Plan > Audiences > Upload a list for account-targeting
 * (ABM). Max 300 000 rader, min 300 matchade foretag for att fa anvandas.
 */
function exportLinkedInAudienceCsv(people: IntentPerson[], groupLabel: string) {
  const companies = [...new Set(people.map((p) => p.company).filter(Boolean))] as string[];
  downloadFile(
    `linkedin-malgrupp-${groupLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`,
    ["companyname", ...companies.map(csvEscape)].join("\n"),
  );
  return companies.length;
}

function intentColor(score: number): string {
  if (score >= 75) return "#ff6b35";
  if (score >= 55) return "#e8864c";
  if (score >= 35) return "#c8a44c";
  if (score >= 15) return "#8bb347";
  return "#888";
}

function tagColor(type: string): string {
  if (type === "form_submit" || type === "lead_submitted") return "#8bb347";
  if (type === "order_placed" || type === "opportunity_won") return "#8bb347";
  if (
    type === "upsales_visit_contact_page" ||
    type === "upsales_visit_pricing_page" ||
    type === "demo_booked" ||
    type === "appointment_scheduled" ||
    type === "opportunity_created" ||
    type === "opportunity_stage_change"
  ) {
    return "#ff6b35";
  }
  if (type === "mail_click") return "#e8864c";
  if (type === "mail_open") return "#c8a44c";
  if (type === "meta_ad_click") return "#1877F2";
  if (type === "linkedin_ad_click") return "#0A66C2";
  if (type === "google_ad_click") return "#EA4335";
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
        title="Identifierad — har email eller telefon"
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
        title="Anonym person, känt företag via IP-match"
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

export default function PersonsPage() {
  const [people, setPeople] = useState<IntentPerson[]>([]);
  const [loading, setLoading] = useState(true);
  // Default kollapsade — användaren expanderar de hen vill djupdyka i
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ctrl = { cancelled: false };
    (async () => {
      try {
        const res = await fetch("/api/buying-intent/top?limit=500&days=365");
        const json = await res.json();
        if (!ctrl.cancelled) {
          setPeople(json.results || []);
          setLoading(false);
        }
      } catch {
        if (!ctrl.cancelled) {
          setPeople([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      ctrl.cancelled = true;
    };
  }, []);

  // Gruppera efter behavior_pattern
  const groups = useMemo(() => {
    const map = new Map<string, IntentPerson[]>();
    for (const p of people) {
      const pattern = p.intent.behavior_pattern || "new_visitor";
      if (!map.has(pattern)) map.set(pattern, []);
      map.get(pattern)!.push(p);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.intent.intent_score - a.intent.intent_score);
    }
    return PATTERN_ORDER.filter((p) => map.has(p)).map((p) => ({
      pattern: p,
      people: map.get(p)!,
    }));
  }, [people]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <UserCircle className="h-6 w-6 text-accent" />
          Leads & Personer
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Alla personer segmenterade efter beteende. Sorterade så heta signaler
          (pris, formulär, kund) hamnar överst. Klicka på en grupp för att se
          personerna och deras kontaktsannolikhet.
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Klassificerar beteenden från events-tabellen...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
          Inga personer i datan än. Sync-jobben kör i bakgrunden.
        </div>
      ) : (
        groups.map((g) => (
          <BehaviorGroup
            key={g.pattern}
            pattern={g.pattern}
            people={g.people}
            expanded={!!expanded[g.pattern]}
            onToggle={() =>
              setExpanded((prev) => ({ ...prev, [g.pattern]: !prev[g.pattern] }))
            }
          />
        ))
      )}
    </div>
  );
}

function BehaviorGroup({
  pattern,
  people,
  expanded,
  onToggle,
}: {
  pattern: string;
  people: IntentPerson[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = PATTERN_META[pattern] || PATTERN_META.new_visitor;
  const maxIntent = people[0]?.intent.intent_score || 0;
  const avgIntent = Math.round(
    people.reduce((s, p) => s + p.intent.intent_score, 0) / people.length,
  );
  const identifiedCount = people.filter((p) => p.is_identified).length;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ background: meta.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-text-primary">{meta.label}</h3>
              <span className="text-xs text-text-muted">
                {people.length} {people.length === 1 ? "person" : "personer"}
              </span>
              {identifiedCount > 0 && (
                <span className="text-[10px] text-text-muted">
                  · {identifiedCount} identifierade
                </span>
              )}
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                style={{
                  background:
                    meta.priority === "het"
                      ? "rgba(255,107,53,0.15)"
                      : meta.priority === "varm"
                        ? "rgba(232,134,76,0.15)"
                        : "rgba(170,170,170,0.15)",
                  color:
                    meta.priority === "het"
                      ? "#ff6b35"
                      : meta.priority === "varm"
                        ? "#e8864c"
                        : "#888",
                }}
              >
                {meta.priority}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-text-muted">
              Topp / snitt intent
            </div>
            <div className="font-mono text-sm tabular-nums">
              <span style={{ color: intentColor(maxIntent) }}>{maxIntent}</span>
              <span className="text-text-muted"> / {avgIntent}</span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-muted transition-transform",
              expanded ? "" : "-rotate-90",
            )}
          />
        </div>
      </button>

      {expanded && (
        <>
          <GroupActionBar people={people} groupLabel={meta.label} />
          <div className="divide-y divide-border border-t border-border max-h-[600px] overflow-y-auto">
            {people.map((p) => (
              <PersonRow key={p.person_id} p={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GroupActionBar({
  people,
  groupLabel,
}: {
  people: IntentPerson[];
  groupLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const emailCount = new Set(people.map((p) => p.email).filter(Boolean)).size;
  const phoneCount = people.filter((p) => p.phone).length;
  const companyCount = new Set(people.map((p) => p.company).filter(Boolean)).size;

  const btn =
    "inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-elevated/30 px-4 py-2">
      <span className="text-[9px] uppercase tracking-wide text-text-muted">
        Actions för gruppen
      </span>
      <button
        className={btn}
        disabled={emailCount === 0}
        onClick={() => {
          if (copyEmailList(people) > 0) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }}
      >
        <Copy className="h-3 w-3" />
        {copied ? "Kopierat!" : `Kopiera mejl (${emailCount})`}
      </button>
      <button
        className={btn}
        disabled={phoneCount === 0}
        onClick={() => exportCallListCsv(people, groupLabel)}
      >
        <Download className="h-3 w-3" />
        Ringlista CSV ({phoneCount})
      </button>
      <button
        className={btn}
        disabled={companyCount === 0}
        onClick={() => exportLinkedInAudienceCsv(people, groupLabel)}
        title="CSV med companyname-kolumn. Ladda upp i LinkedIn Campaign Manager under Plan > Audiences > Upload a list för att annonsera mot dessa företag (ABM)."
      >
        <Megaphone className="h-3 w-3" style={{ color: "#0A66C2" }} />
        LinkedIn-målgrupp CSV ({companyCount} företag)
      </button>
    </div>
  );
}

function PersonRow({ p }: { p: IntentPerson }) {
  const action = ACTION_LABELS[p.intent.next_action_hint] || ACTION_LABELS.bevaka;
  const color = intentColor(p.intent.intent_score);
  const source = p.intent.source_platform
    ? SOURCE_PLATFORM_META[p.intent.source_platform]
    : null;
  const TrendIcon =
    p.intent.trend === "rising"
      ? TrendingUp
      : p.intent.trend === "falling"
        ? TrendingDown
        : null;

  const actionBtn =
    "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors";

  return (
    <div className="flex items-start gap-4 px-4 py-3 hover:bg-surface-elevated transition-colors">
      <Link href={`/persons/${p.person_id}`} className="flex items-start gap-4 flex-1 min-w-0">
        <div
          className="flex h-14 w-14 flex-col items-center justify-center rounded-full shrink-0"
          style={{ background: `${color}15`, border: `2px solid ${color}40` }}
        >
          <span className="text-base font-bold tabular-nums" style={{ color }}>
            {p.intent.intent_score}
          </span>
          <span className="text-[8px] uppercase tracking-wide text-text-muted">
            intent
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary truncate">
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
            <IdentificationBadge isIdentified={p.is_identified} hasCompany={!!p.company} />
            {source && (
              <span
                title="Källa: var personen kom ifrån (first touch)"
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                style={{ background: `${source.color}15`, color: source.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                {source.label}
              </span>
            )}
            {p.intent.has_open_opportunity && (
              <span className="rounded-full bg-[#ff6b35]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#ff6b35]">
                Open opp
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2 flex-wrap text-[11px] text-text-muted">
            {p.title && <span>{p.title}</span>}
            {p.title && p.company && <span>·</span>}
            {p.company && <span className="font-medium">{p.company}</span>}
            {p.intent.top_product_slug && (
              <>
                <span>·</span>
                <span className="text-accent">
                  {PRODUCT_LABELS[p.intent.top_product_slug] || p.intent.top_product_slug}
                </span>
              </>
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
      </Link>

      {/* Mojliga actions baserat pa vilken kontaktdata vi faktiskt har */}
      <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
        <div
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded"
          style={{ background: `${action.color}1A`, color: action.color }}
        >
          {action.label}
        </div>
        <div className="flex items-center gap-1">
          {p.phone && (
            <a href={`tel:${p.phone}`} className={actionBtn} title={`Ring ${p.phone}`}>
              <Phone className="h-2.5 w-2.5" />
              Ring
            </a>
          )}
          {p.phone && (
            <a href={`sms:${p.phone}`} className={actionBtn} title={`SMS:a ${p.phone}`}>
              <MessageSquare className="h-2.5 w-2.5" />
              SMS
            </a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} className={actionBtn} title={`Maila ${p.email}`}>
              <Mail className="h-2.5 w-2.5" />
              Maila
            </a>
          )}
          {!p.phone && !p.email && p.company && (
            <span
              className={actionBtn}
              title="Ingen direktkontakt - nå företaget via LinkedIn-annonsering (exportera gruppens LinkedIn-målgrupp ovan)"
            >
              <Megaphone className="h-2.5 w-2.5" style={{ color: "#0A66C2" }} />
              LinkedIn-ABM
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
