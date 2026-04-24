#!/usr/bin/env node
/**
 * Backfillar Upsales orders + opportunities → events (strong buy-signals).
 * Sätter has_purchased=true på persons när vi ser en order.
 */

import { createClient } from "@supabase/supabase-js";
import { upsalesFetch, SUPABASE_URL, SERVICE_KEY } from "./lib-env.mjs";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const MAX = args.max ? Number(args.max) : Infinity;
const PAGE = 1000;

const accountCache = new Map();
const personCache = new Map();

async function findAccount(upsalesClientId) {
  if (!upsalesClientId) return null;
  if (accountCache.has(upsalesClientId)) return accountCache.get(upsalesClientId);
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .eq("upsales_id", upsalesClientId)
    .maybeSingle();
  const id = data?.id || null;
  accountCache.set(upsalesClientId, id);
  return id;
}

async function findPerson(upsalesContactId) {
  if (!upsalesContactId) return null;
  if (personCache.has(upsalesContactId)) return personCache.get(upsalesContactId);
  const { data } = await supabase
    .from("persons")
    .select("id")
    .eq("upsales_contact_id", upsalesContactId)
    .maybeSingle();
  const id = data?.id || null;
  personCache.set(upsalesContactId, id);
  return id;
}

// Mappa produkt via namn (best-effort)
function productFromText(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/sales[-_ ]?promotion|sales promotion/.test(t)) return "sales-promotion";
  if (/customer[-_ ]?care|kundtjänst/.test(t)) return "customer-care";
  if (/interactive[-_ ]?engage/.test(t)) return "interactive-engage";
  if (/kampanja/.test(t)) return "kampanja";
  if (/send[-_ ]?a[-_ ]?gift|presentkort|sverigecheck/.test(t)) return "send-a-gift";
  if (/clearing|vardeavier|värdeavier|check/.test(t)) return "clearing-solutions";
  if (/kupong/.test(t)) return "kuponger";
  return null;
}

async function backfillOrders() {
  console.log("Orders → events");
  let offset = 0;
  let total = 0;

  while (total < MAX) {
    const data = await upsalesFetch("/orders", {
      limit: PAGE,
      offset,
      sort: "-date",
    });
    const orders = data.data || [];
    if (orders.length === 0) break;

    const batch = [];
    const personUpdates = new Map(); // person_id → { has_purchased: true, is_customer: true }

    for (const o of orders) {
      const accountId = await findAccount(o.client?.id);
      const personId = await findPerson(o.contact?.id);

      const product = productFromText(o.description || o.custom?.[0]?.value || "");

      batch.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_order",
        event_type: "order_placed",
        product_slug: product,
        metadata: {
          external_id: `order:${o.id}`,
          order_id: o.id,
          value: o.value,
          currency: o.currency,
          probability: o.probability,
          stage: o.stage?.name,
          description: o.description,
          client_name: o.client?.name,
        },
        weight: 50,
        intent_weight: 50,
        occurred_at: o.date || o.closeDate || o.regDate || new Date().toISOString(),
      });

      if (personId) {
        personUpdates.set(personId, { has_purchased: true, is_customer: true });
      }
    }

    if (batch.length > 0) {
      const { error } = await supabase.from("events").insert(batch);
      if (error) console.error("  order batch error:", error.message);
      else total += batch.length;
    }

    // Uppdatera persons has_purchased
    for (const [pid, update] of personUpdates) {
      await supabase.from("persons").update(update).eq("id", pid);
    }

    offset += PAGE;
    process.stdout.write(`\r  orders offset=${offset}, events=${total}`);

    if (orders.length < PAGE) break;
  }
  console.log(`\n  ${total} order-events`);
}

async function backfillOpportunities() {
  console.log("Opportunities → events");
  let offset = 0;
  let total = 0;

  while (total < MAX) {
    const data = await upsalesFetch("/opportunities", {
      limit: PAGE,
      offset,
      sort: "-regDate",
    });
    const opps = data.data || [];
    if (opps.length === 0) break;

    const batch = [];

    for (const o of opps) {
      const accountId = await findAccount(o.client?.id);
      const personId = await findPerson(o.contact?.id);
      const product = productFromText(o.description || "");

      const wonLost = o.probability === 100 ? "opportunity_won" :
                     o.probability === 0 ? "opportunity_lost" :
                     "opportunity_created";

      batch.push({
        person_id: personId,
        account_id: accountId,
        source: "upsales_opportunity",
        event_type: wonLost,
        product_slug: product,
        metadata: {
          external_id: `opp:${o.id}`,
          opp_id: o.id,
          value: o.value,
          probability: o.probability,
          stage: o.stage?.name,
          description: o.description,
          client_name: o.client?.name,
        },
        weight: wonLost === "opportunity_won" ? 40 : wonLost === "opportunity_lost" ? -10 : 20,
        intent_weight: wonLost === "opportunity_won" ? 40 : wonLost === "opportunity_lost" ? -10 : 25,
        occurred_at: o.regDate || o.date || new Date().toISOString(),
      });

      if (wonLost === "opportunity_won" && personId) {
        await supabase.from("persons").update({ has_purchased: true, is_customer: true }).eq("id", personId);
      }
    }

    if (batch.length > 0) {
      const { error } = await supabase.from("events").insert(batch);
      if (error) console.error("  opp batch error:", error.message);
      else total += batch.length;
    }

    offset += PAGE;
    process.stdout.write(`\r  opps offset=${offset}, events=${total}`);

    if (opps.length < PAGE) break;
  }
  console.log(`\n  ${total} opportunity-events`);
}

async function main() {
  await backfillOrders();
  await backfillOpportunities();
  console.log("Klart.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
