// Verktyg for dashboardens AI-agent. Varje verktyg ar en tunn wrapper runt
// samma datalager som dashboardens sidor anvander (Windsor, Supabase
// person-graf, Upsales). Agenten hamtar sjalv det den behover per fraga -
// allt injiceras inte i prompten.

import type Anthropic from "@anthropic-ai/sdk";
import {
  getGooglePerformance,
  getMetaPerformance,
  getLinkedInPerformance,
  getPlatformAds,
  getGoogleKeywords,
  getNamedConversions,
  resolveAccountSet,
  type PlatformPerformance,
} from "@/lib/windsor";
import { getServiceClient } from "@/lib/supabase";
import { getTopBuyingIntent, type BehaviorPattern } from "@/lib/buying-intent";
import { getContacts, getActivities, getKpis } from "@/lib/dashboard-data";
import {
  getLandingPageAnalytics,
  getClearonSeWebTraffic,
  buildWebChannelFlows,
} from "@/lib/web-analytics";

const DAY = 24 * 60 * 60 * 1000;

function clampLookback(n: unknown, fallback = 30): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(365, Math.max(1, Math.round(v)));
}

function compactPlatform(p: PlatformPerformance) {
  return {
    platform: p.platform,
    status: p.status,
    reason: p.reason,
    currency: p.currency,
    totals: {
      spend: Math.round(p.totals.spend),
      impressions: p.totals.impressions,
      clicks: p.totals.clicks,
      conversions: Math.round(p.totals.conversions * 10) / 10,
      cost_per_conversion: p.totals.cost_per_conversion
        ? Math.round(p.totals.cost_per_conversion)
        : null,
      ctr: p.totals.ctr ? Math.round(p.totals.ctr * 100) / 100 : null,
    },
    campaigns: p.campaigns.map((c) => ({
      name: c.name,
      status: c.status,
      spend: Math.round(c.spend),
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: Math.round(c.conversions * 10) / 10,
      cost_per_conversion: c.cost_per_conversion ? Math.round(c.cost_per_conversion) : null,
    })),
  };
}

// ---- Tool-definitioner (Anthropic format) ----

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_ads_overview",
    description:
      "Kampanjniva-prestanda for Google Ads, Meta och LinkedIn fran Windsor.ai. Spend, klick, konverteringar, kostnad/konv per kampanj. Anvand for fragor om annonsprestanda, budget och kampanjstatus.",
    input_schema: {
      type: "object",
      properties: {
        account: {
          type: "string",
          enum: ["clearon", "mobila"],
          description: "Vilket kontoset: clearon (default) eller mobila (Mobila Presentkort)",
        },
        lookback_days: { type: "number", description: "Antal dagar bakat, 1-365. Default 30." },
      },
      required: [],
    },
  },
  {
    name: "get_live_ads",
    description:
      "Enskilda annonser (ad-niva) som ar live just nu, med rubrik, annonstext, ad set, kampanj och metrics. Bara annonser dar hela kedjan (annons + ad set + kampanj) ar aktiv. Anvand for kreativ-analys och fragor om specifika annonser.",
    input_schema: {
      type: "object",
      properties: {
        account: { type: "string", enum: ["clearon", "mobila"] },
        lookback_days: { type: "number", description: "Default 30." },
      },
      required: [],
    },
  },
  {
    name: "get_google_keywords",
    description:
      "Googles sokord (bjudna keywords) och faktiska soktermer med klick, spend, konverteringar och CPA. Anvand for SEM-analys, nya sokordsforslag och negativa sokord.",
    input_schema: {
      type: "object",
      properties: {
        account: { type: "string", enum: ["clearon", "mobila"] },
        lookback_days: { type: "number", description: "Default 30." },
      },
      required: [],
    },
  },
  {
    name: "get_lead_attribution",
    description:
      "Vilka leads som kommit fran vilken annonsplattform och kampanj (via UTM + klick-id fran annonsklicket). Visar aven oattribuerade (organiska) leads. Anvand for fragor om vad annonserna faktiskt levererar i leads.",
    input_schema: {
      type: "object",
      properties: {
        lookback_days: { type: "number", description: "Default 30." },
      },
      required: [],
    },
  },
  {
    name: "get_top_leads",
    description:
      "Personer/leads sorterade pa buying intent (vem ar mest trolig att kopa nu). Innehaller namn, foretag, titel, intent-score, beteendemonster (t.ex. form_converted, pricing_intent, ad_responder), kalla (google/meta/linkedin/email) och om telefon/email finns. Anvand for fragor om leads, vem som ska kontaktas, pipeline.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max antal, default 50, max 200." },
        days: { type: "number", description: "Aktivitetsfonster i dagar, default 90." },
        pattern: {
          type: "string",
          enum: [
            "paying_customer",
            "form_converted",
            "pricing_intent",
            "product_evaluator",
            "deep_browser",
            "mail_engaged",
            "ad_responder",
            "dormant_returning",
            "stalled",
            "new_visitor",
          ],
          description: "Filtrera pa beteendemonster (valfritt).",
        },
      },
      required: [],
    },
  },
  {
    name: "search_person",
    description:
      "Sok efter en specifik person i person-grafen pa namn, email eller foretag. Returnerar matchningar med profil + de senaste handelserna (besok, mail, formular, annonsklick) for basta traffen. Anvand for 'vad vet vi om X?'-fragor.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Namn, email eller foretagsnamn att soka pa." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_crm_contacts",
    description:
      "Kontakter direkt fran Upsales CRM med score, kategori (glass-kampanj, landningssida, MG-leverantor, event m.m.), kalla, status (het/varm/kall) och kontakta-nu-flagga. Anvand for fragor om CRM-leads och Upsales-data.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max antal, default 100, max 200." },
      },
      required: [],
    },
  },
  {
    name: "get_web_analytics",
    description:
      "Webbtrafik: clearon.live-landningssidornas besokare, leads och konverteringsgrad per sida, plus kanalfloden (besokare -> leads -> kvalificerade per kalla). Anvand for fragor om sajttrafik och funnel.",
    input_schema: {
      type: "object",
      properties: {
        lookback_days: { type: "number", description: "Default 30." },
      },
      required: [],
    },
  },
  {
    name: "get_recent_activities",
    description:
      "Senaste salj-aktiviteterna fran Upsales (moten, samtal, uppgifter) med kontakt och foretag. Anvand for fragor om vad saljteamet gjort nyligen.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max antal, default 20." },
      },
      required: [],
    },
  },
  {
    name: "get_kpis",
    description:
      "Dashboardens KPI:er: aktiva leads, heta/varma leads, pipeline-varde fran opportunities, konverteringsgrad besokare->formular. Anvand for oversiktsfragor.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

// ---- Exekvering ----

function deriveAdPlatform(meta: Record<string, unknown>): string | null {
  const explicit = meta.ad_platform as string | null;
  if (explicit) return explicit;
  const src = String(meta.utm_source || "").toLowerCase();
  if (meta.gclid || src.includes("google")) return "google";
  if (meta.fbclid || src.includes("facebook") || src.includes("meta") || src.includes("instagram"))
    return "meta";
  if (meta.li_fat_id || src.includes("linkedin")) return "linkedin";
  if (src) return src;
  return null;
}

export async function executeAgentTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const account = resolveAccountSet((input.account as string) || null);
  const lookback = clampLookback(input.lookback_days);
  const period = { lookback_days: lookback };

  switch (name) {
    case "get_ads_overview": {
      const [google, meta, linkedin] = await Promise.all([
        getGooglePerformance(period, 1800, account),
        getMetaPerformance(period, 1800, account),
        getLinkedInPerformance(period, 1800, account),
      ]);
      return {
        account,
        lookback_days: lookback,
        platforms: [google, meta, linkedin].map(compactPlatform),
      };
    }

    case "get_live_ads": {
      const [google, meta, linkedin, named] = await Promise.all([
        getPlatformAds("google", period, 1800, account),
        getPlatformAds("meta", period, 1800, account),
        getPlatformAds("linkedin", period, 1800, account),
        getNamedConversions(period, 1800, account),
      ]);
      return {
        account,
        lookback_days: lookback,
        platforms: [google, meta, linkedin].map((p) => ({
          platform: p.platform,
          status: p.status,
          reason: p.reason,
          ads: p.ads.map((a) => ({
            name: a.name,
            headline: a.headline,
            body: a.body ? a.body.slice(0, 150) : null,
            status: a.status,
            ad_set: a.group_name,
            campaign: a.campaign_name,
            destination_url: a.destination_url,
            spend: Math.round(a.spend),
            impressions: a.impressions,
            clicks: a.clicks,
            conversions: Math.round(a.conversions * 10) / 10,
            conversion_types: a.conversion_types,
            ctr: a.ctr ? Math.round(a.ctr * 100) / 100 : null,
          })),
        })),
        named_conversions: named.slice(0, 20),
      };
    }

    case "get_google_keywords": {
      const gk = await getGoogleKeywords(period, 1800, account);
      return { account, lookback_days: lookback, ...gk };
    }

    case "get_lead_attribution": {
      const supabase = getServiceClient();
      const since = new Date(Date.now() - lookback * DAY).toISOString();
      const { data } = await supabase
        .from("events")
        .select("person_id, occurred_at, metadata")
        .eq("event_type", "lead_submitted")
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(2000);
      const groups = new Map<
        string,
        { platform: string; utm_campaign: string | null; count: number; leads: string[] }
      >();
      for (const row of data || []) {
        const meta = (row.metadata as Record<string, unknown>) || {};
        const platform = deriveAdPlatform(meta) || "organic";
        const campaign = (meta.utm_campaign as string) || null;
        const key = `${platform}::${campaign || ""}`;
        const g = groups.get(key) || { platform, utm_campaign: campaign, count: 0, leads: [] };
        g.count++;
        const label =
          (meta.lead_name as string) || (meta.lead_company as string) || (meta.company as string);
        if (label && g.leads.length < 10) g.leads.push(label);
        groups.set(key, g);
      }
      return {
        lookback_days: lookback,
        total_leads: (data || []).length,
        groups: Array.from(groups.values()).sort((a, b) => b.count - a.count),
      };
    }

    case "get_top_leads": {
      const supabase = getServiceClient();
      const limit = Math.min(200, Math.max(1, Number(input.limit) || 50));
      const days = clampLookback(input.days, 90);
      const results = await getTopBuyingIntent(supabase, {
        limit,
        lookbackDays: days,
        pattern: (input.pattern as BehaviorPattern) || null,
      });
      return results.map((r) => ({
        name: r.name,
        company: r.company,
        title: r.title,
        has_email: !!r.email,
        has_phone: !!r.phone,
        intent_score: r.intent.intent_score,
        trend: r.intent.trend,
        pattern: r.intent.behavior_pattern,
        source_platform: r.intent.source_platform,
        top_product: r.intent.top_product_slug,
        next_action: r.intent.next_action_hint,
        has_open_opportunity: r.intent.has_open_opportunity,
        recent_signals: r.intent.event_tags.map((t) => t.label),
      }));
    }

    case "search_person": {
      const supabase = getServiceClient();
      const q = String(input.query || "").trim();
      if (!q) return { error: "Tom sokfraga" };
      const { data: persons } = await supabase
        .from("persons")
        .select(
          "id, name, primary_email, primary_phone, title, score, behavior_pattern, first_utm_source, is_customer, account:accounts!persons_account_id_fkey(name, industry, website)",
        )
        .or(`name.ilike.%${q}%,primary_email.ilike.%${q}%`)
        .limit(5);
      // Sok aven pa foretagsnamn
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, name, industry, website")
        .ilike("name", `%${q}%`)
        .limit(3);
      let personsByCompany: typeof persons = [];
      if ((accounts || []).length > 0) {
        const res = await supabase
          .from("persons")
          .select(
            "id, name, primary_email, primary_phone, title, score, behavior_pattern, first_utm_source, is_customer, account:accounts!persons_account_id_fkey(name, industry, website)",
          )
          .in("account_id", (accounts || []).map((a) => a.id))
          .limit(10);
        personsByCompany = res.data || [];
      }
      const all = [...(persons || []), ...personsByCompany].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
      );
      if (all.length === 0) return { matches: [], note: "Ingen person matchade sokningen." };

      // Senaste events for basta traffen
      const { data: events } = await supabase
        .from("events")
        .select("event_type, source, product_slug, occurred_at, metadata")
        .eq("person_id", all[0].id)
        .order("occurred_at", { ascending: false })
        .limit(20);

      return {
        matches: all.map((p) => ({
          name: p.name,
          email: p.primary_email,
          phone: p.primary_phone,
          title: p.title,
          score: p.score,
          pattern: p.behavior_pattern,
          first_source: p.first_utm_source,
          is_customer: p.is_customer,
          company: Array.isArray(p.account) ? p.account[0]?.name : (p.account as { name?: string } | null)?.name,
        })),
        recent_events_for_first_match: (events || []).map((e) => ({
          type: e.event_type,
          source: e.source,
          product: e.product_slug,
          at: e.occurred_at,
          utm_campaign: (e.metadata as Record<string, unknown>)?.utm_campaign || null,
        })),
      };
    }

    case "get_crm_contacts": {
      const limit = Math.min(200, Math.max(1, Number(input.limit) || 100));
      const contacts = await getContacts(limit);
      return contacts.map((c) => ({
        name: c.name,
        company: c.company,
        title: c.title,
        has_email: !!c.email,
        has_phone: !!c.phone,
        score: c.score,
        category: c.categoryLabel,
        source: c.sourceChannel,
        status: c.status,
        contact_now: c.contactNow,
        contact_now_reason: c.contactNowReason || null,
        top_product: c.topProduct,
      }));
    }

    case "get_web_analytics": {
      const [landing, contacts] = await Promise.all([
        getLandingPageAnalytics(lookback),
        getContacts(200),
      ]);
      const seTraffic = getClearonSeWebTraffic(contacts);
      const flows = buildWebChannelFlows(landing, seTraffic);
      return { lookback_days: lookback, landing_pages: landing, channel_flows: flows };
    }

    case "get_recent_activities": {
      const limit = Math.min(50, Math.max(1, Number(input.limit) || 20));
      return getActivities(limit);
    }

    case "get_kpis": {
      return getKpis();
    }

    default:
      return { error: `Okant verktyg: ${name}` };
  }
}

/** Trimma verktygsresultat sa ett enskilt svar inte spranger kontexten. */
export function serializeToolResult(result: unknown, maxChars = 40000): string {
  let s: string;
  try {
    s = JSON.stringify(result);
  } catch {
    s = String(result);
  }
  if (s.length > maxChars) {
    return s.slice(0, maxChars) + `\n...[trunkerat, ${s.length} tecken totalt]`;
  }
  return s;
}
