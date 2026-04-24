// Claude-driven värdering av trafik. Läser beteende → returnerar STRUKTURERAD
// klassificering via tool-use (inte fritext). Sparas i accounts.ai_* / persons.ai_*.

import Anthropic from "@anthropic-ai/sdk";

const PRODUCTS_DESC = `ClearOns produkter:
- sales-promotion: kupongkampanjer för retail (leverantörer som Pågen, Unilever)
- customer-care: kundservice-automation
- interactive-engage: AI-driven kundinteraktion
- send-a-gift: personalbelöning, Sverigechecken, presentkort
- clearing-solutions: värdeavier, checkinlösen (typiskt kommuner, banker, stora företag)
- kuponger: mobila kupongkampanjer
- kampanja: kampanjhantering`;

export interface AiEvaluation {
  ai_score: number;
  ai_segment: "qualified" | "evaluating" | "browsing" | "noise";
  ai_buy_probability: number;
  ai_urgency: "high" | "medium" | "low";
  ai_best_fit_product: string;
  ai_reasoning: string;
  ai_next_action: string;
}

const EVAL_TOOL = {
  name: "evaluate_prospect",
  description:
    "Värdera en prospect/kund baserat på beteendedata och returnera strukturerad bedömning.",
  input_schema: {
    type: "object" as const,
    properties: {
      ai_score: {
        type: "number",
        description:
          "0-100. Hur värdefull prospect/kund är för ClearOn just nu. 0 = skräp (bots/felträff), 100 = läggs i demo-tid imorgon.",
      },
      ai_segment: {
        type: "string",
        enum: ["qualified", "evaluating", "browsing", "noise"],
        description:
          "qualified = redo för säljkontakt, evaluating = aktivt utvärderar men inte redo, browsing = ytligt intresse, noise = troligen bot/fel/oförståeligt.",
      },
      ai_buy_probability: {
        type: "number",
        description:
          "0.0-1.0. Sannolikhet att personen/företaget kommer köpa (eller återköpa om kund) inom 3 månader.",
      },
      ai_urgency: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Hur snabbt säljteamet bör agera.",
      },
      ai_best_fit_product: {
        type: "string",
        enum: [
          "sales-promotion",
          "customer-care",
          "interactive-engage",
          "send-a-gift",
          "clearing-solutions",
          "kuponger",
          "kampanja",
          "unknown",
        ],
        description:
          "Vilken ClearOn-produkt som passar bäst baserat på beteende + företagsprofil.",
      },
      ai_reasoning: {
        type: "string",
        description:
          "1-2 meningar på svenska. Konkret, datadrivet. Referera till specifika events/sidor/signaler.",
      },
      ai_next_action: {
        type: "string",
        description:
          "Konkret nästa steg för säljteamet på svenska. 1 mening.",
      },
    },
    required: [
      "ai_score",
      "ai_segment",
      "ai_buy_probability",
      "ai_urgency",
      "ai_best_fit_product",
      "ai_reasoning",
      "ai_next_action",
    ],
  },
};

const SYSTEM_PROMPT = `Du är en B2B sales intelligence-analytiker för ClearOn AB (svensk marknadsledare inom kuponghantering, presentkort, mobila kampanjer och värdeavier). Du utvärderar prospects/kunder baserat på deras faktiska beteende (web-besök, mail-events, ordrar) och returnerar en STRUKTURERAD bedömning via verktyget evaluate_prospect.

${PRODUCTS_DESC}

Riktlinjer:
- Var konservativ. Låga värden för folk med få events.
- "noise" om bara 1-2 events, ingen identifiering, ingen tydlig intent.
- "qualified" endast om: upprepade besök, kontakt-/pris-sida + produkt-sida, eller mail-klick + efterföljande besök.
- Kommuner/offentlig sektor + värdeavier = stark match för clearing-solutions.
- Retail/livsmedel/FMCG = sales-promotion, kuponger, kampanja.
- HR/stora arbetsgivare = send-a-gift.
- Befintlig kund (has_purchased=true) → värdera CROSS-SELL-potential (annan produkt än de köpt).
- Be specifik i reasoning — citera sidor eller events, inte generaliseringar.`;

interface EventSummary {
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

export interface AccountEvalInput {
  name: string;
  industry: string | null;
  website: string | null;
  score: number;
  lifecycle_stage: string;
  is_customer: boolean;
  has_purchased: boolean;
  total_events: number;
  identified_persons_count: number;
  product_scores: ProductScore[];
  recent_events: EventSummary[];
  top_pages: Array<{ url: string; visits: number; duration: number }>;
  vainu?: {
    employees?: number | null;
    revenue?: number | null;
    description?: string | null;
    city?: string | null;
  } | null;
}

export interface PersonEvalInput {
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  journey_step: string | null;
  score: number;
  lifecycle_stage: string;
  is_customer: boolean;
  has_purchased: boolean;
  total_events: number;
  product_scores: ProductScore[];
  recent_events: EventSummary[];
}

function summarizeEvents(events: EventSummary[]): string {
  return events
    .slice(0, 25)
    .map((e) => {
      const d = e.occurred_at.slice(0, 10);
      const md = e.metadata || {};
      let extra = "";
      if (md.url) extra = ` ${md.url}`;
      else if (md.subject) extra = ` "${String(md.subject).slice(0, 60)}"`;
      const p = e.product_slug ? `[${e.product_slug}]` : "";
      return `${d} ${e.event_type}${p ? ` ${p}` : ""}${extra}`;
    })
    .join("\n");
}

function summarizeProducts(scores: ProductScore[]): string {
  return scores
    .filter((s) => s.score > 0)
    .map((s) => `  ${s.product_slug}: score ${s.score}, intent ${s.intent_score}, ${s.event_count} events`)
    .join("\n");
}

async function callClaude(prompt: string): Promise<AiEvaluation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas");
  const anthropic = new Anthropic({ apiKey });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    tools: [EVAL_TOOL],
    tool_choice: { type: "tool", name: "evaluate_prospect" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = msg.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No tool_use returned");
  }
  return toolUse.input as unknown as AiEvaluation;
}

export async function evaluateAccount(ctx: AccountEvalInput): Promise<AiEvaluation> {
  const vainu = ctx.vainu
    ? `\nVainu-berikning:
  Anställda: ${ctx.vainu.employees || "?"}
  Omsättning: ${ctx.vainu.revenue ? Math.round(ctx.vainu.revenue / 1_000_000) + " MSEK" : "?"}
  Stad: ${ctx.vainu.city || "?"}
  Beskrivning: ${ctx.vainu.description ? ctx.vainu.description.slice(0, 200) : "?"}`
    : "";

  const pages =
    ctx.top_pages.length > 0
      ? `\n\nMest besökta sidor:\n${ctx.top_pages
          .slice(0, 6)
          .map((p) => `  ${p.visits}x (${Math.round(p.duration / 60)} min) ${p.url}`)
          .join("\n")}`
      : "";

  const prompt = `Företag: ${ctx.name}
Bransch: ${ctx.industry || "okänd"}
Website: ${ctx.website || "okänd"}${vainu}

Rule-baserat score: ${ctx.score}
Lifecycle: ${ctx.lifecycle_stage}
Befintlig kund: ${ctx.is_customer ? "JA" : "nej"}
Har köpt tidigare: ${ctx.has_purchased ? "JA" : "nej"}
Totalt events: ${ctx.total_events}
Identifierade personer: ${ctx.identified_persons_count}

Per-produkt scoring (beteende-baserat):
${summarizeProducts(ctx.product_scores) || "  (inga)"}${pages}

Senaste events:
${summarizeEvents(ctx.recent_events)}

Värdera detta företag som ClearOn-prospect/kund.`;

  return callClaude(prompt);
}

export async function evaluatePerson(ctx: PersonEvalInput): Promise<AiEvaluation> {
  const prompt = `Person: ${ctx.name}
Titel: ${ctx.title || "okänd"}
Email: ${ctx.email || "okänd"}
Företag: ${ctx.company || "okänd"}
Bransch: ${ctx.industry || "okänd"}
Journey-step i Upsales: ${ctx.journey_step || "okänd"}

Rule-baserat score: ${ctx.score}
Lifecycle: ${ctx.lifecycle_stage}
Befintlig kund: ${ctx.is_customer ? "JA" : "nej"}
Har köpt: ${ctx.has_purchased ? "JA" : "nej"}
Totalt events: ${ctx.total_events}

Per-produkt:
${summarizeProducts(ctx.product_scores) || "  (inga)"}

Senaste events:
${summarizeEvents(ctx.recent_events)}

Värdera denna person som ClearOn-prospect/kund.`;

  return callClaude(prompt);
}
