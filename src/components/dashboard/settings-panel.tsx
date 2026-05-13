"use client";

import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_WEIGHTS, HALFLIFE_DAYS, halflifeFor } from "@/lib/event-weights";

// --- INTEGRATIONER (live status fran /api/integrations/status) ---

interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  envVars: string[];
  docsUrl?: string;
}

function IntegrationCard({ integration }: { integration: IntegrationStatus }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="truncate">{integration.name}</CardTitle>
            <CardDescription>{integration.description}</CardDescription>
          </div>
          <Badge
            variant={integration.connected ? "default" : "secondary"}
            className={cn(
              "shrink-0",
              integration.connected
                ? "bg-accent-subtle text-accent"
                : "bg-surface-elevated text-text-muted",
            )}
          >
            {integration.connected ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> Ansluten
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <X className="h-3 w-3" /> Ej ansluten
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-text-muted">
            Miljovariabler
          </div>
          <div className="flex flex-wrap gap-1.5">
            {integration.envVars.map((envVar) => (
              <span
                key={envVar}
                className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
              >
                {envVar}
              </span>
            ))}
          </div>
        </div>

        {!integration.connected && integration.docsUrl && (
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Skaffa nyckel
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function IntegrationsTab() {
  const [data, setData] = useState<{
    integrations: IntegrationStatus[];
    summary: { total: number; connected: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/integrations/status", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/status", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
        Kontrollerar integrationer...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center text-sm text-text-muted">
        Kunde inte hamta integrationsstatus.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {data.summary.connected} av {data.summary.total} integrationer ar anslutna. Konfigurera via miljovariabler i Vercel-projektet.
        </p>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Uppdatera
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}

// --- SCORING-VIKTER (read-only mot riktiga EVENT_WEIGHTS) ---

const EVENT_TYPE_LABELS: Record<string, string> = {
  // Web events
  page_view: "Sidvisning",
  scroll_depth: "Scroll-djup",
  "hero:role": "Vald roll i hero",
  "product:hover": "Hovrade produkt",
  "product:expand": "Expanderade produkt",
  "product:cta": "CTA på produktsida",
  "game:start": "Startade spel",
  "game:win": "Vann spel",
  "quiz:answer": "Quiz-svar",
  "quiz:complete": "Slutförde quiz",
  "quiz:cta": "Quiz CTA",
  "usecase:expand": "Expanderade use case",
  "sms-demo:send": "Testade SMS-demo",
  "roi:adjust": "Justerade ROI-kalkylator",
  "roi:compute": "Räknade ROI",
  "module:engage": "Engagerade modul",
  cta_clicked: "Klickade CTA",
  lead_submitted: "Skickade formulär",
  popup_shown: "Popup visades",
  popup_dismissed: "Stängde popup",
  // Upsales-visits
  upsales_visit_page: "Besökte clearon.se",
  upsales_visit_contact_page: "Besökte kontaktsidan",
  upsales_visit_pricing_page: "Besökte prissidan",
  upsales_visit_product_page: "Besökte produktsida",
  upsales_visit_return: "Återkom till sajten",
  // Mail
  mail_open: "Öppnade mail",
  mail_click: "Klickade i mail",
  mail_unsubscribe: "Avregistrerade mail",
  mail_bounce: "Mail studsade",
  // Form
  form_submit: "Skickade formulär (Upsales)",
  // CRM
  journey_step_change: "Bytte journey-stage",
  opportunity_created: "Ny opportunity",
  opportunity_stage_change: "Opportunity bytte stage",
  opportunity_won: "Opportunity vunnen",
  opportunity_lost: "Opportunity förlorad",
  activity_created: "Aktivitet skapad i CRM",
  appointment_scheduled: "Bokade möte",
  order_placed: "Order lagd",
  demo_booked: "Demo bokad",
  // Ads
  meta_ad_click: "Klickade Meta-annons",
  linkedin_ad_click: "Klickade LinkedIn-annons",
  google_ad_click: "Klickade Google-annons",
};

function ScoringWeightsTab() {
  // Sortera så starkaste signaler kommer först
  const rows = Object.entries(EVENT_WEIGHTS)
    .map(([type, w]) => ({
      type,
      label: EVENT_TYPE_LABELS[type] || type,
      weight: w.weight,
      intent: w.intent_weight,
      halflife: halflifeFor(type),
    }))
    .sort((a, b) => b.intent + b.weight - (a.intent + a.weight));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="section-prefix">/ SCORING-VIKTER (live)</span>
          </CardTitle>
          <CardDescription>
            Vikterna nedan används av scoring-motorn i realtid. Varje event har en engagement-vikt och en intent-vikt. Halveringstiden styr hur snabbt äldre events tonar bort.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="py-2 pr-4">Event-typ</th>
                  <th className="py-2 pr-4 text-right">Engagement</th>
                  <th className="py-2 pr-4 text-right">Intent</th>
                  <th className="py-2 pr-4 text-right">Halveringstid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((r) => {
                  const total = r.weight + r.intent;
                  const isNegative = total < 0;
                  return (
                    <tr key={r.type} className="hover:bg-surface-elevated/50">
                      <td className="py-2 pr-4">
                        <div className="font-medium text-text-primary">{r.label}</div>
                        <div className="text-[10px] font-mono text-text-muted">{r.type}</div>
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-4 text-right font-mono tabular-nums",
                          isNegative ? "text-danger" : "text-text-primary",
                        )}
                      >
                        {r.weight > 0 ? `+${r.weight}` : r.weight}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-4 text-right font-mono tabular-nums",
                          r.intent < 0 ? "text-danger" : r.intent > 0 ? "text-accent" : "text-text-muted",
                        )}
                      >
                        {r.intent > 0 ? `+${r.intent}` : r.intent}
                      </td>
                      <td className="py-2 pr-4 text-right text-xs text-text-secondary">
                        {r.halflife === Infinity ? "ingen" : `${r.halflife}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Förändring av vikter sker via <code className="rounded bg-surface-elevated px-1 py-0.5 font-mono">src/lib/event-weights.ts</code>. Halveringstider är: engagement {HALFLIFE_DAYS.engagement}d, intent {HALFLIFE_DAYS.intent}d, orders/demo aldrig.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- MAIN SETTINGS PANEL ---

const tabItems = [
  { value: "integrationer", label: "Integrationer" },
  { value: "scoring", label: "Scoring-vikter" },
];

export function SettingsPanel() {
  return (
    <Tabs.Root defaultValue="integrationer">
      <Tabs.List className="flex gap-1 border-b border-border pb-px">
        {tabItems.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors rounded-t-md cursor-pointer",
              "text-text-secondary hover:text-text-primary",
              "data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:-mb-px",
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="pt-6">
        <Tabs.Content value="integrationer">
          <IntegrationsTab />
        </Tabs.Content>

        <Tabs.Content value="scoring">
          <ScoringWeightsTab />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}
