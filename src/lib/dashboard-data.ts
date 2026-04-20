// Real data layer for the dashboard
// Fetches from Upsales CRM and combines with web tracking data
// Scoring is designed to be extensible with Google Ads, Meta, LinkedIn data

import { products } from "./products";

const UPSALES_TOKEN = process.env.UPSALES_API_KEY || "";
const BASE = "https://power.upsales.com/api/v2";

// ---- In-memory cache (5 min TTL) ----
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T;
  }
  try {
    const data = await fetcher();
    cache.set(key, { data, ts: Date.now() });
    return data;
  } catch (e) {
    console.error(`Dashboard data fetch error for ${key}:`, e);
    return fallback;
  }
}

async function upsalesGet(path: string, params?: Record<string, string>) {
  const u = new URL(`${BASE}${path}`);
  u.searchParams.set("token", UPSALES_TOKEN);
  if (params) {
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  }
  const res = await fetch(u.toString(), { cache: "no-store" });
  if (!res.ok) {
    console.error(`Upsales API error: ${res.status} ${res.statusText} for ${path}`);
    return { data: [], metadata: { total: 0 } };
  }
  return res.json();
}

// ---- Types ----

export interface DashboardContact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  company: string;
  companyId: number | null;
  score: number;
  journeyStep: string;
  hasVisit: boolean;
  hasForm: boolean;
  hasMail: boolean;
  segments: string[];
  regDate: string;
  modDate: string;
  // Computed fields
  status: "hot" | "warm" | "cold";
  contactNow: boolean;
  contactNowReason: string;
  topProduct: string | null;
  sourceChannel: string;
}

export interface DashboardKpis {
  activeLeads: { value: number; change: number; period: string };
  hotLeads: { value: number; change: number; period: string };
  pipelineValue: { value: number; change: number; period: string };
  conversionRate: { value: number; change: number; period: string };
}

export interface DashboardActivity {
  id: number;
  date: string;
  description: string;
  type: string;
  contactName: string;
  company: string;
}

// ---- Scoring logic ----
// Designed to be extensible: each source adds points
// Current: Upsales score (visits, forms, mail)
// Future: + Google Ads clicks, + Meta engagement, + LinkedIn interactions

function computeStatus(score: number): "hot" | "warm" | "cold" {
  if (score >= 100) return "hot";
  if (score >= 30) return "warm";
  return "cold";
}

function computeContactNow(contact: {
  score: number;
  hasVisit: boolean;
  hasForm: boolean;
  segments: string[];
}): { should: boolean; reason: string } {
  // Hot with recent visit
  if (contact.score >= 100 && contact.hasVisit) {
    return { should: true, reason: "Hog score + besökt webbplatsen" };
  }
  // Form submission = always contact
  if (contact.hasForm) {
    return { should: true, reason: "Skickade formularet" };
  }
  // High score warm lead
  if (contact.score >= 50 && contact.hasVisit) {
    return { should: true, reason: "Aktiv besokare med bra score" };
  }
  // Warm leads in sales segment
  if (contact.score >= 30 && contact.segments.some((s) => s.toLowerCase().includes("varma"))) {
    return { should: true, reason: "Varm lead i salj-segment" };
  }
  return { should: false, reason: "" };
}

function guessProduct(contact: {
  title: string | null;
  segments: string[];
  company: string;
}): string | null {
  const t = (contact.title || "").toLowerCase();
  const c = contact.company.toLowerCase();

  if (t.includes("hr") || t.includes("personal")) return "send-a-gift";
  if (t.includes("kundtjanst") || t.includes("customer service") || t.includes("crm")) return "customer-care";
  if (t.includes("trade marketing") || t.includes("category")) return "sales-promotion";
  if (t.includes("brand") || t.includes("marknad") || t.includes("marketing")) return "sales-promotion";
  if (t.includes("inkop") || t.includes("clearing")) return "clearing-solutions";
  if (t.includes("digital") || t.includes("kampanj")) return "kampanja";

  // Guess by company type
  if (c.includes("hotel") || c.includes("scandic") || c.includes("restaurang")) return "send-a-gift";

  return null;
}

function guessSourceChannel(contact: {
  hasVisit: boolean;
  hasMail: boolean;
  hasForm: boolean;
  segments: string[];
}): string {
  if (contact.hasForm) return "Formularer";
  if (contact.hasMail && contact.hasVisit) return "Email + Webb";
  if (contact.hasMail) return "Email";
  if (contact.hasVisit) return "Webb";
  if (contact.segments.some((s) => s.includes("Kalla"))) return "Kalla leads";
  return "CRM";
}

// ---- Data fetchers ----

export async function getContacts(limit = 100): Promise<DashboardContact[]> {
  return cachedFetch(`contacts-${limit}`, async () => {
    if (!UPSALES_TOKEN) return [];
    const data = await upsalesGet("/contacts", {
      limit: String(limit),
      sort: "-score",
    });

    return (data.data || []).map((c: Record<string, unknown>) => {
      const client = (c.client as Record<string, unknown>) || {};
      const segments = ((c.segments as Array<{ name: string }>) || []).map((s) => s.name);
      const score = (c.score as number) || 0;
      const hasVisit = !!(c.hasVisit);
      const hasForm = !!(c.hasForm);
      const hasMail = !!(c.hasMail);
      const title = (c.title as string) || null;
      const company = (client.name as string) || "";

      const cn = computeContactNow({ score, hasVisit, hasForm, segments });

      return {
        id: c.id as number,
        name: c.name as string,
        email: (c.email as string) || "",
        phone: (c.cellPhone as string) || (c.phone as string) || null,
        title,
        company,
        companyId: (client.id as number) || null,
        score,
        journeyStep: (c.journeyStep as string) || "unknown",
        hasVisit,
        hasForm,
        hasMail,
        segments,
        regDate: (c.regDate as string) || "",
        modDate: (c.modDate as string) || "",
        status: computeStatus(score),
        contactNow: cn.should,
        contactNowReason: cn.reason,
        topProduct: guessProduct({ title, segments, company }),
        sourceChannel: guessSourceChannel({ hasVisit, hasMail, hasForm, segments }),
      };
    });
  }, []);
}

export async function getKpis(): Promise<DashboardKpis> {
  const fallbackKpis: DashboardKpis = {
    activeLeads: { value: 0, change: 0, period: "-" },
    hotLeads: { value: 0, change: 0, period: "-" },
    pipelineValue: { value: 0, change: 0, period: "-" },
    conversionRate: { value: 0, change: 0, period: "-" },
  };
  return cachedFetch("kpis", async () => {
    // Fetch counts from Upsales
    const [contactsData, oppsData] = await Promise.all([
      upsalesGet("/contacts", { limit: "1", sort: "-score" }),
      upsalesGet("/opportunities", { limit: "1" }),
    ]);

    const totalContacts = contactsData.metadata?.total || 0;
    const totalOpps = oppsData.metadata?.total || 0;

    // Get hot leads count (score >= 100)
    const contacts = await getContacts(200);
    const hotLeads = contacts.filter((c) => c.status === "hot");
    const activeLeads = contacts.filter((c) => c.score > 0);
    const contactNowCount = contacts.filter((c) => c.contactNow);

    // Pipeline: sum of open opportunities (we'll estimate from top opps)
    const topOpps = await upsalesGet("/opportunities", { limit: "50", sort: "-value" });
    const pipelineValue = (topOpps.data || []).reduce(
      (sum: number, o: Record<string, unknown>) => sum + ((o.value as number) || 0),
      0
    );

    // Conversion rate: contacts with form / contacts with visit
    const withVisit = contacts.filter((c) => c.hasVisit).length;
    const withForm = contacts.filter((c) => c.hasForm).length;
    const convRate = withVisit > 0 ? (withForm / withVisit) * 100 : 0;

    return {
      activeLeads: { value: activeLeads.length, change: contactNowCount.length, period: "att kontakta nu" },
      hotLeads: { value: hotLeads.length, change: hotLeads.filter((c) => c.contactNow).length, period: "att kontakta nu" },
      pipelineValue: { value: pipelineValue, change: 0, period: "totalt" },
      conversionRate: { value: Math.round(convRate * 10) / 10, change: 0, period: "besok till formularer" },
    };
  }, fallbackKpis);
}

export async function getActivities(limit = 15): Promise<DashboardActivity[]> {
  return cachedFetch(`activities-${limit}`, async () => {
    const data = await upsalesGet("/activities", {
      limit: String(limit),
      sort: "-date",
    });

    return (data.data || []).map((a: Record<string, unknown>) => {
      const client = (a.client as Record<string, unknown>) || {};
      const contacts = (a.contacts as Array<{ name: string }>) || [];
      const actType = (a.activityType as Record<string, unknown>) || {};

      return {
        id: a.id as number,
        date: (a.date as string) || "",
        description: (a.description as string) || "",
        type: (actType.name as string) || "Aktivitet",
        contactName: contacts[0]?.name || "",
        company: (client.name as string) || "",
      };
    });
  }, []);
}

export async function getHotLeads(limit = 10): Promise<DashboardContact[]> {
  const contacts = await getContacts(200);
  return contacts
    .filter((c) => c.score > 0)
    .sort((a, b) => {
      // Prioritize contactNow, then by score
      if (a.contactNow && !b.contactNow) return -1;
      if (!a.contactNow && b.contactNow) return 1;
      return b.score - a.score;
    })
    .slice(0, limit);
}

export async function getLeadsByProduct(): Promise<Record<string, DashboardContact[]>> {
  const contacts = await getContacts(200);
  const byProduct: Record<string, DashboardContact[]> = {};

  for (const p of products) {
    byProduct[p.slug] = contacts.filter((c) => c.topProduct === p.slug);
  }

  // Also include unassigned
  byProduct["unassigned"] = contacts.filter((c) => !c.topProduct);

  return byProduct;
}

// ---- Scoring sources (extensible) ----
// Each source contributes to the total score
// Currently only Upsales score is used
// Future: add these functions and sum them

export interface ScoreSource {
  source: string;
  score: number;
  signals: string[];
}

export function computeTotalScore(sources: ScoreSource[]): number {
  return sources.reduce((sum, s) => sum + s.score, 0);
}

// Ready for future integration:
// export async function getGoogleAdsScore(email: string): Promise<ScoreSource>
// export async function getMetaAdsScore(email: string): Promise<ScoreSource>
// export async function getLinkedInScore(email: string): Promise<ScoreSource>
// export async function getWebTrackingScore(sessionId: string): Promise<ScoreSource>
