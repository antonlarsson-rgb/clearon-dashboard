// Identity resolution — mappar en external-nyckel (email/phone/cookie/upsales_id/anon_id)
// till en person. Skapar automatiskt ny person om ingen matchar.
// Alla writes går via service-role-klienten.

import type { SupabaseClient } from "@supabase/supabase-js";

export type IdentityType =
  | "email"
  | "phone"
  | "visitor_cookie"
  | "upsales_anon_id"
  | "upsales_contact_id"
  | "linkedin"
  | "meta_hash"
  | "domain";

export interface IdentityInput {
  email?: string | null;
  phone?: string | null;
  visitor_cookie?: string | null;
  upsales_anon_id?: string | null;
  upsales_contact_id?: number | null;
  linkedin_url?: string | null;
}

export interface PersonSeed {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  role_category?: string | null;
  account_id?: string | null;
  contact_id?: string | null;
  journey_step?: string | null;
  source?: string;
  first_utm_source?: string | null;
  first_utm_campaign?: string | null;
  first_referrer?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normEmail(e?: string | null): string | null {
  if (!e) return null;
  const s = e.trim().toLowerCase();
  return EMAIL_RE.test(s) ? s : null;
}

function normPhone(p?: string | null): string | null {
  if (!p) return null;
  const s = p.replace(/[\s-]/g, "").replace(/^\+46/, "0").replace(/^46/, "0");
  return s.length >= 6 ? s : null;
}

/**
 * Slå upp person via valfri nyckel. Returnerar person_id eller null.
 * Ordning: upsales_contact_id > email > phone > visitor_cookie > upsales_anon_id
 */
export async function findPersonId(
  supabase: SupabaseClient,
  keys: IdentityInput
): Promise<string | null> {
  const email = normEmail(keys.email);
  const phone = normPhone(keys.phone);

  // 1. Upsales contact_id är starkaste nyckeln
  if (keys.upsales_contact_id) {
    const { data } = await supabase
      .from("persons")
      .select("id")
      .eq("upsales_contact_id", keys.upsales_contact_id)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  // 2. Email
  if (email) {
    const { data } = await supabase
      .from("persons")
      .select("id")
      .eq("primary_email", email)
      .maybeSingle();
    if (data?.id) return data.id;

    // sekundärt email via identities
    const { data: idRow } = await supabase
      .from("person_identities")
      .select("person_id")
      .eq("identity_type", "email")
      .eq("identity_value", email)
      .maybeSingle();
    if (idRow?.person_id) return idRow.person_id;
  }

  // 3. Phone
  if (phone) {
    const { data } = await supabase
      .from("person_identities")
      .select("person_id")
      .eq("identity_type", "phone")
      .eq("identity_value", phone)
      .maybeSingle();
    if (data?.person_id) return data.person_id;
  }

  // 4. Visitor cookie
  if (keys.visitor_cookie) {
    const { data } = await supabase
      .from("person_identities")
      .select("person_id")
      .eq("identity_type", "visitor_cookie")
      .eq("identity_value", keys.visitor_cookie)
      .maybeSingle();
    if (data?.person_id) return data.person_id;
  }

  // 5. Upsales anonymous id
  if (keys.upsales_anon_id) {
    const { data } = await supabase
      .from("person_identities")
      .select("person_id")
      .eq("identity_type", "upsales_anon_id")
      .eq("identity_value", keys.upsales_anon_id)
      .maybeSingle();
    if (data?.person_id) return data.person_id;
  }

  return null;
}

async function addIdentity(
  supabase: SupabaseClient,
  personId: string,
  type: IdentityType,
  value: string,
  verified = false
) {
  const now = new Date().toISOString();
  await supabase
    .from("person_identities")
    .upsert(
      {
        person_id: personId,
        identity_type: type,
        identity_value: value,
        verified,
        first_seen: now,
        last_seen: now,
      },
      { onConflict: "identity_type,identity_value", ignoreDuplicates: false }
    );
}

/**
 * Slå upp person eller skapa en ny. Lägger alltid till alla givna identities
 * så framtida lookups matchar via andra nycklar.
 */
export async function resolveOrCreatePerson(
  supabase: SupabaseClient,
  keys: IdentityInput,
  seed: PersonSeed = {}
): Promise<string | null> {
  const email = normEmail(keys.email);
  const phone = normPhone(keys.phone);

  const existingId = await findPersonId(supabase, keys);

  if (existingId) {
    // Uppdatera cellulär metadata om seed innehåller nytt
    const updates: Record<string, unknown> = {};
    if (email) updates.primary_email = email;
    if (phone) updates.primary_phone = phone;
    if (seed.name) updates.name = seed.name;
    if (seed.first_name) updates.first_name = seed.first_name;
    if (seed.last_name) updates.last_name = seed.last_name;
    if (seed.title) updates.title = seed.title;
    if (seed.role_category) updates.role_category = seed.role_category;
    if (seed.account_id) updates.account_id = seed.account_id;
    if (seed.contact_id) updates.contact_id = seed.contact_id;
    if (seed.journey_step) updates.journey_step = seed.journey_step;
    if (keys.upsales_contact_id) updates.upsales_contact_id = keys.upsales_contact_id;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await supabase.from("persons").update(updates).eq("id", existingId);
    }

    // Lägg till nya identities
    if (email) await addIdentity(supabase, existingId, "email", email, true);
    if (phone) await addIdentity(supabase, existingId, "phone", phone);
    if (keys.visitor_cookie)
      await addIdentity(supabase, existingId, "visitor_cookie", keys.visitor_cookie);
    if (keys.upsales_anon_id)
      await addIdentity(supabase, existingId, "upsales_anon_id", keys.upsales_anon_id);

    return existingId;
  }

  // Skapa ny person (måste ha åtminstone EN nyckel)
  if (!email && !phone && !keys.visitor_cookie && !keys.upsales_anon_id && !keys.upsales_contact_id) {
    return null;
  }

  const { data: newPerson, error } = await supabase
    .from("persons")
    .insert({
      primary_email: email,
      primary_phone: phone,
      name: seed.name,
      first_name: seed.first_name,
      last_name: seed.last_name,
      title: seed.title,
      role_category: seed.role_category,
      account_id: seed.account_id,
      contact_id: seed.contact_id,
      upsales_contact_id: keys.upsales_contact_id,
      journey_step: seed.journey_step,
      source: seed.source || "web",
      first_utm_source: seed.first_utm_source,
      first_utm_campaign: seed.first_utm_campaign,
      first_referrer: seed.first_referrer,
    })
    .select("id")
    .single();

  if (error || !newPerson) {
    // Race: kanske skapades av parallell request — försök lookup igen
    if (error?.code === "23505") {
      return findPersonId(supabase, keys);
    }
    console.error("resolveOrCreatePerson insert error:", error);
    return null;
  }

  const pid = newPerson.id;
  if (email) await addIdentity(supabase, pid, "email", email, true);
  if (phone) await addIdentity(supabase, pid, "phone", phone);
  if (keys.visitor_cookie)
    await addIdentity(supabase, pid, "visitor_cookie", keys.visitor_cookie);
  if (keys.upsales_anon_id)
    await addIdentity(supabase, pid, "upsales_anon_id", keys.upsales_anon_id);
  if (keys.upsales_contact_id)
    await addIdentity(
      supabase,
      pid,
      "upsales_contact_id",
      String(keys.upsales_contact_id),
      true
    );

  return pid;
}
