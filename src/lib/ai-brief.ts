// AI-brief generator med Claude Sonnet 4.6.
// Tar person/account-data + events-timeline + ev. Vainu-info → kvalitativ analys
// + rekommendation. Ej streaming, körs on-demand per account/person.

import Anthropic from "@anthropic-ai/sdk";

const PRODUCTS: Record<string, string> = {
  "sales-promotion": "Sales Promotion (kampanjbaserade kupongkampanjer för retail)",
  "customer-care": "Customer Care (kundtjänst-digitalisering)",
  "interactive-engage": "Interactive Engage (AI-driven kundinteraktion)",
  kampanja: "Kampanja (kampanjhantering)",
  "send-a-gift": "Send a Gift / Sverigechecken (presentkort för personal)",
  "clearing-solutions": "Clearing Solutions (värdeavier, checkinlösen)",
  kuponger: "Kuponger (mobila kupongkampanjer)",
  "mobila-presentkort": "Mobila Presentkort",
};

interface EventForBrief {
  source: string;
  event_type: string;
  product_slug: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

interface ProductScore {
  product_slug: string;
  score: number;
  intent_score: number;
  event_count: number;
}

export interface AccountBriefContext {
  name: string;
  industry: string | null;
  website: string | null;
  score: number;
  demo_readiness: number;
  segment: string;
  lifecycle_stage: string;
  is_customer: boolean;
  total_events: number;
  identified_persons_count: number;
  top_product_slug: string | null;
  vainu?: {
    employees?: number | null;
    revenue?: number | null;
    description?: string | null;
    city?: string | null;
  } | null;
  product_scores: ProductScore[];
  recent_events: EventForBrief[];
  top_pages: Array<{ url: string; visits: number; duration: number }>;
}

export interface PersonBriefContext {
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  journey_step: string | null;
  score: number;
  demo_readiness: number;
  segment: string;
  lifecycle_stage: string;
  is_customer: boolean;
  total_events: number;
  product_scores: ProductScore[];
  recent_events: EventForBrief[];
}

function summarizeEvents(events: EventForBrief[]): string {
  return events
    .slice(0, 30)
    .map((e) => {
      const date = e.occurred_at.slice(0, 10);
      const md = e.metadata || {};
      let extra = "";
      if (md.url) extra = ` — ${md.url}`;
      else if (md.subject) extra = ` — "${String(md.subject).slice(0, 60)}"`;
      const product = e.product_slug ? ` [${e.product_slug}]` : "";
      return `  ${date} | ${e.source} | ${e.event_type}${product}${extra}`;
    })
    .join("\n");
}

function summarizeProducts(scores: ProductScore[]): string {
  return scores
    .filter((s) => s.score > 0)
    .map((s) => `  - ${PRODUCTS[s.product_slug] || s.product_slug}: score ${s.score}, intent ${s.intent_score}, ${s.event_count} events`)
    .join("\n");
}

const SYSTEM_PROMPT = `Du är en säljanalytiker för ClearOn AB — Sveriges ledande företag inom kuponghantering, presentkort, mobila kampanjer och värdeavier. Du analyserar ett konkret prospect eller en befintlig kund baserat på deras beteende, för att hjälpa ClearOns säljteam fatta nästa steg.

ClearOns produkter:
- Sales Promotion: kupongkampanjer för retail (leverantörer som Pågen, Unilever m.fl.)
- Customer Care: kundservice-automation
- Interactive Engage: AI-driven kundinteraktion
- Send a Gift / Sverigechecken: personalbelöning, presentkort
- Clearing Solutions: värdeavier, checkar (kommuner och stora företag)
- Kuponger: mobila kupongkampanjer

Skriv på svenska, koncist, som en briefing till en säljare. Format:

**Bedömning**: 1-2 meningar om var de befinner sig i köpresan
**Vad de signalerar**: 3-4 punkter om konkreta mönster i datan
**Bästa produkten att pitcha**: 1 produkt + kort motivation (1 mening)
**Rekommenderad next action**: 1 konkret sak som säljaren bör göra nu (inom vilken tidsram)
**Öppningsfråga**: 1 specifik fråga säljaren kan börja samtalet med som refererar till beteendet

Var saklig och datadriven — ingen säljcoach-fluff. Om datan är tunn, säg det.`;

export async function generateAccountBrief(ctx: AccountBriefContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas");

  const anthropic = new Anthropic({ apiKey });

  const vainu = ctx.vainu
    ? `\nVainu-berikning:\n${[
        ctx.vainu.employees && `  Anställda: ${ctx.vainu.employees}`,
        ctx.vainu.revenue && `  Omsättning: ${Math.round(ctx.vainu.revenue / 1_000_000)} MSEK`,
        ctx.vainu.city && `  Stad: ${ctx.vainu.city}`,
        ctx.vainu.description && `  Beskrivning: ${ctx.vainu.description.slice(0, 240)}`,
      ]
        .filter(Boolean)
        .join("\n")}`
    : "";

  const pages =
    ctx.top_pages.length > 0
      ? `\n\nMest besökta sidor:\n${ctx.top_pages
          .slice(0, 8)
          .map((p) => `  ${p.visits}x (${Math.round(p.duration / 60)} min) ${p.url}`)
          .join("\n")}`
      : "";

  const prompt = `Företag: ${ctx.name}
Bransch: ${ctx.industry || "okänd"}
Website: ${ctx.website || "okänd"}${vainu}

Score: ${ctx.score} (${ctx.segment})
Demo-readiness: ${ctx.demo_readiness}%
Lifecycle: ${ctx.lifecycle_stage} | Kund: ${ctx.is_customer ? "JA" : "nej"}
Totalt antal events: ${ctx.total_events}
Identifierade personer: ${ctx.identified_persons_count}

Per-produkt scoring (baserat på beteende):
${summarizeProducts(ctx.product_scores) || "  (inga produktspecifika signaler än)"}${pages}

Senaste events:
${summarizeEvents(ctx.recent_events)}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { text: string }).text)
    .join("\n");
  return text;
}

export async function generatePersonBrief(ctx: PersonBriefContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas");

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Person: ${ctx.name}
Titel: ${ctx.title || "okänd"}
Email: ${ctx.email || "okänd"}
Företag: ${ctx.company || "okänd"}
Bransch: ${ctx.industry || "okänd"}
Journey-step i Upsales: ${ctx.journey_step || "okänd"}

Score: ${ctx.score} (${ctx.segment})
Demo-readiness: ${ctx.demo_readiness}%
Lifecycle: ${ctx.lifecycle_stage} | Kund: ${ctx.is_customer ? "JA" : "nej"}
Totalt antal events: ${ctx.total_events}

Per-produkt scoring:
${summarizeProducts(ctx.product_scores) || "  (inga produktspecifika signaler än)"}

Senaste events (mail, web, form, etc):
${summarizeEvents(ctx.recent_events)}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { text: string }).text)
    .join("\n");
  return text;
}
