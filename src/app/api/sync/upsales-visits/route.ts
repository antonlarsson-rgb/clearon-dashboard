// Sync Upsales /visits (clearon.se IP-identifierade företagsbesök) till
// vår events-tabell. Skapar accounts om de saknas, stitchar visitor till
// person via upsales_anon_id, och loggar varje besökt sida som ett event
// med rätt event-typ (kontakt/pris = high-intent).
//
// Schema: var 15:e min via Vercel Cron. Idempotent via external_id.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getVisits, type UpsalesVisit } from "@/lib/upsales";
import { resolveOrCreatePerson } from "@/lib/identity";
import { logEventsBatch, type LogEventInput } from "@/lib/events";
import { classifyVisitUrl } from "@/lib/event-weights";
import { isAuthorizedCron } from "@/lib/cron-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface AccountRow {
  id: string;
  upsales_id: number | null;
}

/**
 * Säkerställ att en Upsales-client → accounts-rad finns. Returnerar interna
 * UUID:t. Skapar raden om den saknas.
 */
async function ensureAccount(
  supabase: SupabaseClient,
  upsalesClient: { id: number; name: string; journeyStep?: string },
): Promise<string | null> {
  // 1. Finns redan?
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("upsales_id", upsalesClient.id)
    .maybeSingle<AccountRow>();
  if (existing?.id) return existing.id;

  // 2. Skapa
  const { data: created, error } = await supabase
    .from("accounts")
    .insert({
      upsales_id: upsalesClient.id,
      name: upsalesClient.name,
      lifecycle_stage: "prospect",
      segment: "cold",
      score: 0,
    })
    .select("id")
    .single();

  if (error) {
    // Race: kanske skapad samtidigt — slå upp igen
    if (error.code === "23505") {
      const { data } = await supabase
        .from("accounts")
        .select("id")
        .eq("upsales_id", upsalesClient.id)
        .maybeSingle<AccountRow>();
      return data?.id || null;
    }
    console.error("ensureAccount error:", error);
    return null;
  }
  return created?.id || null;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days")) || 1;
  const limit = Math.min(500, Number(url.searchParams.get("limit")) || 300);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const supabase = getServiceClient();
  const t0 = Date.now();

  const { data: visits } = await getVisits({ sinceDate: since, limit });

  let visitsProcessed = 0;
  let accountsTouched = 0;
  let personsStitched = 0;
  let eventsLogged = 0;
  const pendingEvents: LogEventInput[] = [];

  for (const v of visits as UpsalesVisit[]) {
    if (!v.client) continue;
    visitsProcessed++;

    const accountId = await ensureAccount(supabase, {
      id: v.client.id,
      name: v.client.name,
      journeyStep: v.client.journeyStep,
    });
    if (!accountId) continue;
    accountsTouched++;

    // Försök stitcha till identifierad person via Upsales contact_id eller anon_id
    let personId: string | null = null;
    if (v.contact?.id) {
      personId = await resolveOrCreatePerson(
        supabase,
        {
          upsales_contact_id: v.contact.id,
          email: v.contact.email || null,
        },
        {
          name: v.contact.name,
          account_id: accountId,
          source: "upsales_visit",
        },
      );
      if (personId) personsStitched++;
    } else if (v.anonymousId) {
      // Anonym besökare på företaget — koppla till account via anon_id
      personId = await resolveOrCreatePerson(
        supabase,
        { upsales_anon_id: v.anonymousId },
        { account_id: accountId, source: "upsales_visit_anon" },
      );
    }

    // Logga varje sidvisning som ett event
    for (const page of v.pages || []) {
      const { eventType, product_slug } = classifyVisitUrl(page.url || "");
      pendingEvents.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_visit",
        event_type: eventType,
        product_slug,
        occurred_at: page.startDate || v.startDate,
        external_id: `upsales-visit-${v.id}-${(page.url || "").slice(0, 80)}-${page.startDate || v.startDate}`,
        metadata: {
          url: page.url,
          page: page.page,
          duration_seconds: page.durationSeconds || 0,
          upsales_visit_id: v.id,
          referer: v.referer,
          is_first: v.isFirst === 1,
          journey_step: v.client.journeyStep,
        },
      });
    }

    // Markera återkomst om visit inte är första
    if (v.isFirst !== 1 && personId) {
      pendingEvents.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_visit",
        event_type: "upsales_visit_return",
        occurred_at: v.startDate,
        external_id: `upsales-visit-return-${v.id}`,
        metadata: { upsales_visit_id: v.id, referer: v.referer },
      });
    }

    // Flush i batchar om vi byggt upp mycket
    if (pendingEvents.length >= 200) {
      eventsLogged += await logEventsBatch(supabase, pendingEvents);
      pendingEvents.length = 0;
    }
  }

  if (pendingEvents.length > 0) {
    eventsLogged += await logEventsBatch(supabase, pendingEvents);
  }

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    since,
    visits_fetched: visits.length,
    visits_processed: visitsProcessed,
    accounts_touched: accountsTouched,
    persons_stitched: personsStitched,
    events_logged: eventsLogged,
  });
}

export const POST = GET;
