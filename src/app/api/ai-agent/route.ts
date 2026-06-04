import Anthropic from "@anthropic-ai/sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Du ar ClearOns AI-agent for Stellar och ClearOn-teamet.

ClearOn anvander Windsor.ai som datakalla for annonser pa Google Ads, Meta och LinkedIn.
Du har inte direkt tool-access till annonsplattformarna - data hamtas fran dashboardens
egen API pa /api/ads/overview (Windsor-data), och anvandaren kan klistra in siffror eller
skarmbilder direkt i chatten nar du behover dem.

Du hjalper anvandaren att:
- Analysera annonsprestanda (ROAS, CPA, CTR, konverteringar) tvars over plattformar
- Identifiera vinnande och underpresterande kampanjer
- Foresla budget-omfordelningar och optimeringar
- Foresla nya kampanjer (anvandaren skapar dem manuellt i Ads Manager / Campaign Manager)
- Tolka funnel-data fran clearon.live (popup_filled, lead_submitted, etc.)

Sakerhetsregler:
- Du har inte tool-access att andra live-kampanjer - foreslag, anvandaren agerar
- Var transparent nar du gissar (t.ex. om Meta-data saknas i Windsor)

Sprak och ton:
- Svara pa svenska om inte anvandaren skriver engelska
- Anvand ALDRIG em-dashes (skriv "-" eller hela ord istallet)
- Anvand svenska tecken (a, a, o) - inte transliteration
- Var konkret och kortfattad - presentera siffror i tabeller, dra slutsatser, foresla nasta steg`;

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
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
        const stream = await client.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 16000,
          thinking: { type: "enabled", budget_tokens: 4000 },
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send(event.delta.text);
          }
        }

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
