import { NextResponse } from "next/server";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
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
import { relayInBackground, type RelayContext } from "@/lib/capi";

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function clientIpFull(request: Request): string | undefined {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  return real || undefined;
}

function buildEventSourceUrl(request: Request, pagePath: string | undefined): string {
  const origin = request.headers.get("origin") || request.headers.get("referer");
  if (origin) {
    try {
      const u = new URL(origin);
      return `${u.protocol}//${u.host}${pagePath || u.pathname}`;
    } catch {
      // fall through
    }
  }
  const host = request.headers.get("host") || "clearon.live";
  return `https://${host}${pagePath || "/"}`;
}

/**
 * Verifiera mail-länk-token. Upsales-mail-länkar genereras med
 *   HMAC-SHA256(MAIL_LINK_SECRET, payload).slice(0, 32) i hex
 * (kan trunkeras till ~12 tecken om URL-längd är problem).
 * Returnerar true om sign saknas och secret saknas, eller om sign matchar.
 */
async function verifyMailSig(
  payload: string,
  sig: string | null,
  secret: string,
): Promise<boolean> {
  if (!sig) return false;
  try {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected.slice(0, sig.length));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Extrahera klient-IP och tilbakaprefix till /24 (de första 3 oktetterna)
 * för IPv4 eller /48 för IPv6. Trunkering = GDPR-safe pseudonymisering.
 */
function clientIpPrefix(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  if (!ip) return null;
  if (ip.includes(":")) {
    // IPv6 — ta de första 3 grupperna (~/48)
    return ip.split(":").slice(0, 3).join(":") + "::/48";
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

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
    const { sessionId, visitorId, eventName, properties, eventId: eventIdFromBody } = body;

    if (!sessionId || !eventName) {
      return NextResponse.json(
        { error: "Missing sessionId or eventName" },
        { status: 400 }
      );
    }

    const eventId: string = eventIdFromBody || randomUUID();

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
      const ipPrefix = clientIpPrefix(request);
      const { data: newSession, error: sessionError } = await supabase
        .from("web_sessions")
        .insert({
          anonymous_id: sessionId,
          visitor_id: visitorId || null,
          page_path: pagePath,
          source: (props.utm_source as string) || null,
          medium: (props.utm_medium as string) || null,
          campaign: (props.utm_campaign as string) || null,
          ip_prefix: ipPrefix,
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
    // Identifierings-token från mail-länk: clearon_pid (upsales_contact_id)
    // eller clearon_email (base64-kodad). Verifierar HMAC om MAIL_LINK_SECRET
    // är satt, annars accepteras token "best-effort" (mail-mottagaren har
    // ändå verifierats av Upsales mail-system).
    let upsalesContactId: number | null = null;
    let identifiedEmail: string | null = null;
    let identMethod: string | null = null;

    const cleronPid = (props.clearon_pid as string) || null;
    const clearonEmail = (props.clearon_email as string) || null;
    const clearonSig = (props.clearon_sig as string) || null;

    if (cleronPid) {
      const pidNum = Number(cleronPid);
      if (Number.isFinite(pidNum) && pidNum > 0) {
        const mailSecret = (process.env.MAIL_LINK_SECRET || "").trim();
        if (!mailSecret || (await verifyMailSig(cleronPid, clearonSig, mailSecret))) {
          upsalesContactId = pidNum;
          identMethod = "mail_link";
        }
      }
    }
    if (clearonEmail) {
      try {
        const decoded = Buffer.from(clearonEmail, "base64").toString("utf-8");
        if (decoded.includes("@") && decoded.length < 200) {
          const mailSecret = (process.env.MAIL_LINK_SECRET || "").trim();
          if (!mailSecret || (await verifyMailSig(clearonEmail, clearonSig, mailSecret))) {
            identifiedEmail = decoded.toLowerCase();
            identMethod = identMethod || "mail_link";
          }
        }
      } catch {
        // bad base64, ignore
      }
    }

    if (visitorId) {
      const personId = await resolveOrCreatePerson(
        supabase,
        {
          visitor_cookie: visitorId,
          upsales_contact_id: upsalesContactId,
          email: identifiedEmail,
        },
        {
          source: identMethod === "mail_link" ? "mail_link" : "web",
          first_utm_source: (props.utm_source as string) || null,
          first_utm_campaign: (props.utm_campaign as string) || null,
          first_referrer: (props.referrer as string) || null,
        }
      );
      if (personId && identMethod) {
        // Markera identifierings-metoden om personen blev nyligen identifierad
        await supabase
          .from("persons")
          .update({
            identification_method: identMethod,
            identification_confidence: 0.95,
            updated_at: new Date().toISOString(),
          })
          .eq("id", personId)
          .is("identification_method", null);
      }
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

    // --- 4. Fan-out till Meta CAPI + LinkedIn CAPI (fire-and-forget) ---
    const cookieHeader = request.headers.get("cookie");
    const relayCtx: RelayContext = {
      eventName,
      eventId,
      eventTimeSeconds: Math.floor(Date.now() / 1000),
      eventSourceUrl: buildEventSourceUrl(
        request,
        (props.page_path as string) || (props.page_section as string)
      ),
      clientIpAddress: clientIpFull(request),
      clientUserAgent: request.headers.get("user-agent") || undefined,
      fbp: readCookie(cookieHeader, "_fbp"),
      fbc: readCookie(cookieHeader, "_fbc"),
      liFatId: readCookie(cookieHeader, "li_fat_id"),
      email: (identifiedEmail as string | null) || (props.email as string) || undefined,
      phone: (props.phone as string) || undefined,
      visitorId: visitorId || undefined,
      properties: props,
    };
    void relayInBackground(relayCtx);

    return NextResponse.json({ success: true, eventId: eventData?.id, capiEventId: eventId });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
