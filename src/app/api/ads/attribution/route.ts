import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Leads per annonskalla. Grupperar lead_submitted-events pa plattform +
 * kampanj utifran attribution som /api/leads loggar i events.metadata
 * (utm_* + gclid/fbclid/li_fat_id). Leads utan annons-attribution hamnar i
 * gruppen "organic" sa totalen alltid stammer.
 */

interface LeadEventRow {
  id: string;
  person_id: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

interface AttributedLead {
  person_id: string | null;
  name: string | null;
  company: string | null;
  occurred_at: string;
}

interface SourceGroup {
  platform: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  count: number;
  leads: AttributedLead[];
}

function derivePlatform(meta: Record<string, unknown>): string | null {
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lookback = Math.min(Math.max(Number(url.searchParams.get("lookback")) || 30, 1), 365);
  const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, person_id, occurred_at, metadata")
    .eq("event_type", "lead_submitted")
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("attribution query error:", error);
    return NextResponse.json({ error: "query-failed" }, { status: 500 });
  }

  const rows = (data || []) as LeadEventRow[];

  const groups = new Map<string, SourceGroup>();
  let attributed = 0;

  for (const row of rows) {
    const meta = row.metadata || {};
    const platform = derivePlatform(meta);
    const utmCampaign = (meta.utm_campaign as string) || null;
    const utmSource = (meta.utm_source as string) || null;
    const utmContent = (meta.utm_content as string) || null;
    if (platform) attributed++;

    const key = `${platform || "organic"}::${utmCampaign || ""}`;
    const group = groups.get(key) || {
      platform: platform || "organic",
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      count: 0,
      leads: [],
    };
    group.count++;
    group.leads.push({
      person_id: row.person_id,
      name: (meta.lead_name as string) || null,
      company: (meta.lead_company as string) || (meta.company as string) || null,
      occurred_at: row.occurred_at,
    });
    groups.set(key, group);
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    // Annons-attribuerade grupper forst, sen storst forst
    if ((a.platform === "organic") !== (b.platform === "organic")) {
      return a.platform === "organic" ? 1 : -1;
    }
    return b.count - a.count;
  });

  return NextResponse.json({
    period: { lookback_days: lookback, since },
    total_leads: rows.length,
    attributed_leads: attributed,
    groups: sorted,
  });
}
