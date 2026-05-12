import { getServiceClient } from "@/lib/supabase";
import type { DashboardContact } from "@/lib/dashboard-data";
import { products } from "@/lib/products";

// Datakallor for dashboard:
// - clearon.live: Supabase web_sessions + web_events (fylls via /api/tracking).
// - clearon.se: Upsales-kontakter med hasVisit utan landingpage-projekt.
// Cacheas 5 min i modul-scope sa att flera dashboard-sidor inte hammrar Supabase.

const LEAD_EVENT_NAMES = new Set(["lead_submitted", "lead:submit"]);

const ANALYTICS_CACHE_TTL_MS = 5 * 60 * 1000;
const analyticsCache = new Map<string, { ts: number; data: LandingPageAnalytics[] }>();

export interface LandingPageAnalytics {
  path: string;
  product_slug: string | null;
  visitors: number;
  leads: number;
  conversion_rate: number;
  top_source: string;
}

export interface ClearonSeWebTraffic {
  visitors: number;
  leads: number;
  qualified: number;
  contactNow: number;
}

export interface WebChannelFlow {
  channel: string;
  visitors: number;
  leads: number;
  qualified: number;
  opportunities: number;
  deals: number;
  topLandingPage: string;
  topProduct: string;
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function normalizeProductSlug(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  if (value === "clearing") return "clearing-solutions";
  return products.some((product) => product.slug === value) ? value : null;
}

function resolveProductSlug(
  pagePath: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined
): string | null {
  const fromMetadata =
    normalizeProductSlug(metadata?.product) ||
    normalizeProductSlug(metadata?.product_slug);
  if (fromMetadata) return fromMetadata;

  const path = (pagePath || "").trim();
  if (!path) return null;

  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return normalizeProductSlug(last);
}

function resolvePagePath(
  pagePath: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined
): string {
  const explicitPath =
    typeof metadata?.page_path === "string" ? metadata.page_path : pagePath;
  const productSlug = resolveProductSlug(explicitPath, metadata);

  if (productSlug) {
    const product = products.find((item) => item.slug === productSlug);
    if (product) {
      try {
        return new URL(product.landingPageUrl).pathname;
      } catch {
        return `/${productSlug}`;
      }
    }
    return `/${productSlug}`;
  }

  if (explicitPath && explicitPath.startsWith("/")) return explicitPath;
  if (explicitPath) return `/${explicitPath}`;
  return "/";
}

function isLeadEvent(eventName: string) {
  return LEAD_EVENT_NAMES.has(eventName);
}

export function isClearonSeVisitor(contact: DashboardContact): boolean {
  if (!contact.hasVisit) return false;
  if (contact.category === "landing_page" || contact.category === "glass_lead") {
    return false;
  }

  const hasLandingProject = contact.projects.some((project) =>
    project.toLowerCase().includes("landingpage")
  );
  return !hasLandingProject;
}

export function getClearonSeWebTraffic(contacts: DashboardContact[]): ClearonSeWebTraffic {
  const visitors = contacts.filter(isClearonSeVisitor);

  return {
    visitors: visitors.length,
    leads: visitors.filter((contact) => contact.hasForm).length,
    qualified: visitors.filter(
      (contact) => contact.status === "warm" || contact.status === "hot"
    ).length,
    contactNow: visitors.filter((contact) => contact.contactNow).length,
  };
}

export function clearWebAnalyticsCache() {
  analyticsCache.clear();
}

export async function getLandingPageAnalytics(
  lookbackDays = 30
): Promise<LandingPageAnalytics[]> {
  if (!hasSupabaseConfig()) return [];

  const cacheKey = `landing-${lookbackDays}`;
  const cached = analyticsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < ANALYTICS_CACHE_TTL_MS) {
    return cached.data;
  }

  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);
  const sinceIso = since.toISOString();

  try {
    const supabase = getServiceClient();
    const [{ data: sessions, error: sessionsError }, { data: events, error: eventsError }] =
      await Promise.all([
        supabase
          .from("web_sessions")
          .select("id, page_path, source, medium, campaign, anonymous_id, timestamp")
          .gte("timestamp", sinceIso),
        supabase
          .from("web_events")
          .select("session_id, event_name, page_path, metadata, timestamp")
          .gte("timestamp", sinceIso),
      ]);

    if (sessionsError || eventsError) {
      console.error("Landing analytics query error:", sessionsError || eventsError);
      return [];
    }

    const sessionById = new Map<
      string,
      { page_path: string | null; source: string | null; anonymous_id: string | null }
    >();
    const sessionIdsByAnonymous = new Map<string, Set<string>>();

    for (const session of sessions || []) {
      sessionById.set(session.id, {
        page_path: session.page_path,
        source: session.source,
        anonymous_id: session.anonymous_id,
      });

      if (session.anonymous_id) {
        const existing = sessionIdsByAnonymous.get(session.anonymous_id) || new Set<string>();
        existing.add(session.id);
        sessionIdsByAnonymous.set(session.anonymous_id, existing);
      }
    }

    type Bucket = {
      path: string;
      product_slug: string | null;
      sessionIds: Set<string>;
      leadSessionIds: Set<string>;
      sourceCounts: Map<string, number>;
    };

    const buckets = new Map<string, Bucket>();

    const getBucket = (path: string, productSlug: string | null) => {
      const key = `${path}::${productSlug || "none"}`;
      const existing = buckets.get(key);
      if (existing) return existing;

      const bucket: Bucket = {
        path,
        product_slug: productSlug,
        sessionIds: new Set<string>(),
        leadSessionIds: new Set<string>(),
        sourceCounts: new Map<string, number>(),
      };
      buckets.set(key, bucket);
      return bucket;
    };

    for (const session of sessions || []) {
      const productSlug = resolveProductSlug(session.page_path, null);
      const path = resolvePagePath(session.page_path, { page_path: session.page_path });
      const bucket = getBucket(path, productSlug);
      bucket.sessionIds.add(session.id);

      const source = session.source || "Direkt";
      bucket.sourceCounts.set(source, (bucket.sourceCounts.get(source) || 0) + 1);
    }

    for (const event of events || []) {
      const metadata = (event.metadata || {}) as Record<string, unknown>;
      const session = event.session_id ? sessionById.get(event.session_id) : undefined;
      const productSlug = resolveProductSlug(event.page_path || session?.page_path, metadata);
      const path = resolvePagePath(event.page_path || session?.page_path, metadata);
      const bucket = getBucket(path, productSlug);

      if (event.session_id) {
        bucket.sessionIds.add(event.session_id);
      }

      if (isLeadEvent(event.event_name) && event.session_id) {
        bucket.leadSessionIds.add(event.session_id);
      }
    }

    const result = [...buckets.values()]
      .map((bucket) => {
        const visitors = bucket.sessionIds.size;
        const leads = bucket.leadSessionIds.size;
        const conversionRate =
          visitors > 0 ? Math.round((leads / visitors) * 1000) / 10 : 0;
        const topSource =
          [...bucket.sourceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "Direkt";

        return {
          path: bucket.path,
          product_slug: bucket.product_slug,
          visitors,
          leads,
          conversion_rate: conversionRate,
          top_source: topSource,
        };
      })
      .filter((row) => row.visitors > 0 || row.leads > 0)
      .sort((a, b) => b.visitors - a.visitors);

    analyticsCache.set(cacheKey, { ts: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error("Landing analytics error:", error);
    return [];
  }
}

export function getTotalLiveTraffic(rows: LandingPageAnalytics[]) {
  const visitors = rows.reduce((sum, row) => sum + row.visitors, 0);
  const leads = rows.reduce((sum, row) => sum + row.leads, 0);
  const conversionRate =
    visitors > 0 ? Math.round((leads / visitors) * 1000) / 10 : 0;
  return { visitors, leads, conversion_rate: conversionRate };
}

export function buildWebChannelFlows(
  landingStats: LandingPageAnalytics[],
  clearonSe: ClearonSeWebTraffic
): WebChannelFlow[] {
  const liveVisitors = landingStats.reduce((sum, row) => sum + row.visitors, 0);
  const liveLeads = landingStats.reduce((sum, row) => sum + row.leads, 0);
  const topLanding = [...landingStats].sort((a, b) => b.visitors - a.visitors)[0];

  const flows: WebChannelFlow[] = [];

  if (liveVisitors > 0 || liveLeads > 0) {
    flows.push({
      channel: "clearon.live",
      visitors: liveVisitors,
      leads: liveLeads,
      qualified: liveLeads,
      opportunities: 0,
      deals: 0,
      topLandingPage: topLanding?.path || "/",
      topProduct: topLanding?.product_slug
        ? products.find((product) => product.slug === topLanding.product_slug)?.name ||
          topLanding.product_slug
        : "-",
    });
  }

  if (clearonSe.visitors > 0 || clearonSe.leads > 0) {
    flows.push({
      channel: "clearon.se (Upsales)",
      visitors: clearonSe.visitors,
      leads: clearonSe.leads,
      qualified: clearonSe.qualified,
      opportunities: 0,
      deals: 0,
      topLandingPage: "clearon.se",
      topProduct: "-",
    });
  }

  return flows;
}

export function mergeLandingStats(
  live: LandingPageAnalytics | null,
  upsales: {
    visitors: number;
    leads: number;
    conversion_rate: number;
    top_source: string;
  }
) {
  if (!live) return upsales;

  return {
    visitors: live.visitors || upsales.visitors,
    leads: live.leads || upsales.leads,
    conversion_rate: live.conversion_rate || upsales.conversion_rate,
    top_source: live.top_source || upsales.top_source,
  };
}

export function getLandingAnalyticsForProduct(
  landingStats: LandingPageAnalytics[],
  productSlug: string
): LandingPageAnalytics | null {
  const product = products.find((item) => item.slug === productSlug);
  const expectedPath = product
    ? (() => {
        try {
          return new URL(product.landingPageUrl).pathname;
        } catch {
          return `/${productSlug}`;
        }
      })()
    : `/${productSlug}`;

  return (
    landingStats.find(
      (row) => row.product_slug === productSlug || row.path === expectedPath
    ) || null
  );
}
