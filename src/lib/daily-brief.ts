// Genererar morgonbriefen för dashboarden. Tar dagens hetaste signaler
// (top buying-intent + nya opportunities + qualified från AI) och låter
// Claude skriva 4-6 raders svenska som faktiskt är användbar för säljaren.
//
// Cachas i daily_briefs-tabellen, en rad per datum.

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getTopBuyingIntent,
  getTopAccountBuyingIntent,
} from "@/lib/buying-intent";

const SYSTEM_PROMPT = `Du är ClearOns morgon-briefer. En säljare öppnar dashboarden kl 08:00 och vill veta på 5 sekunder: VEM ska jag prata med idag och VARFÖR.

Skriv en kort, konkret morgonbriefing på svenska. Max 5-6 meningar. Inga punktlistor, inga rubriker, ingen säljcoaching. Bara fakta:
- Vad ändrades senaste 24h
- Vem är topp-prioritet idag (namn + företag + 1 mening varför)
- Eventuella öppna opportunities som rört på sig
- En sak att fokusera på i veckan

Var saklig, datadriven, lugn. Inga utropstecken. Inga emojis.`;

export interface DailyBriefResult {
  brief: string;
  generated_at: string;
  context_summary: {
    top_person: string | null;
    top_account: string | null;
    qualified_count: number;
    rising_count: number;
    new_opps_24h: number;
  };
}

export async function generateDailyBrief(
  supabase: SupabaseClient,
): Promise<DailyBriefResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas");

  // Hämta dagens signaler parallellt
  const [topPersons, topAccounts, newOppsData, qualifiedData] = await Promise.all([
    getTopBuyingIntent(supabase, { limit: 8, lookbackDays: 7 }),
    getTopAccountBuyingIntent(supabase, { limit: 6, lookbackDays: 7 }),
    supabase
      .from("events")
      .select("metadata, account:accounts(name), occurred_at")
      .in("event_type", ["opportunity_created", "opportunity_stage_change"])
      .gte("occurred_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(10),
    supabase
      .from("accounts")
      .select("name, ai_buy_probability, ai_urgency, ai_reasoning, ai_best_fit_product")
      .eq("ai_segment", "qualified")
      .gte(
        "ai_evaluated_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("ai_score", { ascending: false })
      .limit(5),
  ]);

  const newOpps = newOppsData.data || [];
  const qualified = qualifiedData.data || [];

  const topPerson = topPersons[0];
  const topAccount = topAccounts[0];

  // Bygg en strukturerad input till Claude
  const lines: string[] = [];
  lines.push(`Datum: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  if (topPersons.length > 0) {
    lines.push("TOPP-PERSONER MED HÖG KÖPSIGNAL JUST NU:");
    topPersons.slice(0, 5).forEach((p, i) => {
      const reason = p.intent.reasons[0] || "aktiv";
      lines.push(
        `  ${i + 1}. ${p.name || "Okänd"} (${p.company || "okänt företag"}, ${p.title || "okänd titel"}) — intent ${p.intent.intent_score}/100 — ${reason}`,
      );
    });
    lines.push("");
  }

  if (topAccounts.length > 0) {
    lines.push("TOPP-FÖRETAG MED HÖG AKTIVITET:");
    topAccounts.slice(0, 4).forEach((a, i) => {
      const reason = a.intent.reasons[0] || "aktiv";
      lines.push(
        `  ${i + 1}. ${a.name} — intent ${a.intent.intent_score}/100 — ${a.intent.recent_event_count} events 48h — ${reason}`,
      );
    });
    lines.push("");
  }

  if (newOpps.length > 0) {
    lines.push("NYA / FÖRFLYTTADE OPPORTUNITIES SENASTE 24H:");
    newOpps.slice(0, 5).forEach((o) => {
      const acc = Array.isArray(o.account) ? o.account[0] : o.account;
      const md = (o.metadata as { value?: number; stage_name?: string }) || {};
      lines.push(
        `  ${acc?.name || "okänd"}: ${md.stage_name || "stage?"} (${md.value || 0} kr)`,
      );
    });
    lines.push("");
  }

  if (qualified.length > 0) {
    lines.push("CLAUDE BEDÖMDE SOM 'QUALIFIED' SENASTE 24H:");
    qualified.forEach((q) => {
      lines.push(
        `  ${q.name} — ${Math.round(((q.ai_buy_probability as number) || 0) * 100)}% köp-sannolikhet — ${q.ai_reasoning || ""}`,
      );
    });
  }

  const dataDump = lines.join("\n");
  if (dataDump.split("\n").length < 5) {
    return {
      brief:
        "Ingen särskild rörelse senaste 24h. Använd dagen till att följa upp äldre prospects eller bygga pipeline.",
      generated_at: new Date().toISOString(),
      context_summary: {
        top_person: null,
        top_account: null,
        qualified_count: 0,
        rising_count: 0,
        new_opps_24h: 0,
      },
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Här är dagens data:\n\n${dataDump}` }],
  });

  const text = msg.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { text: string }).text)
    .join("\n")
    .trim();

  return {
    brief: text,
    generated_at: new Date().toISOString(),
    context_summary: {
      top_person: topPerson
        ? `${topPerson.name} (${topPerson.company})`
        : null,
      top_account: topAccount?.name || null,
      qualified_count: qualified.length,
      rising_count: topPersons.filter((p) => p.intent.trend === "rising").length,
      new_opps_24h: newOpps.length,
    },
  };
}

export async function getCachedDailyBrief(
  supabase: SupabaseClient,
): Promise<DailyBriefResult | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_briefs")
    .select("brief, generated_at, context_summary")
    .eq("date", today)
    .maybeSingle();

  if (!data) return null;
  return {
    brief: data.brief,
    generated_at: data.generated_at,
    context_summary: data.context_summary || {
      top_person: null,
      top_account: null,
      qualified_count: 0,
      rising_count: 0,
      new_opps_24h: 0,
    },
  };
}

export async function saveDailyBrief(
  supabase: SupabaseClient,
  result: DailyBriefResult,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("daily_briefs").upsert(
    {
      date: today,
      brief: result.brief,
      generated_at: result.generated_at,
      context_summary: result.context_summary,
    },
    { onConflict: "date" },
  );
}
