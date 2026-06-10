// ROI per kanal: kopplar Upsales-opportunities (hamtade live fran Upsales
// /orders med kund + kontakt) till kallan personen/kontot kom ifran
// (annons-attribution via utm/klick-id, email, direkt, upsales) och staller
// det mot annons-spend fran Windsor. Svarar pa fragan "vad ger annons-
// kronorna i pipeline och vunna affarer - inte bara i leads?".

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getGooglePerformance,
  getMetaPerformance,
  getLinkedInPerformance,
} from "@/lib/windsor";
import { getOpportunities, type UpsalesOpportunity } from "@/lib/upsales";

const DAY = 24 * 60 * 60 * 1000;

export type RoiChannel =
  | "google"
  | "meta"
  | "linkedin"
  | "email"
  | "direkt"
  | "upsales"
  | "okand";

export interface ChannelRoiRow {
  channel: RoiChannel;
  ad_spend: number | null; // bara annonskanaler har spend
  leads: number; // lead_submitted i perioden
  opportunities_open: number;
  pipeline_value: number; // varde pa oppna opportunities
  opportunities_won: number;
  won_value: number;
  opportunities_lost: number;
  roi: number | null; // won_value / ad_spend
  pipeline_per_spend: number | null; // (pipeline + won) / ad_spend
}

export interface ChannelRoiResult {
  lookback_days: number;
  channels: ChannelRoiRow[];
  totals: {
    ad_spend: number;
    pipeline_value: number;
    won_value: number;
    opportunities: number;
  };
  note: string;
}

// 10 min in-memory cache - Upsales-pagineringen ar dyr
const roiCache = new Map<number, { data: ChannelRoiResult; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function deriveAdPlatform(meta: Record<string, unknown>): string | null {
  const explicit = meta.ad_platform as string | null;
  if (explicit) return explicit;
  const src = String(meta.utm_source || "").toLowerCase();
  if (meta.gclid || src.includes("google")) return "google";
  if (meta.fbclid || src.includes("facebook") || src.includes("meta") || src.includes("instagram"))
    return "meta";
  if (meta.li_fat_id || src.includes("linkedin")) return "linkedin";
  return null;
}

function utmToChannel(src: string | null | undefined): RoiChannel | null {
  if (!src) return null;
  const s = src.toLowerCase();
  if (s.includes("google")) return "google";
  if (s.includes("facebook") || s.includes("meta") || s.includes("instagram")) return "meta";
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("mail") || s.includes("email") || s.includes("newsletter")) return "email";
  return "direkt";
}

function sourceToChannel(source: string | null | undefined): RoiChannel | null {
  const s = source || "";
  if (s === "web" || s === "form") return "direkt";
  if (s.startsWith("upsales_mail")) return "email";
  if (s.startsWith("upsales")) return "upsales";
  return null;
}

// Upsales stage 14 = "Faktura": lopande fakturering/clearing-ordrar (tusentals
// per manad, 50+ Mkr) - INTE nyforsaljning. Exkluderas server-side sa
// ROI-vyn visar saljpipelinen: Identifierat Projekt -> Skickat offert ->
// Muntlig overenskommelse -> Vunnen affar/Order (eller Forlorad).
const FAKTURA_STAGE_ID = 14;

function classifyStage(opp: UpsalesOpportunity): "won" | "lost" | "open" {
  const prob =
    typeof opp.probability === "number"
      ? opp.probability
      : typeof opp.probability1 === "number"
        ? opp.probability1
        : null;
  const stageName = (opp.stage?.name || "").toLowerCase();
  if (
    stageName.includes("won") ||
    stageName.includes("vunnen") ||
    stageName.includes("vann") ||
    stageName === "order" ||
    prob === 100
  )
    return "won";
  if (
    prob === 0 ||
    stageName.includes("lost") ||
    stageName.includes("förlorad") ||
    stageName.includes("forlorad")
  )
    return "lost";
  return "open";
}

export async function getChannelRoi(
  supabase: SupabaseClient,
  lookbackDays = 90,
): Promise<ChannelRoiResult> {
  const lookback = Math.min(365, Math.max(7, lookbackDays));

  const cached = roiCache.get(lookback);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const since = new Date(Date.now() - lookback * DAY).toISOString();
  const period = { lookback_days: lookback };

  // 1. Opportunities live fran Upsales (paginerat) + leads + annons-spend
  const fetchOpps = async (): Promise<UpsalesOpportunity[]> => {
    const all: UpsalesOpportunity[] = [];
    const PAGE = 500;
    const MAX = 4000;
    for (let offset = 0; offset < MAX; offset += PAGE) {
      const { data } = await getOpportunities({
        sinceDate: since,
        limit: PAGE,
        offset,
        excludeStageId: FAKTURA_STAGE_ID,
      });
      all.push(...data);
      if (data.length < PAGE) break;
    }
    return all;
  };

  const [opps, leadEventsRes, google, meta, linkedin] = await Promise.all([
    fetchOpps(),
    supabase
      .from("events")
      .select("person_id, metadata")
      .eq("event_type", "lead_submitted")
      .gte("occurred_at", since)
      .limit(3000),
    getGooglePerformance(period, 1800, "clearon"),
    getMetaPerformance(period, 1800, "clearon"),
    getLinkedInPerformance(period, 1800, "clearon"),
  ]);

  // 2. Lead-attribution: person-uuid -> kanal (starkaste signalen) + lead-rakning
  const personUuidChannel = new Map<string, RoiChannel>();
  const leadsByChannel = new Map<RoiChannel, number>();
  for (const ev of leadEventsRes.data || []) {
    const md = (ev.metadata as Record<string, unknown>) || {};
    const platform = deriveAdPlatform(md);
    const channel: RoiChannel =
      (platform as RoiChannel) || utmToChannel(md.utm_source as string) || "direkt";
    leadsByChannel.set(channel, (leadsByChannel.get(channel) || 0) + 1);
    const pid = ev.person_id as string | null;
    if (pid && platform && !personUuidChannel.has(pid)) {
      personUuidChannel.set(pid, platform as RoiChannel);
    }
  }

  // 3. Sla upp personer (via upsales_contact_id) och konton (via upsales_id)
  // i chunkar - hundratals id:n i en .in() ger for lang URL och felar tyst.
  const contactIds = [
    ...new Set(opps.map((o) => o.contacts?.[0]?.id).filter(Boolean) as number[]),
  ];
  const clientIds = [...new Set(opps.map((o) => o.client?.id).filter(Boolean) as number[])];

  const chunk = <T>(arr: T[], size = 150): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  // Person per upsales-kontakt
  const contactChannel = new Map<number, RoiChannel>();
  for (const ids of chunk(contactIds)) {
    const { data } = await supabase
      .from("persons")
      .select("id, upsales_contact_id, first_utm_source, source")
      .in("upsales_contact_id", ids);
    for (const p of data || []) {
      const cid = p.upsales_contact_id as number;
      if (contactChannel.has(cid)) continue;
      const ch =
        personUuidChannel.get(p.id as string) ||
        utmToChannel(p.first_utm_source as string) ||
        sourceToChannel(p.source as string);
      if (ch) contactChannel.set(cid, ch);
    }
  }

  // Konto-fallback: nagon ANNONS-attribuerad person pa samma kund
  const clientChannel = new Map<number, RoiChannel>();
  const accountUuidToClient = new Map<string, number>();
  for (const ids of chunk(clientIds)) {
    const { data } = await supabase
      .from("accounts")
      .select("id, upsales_id")
      .in("upsales_id", ids);
    for (const a of data || []) {
      accountUuidToClient.set(a.id as string, a.upsales_id as number);
    }
  }
  for (const ids of chunk([...accountUuidToClient.keys()])) {
    const { data } = await supabase
      .from("persons")
      .select("account_id, first_utm_source")
      .in("account_id", ids)
      .not("first_utm_source", "is", null);
    for (const p of data || []) {
      const clientId = accountUuidToClient.get(p.account_id as string);
      if (!clientId || clientChannel.has(clientId)) continue;
      const ch = utmToChannel(p.first_utm_source as string);
      if (ch) clientChannel.set(clientId, ch);
    }
  }

  // 4. Aggregera per kanal
  const rows = new Map<RoiChannel, ChannelRoiRow>();
  const ensure = (ch: RoiChannel): ChannelRoiRow => {
    const existing = rows.get(ch);
    if (existing) return existing;
    const fresh: ChannelRoiRow = {
      channel: ch,
      ad_spend: null,
      leads: 0,
      opportunities_open: 0,
      pipeline_value: 0,
      opportunities_won: 0,
      won_value: 0,
      opportunities_lost: 0,
      roi: null,
      pipeline_per_spend: null,
    };
    rows.set(ch, fresh);
    return fresh;
  };

  for (const opp of opps) {
    const contactId = opp.contacts?.[0]?.id;
    const channel: RoiChannel =
      (contactId && contactChannel.get(contactId)) ||
      (opp.client?.id && clientChannel.get(opp.client.id)) ||
      "okand";
    const row = ensure(channel);
    const state = classifyStage(opp);
    const value = opp.value || 0;
    if (state === "open") {
      row.opportunities_open++;
      row.pipeline_value += value;
    } else if (state === "won") {
      row.opportunities_won++;
      row.won_value += value;
    } else {
      row.opportunities_lost++;
    }
  }

  for (const [ch, count] of leadsByChannel) {
    ensure(ch).leads = count;
  }

  // 5. Spend fran Windsor pa annonskanalerna
  const spendByChannel: Partial<Record<RoiChannel, number>> = {
    google: google.totals.spend,
    meta: meta.totals.spend,
    linkedin: linkedin.totals.spend,
  };
  for (const [ch, spend] of Object.entries(spendByChannel) as Array<[RoiChannel, number]>) {
    const row = ensure(ch);
    row.ad_spend = Math.round(spend);
    if (spend > 0) {
      row.roi = row.won_value > 0 ? row.won_value / spend : 0;
      const total = row.pipeline_value + row.won_value;
      row.pipeline_per_spend = total > 0 ? total / spend : 0;
    }
  }

  const channels = [...rows.values()].sort(
    (a, b) => b.won_value + b.pipeline_value - (a.won_value + a.pipeline_value),
  );

  const totals = {
    ad_spend: channels.reduce((s, c) => s + (c.ad_spend || 0), 0),
    pipeline_value: channels.reduce((s, c) => s + c.pipeline_value, 0),
    won_value: channels.reduce((s, c) => s + c.won_value, 0),
    opportunities: channels.reduce(
      (s, c) => s + c.opportunities_open + c.opportunities_won + c.opportunities_lost,
      0,
    ),
  };

  const result: ChannelRoiResult = {
    lookback_days: lookback,
    channels,
    totals,
    note: "Saljpipeline live fran Upsales (uppdaterad i perioden), kopplad till kundens forsta kanda kalla. Lopande faktura-/clearingordrar ar exkluderade - detta ar nyforsaljning. 'Okand' = ingen sparbar digital kalla (t.ex. saljarens eget natverk) - andelen krymper i takt med att attributions-trackingen samlar data.",
  };

  roiCache.set(lookback, { data: result, ts: Date.now() });
  return result;
}
