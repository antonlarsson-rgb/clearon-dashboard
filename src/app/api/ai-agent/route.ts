import Anthropic from "@anthropic-ai/sdk";
import {
  getGooglePerformance,
  getMetaPerformance,
  getLinkedInPerformance,
  getNamedConversions,
  type AccountSet,
  type PlatformPerformance,
} from "@/lib/windsor";

export const maxDuration = 300;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `Du ar ClearOns AI-agent for Stellar och ClearOn-teamet.

Du far LIVE annonsdata (senaste 30 dagarna) injicerad i varje konversation - se
sektionen LIVE-DATA nedan. Datan kommer fran Windsor.ai som hamtar direkt fran
Google Ads, Meta och LinkedIn for tva konton: ClearOn och Mobila Presentkort.
Behover du annan period eller mer detalj (annonsniva, sokord) kan anvandaren
kolla fliken Kampanjer i dashboarden, eller klistra in siffror i chatten.

Du hjalper anvandaren att:
- Analysera annonsprestanda (spend, CPA, CTR, konverteringar) tvars over plattformar
- Identifiera vinnande och underpresterande kampanjer
- Foresla budget-omfordelningar och optimeringar
- Foresla nya kampanjer (anvandaren skapar dem manuellt i Ads Manager / Campaign Manager)
- Tolka funnel-data fran clearon.live (popup_filled, lead_submitted, etc.)

Sakerhetsregler:
- Du har inte tool-access att andra live-kampanjer - foreslag, anvandaren agerar
- Var transparent om vad som ar data och vad som ar din bedomning

Sprak och ton:
- Svara pa svenska om inte anvandaren skriver engelska
- Anvand ALDRIG em-dashes (skriv "-" eller hela ord istallet)
- Anvand svenska tecken (a, a, o) - inte transliteration
- Var konkret och kortfattad - presentera siffror i tabeller, dra slutsatser, foresla nasta steg`;

function fmtPlatform(p: PlatformPerformance): string {
  if (p.status !== "live") return `  ${p.platform}: ${p.status} (${p.reason || "ingen data"})`;
  const t = p.totals;
  const lines = [
    `  ${p.platform}: spend ${Math.round(t.spend)} ${p.currency}, ${t.impressions} visningar, ${t.clicks} klick, ${t.conversions.toFixed(1)} konv${t.cost_per_conversion ? `, ${Math.round(t.cost_per_conversion)} ${p.currency}/konv` : ""}`,
  ];
  for (const c of p.campaigns.slice(0, 10)) {
    lines.push(
      `    - "${c.name}" [${c.status || "okand status"}]: ${Math.round(c.spend)} ${p.currency}, ${c.clicks} klick, ${c.conversions.toFixed(1)} konv`,
    );
  }
  return lines.join("\n");
}

/**
 * Bygg kompakt live-kontext fran Windsor. Cachas av Windsor-lagrets
 * revalidate (30 min) sa detta ar billigt per request.
 */
async function buildLiveContext(): Promise<string> {
  const period = { lookback_days: 30 };
  try {
    const accounts: AccountSet[] = ["clearon", "mobila"];
    const results = await Promise.all(
      accounts.flatMap((acc) => [
        getGooglePerformance(period, 1800, acc),
        getMetaPerformance(period, 1800, acc),
        getLinkedInPerformance(period, 1800, acc),
      ]),
    );
    const named = await Promise.all(
      accounts.map((acc) => getNamedConversions(period, 1800, acc)),
    );

    const sections: string[] = ["LIVE-DATA (senaste 30 dagarna, via Windsor.ai):"];
    accounts.forEach((acc, i) => {
      sections.push(`\n${acc === "clearon" ? "ClearOn" : "Mobila Presentkort"}:`);
      sections.push(results.slice(i * 3, i * 3 + 3).map(fmtPlatform).join("\n"));
      const conv = named[i].slice(0, 8);
      if (conv.length > 0) {
        sections.push(
          `  Namngivna konverteringar: ${conv
            .map((n) => `${n.conversion_name} (${n.platform}): ${Math.round(n.value)}`)
            .join("; ")}`,
        );
      }
    });
    return sections.join("\n");
  } catch (e) {
    return `LIVE-DATA: kunde inte hamtas just nu (${e instanceof Error ? e.message : "okant fel"}). Be anvandaren klistra in siffror vid behov.`;
  }
}

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
  const liveContext = await buildLiveContext();

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
          model: "claude-opus-4-8",
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              // Statisk prompt cachas; live-datan ligger efter breakpointen
              // sa cachen overlever att siffrorna uppdateras
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: liveContext,
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
