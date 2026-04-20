// Real data layer - Upsales CRM
// Scoring extensible for Google Ads, Meta, LinkedIn

function getToken() {
  return (process.env.UPSALES_API_KEY || "").trim();
}
const BASE = "https://power.upsales.com/api/v2";

// ---- Cache (5 min) ----
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function clearCache() {
  cache.clear();
}

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, _fallback: T): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T;
  // Let errors propagate so we can see them in debug
  const data = await fetcher();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// Exported for debugging
export let lastFetchDebug = { url: "", status: 0, dataLength: 0, error: "" };

async function upsalesGet(path: string, params?: Record<string, string>) {
  const token = (process.env.UPSALES_API_KEY || "").trim();
  if (!token) {
    lastFetchDebug = { url: "", status: 0, dataLength: 0, error: "NO TOKEN" };
    return { data: [], metadata: { total: 0 } };
  }
  const u = new URL(`${BASE}${path}`);
  u.searchParams.set("token", token);
  if (params) for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

  const fetchUrl = u.toString();
  try {
    const res = await fetch(fetchUrl, { cache: "no-store" });
    lastFetchDebug.url = fetchUrl.replace(token, "***");
    lastFetchDebug.status = res.status;

    if (!res.ok) {
      lastFetchDebug.error = `HTTP ${res.status}`;
      return { data: [], metadata: { total: 0 } };
    }
    const json = await res.json();
    lastFetchDebug.dataLength = json.data?.length || 0;
    lastFetchDebug.error = "";
    return json;
  } catch (e) {
    lastFetchDebug.error = String(e);
    return { data: [], metadata: { total: 0 } };
  }
}

// ---- Landing page project mapping ----
// Maps Upsales project IDs to our product/page categories
const LANDING_PAGE_PROJECTS: Record<number, { label: string; product: string | null }> = {
  15: { label: "Retail / Handel", product: "sales-promotion" },
  16: { label: "Kundvarvning", product: "interactive-engage" },
  17: { label: "Telekom", product: "customer-care" },
  18: { label: "Kundvard", product: "customer-care" },
  19: { label: "Energi", product: null },
  20: { label: "Personalbeloning", product: "send-a-gift" },
  21: { label: "Huvudsida", product: null },
  22: { label: "Finans / Forsakring", product: null },
  23: { label: "E-handel", product: "kampanja" },
};

const FORM_PROJECT_ID = 28; // "CL-DK | B2B | LS-A eller -B Formulär = JA"
const POPUP_PROJECT_ID = 26; // "CL-DK | B2B | LS-A Mail popup = JA"

// ---- Lead categories ----
export type LeadCategory =
  | "glass_lead"       // From glass campaigns / Alva Frostander
  | "landing_page"     // From our landing pages (identified)
  | "mg_leverantor"    // MG leverantorslista (email)
  | "event"            // ClearOn events
  | "existing_customer" // Has orders
  | "web_visitor"      // Has visited website
  | "email_engaged"    // Opened/clicked emails
  | "cold"             // No engagement
  | "internal";        // ClearOn/Stellar internal

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
  projects: string[];
  regDate: string;
  modDate: string;
  // Computed
  category: LeadCategory;
  categoryLabel: string;
  status: "hot" | "warm" | "cold";
  contactNow: boolean;
  contactNowReason: string;
  topProduct: string | null;
  landingPage: string | null;
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

// ---- Categorization ----

const INTERNAL_DOMAINS = ["clearon.se", "wearestellar.se", "clearon-test.se"];
const INTERNAL_COMPANIES = ["testbolag", "test företag", "e2e test", "persisttest", "poangtest"];

function categorizeContact(c: {
  email: string;
  company: string;
  projects: string[];
  segments: string[];
  hasVisit: boolean;
  hasMail: boolean;
  hasForm: boolean;
  score: number;
}): { category: LeadCategory; label: string } {
  const email = c.email.toLowerCase();
  const company = c.company.toLowerCase();
  const domain = email.split("@")[1] || "";

  // Internal
  if (INTERNAL_DOMAINS.some((d) => domain.includes(d)) || INTERNAL_COMPANIES.some((ic) => company.includes(ic))) {
    return { category: "internal", label: "Intern" };
  }

  // Glass leads (from Alva's campaigns)
  if (company === "glass leads") {
    return { category: "glass_lead", label: "Glass-kampanj" };
  }

  // Landing page leads (identified via form or popup)
  const hasLandingProject = c.projects.some((p) => p.startsWith("Landingpage"));
  const hasFormProject = c.projects.some((p) => p.includes("Formulär"));
  const hasPopupProject = c.projects.some((p) => p.includes("Mail popup"));
  if (hasFormProject || hasPopupProject) {
    return { category: "landing_page", label: "Landningssida (identifierad)" };
  }

  // MG Leverantorer
  if (company.includes("emailadresser mg") || company.includes("mg matbutiker")) {
    return { category: "mg_leverantor", label: "MG Leverantor" };
  }

  // Event
  if (c.projects.some((p) => p.toLowerCase().includes("event"))) {
    return { category: "event", label: "Event" };
  }

  // Web visitor with landing page
  if (hasLandingProject && c.hasVisit) {
    return { category: "landing_page", label: "Landningssida (besokare)" };
  }

  // Web visitor
  if (c.hasVisit) {
    return { category: "web_visitor", label: "Webbbesokare" };
  }

  // Email engaged
  if (c.hasMail) {
    return { category: "email_engaged", label: "Email-engagerad" };
  }

  // Has landing page project but no visit
  if (hasLandingProject) {
    return { category: "landing_page", label: "Landningssida" };
  }

  // Cold
  return { category: "cold", label: "Kall" };
}

function computeStatus(score: number, hasVisit: boolean, hasForm: boolean): "hot" | "warm" | "cold" {
  if (score >= 100 || hasForm) return "hot";
  if (score >= 30 || hasVisit) return "warm";
  return "cold";
}

function computeContactNow(c: {
  score: number;
  hasVisit: boolean;
  hasForm: boolean;
  hasMail: boolean;
  category: LeadCategory;
  segments: string[];
}): { should: boolean; reason: string } {
  // Never contact internal
  if (c.category === "internal") return { should: false, reason: "" };

  // Form submissions = always
  if (c.hasForm && c.score >= 20) return { should: true, reason: "Skickade formular" };

  // Hot with visit
  if (c.score >= 100 && c.hasVisit) return { should: true, reason: "Hog score + webbbesok" };

  // Warm leads in "Stellar Varma" segment
  if (c.segments.some((s) => s.includes("Varma"))) return { should: true, reason: "Varm lead (segment)" };

  // High score glass leads
  if (c.category === "glass_lead" && c.score >= 50) return { should: true, reason: "Glass-lead med hog score" };

  // Landing page visitor with decent score
  if (c.category === "landing_page" && c.score >= 40) return { should: true, reason: "Aktiv pa landningssida" };

  // Email engaged + visit
  if (c.hasMail && c.hasVisit && c.score >= 50) return { should: true, reason: "Email + webbbesok" };

  return { should: false, reason: "" };
}

function resolveProduct(projects: string[], title: string | null): string | null {
  // Check landing page projects first
  for (const [pidStr, mapping] of Object.entries(LANDING_PAGE_PROJECTS)) {
    const projectName = `Landingpage - ${mapping.label === "Huvudsida" ? "Huvudsida" : mapping.label}`;
    // Match by label in project name
    if (projects.some((p) => {
      const pLower = p.toLowerCase();
      return pLower.includes(mapping.label.toLowerCase()) && pLower.includes("landingpage");
    }) && mapping.product) {
      return mapping.product;
    }
  }

  // Guess from title
  const t = (title || "").toLowerCase();
  if (t.includes("hr") || t.includes("personal")) return "send-a-gift";
  if (t.includes("kundtjanst") || t.includes("customer")) return "customer-care";
  if (t.includes("trade") || t.includes("brand") || t.includes("marknad")) return "sales-promotion";

  return null;
}

function resolveLandingPage(projects: string[]): string | null {
  for (const p of projects) {
    if (p.includes("Retail")) return "Retail / Handel";
    if (p.includes("Kundvärvning") || p.includes("Kundvarvning")) return "Kundvarvning";
    if (p.includes("Kundvård") || p.includes("Kundvard")) return "Kundvard";
    if (p.includes("Telekom")) return "Telekom";
    if (p.includes("Personalbelöning") || p.includes("Personalbeloning")) return "Personalbeloning";
    if (p.includes("Energi")) return "Energi";
    if (p.includes("Finans")) return "Finans";
    if (p.includes("E-handel")) return "E-handel";
    if (p.includes("Huvudsida")) return "Huvudsida";
    if (p.includes("Demo")) return "Demo/Test";
    if (p.includes("Resor")) return "Resor";
  }
  return null;
}

function resolveSourceChannel(c: {
  category: LeadCategory;
  hasVisit: boolean;
  hasMail: boolean;
  hasForm: boolean;
  projects: string[];
}): string {
  if (c.category === "glass_lead") return "Glass-kampanj";
  if (c.projects.some((p) => p.includes("Formulär"))) return "Formular";
  if (c.projects.some((p) => p.includes("Mail popup"))) return "Popup";
  if (c.category === "mg_leverantor") return "MG Leverantorer";
  if (c.category === "event") return "Event";
  if (c.hasMail && c.hasVisit) return "Email + Webb";
  if (c.hasMail) return "Email";
  if (c.hasVisit) return "Webb";
  if (c.projects.some((p) => p.includes("Landingpage"))) return "Landningssida";
  return "Upsales CRM";
}

// ---- Data fetchers ----

export async function getContacts(limit = 200): Promise<DashboardContact[]> {
  // Fetch more than needed since we filter some out
  const fetchLimit = Math.min(limit * 3, 500);
  return cachedFetch(`contacts-${limit}`, async () => {
    if (!process.env.UPSALES_API_KEY) return [];
    const data = await upsalesGet("/contacts", { limit: String(fetchLimit), sort: "-score" });

    const results: DashboardContact[] = [];
    for (const c of (data.data || [])) {
      try {
        const client = ((c as Record<string, unknown>).client as Record<string, unknown>) || {};
        const segments = (((c as Record<string, unknown>).segments as Array<{ name: string }>) || []).map((s) => s.name);
        const projects = (((c as Record<string, unknown>).projects as Array<{ name: string }>) || []).map((p) => p.name);
        const score = ((c as Record<string, unknown>).score as number) || 0;
        const hasVisit = !!((c as Record<string, unknown>).hasVisit);
        const hasForm = !!((c as Record<string, unknown>).hasForm);
        const hasMail = !!((c as Record<string, unknown>).hasMail);
        const title = ((c as Record<string, unknown>).title as string) || null;
        const company = (client.name as string) || "";
        const email = ((c as Record<string, unknown>).email as string) || "";

        const cat = categorizeContact({ email, company, projects, segments, hasVisit, hasMail, hasForm, score });
        if (cat.category === "internal") continue;

        const status = computeStatus(score, hasVisit, hasForm);
        const cn = computeContactNow({ score, hasVisit, hasForm, hasMail, category: cat.category, segments });

        results.push({
          id: (c as Record<string, unknown>).id as number,
          name: (c as Record<string, unknown>).name as string,
          email,
          phone: ((c as Record<string, unknown>).cellPhone as string) || ((c as Record<string, unknown>).phone as string) || null,
          title,
          company,
          companyId: (client.id as number) || null,
          score,
          journeyStep: ((c as Record<string, unknown>).journeyStep as string) || "unknown",
          hasVisit,
          hasForm,
          hasMail,
          segments,
          projects,
          regDate: ((c as Record<string, unknown>).regDate as string) || "",
          modDate: ((c as Record<string, unknown>).modDate as string) || "",
          category: cat.category,
          categoryLabel: cat.label,
          status,
          contactNow: cn.should,
          contactNowReason: cn.reason,
          topProduct: resolveProduct(projects, title),
          landingPage: resolveLandingPage(projects),
          sourceChannel: resolveSourceChannel({ category: cat.category, hasVisit, hasMail, hasForm, projects }),
        });

        if (results.length >= limit) break;
      } catch (e) {
        console.error("Error processing contact:", (c as Record<string, unknown>).name, e);
        continue;
      }
    }
    return results;
  }, []);
}

export async function getKpis(): Promise<DashboardKpis> {
  const fallback: DashboardKpis = {
    activeLeads: { value: 0, change: 0, period: "-" },
    hotLeads: { value: 0, change: 0, period: "-" },
    pipelineValue: { value: 0, change: 0, period: "-" },
    conversionRate: { value: 0, change: 0, period: "-" },
  };
  return cachedFetch("kpis", async () => {
    const contacts = await getContacts(200);

    const hotLeads = contacts.filter((c) => c.status === "hot");
    const warmLeads = contacts.filter((c) => c.status === "warm");
    const contactNow = contacts.filter((c) => c.contactNow);
    const glassLeads = contacts.filter((c) => c.category === "glass_lead");
    const landingLeads = contacts.filter((c) => c.category === "landing_page");

    // Pipeline from opportunities
    let pipelineValue = 0;
    try {
      const topOpps = await upsalesGet("/opportunities", { limit: "50", sort: "-value" });
      pipelineValue = (topOpps.data || []).reduce(
        (sum: number, o: Record<string, unknown>) => sum + ((o.value as number) || 0), 0
      );
    } catch { /* ignore */ }

    const withVisit = contacts.filter((c) => c.hasVisit).length;
    const withForm = contacts.filter((c) => c.hasForm).length;
    const convRate = withVisit > 0 ? (withForm / withVisit) * 100 : 0;

    return {
      activeLeads: { value: contacts.length, change: contactNow.length, period: "att kontakta nu" },
      hotLeads: { value: hotLeads.length + warmLeads.length, change: glassLeads.length + landingLeads.length, period: `varav ${glassLeads.length} glass + ${landingLeads.length} landing` },
      pipelineValue: { value: pipelineValue, change: 0, period: "totalt ordervarde" },
      conversionRate: { value: Math.round(convRate * 10) / 10, change: withForm, period: `av ${withVisit} besokare` },
    };
  }, fallback);
}

export async function getActivities(limit = 15): Promise<DashboardActivity[]> {
  return cachedFetch(`activities-${limit}`, async () => {
    if (!process.env.UPSALES_API_KEY) return [];
    const data = await upsalesGet("/activities", { limit: String(limit), sort: "-date" });

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
      if (a.contactNow && !b.contactNow) return -1;
      if (!a.contactNow && b.contactNow) return 1;
      return b.score - a.score;
    })
    .slice(0, limit);
}

export async function getLeadsByCategory(): Promise<Record<LeadCategory, DashboardContact[]>> {
  const contacts = await getContacts(200);
  const result: Record<string, DashboardContact[]> = {};
  for (const c of contacts) {
    if (!result[c.category]) result[c.category] = [];
    result[c.category].push(c);
  }
  return result as Record<LeadCategory, DashboardContact[]>;
}

// ---- Scoring sources (extensible) ----
export interface ScoreSource {
  source: string;
  score: number;
  signals: string[];
}

export function computeTotalScore(sources: ScoreSource[]): number {
  return sources.reduce((sum, s) => sum + s.score, 0);
}

// Future:
// export async function getGoogleAdsScore(email: string): Promise<ScoreSource>
// export async function getMetaAdsScore(email: string): Promise<ScoreSource>
// export async function getLinkedInScore(email: string): Promise<ScoreSource>
