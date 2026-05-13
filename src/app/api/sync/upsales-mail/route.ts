// Sync Upsales mail-events (open/click) till events-tabellen.
// Stitchar mottagare via upsales_contact_id → person.
//
// Schema: varje timme. Idempotent via external_id = upsales-mailEvent-<id>.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getMailEvents, type UpsalesMailEvent } from "@/lib/upsales";
import { resolveOrCreatePerson } from "@/lib/identity";
import { logEventsBatch, type LogEventInput } from "@/lib/events";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { productFromUrl } from "@/lib/event-weights";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function classifyMailEvent(type: string): string | null {
  const t = type.toLowerCase();
  if (t.includes("open")) return "mail_open";
  if (t.includes("click")) return "mail_click";
  if (t.includes("bounce")) return "mail_bounce";
  if (t.includes("unsub")) return "mail_unsubscribe";
  return null;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days")) || 2;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getServiceClient();
  const t0 = Date.now();

  const events = await getMailEvents({ sinceDate: since, limit: 1000 });

  let stitched = 0;
  const pending: LogEventInput[] = [];

  for (const ev of events as UpsalesMailEvent[]) {
    const eventType = classifyMailEvent(ev.type);
    if (!eventType) continue;
    if (!ev.contact?.id && !ev.contact?.email) continue;

    const personId = await resolveOrCreatePerson(
      supabase,
      {
        upsales_contact_id: ev.contact.id || null,
        email: ev.contact.email || null,
      },
      { name: ev.contact.name, source: "upsales_mail" },
    );
    if (!personId) continue;
    stitched++;

    // För klick: mappa URL till produkt om möjligt
    const productSlug =
      eventType === "mail_click" && ev.url ? productFromUrl(ev.url) : null;

    pending.push({
      person_id: personId,
      source: "upsales_mail",
      event_type: eventType,
      product_slug: productSlug,
      occurred_at: ev.date,
      external_id: `upsales-mailEvent-${ev.id}`,
      metadata: {
        mail_id: ev.mail?.id,
        subject: ev.mail?.subject,
        url: ev.url,
        type: ev.type,
      },
    });
  }

  const eventsLogged = await logEventsBatch(supabase, pending);

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    since,
    mail_events_fetched: events.length,
    persons_stitched: stitched,
    events_logged: eventsLogged,
  });
}

export const POST = GET;
