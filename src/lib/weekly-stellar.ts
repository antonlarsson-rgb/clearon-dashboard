// Veckosammanfattning från Stellar till ClearOn. Tar in:
//   - ClickUp closed tasks senaste 7 dagarna
//   - Nya leads / form-submits senaste 7d (från events-tabellen)
//   - Opportunities som rört sig senaste 7d
//   - Trafik-/event-delta senaste veckan
// → låter Claude skriva en kort svensk sammanfattning. Sparas i
// weekly_stellar_updates med ISO-vecka som key.

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `Du är Stellars veckorapporterare till ClearOn. En produktägare hos ClearOn öppnar dashboarden måndag morgon och vill veta: vad gjorde Stellar förra veckan, och vad rörde sig i datan?

Skriv en kort sammanfattning på svenska. Max 5-7 meningar. Inga utropstecken, inga emojis, ingen säljjargong. Vara saklig.

Struktur:
- 1 mening: vad Stellar levererat (ClickUp closed tasks). Lyft fram konkreta uppgifter.
- 1-2 meningar: vad som hände i pipelinen (nya leads, opportunity-rörelser).
- 1-2 meningar: webb- och kampanjsignaler om de är värda att nämna.
- 1 mening: vad som kommer härnäst (pågående ClickUp-tasks).

Inkludera bara fakta från datan nedan. Om något saknas, hoppa över det.`;

interface ClickupTask {
  id: string;
  name: string;
  status: string;
  date_closed?: number | string | null;
  list?: { name?: string } | null;
}

export interface WeeklyStellarResult {
  brief: string;
  generated_at: string;
  week_start: string;
  context_summary: {
    closed_tasks: number;
    in_progress_tasks: number;
    new_leads: number;
    new_opps: number;
    won_opps: number;
    total_event_count: number;
  };
}

async function fetchClickUpTasks(): Promise<{ closed: ClickupTask[]; inProgress: ClickupTask[] }> {
  const apiKey = process.env.CLICKUP_API_KEY?.trim();
  const teamId = process.env.CLICKUP_TEAM_ID?.trim();
  if (!apiKey || !teamId) return { closed: [], inProgress: [] };

  const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  try {
    const [closedRes, openRes] = await Promise.all([
      fetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?include_closed=true&subtasks=false&order_by=updated&reverse=true&date_updated_gt=${sinceMs}`,
        { headers: { Authorization: apiKey }, cache: "no-store" },
      ),
      fetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?include_closed=false&subtasks=false&order_by=updated&reverse=true`,
        { headers: { Authorization: apiKey }, cache: "no-store" },
      ),
    ]);

    const closedJson = closedRes.ok ? await closedRes.json() : { tasks: [] };
    const openJson = openRes.ok ? await openRes.json() : { tasks: [] };

    const closedTasks = (closedJson.tasks || []).filter((t: ClickupTask) => {
      const status = (t.status as unknown as { status?: string })?.status?.toLowerCase() || "";
      return (
        status.includes("done") || status.includes("complete") || status.includes("closed")
      );
    });

    const inProgressTasks = (openJson.tasks || []).filter((t: ClickupTask) => {
      const status = (t.status as unknown as { status?: string })?.status?.toLowerCase() || "";
      return status.includes("progress") || status.includes("doing");
    });

    return {
      closed: closedTasks.slice(0, 15),
      inProgress: inProgressTasks.slice(0, 10),
    };
  } catch (e) {
    console.error("clickup fetch error:", e);
    return { closed: [], inProgress: [] };
  }
}

function weekStart(date: Date): string {
  // Måndag som veckostart (ISO 8601)
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function generateWeeklyStellar(
  supabase: SupabaseClient,
): Promise<WeeklyStellarResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [tasks, newLeadEvents, oppEvents, eventCountRes] = await Promise.all([
    fetchClickUpTasks(),
    supabase
      .from("events")
      .select("metadata, occurred_at, account:accounts(name)")
      .in("event_type", ["lead_submitted", "form_submit"])
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("events")
      .select("event_type, metadata, occurred_at, account:accounts(name)")
      .in("event_type", [
        "opportunity_created",
        "opportunity_stage_change",
        "opportunity_won",
        "opportunity_lost",
      ])
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("occurred_at", since),
  ]);

  const newLeads = newLeadEvents.data || [];
  const oppMovements = oppEvents.data || [];
  const wonOpps = oppMovements.filter((e) => e.event_type === "opportunity_won");
  const newOpps = oppMovements.filter((e) => e.event_type === "opportunity_created");
  const totalEvents = eventCountRes.count || 0;

  // Bygg input till Claude
  const lines: string[] = [];
  lines.push(`Vecka: ${weekStart(new Date())} och 7 dagar bakåt`);
  lines.push("");

  if (tasks.closed.length > 0) {
    lines.push(`STELLAR CLOSED ${tasks.closed.length} CLICKUP-TASKS:`);
    for (const t of tasks.closed) {
      const list = (t.list as { name?: string })?.name || "?";
      lines.push(`  - ${t.name} [${list}]`);
    }
    lines.push("");
  }

  if (tasks.inProgress.length > 0) {
    lines.push(`PÅGÅENDE TASKS (${tasks.inProgress.length}):`);
    for (const t of tasks.inProgress.slice(0, 6)) {
      const list = (t.list as { name?: string })?.name || "?";
      lines.push(`  - ${t.name} [${list}]`);
    }
    lines.push("");
  }

  if (newLeads.length > 0) {
    lines.push(`NYA LEADS (${newLeads.length}):`);
    for (const e of newLeads.slice(0, 8)) {
      const acc = Array.isArray(e.account) ? e.account[0] : e.account;
      const md = (e.metadata as { role?: string; company?: string }) || {};
      lines.push(
        `  - ${acc?.name || md.company || "okänt"}${md.role ? ` (${md.role})` : ""}`,
      );
    }
    lines.push("");
  }

  if (newOpps.length > 0 || wonOpps.length > 0) {
    lines.push(`OPPORTUNITY-RÖRELSER:`);
    for (const e of oppMovements.slice(0, 10)) {
      const acc = Array.isArray(e.account) ? e.account[0] : e.account;
      const md = (e.metadata as { value?: number; stage_name?: string }) || {};
      const type = e.event_type.replace("opportunity_", "");
      lines.push(
        `  - ${acc?.name || "okänt"}: ${type}${md.stage_name ? ` → ${md.stage_name}` : ""}${md.value ? ` (${md.value} kr)` : ""}`,
      );
    }
    lines.push("");
  }

  lines.push(`TOTALT EVENTS I PERSON-GRAFEN SENASTE 7D: ${totalEvents}`);

  const dataDump = lines.join("\n");

  // Om vi inte har någon data alls — returnera en ärlig placeholder utan Claude
  if (
    tasks.closed.length === 0 &&
    tasks.inProgress.length === 0 &&
    newLeads.length === 0 &&
    oppMovements.length === 0 &&
    totalEvents === 0
  ) {
    return {
      brief:
        "Ingen rörelse senaste 7 dagarna. Inga slutförda ClickUp-tasks, inga nya leads, inga opportunity-rörelser. Värt att kontrollera att tracking och syncs körs som de ska.",
      generated_at: new Date().toISOString(),
      week_start: weekStart(new Date()),
      context_summary: {
        closed_tasks: 0,
        in_progress_tasks: 0,
        new_leads: 0,
        new_opps: 0,
        won_opps: 0,
        total_event_count: 0,
      },
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Här är veckans data:\n\n${dataDump}` }],
  });

  const text = msg.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { text: string }).text)
    .join("\n")
    .trim();

  return {
    brief: text,
    generated_at: new Date().toISOString(),
    week_start: weekStart(new Date()),
    context_summary: {
      closed_tasks: tasks.closed.length,
      in_progress_tasks: tasks.inProgress.length,
      new_leads: newLeads.length,
      new_opps: newOpps.length,
      won_opps: wonOpps.length,
      total_event_count: totalEvents,
    },
  };
}

export async function getCachedWeeklyStellar(
  supabase: SupabaseClient,
): Promise<WeeklyStellarResult | null> {
  const wkStart = weekStart(new Date());
  const { data } = await supabase
    .from("weekly_stellar_updates")
    .select("brief, generated_at, week_start, context_summary")
    .eq("week_start", wkStart)
    .maybeSingle();
  if (!data) return null;
  return {
    brief: data.brief,
    generated_at: data.generated_at,
    week_start: data.week_start,
    context_summary: data.context_summary || {
      closed_tasks: 0,
      in_progress_tasks: 0,
      new_leads: 0,
      new_opps: 0,
      won_opps: 0,
      total_event_count: 0,
    },
  };
}

export async function saveWeeklyStellar(
  supabase: SupabaseClient,
  result: WeeklyStellarResult,
): Promise<void> {
  await supabase.from("weekly_stellar_updates").upsert(
    {
      week_start: result.week_start,
      brief: result.brief,
      generated_at: result.generated_at,
      context_summary: result.context_summary,
    },
    { onConflict: "week_start" },
  );
}
