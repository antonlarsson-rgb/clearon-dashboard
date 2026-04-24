#!/usr/bin/env node
/**
 * Backfillar Upsales /mail → events-tabellen.
 * Varje mail har `events: [{type, date}]` där type = send|read|click|bounce|unsub|softbounce
 * Vi skapar ett event per sådan entry, stitchat till person via contact.id.
 *
 * Detta är NYCKELN till individ-nivå scoring: 118k mails × flera events vardera.
 */

import { createClient } from "@supabase/supabase-js";
import { upsalesFetch, SUPABASE_URL, SERVICE_KEY } from "./lib-env.mjs";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("="))
);
const MAX = args.max ? Number(args.max) : Infinity;
const SINCE = args.since || null; // ISO date
const PAGE = 500;

// Kopierad från src/lib/event-weights.ts (self-contained script)
const MAIL_WEIGHTS = {
  send: { weight: 0, intent: 0, type: "mail_sent" },
  read: { weight: 2, intent: 0, type: "mail_open" },
  click: { weight: 8, intent: 6, type: "mail_click" },
  bounce: { weight: -5, intent: 0, type: "mail_bounce" },
  softbounce: { weight: -2, intent: 0, type: "mail_softbounce" },
  unsub: { weight: -30, intent: -20, type: "mail_unsubscribe" },
  spam: { weight: -20, intent: -10, type: "mail_spam" },
};

// cache: upsales_contact_id → person uuid
const personCache = new Map();
const accountCache = new Map();

async function findOrCreatePerson(contact, clientId) {
  if (!contact || !contact.id) return null;
  if (personCache.has(contact.id)) return personCache.get(contact.id);

  const { data: existing } = await supabase
    .from("persons")
    .select("id")
    .eq("upsales_contact_id", contact.id)
    .maybeSingle();

  if (existing) {
    personCache.set(contact.id, existing.id);
    return existing.id;
  }

  const accountId = clientId ? await findOrCreateAccount(clientId) : null;
  const { data: created } = await supabase
    .from("persons")
    .insert({
      upsales_contact_id: contact.id,
      primary_email: contact.email?.toLowerCase() || null,
      name: contact.name,
      journey_step: contact.journeyStep,
      account_id: accountId,
      source: "upsales",
    })
    .select("id")
    .maybeSingle();

  const id = created?.id || null;
  if (id) {
    personCache.set(contact.id, id);
    await supabase.from("person_identities").upsert(
      [
        { person_id: id, identity_type: "upsales_contact_id", identity_value: String(contact.id), verified: true },
        ...(contact.email ? [{ person_id: id, identity_type: "email", identity_value: contact.email.toLowerCase(), verified: true }] : []),
      ],
      { onConflict: "identity_type,identity_value", ignoreDuplicates: true }
    );
  }
  return id;
}

async function findOrCreateAccount(clientId) {
  if (!clientId) return null;
  if (accountCache.has(clientId)) return accountCache.get(clientId);
  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("upsales_id", clientId)
    .maybeSingle();
  if (existing) {
    accountCache.set(clientId, existing.id);
    return existing.id;
  }
  // Vi vet inte namnet här; skapa inte dummy
  accountCache.set(clientId, null);
  return null;
}

async function main() {
  console.log("Backfill Upsales /mail → events");
  let offset = 0;
  let totalMails = 0;
  let totalEvents = 0;
  const t0 = Date.now();

  while (totalMails < MAX) {
    const params = {
      limit: PAGE,
      offset,
      sort: "-date",
    };
    if (SINCE) {
      params["q[0][a]"] = "date";
      params["q[0][c]"] = "gte";
      params["q[0][v]"] = SINCE;
    }

    const data = await upsalesFetch("/mail", params);
    const mails = data.data || [];
    if (mails.length === 0) break;

    const batch = [];

    for (const m of mails) {
      totalMails++;
      if (!m.contact?.id) continue; // måste ha kontakt för individ-scoring

      const clientId = m.client?.id || null;
      const accountId = clientId ? await findOrCreateAccount(clientId) : null;
      const personId = await findOrCreatePerson(m.contact, clientId);
      if (!personId) continue;

      const subject = m.subject || "";
      // Gissa produkt från subject/template
      const productSlug = productFromSubject(subject);

      const mailEvents = m.events || [];
      for (const ev of mailEvents) {
        const w = MAIL_WEIGHTS[ev.type] || { weight: 1, intent: 0, type: `mail_${ev.type}` };
        batch.push({
          person_id: personId,
          account_id: accountId,
          source: "upsales_mail",
          event_type: w.type,
          product_slug: productSlug,
          metadata: {
            external_id: `mail:${m.id}:${ev.type}:${ev.date}`,
            mail_id: m.id,
            subject,
            event_type: ev.type,
            value: ev.value,
            user: m.users?.[0]?.name,
            project: m.project?.name,
          },
          weight: w.weight,
          intent_weight: w.intent,
          occurred_at: ev.date || m.date,
        });
      }
    }

    if (batch.length > 0) {
      // Dedupe inom batchen (duplicate external_ids)
      const seen = new Set();
      const unique = batch.filter((e) => {
        const k = e.metadata.external_id;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // Kolla befintliga external_ids
      const externalIds = unique.map((e) => e.metadata.external_id);
      const { data: existing } = await supabase
        .from("events")
        .select("metadata")
        .eq("source", "upsales_mail")
        .in("metadata->>external_id", externalIds);
      const existingSet = new Set((existing || []).map((e) => e.metadata?.external_id));
      const fresh = unique.filter((e) => !existingSet.has(e.metadata.external_id));

      if (fresh.length > 0) {
        const { error } = await supabase.from("events").insert(fresh);
        if (error) console.error("\n  batch error:", error.message);
        else totalEvents += fresh.length;
      }
    }

    offset += PAGE;
    const elapsed = (Date.now() - t0) / 1000;
    process.stdout.write(
      `\r  offset=${offset}  mails=${totalMails}  events=${totalEvents}  persons=${personCache.size}  ${(totalEvents / elapsed).toFixed(0)}/s`
    );

    if (mails.length < PAGE) break;
  }

  console.log(`\nKlart. ${totalMails} mails, ${totalEvents} events, ${personCache.size} personer berörda.`);
}

function productFromSubject(subject) {
  if (!subject) return null;
  const s = subject.toLowerCase();
  if (/sales[-_ ]?promotion|kampanjbaserad/.test(s)) return "sales-promotion";
  if (/värdeavier|vardeavier|check/.test(s)) return "clearing-solutions";
  if (/kupong|coupon/.test(s)) return "kuponger";
  if (/gift|presentkort|sverigecheck|personalbeloning/.test(s)) return "send-a-gift";
  if (/engage|interactive/.test(s)) return "interactive-engage";
  if (/customer[-_ ]?care|kundtjänst/.test(s)) return "customer-care";
  if (/mobilkupong|mobil kupong/.test(s)) return "kuponger";
  if (/kampanja/.test(s)) return "kampanja";
  return null;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
