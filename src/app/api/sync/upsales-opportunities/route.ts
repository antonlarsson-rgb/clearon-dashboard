// Sync Upsales /orders (opportunities + ordrar). I Upsales är "order" det som
// kallas opportunity i andra CRM:er — och en vunnen order är en deal.
//
// Vi loggar:
//   opportunity_created — när en ny order skapas (stage öppen, värde > 0)
//   opportunity_stage_change — när modDate uppdaterats och status fortfarande öppen
//   opportunity_won — när probability=100 eller stage indikerar vunnen
//   opportunity_lost — när probability=0 eller stage indikerar förlorad
//   order_placed — när ordern är genomförd (har closeDate och status=vunnen)
//
// Idempotent via external_id baserat på (orderId + stage + modDate).

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getOpportunities, type UpsalesOpportunity } from "@/lib/upsales";
import { resolveOrCreatePerson } from "@/lib/identity";
import { logEventsBatch, type LogEventInput } from "@/lib/events";
import { isAuthorizedCron } from "@/lib/cron-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function ensureAccount(
  supabase: SupabaseClient,
  client: { id: number; name: string },
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("upsales_id", client.id)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("accounts")
    .insert({
      upsales_id: client.id,
      name: client.name,
      lifecycle_stage: "prospect",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data } = await supabase
        .from("accounts")
        .select("id")
        .eq("upsales_id", client.id)
        .maybeSingle();
      return data?.id || null;
    }
    return null;
  }
  return created?.id || null;
}

function classifyStage(opp: UpsalesOpportunity): {
  isWon: boolean;
  isLost: boolean;
  isOpen: boolean;
  probability: number | null;
} {
  const prob =
    typeof opp.probability === "number"
      ? opp.probability
      : typeof opp.probability1 === "number"
        ? opp.probability1
        : null;

  const stageName = (opp.stage?.name || "").toLowerCase();
  const isWon =
    prob === 100 || stageName.includes("won") || stageName.includes("vunnen") || stageName.includes("vann");
  const isLost =
    prob === 0 || stageName.includes("lost") || stageName.includes("förlorad") || stageName.includes("forlorad");

  return { isWon, isLost, isOpen: !isWon && !isLost, probability: prob };
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days")) || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getServiceClient();
  const t0 = Date.now();

  const { data: opps } = await getOpportunities({ sinceDate: since, limit: 300 });

  let oppsProcessed = 0;
  let accountsTouched = 0;
  const pending: LogEventInput[] = [];

  for (const opp of opps as UpsalesOpportunity[]) {
    if (!opp.client) continue;
    oppsProcessed++;

    const accountId = await ensureAccount(supabase, {
      id: opp.client.id,
      name: opp.client.name,
    });
    if (!accountId) continue;
    accountsTouched++;

    // Försök stitcha första kontakten
    let personId: string | null = null;
    if (opp.contacts?.[0]?.id) {
      personId = await resolveOrCreatePerson(
        supabase,
        { upsales_contact_id: opp.contacts[0].id },
        { name: opp.contacts[0].name, account_id: accountId, source: "upsales_opportunity" },
      );
    }

    const stage = classifyStage(opp);
    const value = opp.value || 0;
    const stageName = opp.stage?.name || "unknown";
    const baseMeta = {
      upsales_order_id: opp.id,
      value,
      stage_id: opp.stage?.id,
      stage_name: stageName,
      probability: stage.probability,
      close_date: opp.closeDate,
      description: opp.description,
      owner: opp.user?.name,
    };

    // Skapad-event (skapas alltid vid första syncen, idempotent via external_id)
    pending.push({
      person_id: personId,
      account_id: accountId,
      source: "upsales_opportunity",
      event_type: "opportunity_created",
      occurred_at: opp.regDate,
      external_id: `upsales-opp-created-${opp.id}`,
      metadata: baseMeta,
    });

    // Vinst / förlust
    if (stage.isWon && opp.closeDate) {
      pending.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_opportunity",
        event_type: "opportunity_won",
        occurred_at: opp.closeDate || opp.modDate,
        external_id: `upsales-opp-won-${opp.id}`,
        metadata: baseMeta,
      });
      // Markera också som order_placed för customer-detection
      pending.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_opportunity",
        event_type: "order_placed",
        product_slug: null,
        occurred_at: opp.closeDate || opp.modDate,
        external_id: `upsales-order-${opp.id}`,
        metadata: baseMeta,
      });
    } else if (stage.isLost) {
      pending.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_opportunity",
        event_type: "opportunity_lost",
        occurred_at: opp.closeDate || opp.modDate,
        external_id: `upsales-opp-lost-${opp.id}`,
        metadata: baseMeta,
      });
    } else if (stage.isOpen && opp.modDate > opp.regDate) {
      // Open opportunity som har uppdaterats efter skapande = stage change
      pending.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_opportunity",
        event_type: "opportunity_stage_change",
        occurred_at: opp.modDate,
        external_id: `upsales-opp-stage-${opp.id}-${opp.modDate.slice(0, 10)}`,
        metadata: baseMeta,
      });
    }
  }

  const eventsLogged = await logEventsBatch(supabase, pending);

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    since,
    opps_fetched: opps.length,
    opps_processed: oppsProcessed,
    accounts_touched: accountsTouched,
    events_logged: eventsLogged,
  });
}

export const POST = GET;
