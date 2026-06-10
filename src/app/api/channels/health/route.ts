// Aggregera kanal-hälsa över alla källor i en endpoint.
// För /kanaler-sidans översta sektion: "vilka kanaler är live, vilka genererar något".

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

interface ChannelHealth {
  id: string;
  name: string;
  category: "web" | "ads" | "email";
  status: "live" | "paused" | "inactive" | "unknown";
  spend: number | null;
  currency: string;
  visitors: number | null;
  leads: number | null;
  clicks: number | null;
  conversions: number | null;
  cost_per_conversion: number | null;
  campaigns_active: number | null;
  campaigns_total: number | null;
  note: string | null;
}

// Samma harledning som /api/ads/attribution - vilken plattform kom leadet fran
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lookback = Math.min(180, Math.max(1, Number(url.searchParams.get("lookback")) || 30));
    const since = new Date(Date.now() - lookback * DAY).toISOString();

    const supabase = getServiceClient();

    // 1. Hämta Ads-data (Windsor) (Google, Meta, LinkedIn live)
    const baseUrl = new URL(request.url);
    const adsUrl = `${baseUrl.protocol}//${baseUrl.host}/api/ads/overview?lookback=${lookback}`;
    let ads: {
      platforms?: Array<{
        platform: string;
        status: string;
        currency: string;
        reason: string | null;
        totals: {
          spend: number;
          impressions: number;
          clicks: number;
          conversions: number;
          campaigns: number;
        };
        campaigns: Array<{ status?: string | null }>;
      }>;
    } = {};
    try {
      const res = await fetch(adsUrl, { cache: "no-store" });
      if (res.ok) ads = await res.json();
    } catch {
      // ignore
    }

    // 2. Hämta web-data (clearon.live från web_sessions, clearon.se från Upsales-events)
    const [webSessionsRes, leadEventsRes, leadAttributionRes, upsalesVisitsRes, mailEventsRes, mailCampaignsRes] =
      await Promise.all([
        supabase
          .from("web_sessions")
          .select("anonymous_id", { count: "exact", head: true })
          .gte("timestamp", since),
        supabase
          .from("events")
          .select("person_id", { count: "exact", head: true })
          .in("event_type", ["lead_submitted", "form_submit"])
          .gte("occurred_at", since),
        supabase
          .from("events")
          .select("metadata")
          .eq("event_type", "lead_submitted")
          .gte("occurred_at", since)
          .limit(2000),
        supabase
          .from("events")
          .select("account_id", { count: "exact", head: true })
          .in("event_type", [
            "upsales_visit_page",
            "upsales_visit_contact_page",
            "upsales_visit_pricing_page",
            "upsales_visit_product_page",
            "upsales_visit_return",
          ])
          .gte("occurred_at", since),
        supabase
          .from("events")
          .select("event_type", { count: "exact" })
          .in("event_type", ["mail_open", "mail_click"])
          .gte("occurred_at", since),
        supabase
          .from("ad_campaigns")
          .select("status, leads_generated, impressions, clicks")
          .eq("platform", "email"),
      ]);

    // Räkna unika events per typ (open/click)
    const mailOpenCount = (mailEventsRes.data || []).filter(
      (e) => e.event_type === "mail_open",
    ).length;
    const mailClickCount = (mailEventsRes.data || []).filter(
      (e) => e.event_type === "mail_click",
    ).length;

    // Leads per annonsplattform fran attributionen pa lead-eventen
    const leadsByPlatform = new Map<string, number>();
    for (const row of leadAttributionRes.data || []) {
      const platform = deriveAdPlatform((row.metadata as Record<string, unknown>) || {});
      if (platform) leadsByPlatform.set(platform, (leadsByPlatform.get(platform) || 0) + 1);
    }

    const channels: ChannelHealth[] = [];

    // clearon.live (web)
    const liveVisitors = webSessionsRes.count || 0;
    const liveLeads = leadEventsRes.count || 0;
    channels.push({
      id: "clearon_live",
      name: "clearon.live",
      category: "web",
      status: liveVisitors > 0 ? "live" : "inactive",
      spend: null,
      currency: "SEK",
      visitors: liveVisitors,
      leads: liveLeads,
      clicks: null,
      conversions: null,
      cost_per_conversion: null,
      campaigns_active: null,
      campaigns_total: null,
      note: liveVisitors === 0 ? "Ingen trafik registrerad i perioden" : null,
    });

    // clearon.se (Upsales web-tracking)
    const upsalesVisits = upsalesVisitsRes.count || 0;
    channels.push({
      id: "clearon_se",
      name: "clearon.se",
      category: "web",
      status: upsalesVisits > 0 ? "live" : "inactive",
      spend: null,
      currency: "SEK",
      visitors: upsalesVisits,
      leads: null,
      clicks: null,
      conversions: null,
      cost_per_conversion: null,
      campaigns_active: null,
      campaigns_total: null,
      note: upsalesVisits === 0 ? "Inga IP-identifierade besök i perioden" : "IP-identifierade besök via Upsales",
    });

    // Email (Upsales mail)
    const emailCampaigns = mailCampaignsRes.data || [];
    const emailActive = emailCampaigns.filter(
      (c) => (c.status as string)?.toLowerCase().includes("active"),
    ).length;
    channels.push({
      id: "email",
      name: "Upsales Mail",
      category: "email",
      status: mailOpenCount + mailClickCount > 0 ? "live" : emailCampaigns.length > 0 ? "paused" : "inactive",
      spend: null,
      currency: "SEK",
      visitors: null,
      leads: null,
      clicks: mailClickCount,
      conversions: null,
      cost_per_conversion: null,
      campaigns_active: emailActive,
      campaigns_total: emailCampaigns.length,
      note: `${mailOpenCount} öppningar · ${mailClickCount} klick i perioden`,
    });

    // Ads (Google, Meta, LinkedIn fran Windsor)
    for (const p of ads.platforms || []) {
      const totals = p.totals;
      // Google rapporterar "ENABLED", Meta/LinkedIn "ACTIVE"
      const activeCampaigns = p.campaigns.filter((c) => {
        const s = (c.status as string | null)?.toLowerCase() || "";
        return s === "active" || s === "enabled";
      }).length;
      const platformName =
        p.platform === "google"
          ? "Google Ads"
          : p.platform === "meta"
            ? "Meta Ads"
            : p.platform === "linkedin"
              ? "LinkedIn Ads"
              : p.platform;

      let status: ChannelHealth["status"] = "unknown";
      if (p.status === "live") {
        status = totals.spend > 0 ? "live" : activeCampaigns > 0 ? "live" : "paused";
      } else if (p.status === "structure_only") {
        status = "paused";
      } else if (p.status === "no_data" || p.status === "unavailable") {
        status = "inactive";
      }

      channels.push({
        id: `ads_${p.platform}`,
        name: platformName,
        category: "ads",
        status,
        spend: totals.spend,
        currency: p.currency,
        visitors: null,
        leads: leadsByPlatform.get(p.platform) || 0,
        clicks: totals.clicks,
        conversions: totals.conversions,
        cost_per_conversion:
          totals.conversions > 0 ? totals.spend / totals.conversions : null,
        campaigns_active: activeCampaigns,
        campaigns_total: p.campaigns.length,
        note: p.status === "structure_only" ? "Windsor synkar dagligt" : p.reason,
      });
    }

    return NextResponse.json({
      lookback,
      period_start: since,
      period_end: new Date().toISOString(),
      channels,
    });
  } catch (e) {
    console.error("channels/health error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
