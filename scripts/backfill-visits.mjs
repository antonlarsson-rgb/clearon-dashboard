#!/usr/bin/env node
/**
 * Backfillar Upsales website visits → events-tabellen.
 * Varje visit-page blir 1 event. Identifierade visits (har .client) stitchas
 * via account_id. Identifierade contacts (har .contact) stitchas via person.
 *
 * Användning: node scripts/backfill-visits.mjs [--since=YYYY-MM-DD] [--max=N]
 */

import { createClient } from "@supabase/supabase-js";
import { upsalesFetch, SUPABASE_URL, SERVICE_KEY } from "./lib-env.mjs";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("="))
);
const SINCE = args.since || "2026-01-01";
const MAX = args.max ? Number(args.max) : Infinity;
const PAGE = 1000;

// ===== Event weights (kopierade från src/lib/event-weights.ts för self-contained script) =====

const EVENT_WEIGHTS = {
  upsales_visit_page: { weight: 3, intent: 1 },
  upsales_visit_contact_page: { weight: 8, intent: 10 },
  upsales_visit_product_page: { weight: 6, intent: 4 },
  upsales_visit_return: { weight: 10, intent: 8 },
};

const URL_PATTERNS = [
  [/sales[-_ ]?promotion/i, "sales-promotion"],
  [/customer[-_ ]?care/i, "customer-care"],
  [/interactive[-_ ]?engage|engage[-_ ]?ai/i, "interactive-engage"],
  [/kampanja/i, "kampanja"],
  [/send[-_ ]?a[-_ ]?gift|skicka.?presentkort|personalbelon/i, "send-a-gift"],
  [/clearing|vardeavier|v%C3%A4rdeavier/i, "clearing-solutions"],
  [/kupong|coupon|mobilkupong/i, "kuponger"],
  [/mobil(a)?[-_ ]?presentkort/i, "mobila-presentkort"],
  [/sverigecheck/i, "send-a-gift"],
  [/checkar/i, "sales-promotion"],
];

function productFromUrl(url) {
  if (!url) return null;
  for (const [re, slug] of URL_PATTERNS) if (re.test(url)) return slug;
  return null;
}

function classifyUrl(url) {
  const lower = (url || "").toLowerCase();
  const product = productFromUrl(url);
  if (/kontakt|kontakta-oss|demo|pris|pricing|offert/.test(lower)) {
    return { eventType: "upsales_visit_contact_page", product_slug: product };
  }
  if (product) return { eventType: "upsales_visit_product_page", product_slug: product };
  return { eventType: "upsales_visit_page", product_slug: null };
}

// ===== Account / person cache =====

const accountCache = new Map(); // upsales_id → uuid
const personByUpsalesContact = new Map(); // upsales_contact_id → uuid

async function ensureAccount(client) {
  if (!client) return null;
  if (accountCache.has(client.id)) return accountCache.get(client.id);

  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("upsales_id", client.id)
    .maybeSingle();

  if (existing) {
    accountCache.set(client.id, existing.id);
    return existing.id;
  }

  const { data: created } = await supabase
    .from("accounts")
    .insert({
      upsales_id: client.id,
      name: client.name || `Upsales ${client.id}`,
    })
    .select("id")
    .maybeSingle();

  const id = created?.id || null;
  if (id) accountCache.set(client.id, id);
  return id;
}

async function ensurePersonFromContact(contact, accountId) {
  if (!contact) return null;
  if (personByUpsalesContact.has(contact.id))
    return personByUpsalesContact.get(contact.id);

  const { data: existing } = await supabase
    .from("persons")
    .select("id")
    .eq("upsales_contact_id", contact.id)
    .maybeSingle();

  if (existing) {
    personByUpsalesContact.set(contact.id, existing.id);
    return existing.id;
  }

  // skapa stub-person
  const { data: created } = await supabase
    .from("persons")
    .insert({
      upsales_contact_id: contact.id,
      name: contact.name,
      primary_email: contact.email?.toLowerCase() || null,
      account_id: accountId,
      source: "upsales",
    })
    .select("id")
    .maybeSingle();

  const id = created?.id || null;
  if (id) {
    personByUpsalesContact.set(contact.id, id);
    await supabase.from("person_identities").upsert(
      [
        { person_id: id, identity_type: "upsales_contact_id", identity_value: String(contact.id), verified: true },
        ...(contact.email
          ? [{ person_id: id, identity_type: "email", identity_value: contact.email.toLowerCase(), verified: true }]
          : []),
      ],
      { onConflict: "identity_type,identity_value", ignoreDuplicates: true }
    );
  }
  return id;
}

// ===== Main =====

async function main() {
  console.log(`Backfill Upsales visits → events (sen ${SINCE})`);

  let offset = 0;
  let totalEvents = 0;
  let totalVisits = 0;
  let identifiedVisits = 0;
  const t0 = Date.now();

  while (totalVisits < MAX) {
    const data = await upsalesFetch("/visits", {
      limit: PAGE,
      offset,
      sort: "-startDate",
      "q[0][a]": "startDate",
      "q[0][c]": "gte",
      "q[0][v]": SINCE,
    });

    const visits = data.data || [];
    if (visits.length === 0) break;

    const batch = [];
    const anonIdentities = []; // { person_id: null, identity } — vi slutskapar senare

    for (const v of visits) {
      totalVisits++;

      // identifiera account + person via client/contact
      const accountId = v.client ? await ensureAccount(v.client) : null;
      const personId = v.contact ? await ensurePersonFromContact(v.contact, accountId) : null;

      if (v.client) identifiedVisits++;

      // Om client men ingen person → skapa anonym "IP-identifierad company visitor"
      // som binder upsales_anon_id → account (ingen person, företagsnivå)
      const anonId = v.anonymousId && v.anonymousId !== "0" ? v.anonymousId : null;

      // 1 event per sida i besöket
      for (const [i, p] of (v.pages || []).entries()) {
        const { eventType, product_slug } = classifyUrl(p.url);
        const w = EVENT_WEIGHTS[eventType] || EVENT_WEIGHTS.upsales_visit_page;
        const weight = w.weight + Math.min(3, Math.floor((p.durationSeconds || 0) / 30));

        batch.push({
          person_id: personId,
          account_id: accountId,
          source: "upsales_visit",
          event_type: eventType,
          product_slug,
          metadata: {
            external_id: `${v.id}:${i}`,
            visit_id: v.id,
            page: p.page,
            url: p.url,
            duration_seconds: p.durationSeconds,
            referer: v.referer,
            anonymous_id: anonId,
            is_first_visit: v.isFirst === 1,
            client_name: v.client?.name || null,
            client_id: v.client?.id || null,
          },
          weight,
          intent_weight: w.intent,
          occurred_at: p.startDate || v.startDate,
        });
      }
    }

    if (batch.length > 0) {
      // Dedupe: filtrera bort existing external_ids först
      const externalIds = batch.map((e) => e.metadata.external_id);
      const { data: existing } = await supabase
        .from("events")
        .select("metadata")
        .eq("source", "upsales_visit")
        .in("metadata->>external_id", externalIds);
      const existingSet = new Set((existing || []).map((e) => e.metadata?.external_id));
      const fresh = batch.filter((e) => !existingSet.has(e.metadata.external_id));

      if (fresh.length > 0) {
        const { error } = await supabase.from("events").insert(fresh);
        if (error) console.error("\n  batch error:", error.message);
        else totalEvents += fresh.length;
      }
    }

    offset += PAGE;
    const elapsed = (Date.now() - t0) / 1000;
    process.stdout.write(
      `\r  offset=${offset}  visits=${totalVisits}  identified=${identifiedVisits}  events=${totalEvents}  ${(totalEvents / elapsed).toFixed(0)}/s`
    );

    if (visits.length < PAGE) break;
    if (totalVisits >= MAX) break;
  }

  console.log(`\nKlart. ${totalVisits} visits, ${identifiedVisits} identifierade, ${totalEvents} events.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
