// AI Agent Route Handler
// POST /api/ai-agent
//
// Future tool schemas for Claude API integration:
//
// const tools = [
//   {
//     name: "search_leads",
//     description: "Search leads by score, company, product interest, or activity",
//     input_schema: {
//       type: "object",
//       properties: {
//         min_score: { type: "number", description: "Minimum lead score" },
//         company: { type: "string", description: "Company name filter" },
//         product: { type: "string", description: "Product slug filter" },
//         sort_by: { type: "string", enum: ["score", "recent_activity", "name"] },
//         limit: { type: "number", description: "Max results" },
//       },
//     },
//   },
//   {
//     name: "get_org_chart",
//     description: "Get organizational chart for a given account/company",
//     input_schema: {
//       type: "object",
//       properties: {
//         account_name: { type: "string", description: "Company name" },
//       },
//       required: ["account_name"],
//     },
//   },
//   {
//     name: "draft_email",
//     description: "Draft an email to a lead or segment",
//     input_schema: {
//       type: "object",
//       properties: {
//         to: { type: "string", description: "Recipient description or segment" },
//         subject: { type: "string" },
//         tone: { type: "string", enum: ["formal", "casual", "follow-up"] },
//         context: { type: "string", description: "Additional context" },
//       },
//       required: ["to"],
//     },
//   },
//   {
//     name: "get_product_momentum",
//     description: "Get product performance and momentum data",
//     input_schema: {
//       type: "object",
//       properties: {
//         product_slug: { type: "string", description: "Optional specific product" },
//       },
//     },
//   },
//   {
//     name: "get_weekly_summary",
//     description: "Get Stellar weekly delivery summary",
//     input_schema: {
//       type: "object",
//       properties: {
//         week: { type: "number", description: "Week number" },
//       },
//     },
//   },
//   {
//     name: "create_audience",
//     description: "Create a Meta/LinkedIn ad audience from lead segments",
//     input_schema: {
//       type: "object",
//       properties: {
//         platform: { type: "string", enum: ["meta", "linkedin"] },
//         criteria: { type: "string", description: "Audience criteria description" },
//       },
//       required: ["platform", "criteria"],
//     },
//   },
// ];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const mockResponses: Record<string, string> = {
  leads_call:
    `Baserat pa dagens data rekommenderar jag att du ringer dessa leads idag:\n\n1. Maria Eriksson, Fazer (Score: 87)\n   Brand Manager. Laddade ner rapport idag, 3 sidbesok igar. Tydliga kopsignaler for Sales Promotion.\n\n2. Johan Lindstrom, Volvo Cars (Score: 74)\n   HR-chef. Ny lead via Google "personalbeloning". Intresserad av Send a Gift.\n\n3. Anna Svensson, Orkla (Score: 71)\n   Trade Marketing Manager. Klickade pa LinkedIn-annons for gamification igar.\n\n4. Per Nilsson, Lantmannen (Score: 68)\n   Marknadschef. Oppnade 3 mail denna vecka. Varm lead for Sales Promotion.\n\n5. Sara Bergstrom, Telia (Score: 65)\n   Besökte Customer Care-sidan idag. Agera medan intresset ar varmt.\n\nTips: Borja med Maria Eriksson. Hennes chef Anders Johansson (CMO) finns redan i CRM, sa du kan referera till det i samtalet.`,

  email_engage:
    `Har ar ett utkast till mail for kontakter som tittat pa Interactive Engage 3+ ganger:\n\n---\nAmne: Sa har okar ni forsaljningen med gamification\n\nHej [Fornamn],\n\nJag sag att ni har visat intresse for vara gamification-losningar. Foretag som Orkla anvander redan Interactive Engage for att driva +16% extra forsaljningsokning utover standardkampanjer.\n\nNagra highlights:\n- Spin-the-wheel, tavlingar och spel som ger kuponger\n- Fungerar i 5 000 butiker med 20 000 anslutna kassor\n- Setup pa under 2 veckor\n\nSkulle det passa med ett kort samtal nasta vecka? Jag visar garna hur det fungerar i praktiken.\n\nMvh,\nKaveh Sabeghi\nClearOn\n---\n\nSegmentet innehaller 6 kontakter. Ska jag skicka detta via Upsales-automation?`,

  org_chart_fazer:
    `Organisationskarta for Fazer:\n\nAnders Johansson (CMO)\n  |-- Maria Eriksson (Brand Manager) - Score: 87\n  |     |-- Sofia Holm (Digital Marketing Specialist) - Score: 33\n  |-- Erik Lind (Trade Marketing Manager) - Score: 42\n\nSammanfattning:\n- 4 kontakter i CRM\n- Anders Johansson ar beslutsfattare (CMO)\n- Maria Eriksson ar varmaste lead (Score 87)\n- Erik Lind kan vara inflytelserik for Trade Marketing-beslut\n\nRekommendation: Kontakta Maria forst, referera till att ni redan har dialog med teamet. Forbered en presentation som aven passar Anders som beslutsfattare.`,

  product_momentum:
    `Produktmomentum just nu:\n\n1. Sales Promotion - Hogst momentum\n   - 6 aktiva leads med score over 40\n   - Meta-kampanj "Kupongguiden" ROAS 6.2x\n   - Google Ads CPL 89 kr (under budget pa 120 kr)\n   - 34 leads genererade denna manad\n\n2. Send a Gift - Stigande\n   - 3 aktiva leads (Volvo Cars, Scandic Hotels m.fl.)\n   - HR-segment med 14 obesvarade besokare\n   - Google Ads-kampanj under uppbyggnad\n\n3. Interactive Engage - Stabil\n   - LinkedIn-kampanj gar bra (890 klick)\n   - Orkla visar starkt intresse\n\n4. Customer Care - Avvaktande\n   - LinkedIn-kampanj pausad (budget slut)\n   - Telia ar aktiv lead\n\n5. Kampanja - Ny lansering\n   - Landningssida just live\n   - Meta-kampanj startad, 6 leads hittills\n\nRekommendation: Dubbla ner pa Sales Promotion. Oka Meta-budgeten med 40% baserat pa stark ROAS.`,

  stellar_summary:
    `Stellar-sammanfattning vecka 16:\n\nSlutfort (8 uppgifter):\n- Landningssida Kampanja live pa clearon.live/kampanja\n- Meta A/B-test klart, variant B vann (+34% CTR)\n- SEO-audit levererad med 47 atgardspunkter\n- 3 bloggartiklar om kupongkampanjer publicerade\n- 4 ytterligare tasks slutforda\n\nPagar (3 uppgifter):\n- Google Ads-kampanj for Send a Gift (lanseras mandag)\n- Design Interactive Engage-sidan\n- Konverteringsoptimering clearon.live (hog prioritet)\n\nKommande:\n- LinkedIn-kampanj Q2\n- Uppdatera ClearOn Event-sida\n- Email-automation setup i Upsales`,

  meta_audience:
    `Jag har forberett en Meta-malgrupp baserad pa era hetaste leads:\n\nMalgrupp: "ClearOn Hot Leads Lookalike"\n\nKalldata (12 kontakter med score over 50):\n- Bransch: FMCG (65%), Dagligvaruhandel (20%), Ovriga (15%)\n- Roller: Brand Manager, Trade Marketing, Marknadschef\n- Foretag: 500+ anstallda\n- Intresse: Sales Promotion (45%), Interactive Engage (25%), Send a Gift (20%)\n\nRekommenderad kampanjsetup:\n- Lookalike 1% (Sverige)\n- Budskap: Case study + demo-CTA\n- Budget: 15 000 kr/manad\n- Forvantat resultat: 20-30 nya leads/manad\n\nOBS: Detta ar en forhandsvisning. For att skapa malgruppen i Meta Ads behover du exportera listan fran Upsales och ladda upp som Custom Audience.`,
};

function getMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("ringa") || lower.includes("leads idag")) {
    return mockResponses.leads_call;
  }
  if (lower.includes("mail") && lower.includes("engage")) {
    return mockResponses.email_engage;
  }
  if (lower.includes("organisationskarta") || lower.includes("org") && lower.includes("fazer")) {
    return mockResponses.org_chart_fazer;
  }
  if (lower.includes("momentum") || lower.includes("produkt")) {
    return mockResponses.product_momentum;
  }
  if (lower.includes("stellar") || lower.includes("levererat") || lower.includes("vecka")) {
    return mockResponses.stellar_summary;
  }
  if (lower.includes("meta") || lower.includes("malgrupp") || lower.includes("audience")) {
    return mockResponses.meta_audience;
  }

  return `Jag analyserade din fraga: "${userMessage}"\n\nJust nu kor jag med mockdata, men nar jag ar fullt ansluten till Upsales, ClickUp och era annonskonton kan jag ge dig realtidsdata och utfora atgarder direkt.\n\nProva nagon av dessa fragor:\n- "Vilka leads ska jag ringa idag?"\n- "Vilken produkt har mest momentum just nu?"\n- "Sammanfatta vad Stellar levererat denna vecka"`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const messages: ChatMessage[] = body.messages;

  if (!messages || messages.length === 0) {
    return new Response("Messages required", { status: 400 });
  }

  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  if (!lastUserMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const responseText = getMockResponse(lastUserMessage.content);

  // Simulate SSE streaming by sending chunks
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = responseText.split(" ");
      let buffer = "";

      for (let i = 0; i < words.length; i++) {
        buffer += (i === 0 ? "" : " ") + words[i];

        // Send every 2-4 words for realistic chunking
        if (buffer.length > 15 || i === words.length - 1) {
          const data = JSON.stringify({ content: buffer });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          buffer = "";
          // Simulate typing delay
          await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 30));
        }
      }

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
