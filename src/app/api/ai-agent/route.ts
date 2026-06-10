import Anthropic from "@anthropic-ai/sdk";
import {
  AGENT_TOOLS,
  executeAgentTool,
  serializeToolResult,
} from "@/lib/ai-agent-tools";

export const maxDuration = 300;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_TOOL_ITERATIONS = 8;

const SYSTEM_PROMPT = `Du ar ClearOns AI-agent for Stellar och ClearOn-teamet, inbyggd i intelligence-dashboarden pa dashboard.clearon.live.

Du har verktyg som ger dig tillgang till ALL data i systemet:
- Annonser: kampanj- och annonsniva for Google/Meta/LinkedIn via Windsor.ai, for tva konton (clearon = ClearOn AB, mobila = Mobila Presentkort). Sokord och soktermer for Google. Namngivna konverteringar.
- Leads och personer: buying intent-rankade leads fran person-grafen (beteendedata fran clearon.live, mail, annonsklick, Upsales), person-sokning, lead-attribution (vilken plattform/kampanj varje lead kom fran).
- CRM: Upsales-kontakter med score och kategorier, senaste salj-aktiviteter, KPI:er och pipeline.
- Webb: landningssidornas trafik, leads och konverteringsgrad, kanalfloden.

Arbetssatt:
- Hamta data med verktygen innan du svarar pa datafragor - gissa aldrig siffror
- Valj ratt period: anvand lookback_days som matchar fragan (default 30 dagar)
- Kombinera kallor nar det ger battre svar (t.ex. spend fran annonser + leads fran attributionen = verklig kostnad per lead)
- Du har inte tool-access att ANDRA kampanjer eller skicka mail - foreslag, anvandaren agerar
- Var transparent om vad som ar data och vad som ar din bedomning

Kontext om verksamheten:
- ClearOn saljer kupong- och presentkortslosningar B2B (produkter: sales-promotion, customer-care, interactive-engage, kampanja, send-a-gift, clearing-solutions, kuponger)
- clearon.live ar lead-gen-landningssidor, clearon.se ar huvudsajten (Upsales IP-identifierar foretag dar)
- Mobila Presentkort ar ett separat varumarke (B2C, glass/presentkort) vars annonskonton ocksa foljs har

Sprak och ton:
- Svara pa svenska om inte anvandaren skriver engelska
- Anvand ALDRIG em-dashes (skriv "-" eller hela ord istallet)
- Anvand svenska tecken (a, a, o)
- Var konkret och kortfattad - presentera siffror i tabeller, dra slutsatser, foresla nasta steg`;

const TOOL_LABELS: Record<string, string> = {
  get_ads_overview: "Hämtar kampanjdata",
  get_live_ads: "Hämtar live-annonser",
  get_google_keywords: "Hämtar Google-sökord",
  get_lead_attribution: "Hämtar lead-attribution",
  get_top_leads: "Hämtar leads",
  search_person: "Söker person",
  get_crm_contacts: "Hämtar CRM-kontakter",
  get_web_analytics: "Hämtar webbtrafik",
  get_recent_activities: "Hämtar säljaktiviteter",
  get_kpis: "Hämtar KPI:er",
};

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const chatMessages = body.messages;
  if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
    return new Response("Messages required", { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!anthropicKey) {
    return sseError("ANTHROPIC_API_KEY saknas - lagg till i .env.local och Vercel-env.");
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (content: string) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
        );
      };
      const done = () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };

      try {
        let messages: Anthropic.MessageParam[] = chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const stream = client.messages.stream({
            model: "claude-opus-4-8",
            max_tokens: 16000,
            thinking: { type: "adaptive" },
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
              {
                type: "text",
                text: `Dagens datum: ${new Date().toISOString().slice(0, 10)}`,
              },
            ],
            tools: AGENT_TOOLS,
            messages,
          });

          stream.on("text", (delta) => send(delta));

          const message = await stream.finalMessage();

          if (message.stop_reason !== "tool_use") {
            done();
            return;
          }

          // Kor verktygen och loopa vidare
          messages = [...messages, { role: "assistant", content: message.content }];

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of message.content) {
            if (block.type !== "tool_use") continue;
            send(`\n\n*${TOOL_LABELS[block.name] || `Kör ${block.name}`}...*\n\n`);
            let result: unknown;
            try {
              result = await executeAgentTool(
                block.name,
                (block.input as Record<string, unknown>) || {},
              );
            } catch (e) {
              result = {
                error: e instanceof Error ? e.message : "Verktygsfel",
              };
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: serializeToolResult(result),
            });
          }

          messages = [...messages, { role: "user", content: toolResults }];
        }

        send("\n\n[Avbrot: for manga verktygsanrop i en och samma fraga. Stall en foljdfraga sa fortsatter jag.]");
        done();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Okant streamingfel";
        send(`\n\n[Fel: ${msg}]`);
        done();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function sseError(message: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: message })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
