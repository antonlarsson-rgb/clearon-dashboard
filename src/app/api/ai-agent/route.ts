import Anthropic from "@anthropic-ai/sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Du ar ClearOns AI-agent for Stellar och ClearOn-teamet.

Du har tillgang till Adspirer MCP-servern som ger dig live-data och kontroll over annonser pa Meta, Google Ads, LinkedIn (och TikTok).

Du hjalper anvandaren att:
- Analysera annonsprestanda (ROAS, CPA, CTR, konverteringar) tvars over plattformar
- Identifiera vinnande och underpresterande kampanjer
- Foresla budget-omfordelningar och optimeringar
- Pausa underpresterande kampanjer (alltid efter explicit bekraftelse)
- Skapa nya kampanjer (alltid i PAUSED status forst)
- Hamta keyword-research, malgrupps-insikter och creative-data

Sakerhetsregler (icke-forhandlingsbart):
- Bekrafta ALLTID med anvandaren innan du skapar kampanjer eller andrar live-budgetar
- Skapa nya kampanjer i PAUSED status om inte anvandaren explicit godkant aktivering
- Aldrig auto-retry vid fel pa kampanjskapande - visa felet for anvandaren och stanna
- Aldrig modifiera live-budgetar utan explicit godkannande

Forsta steget i varje arbetsfloede ar att kalla get_connections_status for att se vilka plattformar som ar kopplade. Om en plattform inte ar kopplad, hanvisa anvandaren till https://adspirer.ai/connections.

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
  const adspirerToken = process.env.ADSPIRER_TOKEN?.trim();

  if (!anthropicKey) {
    return sseError("ANTHROPIC_API_KEY saknas - lagg till i .env.local och Vercel-env.");
  }
  if (!adspirerToken) {
    return sseError(
      "ADSPIRER_TOKEN saknas - hamta pa https://adspirer.ai/account och lagg till i .env.local och Vercel-env.",
    );
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
        const stream = await client.beta.messages.create({
          model: "claude-opus-4-7",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          mcp_servers: [
            {
              type: "url",
              name: "adspirer",
              url: "https://mcp.adspirer.com/mcp",
              authorization_token: adspirerToken,
            },
          ],
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
          betas: ["mcp-client-2025-04-04"],
        });

        let toolUseAnnounced = false;

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send(event.delta.text);
            toolUseAnnounced = false;
          } else if (
            event.type === "content_block_start" &&
            event.content_block.type === "mcp_tool_use"
          ) {
            const toolName = event.content_block.name;
            if (!toolUseAnnounced) {
              send(`\n\n_Hamtar live-data via ${toolName}..._\n\n`);
              toolUseAnnounced = true;
            }
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
