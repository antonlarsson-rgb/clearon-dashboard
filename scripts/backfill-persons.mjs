#!/usr/bin/env node
/**
 * Backfillar alla Upsales-kontakter till persons + person_identities,
 * och deras klienter (accounts) till accounts om de inte redan finns.
 *
 * Användning: node scripts/backfill-persons.mjs [--max=N]
 */

import { createClient } from "@supabase/supabase-js";
import { upsalesFetch, SUPABASE_URL, SERVICE_KEY } from "./lib-env.mjs";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Saknar SUPABASE_URL / SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("="))
);
const MAX = args.max ? Number(args.max) : Infinity;
const PAGE = 1000;

function normEmail(e) {
  if (!e) return null;
  const s = String(e).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function normPhone(p) {
  if (!p) return null;
  const s = String(p).replace(/[\s-]/g, "").replace(/^\+46/, "0").replace(/^46/, "0");
  return s.length >= 6 ? s : null;
}

// ==================== ACCOUNTS ====================

const accountCache = new Map(); // upsales_id → uuid

async function ensureAccount(upsalesClient) {
  if (!upsalesClient) return null;
  const upsId = upsalesClient.id;
  if (accountCache.has(upsId)) return accountCache.get(upsId);

  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("upsales_id", upsId)
    .maybeSingle();

  if (existing?.id) {
    accountCache.set(upsId, existing.id);
    return existing.id;
  }

  const { data: created } = await supabase
    .from("accounts")
    .insert({
      upsales_id: upsId,
      name: upsalesClient.name || `Upsales ${upsId}`,
      industry: null,
      website: null,
    })
    .select("id")
    .single();

  if (created?.id) accountCache.set(upsId, created.id);
  return created?.id || null;
}

// ==================== CONTACTS → PERSONS ====================

async function upsertPerson(upsalesContact, accountId) {
  const email = normEmail(upsalesContact.email);
  const phone = normPhone(upsalesContact.cellPhone || upsalesContact.phone);

  if (!email && !phone && !upsalesContact.id) return null;

  const payload = {
    upsales_contact_id: upsalesContact.id,
    primary_email: email,
    primary_phone: phone,
    name: upsalesContact.name,
    first_name: upsalesContact.firstName,
    last_name: upsalesContact.lastName,
    title: upsalesContact.title,
    linkedin_url: upsalesContact.linkedin,
    account_id: accountId,
    journey_step: upsalesContact.journeyStep,
    has_purchased: !!upsalesContact.hasOrder || !!upsalesContact.hadOrder,
    is_customer: !!upsalesContact.hasOrder,
    source: "upsales",
    updated_at: new Date().toISOString(),
  };

  // upsert på upsales_contact_id (unique)
  const { data, error } = await supabase
    .from("persons")
    .upsert(payload, { onConflict: "upsales_contact_id" })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505" && email) {
      // email collision — uppdatera via email istället
      const { data: byEmail } = await supabase
        .from("persons")
        .update({ ...payload, primary_email: email })
        .eq("primary_email", email)
        .select("id")
        .single();
      return byEmail?.id || null;
    }
    console.error(`  ! upsert failed for contact ${upsalesContact.id}:`, error.message);
    return null;
  }

  const personId = data?.id;
  if (!personId) return null;

  // identities — batched
  const identities = [];
  if (email) identities.push({ person_id: personId, identity_type: "email", identity_value: email, verified: true });
  if (phone) identities.push({ person_id: personId, identity_type: "phone", identity_value: phone });
  identities.push({
    person_id: personId,
    identity_type: "upsales_contact_id",
    identity_value: String(upsalesContact.id),
    verified: true,
  });

  if (identities.length) {
    await supabase
      .from("person_identities")
      .upsert(identities, { onConflict: "identity_type,identity_value", ignoreDuplicates: true });
  }

  return personId;
}

async function main() {
  console.log("Backfill Upsales contacts → persons");
  let offset = 0;
  let imported = 0;
  let accounts = 0;
  let t0 = Date.now();

  while (imported < MAX) {
    const data = await upsalesFetch("/contacts", {
      limit: PAGE,
      offset,
      sort: "id",
    });
    const contacts = data.data || [];
    if (contacts.length === 0) break;

    for (const c of contacts) {
      const accountId = await ensureAccount(c.client);
      if (c.client && accountId) accounts++;
      const pid = await upsertPerson(c, accountId);
      if (pid) imported++;
    }

    offset += PAGE;
    const elapsed = (Date.now() - t0) / 1000;
    process.stdout.write(
      `\r  offset=${offset}  personer=${imported}  accounts=${accounts}  ${(imported / elapsed).toFixed(0)}/s`
    );

    if (contacts.length < PAGE) break;
    if (imported >= MAX) break;
  }

  console.log(`\nKlart. ${imported} personer, ${accounts} accounts.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
