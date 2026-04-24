import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  ENGAGEMENT_POINTS,
  INTENT_POINTS,
  computeDemoReadiness,
  computeSegment,
  productAffinityFromEvent,
} from "@/lib/scoring";
import { resolveOrCreatePerson } from "@/lib/identity";
import { logEvent } from "@/lib/events";

interface VisitorRow {
  id: string;
  visitor_id: string;
  contact_id: string | null;
  email: string | null;
  company: string | null;
  visits_count: number;
  events_count: number;
  pages_viewed: number;
  max_scroll_depth: number;
  total_dwell_seconds: number;
  score: number;
  engagement_score: number;
  intent_score: number;
  product_affinities: Record<string, number> | null;
  last_seen: string | null;
  first_utm_source: string | null;
  first_utm_medium: string | null;
  first_utm_campaign: string | null;
  first_referrer: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, visitorId, eventName, properties } = body;

    if (!sessionId || !eventName) {
      return NextResponse.json(
        { error: "Missing sessionId or eventName" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const props = (properties as Record<string, unknown>) || {};

    // --- 1. Parallella lookups: session + visitor samtidigt ---
    const [sessionRes, visitorRes] = await Promise.all([
      supabase
        .from("web_sessions")
        .select("id")
        .eq("anonymous_id", sessionId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle(),
      visitorId
        ? supabase
            .from("visitors")
            .select(
              "id, visitor_id, contact_id, email, company, visits_count, events_count, pages_viewed, max_scroll_depth, total_dwell_seconds, score, engagement_score, intent_score, product_affinities, last_seen, first_utm_source, first_utm_medium, first_utm_campaign, first_referrer"
            )
            .eq("visitor_id", visitorId)
            .maybeSingle<VisitorRow>()
        : Promise.resolve({ data: null }),
    ]);

    const existingSession = sessionRes.data;

    let webSessionId = existingSession?.id;

    if (!webSessionId) {
      const pagePath = (props.page_section as string) || "/landing";
      const { data: newSession, error: sessionError } = await supabase
        .from("web_sessions")
        .insert({
          anonymous_id: sessionId,
          visitor_id: visitorId || null,
          page_path: pagePath,
          source: (props.utm_source as string) || null,
          medium: (props.utm_medium as string) || null,
          campaign: (props.utm_campaign as string) || null,
          duration_seconds: 0,
          timestamp: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error("Session create error:", sessionError);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
      }
      webSessionId = newSession?.id;
    }

    // --- 2a. Insert event into web_events (legacy) ---
    const { data: eventData, error: eventError } = await supabase
      .from("web_events")
      .insert({
        session_id: webSessionId,
        event_name: eventName,
        page_path: (props.page_section as string) || "/landing",
        metadata: { ...props, visitor_id: visitorId || null },
        timestamp: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (eventError) {
      console.error("web_events insert error:", eventError);
    }

    // --- 2b. Resolve person + logga i nya events-tabellen (person graph) ---
    if (visitorId) {
      const personId = await resolveOrCreatePerson(
        supabase,
        { visitor_cookie: visitorId },
        {
          source: "web",
          first_utm_source: (props.utm_source as string) || null,
          first_utm_campaign: (props.utm_campaign as string) || null,
          first_referrer: (props.referrer as string) || null,
        }
      );
      if (personId) {
        const productSlug =
          (props.product as string) ||
          (props.product_slug as string) ||
          null;
        await logEvent(supabase, {
          person_id: personId,
          source: "web",
          event_type: eventName,
          product_slug: productSlug,
          metadata: props,
        });
      }
    }

    // --- 3. Upsert visitor + compute scoring (återanvänder parallell lookup) ---
    if (visitorId) {
      const existing = (visitorRes as { data: VisitorRow | null }).data;

      const engagementDelta = ENGAGEMENT_POINTS[eventName] ?? 0;
      const intentDelta = INTENT_POINTS[eventName] ?? 0;
      const affinity = productAffinityFromEvent(eventName, props);

      const now = new Date();
      const isPageView = eventName === "page_view";
      const scrollDepth = eventName === "scroll_depth"
        ? Number(props.depth) || 0
        : 0;

      if (!existing) {
        // First visit ever — skapa raden
        const initialAffinity = affinity
          ? { [affinity.product]: affinity.points }
          : {};
        const initialEngagement = Math.max(0, engagementDelta);
        const initialIntent = Math.max(0, intentDelta);
        const totalScore = initialEngagement + initialIntent;

        const demoReadiness = computeDemoReadiness({
          intentScore: initialIntent,
          engagementScore: initialEngagement,
          visitsCount: 1,
          maxScrollDepth: scrollDepth,
          dwellSeconds: 0,
          hasIdentified: false,
          hasCompany: false,
        });

        await supabase.from("visitors").insert({
          visitor_id: visitorId,
          first_seen: now.toISOString(),
          last_seen: now.toISOString(),
          visits_count: 1,
          events_count: 1,
          pages_viewed: isPageView ? 1 : 0,
          max_scroll_depth: scrollDepth,
          total_dwell_seconds: 0,
          score: totalScore,
          engagement_score: initialEngagement,
          intent_score: initialIntent,
          demo_readiness: demoReadiness,
          segment: computeSegment(totalScore),
          product_affinities: initialAffinity,
          signals: [
            {
              type: eventName,
              points: engagementDelta + intentDelta,
              timestamp: now.toISOString(),
            },
          ],
          first_utm_source: (props.utm_source as string) || null,
          first_utm_medium: (props.utm_medium as string) || null,
          first_utm_campaign: (props.utm_campaign as string) || null,
          first_referrer: (props.referrer as string) || null,
        });
      } else {
        // Uppdatera befintlig visitor
        const lastSeenAt = existing.last_seen ? new Date(existing.last_seen) : now;
        const hoursSinceLastSeen =
          (now.getTime() - lastSeenAt.getTime()) / (1000 * 60 * 60);
        const isNewVisit = hoursSinceLastSeen > 0.5; // ny session om >30 min sedan senaste event

        const returnVisitBonus = isNewVisit ? INTENT_POINTS.return_visit || 0 : 0;

        const newEngagement = existing.engagement_score + Math.max(0, engagementDelta);
        const newIntent = existing.intent_score + Math.max(0, intentDelta) + returnVisitBonus;
        const newTotal = existing.score + engagementDelta + intentDelta + returnVisitBonus;

        const affinities = { ...(existing.product_affinities || {}) };
        if (affinity) {
          affinities[affinity.product] = (affinities[affinity.product] || 0) + affinity.points;
        }

        const newMaxScroll = Math.max(existing.max_scroll_depth, scrollDepth);
        const newPagesViewed = existing.pages_viewed + (isPageView ? 1 : 0);
        const newVisitsCount = existing.visits_count + (isNewVisit ? 1 : 0);
        const dwellBump = isNewVisit ? 0 : 30; // grov uppskattning: +30s per nytt event i samma session

        const demoReadiness = computeDemoReadiness({
          intentScore: newIntent,
          engagementScore: newEngagement,
          visitsCount: newVisitsCount,
          maxScrollDepth: newMaxScroll,
          dwellSeconds: existing.total_dwell_seconds + dwellBump,
          hasIdentified: !!existing.contact_id || !!existing.email,
          hasCompany: !!existing.company,
        });

        await supabase
          .from("visitors")
          .update({
            last_seen: now.toISOString(),
            visits_count: newVisitsCount,
            events_count: existing.events_count + 1,
            pages_viewed: newPagesViewed,
            max_scroll_depth: newMaxScroll,
            total_dwell_seconds: existing.total_dwell_seconds + dwellBump,
            score: Math.max(0, newTotal),
            engagement_score: Math.max(0, newEngagement),
            intent_score: Math.max(0, newIntent),
            demo_readiness: demoReadiness,
            segment: computeSegment(newTotal),
            product_affinities: affinities,
            updated_at: now.toISOString(),
          })
          .eq("visitor_id", visitorId);
      }

      // Koppla sessionens visitor_id om det saknades
      if (webSessionId) {
        await supabase
          .from("web_sessions")
          .update({ visitor_id: visitorId })
          .eq("id", webSessionId)
          .is("visitor_id", null);
      }
    }

    return NextResponse.json({ success: true, eventId: eventData?.id });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
