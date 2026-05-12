import { NextResponse } from "next/server";
import {
  getContacts,
  clearCache,
  lastFetchDebug,
} from "@/lib/dashboard-data";
import {
  clearWebAnalyticsCache,
  getClearonSeWebTraffic,
  getLandingPageAnalytics,
  isClearonSeVisitor,
} from "@/lib/web-analytics";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function supabaseDebug() {
  if (!hasSupabaseEnv()) {
    return { configured: false };
  }
  try {
    const supabase = getServiceClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [sessions, events, latestEvents] = await Promise.all([
      supabase
        .from("web_sessions")
        .select("id", { count: "exact", head: true })
        .gte("timestamp", sinceIso),
      supabase
        .from("web_events")
        .select("id", { count: "exact", head: true })
        .gte("timestamp", sinceIso),
      supabase
        .from("web_events")
        .select("event_name, page_path, timestamp")
        .gte("timestamp", sinceIso)
        .order("timestamp", { ascending: false })
        .limit(5),
    ]);

    return {
      configured: true,
      sessions_30d: sessions.count ?? 0,
      events_30d: events.count ?? 0,
      latest_events: latestEvents.data ?? [],
      sessions_error: sessions.error?.message,
      events_error: events.error?.message,
    };
  } catch (e) {
    return { configured: true, error: String(e) };
  }
}

export async function GET() {
  clearCache();
  clearWebAnalyticsCache();

  let result: Awaited<ReturnType<typeof getContacts>> = [];
  let error: string | null = null;
  try {
    result = await getContacts(200);
  } catch (e) {
    error = e instanceof Error ? e.message + "\n" + e.stack : String(e);
  }

  const clearonSeTraffic = getClearonSeWebTraffic(result);
  const clearonSeVisitors = result.filter(isClearonSeVisitor).length;
  const landing = await getLandingPageAnalytics(30);
  const supa = await supabaseDebug();

  return NextResponse.json({
    upsales: {
      envAvailable: !!process.env.UPSALES_API_KEY,
      contactCount: result?.length,
      error: error || null,
      first3: (result || []).slice(0, 3).map((c) => ({
        name: c.name,
        company: c.company,
        score: c.score,
        category: c.category,
      })),
      lastFetchDebug,
    },
    clearon_se: {
      ...clearonSeTraffic,
      visitorsRaw: clearonSeVisitors,
    },
    clearon_live: {
      landingPages: landing.length,
      totalVisitors: landing.reduce((sum, row) => sum + row.visitors, 0),
      totalLeads: landing.reduce((sum, row) => sum + row.leads, 0),
      rows: landing,
    },
    supabase: supa,
  });
}
