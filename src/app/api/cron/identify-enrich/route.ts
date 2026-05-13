// Cron: var 30:e min. Försök identifiera anonyma personer på clearon.live
// via tre signaler:
//   1. Mail-link-token finns i events.metadata (clearon_pid eller clearon_email)
//      → stitch person till upsales_contact_id eller email
//   2. IP-prefix från web_sessions matchar en känd Upsales-account (samma
//      företag har klickat in på clearon.se via Upsales tracking).
//      → sätt persons.suggested_account_id + identification_method=ip_match
//   3. Domän från befintliga identities (email) som matchar account.website
//      → sätt account_id om saknas
//
// Idén: även om vi inte vet exakt VEM (utan email), så vet vi VILKET FÖRETAG
// med rimlig sannolikhet. Säljaren ser "Anonym besökare · Företag: Volvo
// (IP-match)" istället för bara "Anonym".

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const t0 = Date.now();
  const since = new Date(Date.now() - 7 * DAY).toISOString();

  const results = {
    mail_token_stitched: 0,
    ip_match_suggested: 0,
    domain_match_assigned: 0,
    inspected: 0,
  };

  // --- Steg 1: Mail-link tokens i events ---
  // Eventet kan ha skapats utan att stitchningen sattes (race eller miss).
  // Plocka alla web-events senaste 7d med clearon_pid i metadata och en
  // person_id som saknar upsales_contact_id.
  const { data: tokenEvents } = await supabase
    .from("events")
    .select("person_id, metadata, occurred_at")
    .eq("source", "web")
    .gte("occurred_at", since)
    .not("metadata->clearon_pid", "is", null)
    .limit(500);

  for (const ev of tokenEvents || []) {
    const md = (ev.metadata as Record<string, unknown>) || {};
    const pid = Number(md.clearon_pid);
    if (!Number.isFinite(pid) || pid <= 0) continue;
    if (!ev.person_id) continue;

    const { data: existing } = await supabase
      .from("persons")
      .select("upsales_contact_id, identification_method")
      .eq("id", ev.person_id)
      .maybeSingle();
    if (existing?.upsales_contact_id) continue;

    await supabase
      .from("persons")
      .update({
        upsales_contact_id: pid,
        identification_method: existing?.identification_method || "mail_link",
        identification_confidence: 0.9,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ev.person_id);

    await supabase.from("person_identities").upsert(
      {
        person_id: ev.person_id,
        identity_type: "upsales_contact_id",
        identity_value: String(pid),
        verified: true,
        first_seen: ev.occurred_at,
        last_seen: ev.occurred_at,
      },
      { onConflict: "identity_type,identity_value", ignoreDuplicates: true },
    );
    results.mail_token_stitched++;
  }

  // --- Steg 2: IP-prefix-match ---
  // Hämta anonyma sessions från clearon.live senaste 7d som har ip_prefix
  // men där visitor → person inte är kopplad till account.
  const { data: anonSessions } = await supabase
    .from("web_sessions")
    .select("anonymous_id, visitor_id, ip_prefix, source, campaign, page_path, timestamp")
    .gte("timestamp", since)
    .not("ip_prefix", "is", null)
    .not("visitor_id", "is", null)
    .order("timestamp", { ascending: false })
    .limit(1000);

  if (anonSessions && anonSessions.length > 0) {
    // Bygg IP-prefix → account_id via Upsales-visits.
    // Tyvärr lagrar vi inte Upsales-visit-IP idag, men vi kan använda
    // person_identities där upsales_anon_id är satt och kolla vilka accounts
    // de tillhör.
    //
    // För framtida förbättring: berika ip_prefix → account direkt när
    // sync-upsales-visits kör (om Upsales API exponerar IP). Tills dess
    // använder vi en proxy: om en känd person med samma ip_prefix har
    // visited samma sajt → sannolikt samma företag.

    // Hämta alla mappningar visitor → person → account vi redan har
    const visitorIds = [...new Set(anonSessions.map((s) => s.visitor_id))].filter(Boolean);
    if (visitorIds.length > 0) {
      const { data: identMap } = await supabase
        .from("person_identities")
        .select("person_id, identity_value")
        .eq("identity_type", "visitor_cookie")
        .in("identity_value", visitorIds);

      const visitorToPerson = new Map<string, string>();
      for (const i of identMap || []) {
        visitorToPerson.set(i.identity_value as string, i.person_id as string);
      }

      // För varje session: om person finns men inte account, gissa via IP-grannar
      for (const sess of anonSessions) {
        const personId = visitorToPerson.get(sess.visitor_id as string);
        if (!personId) continue;

        const { data: person } = await supabase
          .from("persons")
          .select("account_id, suggested_account_id, primary_email")
          .eq("id", personId)
          .maybeSingle();
        if (!person || person.account_id || person.suggested_account_id) continue;

        // Hitta andra sessions med samma IP-prefix → person → account
        const { data: neighborSessions } = await supabase
          .from("web_sessions")
          .select("visitor_id")
          .eq("ip_prefix", sess.ip_prefix)
          .neq("visitor_id", sess.visitor_id)
          .limit(20);

        const neighborVisitorIds = (neighborSessions || [])
          .map((n) => n.visitor_id)
          .filter(Boolean) as string[];
        if (neighborVisitorIds.length === 0) continue;

        const { data: neighborIdents } = await supabase
          .from("person_identities")
          .select("person_id")
          .eq("identity_type", "visitor_cookie")
          .in("identity_value", neighborVisitorIds);

        const neighborPersonIds = (neighborIdents || []).map((n) => n.person_id);
        if (neighborPersonIds.length === 0) continue;

        const { data: neighborPersons } = await supabase
          .from("persons")
          .select("account_id")
          .in("id", neighborPersonIds)
          .not("account_id", "is", null);

        const accountCounts = new Map<string, number>();
        for (const np of neighborPersons || []) {
          const aid = np.account_id as string;
          accountCounts.set(aid, (accountCounts.get(aid) || 0) + 1);
        }

        const topAccount = [...accountCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (!topAccount) continue;

        const confidence = Math.min(0.7, 0.3 + topAccount[1] * 0.1);
        await supabase
          .from("persons")
          .update({
            suggested_account_id: topAccount[0],
            identification_method: "ip_match",
            identification_confidence: confidence,
            updated_at: new Date().toISOString(),
          })
          .eq("id", personId);
        results.ip_match_suggested++;
      }
    }
  }

  // --- Steg 3: Domän-match för personer med email men utan account ---
  const { data: orphanPersons } = await supabase
    .from("persons")
    .select("id, primary_email")
    .not("primary_email", "is", null)
    .is("account_id", null)
    .limit(200);

  for (const p of orphanPersons || []) {
    const email = p.primary_email as string;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "live.se", "icloud.com"].includes(domain)) {
      continue;
    }
    const rootDomain = domain.split(".").slice(-2, -1)[0];
    if (!rootDomain) continue;

    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .ilike("website", `%${rootDomain}%`)
      .limit(1)
      .maybeSingle();
    if (!account) continue;

    await supabase
      .from("persons")
      .update({
        account_id: account.id,
        identification_method: "domain_match",
        identification_confidence: 0.85,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    results.domain_match_assigned++;
  }

  results.inspected = (tokenEvents?.length || 0) + (anonSessions?.length || 0) + (orphanPersons?.length || 0);

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    results,
  });
}

export const POST = GET;
