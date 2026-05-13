// GET /api/buying-intent/feed — senaste 50 events i grafen, joinade med person + account.
// För live-feeden på hemskärmen.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(200, Number(url.searchParams.get("limit")) || 50);
    const minutes = Number(url.searchParams.get("minutes")) || 60 * 24; // 24h default

    const supabase = getServiceClient();
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("events")
      .select(
        `
        id, occurred_at, source, event_type, product_slug, metadata, weight, intent_weight,
        person:persons(id, name, primary_email, title),
        account:accounts(id, name, industry)
      `
      )
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    const events = (data || []).map((ev) => {
      const person = Array.isArray(ev.person) ? ev.person[0] : ev.person;
      const account = Array.isArray(ev.account) ? ev.account[0] : ev.account;
      return {
        id: ev.id,
        occurred_at: ev.occurred_at,
        source: ev.source,
        event_type: ev.event_type,
        product_slug: ev.product_slug,
        weight: ev.weight,
        intent_weight: ev.intent_weight,
        metadata: ev.metadata,
        person: person
          ? {
              id: person.id,
              name: person.name,
              email: person.primary_email,
              title: person.title,
            }
          : null,
        account: account
          ? { id: account.id, name: account.name, industry: account.industry }
          : null,
      };
    });

    return NextResponse.json({ events });
  } catch (e) {
    console.error("buying-intent/feed error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
