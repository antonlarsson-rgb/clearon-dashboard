// Realistic mock data for ClearOn Intelligence Dashboard
// This will be replaced by Supabase queries when live

export interface Account {
  id: string;
  upsales_id: number;
  name: string;
  industry: string;
  size: string;
  website: string;
}

export interface Contact {
  id: string;
  upsales_id: number;
  account_id: string;
  account_name: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  role_category: string;
  reports_to_contact_id: string | null;
  linkedin_url: string;
}

export interface LeadScore {
  contact_id: string;
  total_score: number;
  engagement_score: number;
  fit_score: number;
  intent_score: number;
  signals: Signal[];
}

export interface Signal {
  type: string;
  value: number;
  timestamp: string;
  description: string;
}

export interface ProductScore {
  contact_id: string;
  product_slug: string;
  score: number;
}

export interface Activity {
  id: string;
  timestamp: string;
  contact_name: string;
  company: string;
  description: string;
  type: "page_view" | "download" | "email" | "ad_click" | "form" | "task" | "crm";
  score_change?: number;
  cta?: string;
}

export interface AiSuggestion {
  id: string;
  category: string;
  priority: "kritiskt" | "hog" | "medel";
  title: string;
  description: string;
  metric?: string;
  cta_primary: string;
  cta_secondary: string;
}

export interface ClickUpTask {
  id: string;
  clickup_id: string;
  name: string;
  description: string;
  status: "to do" | "in progress" | "review" | "done";
  assignee: string;
  priority: number;
  due_date: string;
  date_created: string;
  date_updated: string;
  date_closed: string | null;
  list_name: string;
  folder_name: string;
}

export interface AdCampaign {
  id: string;
  platform: "meta" | "google" | "linkedin";
  campaign_name: string;
  product_slug: string;
  status: "active" | "paused" | "completed";
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads_generated: number;
  conversions: number;
  date: string;
}

// ---- ACCOUNTS ----
export const accounts: Account[] = [
  { id: "a1", upsales_id: 1001, name: "Fazer", industry: "FMCG", size: "1000+", website: "fazer.se" },
  { id: "a2", upsales_id: 1002, name: "Orkla", industry: "FMCG", size: "500-999", website: "orkla.se" },
  { id: "a3", upsales_id: 1003, name: "ICA", industry: "Dagligvaruhandel", size: "1000+", website: "ica.se" },
  { id: "a4", upsales_id: 1004, name: "Lantmannen", industry: "FMCG", size: "1000+", website: "lantmannen.se" },
  { id: "a5", upsales_id: 1005, name: "Volvo Cars", industry: "Fordon", size: "1000+", website: "volvocars.se" },
  { id: "a6", upsales_id: 1006, name: "Telia", industry: "Telekom", size: "1000+", website: "telia.se" },
  { id: "a7", upsales_id: 1007, name: "Axfood", industry: "Dagligvaruhandel", size: "1000+", website: "axfood.se" },
  { id: "a8", upsales_id: 1008, name: "Arla", industry: "FMCG", size: "1000+", website: "arla.se" },
  { id: "a9", upsales_id: 1009, name: "Coop", industry: "Dagligvaruhandel", size: "1000+", website: "coop.se" },
  { id: "a10", upsales_id: 1010, name: "Unilever Nordics", industry: "FMCG", size: "500-999", website: "unilever.se" },
  { id: "a11", upsales_id: 1011, name: "Procter & Gamble", industry: "FMCG", size: "1000+", website: "pg.com" },
  { id: "a12", upsales_id: 1012, name: "Nestle Nordics", industry: "FMCG", size: "1000+", website: "nestle.se" },
  { id: "a13", upsales_id: 1013, name: "H&M", industry: "Retail", size: "1000+", website: "hm.com" },
  { id: "a14", upsales_id: 1014, name: "IKEA", industry: "Retail", size: "1000+", website: "ikea.se" },
  { id: "a15", upsales_id: 1015, name: "Stadium", industry: "Retail", size: "500-999", website: "stadium.se" },
  { id: "a16", upsales_id: 1016, name: "Systembolaget", industry: "Dagligvaruhandel", size: "1000+", website: "systembolaget.se" },
  { id: "a17", upsales_id: 1017, name: "Mondelez", industry: "FMCG", size: "500-999", website: "mondelez.se" },
  { id: "a18", upsales_id: 1018, name: "Reckitt Nordic", industry: "FMCG", size: "200-499", website: "reckitt.com" },
  { id: "a19", upsales_id: 1019, name: "Scandic Hotels", industry: "Hospitality", size: "1000+", website: "scandichotels.se" },
  { id: "a20", upsales_id: 1020, name: "SAS", industry: "Transport", size: "1000+", website: "sas.se" },
];

// ---- TOP CONTACTS (leads) ----
export const contacts: Contact[] = [
  {
    id: "c1", upsales_id: 2001, account_id: "a1", account_name: "Fazer",
    name: "Maria Eriksson", title: "Brand Manager", email: "maria.eriksson@fazer.se",
    phone: "+46 70 123 4567", role_category: "marketing", reports_to_contact_id: "c2",
    linkedin_url: "linkedin.com/in/mariaeriksson",
  },
  {
    id: "c2", upsales_id: 2002, account_id: "a1", account_name: "Fazer",
    name: "Anders Johansson", title: "CMO", email: "anders.johansson@fazer.se",
    phone: "+46 70 234 5678", role_category: "executive", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/andersjohansson",
  },
  {
    id: "c3", upsales_id: 2003, account_id: "a1", account_name: "Fazer",
    name: "Erik Lind", title: "Trade Marketing Manager", email: "erik.lind@fazer.se",
    phone: "+46 70 345 6789", role_category: "trade_marketing", reports_to_contact_id: "c2",
    linkedin_url: "linkedin.com/in/eriklind",
  },
  {
    id: "c4", upsales_id: 2004, account_id: "a1", account_name: "Fazer",
    name: "Sofia Holm", title: "Digital Marketing Specialist", email: "sofia.holm@fazer.se",
    phone: "+46 70 456 7890", role_category: "marketing", reports_to_contact_id: "c1",
    linkedin_url: "linkedin.com/in/sofiaholm",
  },
  {
    id: "c5", upsales_id: 2005, account_id: "a5", account_name: "Volvo Cars",
    name: "Johan Lindstrom", title: "HR-chef", email: "johan.lindstrom@volvocars.com",
    phone: "+46 70 567 8901", role_category: "hr", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/johanlindstrom",
  },
  {
    id: "c6", upsales_id: 2006, account_id: "a2", account_name: "Orkla",
    name: "Anna Svensson", title: "Trade Marketing Manager", email: "anna.svensson@orkla.se",
    phone: "+46 70 678 9012", role_category: "trade_marketing", reports_to_contact_id: "c7",
    linkedin_url: "linkedin.com/in/annasvensson",
  },
  {
    id: "c7", upsales_id: 2007, account_id: "a2", account_name: "Orkla",
    name: "Henrik Dahl", title: "Marketing Director", email: "henrik.dahl@orkla.se",
    phone: "+46 70 789 0123", role_category: "executive", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/henrikdahl",
  },
  {
    id: "c8", upsales_id: 2008, account_id: "a4", account_name: "Lantmannen",
    name: "Per Nilsson", title: "Marknadschef", email: "per.nilsson@lantmannen.se",
    phone: "+46 70 890 1234", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/pernilsson",
  },
  {
    id: "c9", upsales_id: 2009, account_id: "a6", account_name: "Telia",
    name: "Sara Bergstrom", title: "Kundtjanstchef", email: "sara.bergstrom@telia.se",
    phone: "+46 70 901 2345", role_category: "customer_service", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/sarabergstrom",
  },
  {
    id: "c10", upsales_id: 2010, account_id: "a3", account_name: "ICA",
    name: "Lars Pettersson", title: "Category Manager", email: "lars.pettersson@ica.se",
    phone: "+46 70 012 3456", role_category: "trade_marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/larspettersson",
  },
  {
    id: "c11", upsales_id: 2011, account_id: "a7", account_name: "Axfood",
    name: "Karin Lundgren", title: "Brand Manager", email: "karin.lundgren@axfood.se",
    phone: "+46 70 111 2233", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/karinlundgren",
  },
  {
    id: "c12", upsales_id: 2012, account_id: "a8", account_name: "Arla",
    name: "Oskar Berg", title: "Trade Marketing Specialist", email: "oskar.berg@arla.se",
    phone: "+46 70 222 3344", role_category: "trade_marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/oskarberg",
  },
  {
    id: "c13", upsales_id: 2013, account_id: "a10", account_name: "Unilever Nordics",
    name: "Emma Franzen", title: "Shopper Marketing Manager", email: "emma.franzen@unilever.com",
    phone: "+46 70 333 4455", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/emmafranzen",
  },
  {
    id: "c14", upsales_id: 2014, account_id: "a9", account_name: "Coop",
    name: "David Nordin", title: "Marknadschef", email: "david.nordin@coop.se",
    phone: "+46 70 444 5566", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/davidnordin",
  },
  {
    id: "c15", upsales_id: 2015, account_id: "a5", account_name: "Volvo Cars",
    name: "Anna Svensson", title: "Inkopschef", email: "anna.s@volvocars.com",
    phone: "+46 70 555 6677", role_category: "other", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/annasvensson2",
  },
  {
    id: "c16", upsales_id: 2016, account_id: "a11", account_name: "Procter & Gamble",
    name: "Therese Aberg", title: "Brand Manager", email: "therese.aberg@pg.com",
    phone: "+46 70 666 7788", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/thereseaberg",
  },
  {
    id: "c17", upsales_id: 2017, account_id: "a12", account_name: "Nestle Nordics",
    name: "Fredrik Ek", title: "Marketing Manager", email: "fredrik.ek@nestle.se",
    phone: "+46 70 777 8899", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/fredrikek",
  },
  {
    id: "c18", upsales_id: 2018, account_id: "a13", account_name: "H&M",
    name: "Louise Sjoberg", title: "CRM Manager", email: "louise.sjoberg@hm.com",
    phone: "+46 70 888 9900", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/louisesjoberg",
  },
  {
    id: "c19", upsales_id: 2019, account_id: "a19", account_name: "Scandic Hotels",
    name: "Marcus Wahl", title: "HR-direktor", email: "marcus.wahl@scandichotels.com",
    phone: "+46 70 999 0011", role_category: "hr", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/marcuswahl",
  },
  {
    id: "c20", upsales_id: 2020, account_id: "a17", account_name: "Mondelez",
    name: "Ida Karlsson", title: "Shopper Marketing Lead", email: "ida.karlsson@mondelez.com",
    phone: "+46 70 100 2233", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/idakarlsson",
  },
];

// ---- LEAD SCORES ----
export const leadScores: LeadScore[] = [
  {
    contact_id: "c1", total_score: 87, engagement_score: 36, fit_score: 25, intent_score: 26,
    signals: [
      { type: "page_view", value: 8, timestamp: "2026-04-16T14:30:00Z", description: "Besökte /sales-promotion/ (3 ggr)" },
      { type: "download", value: 10, timestamp: "2026-04-17T09:42:00Z", description: 'Laddade ner "Clear Insights"-rapport' },
      { type: "email_click", value: 6, timestamp: "2026-04-14T11:20:00Z", description: 'Klickade pa "Boka demo"-lank' },
      { type: "email_open", value: 3, timestamp: "2026-04-15T08:15:00Z", description: 'Oppnade "Kupongkampanjer 2026"' },
      { type: "search", value: 5, timestamp: "2026-04-12T16:00:00Z", description: 'Forsta besok via Google "kupongkampanj butik"' },
    ],
  },
  {
    contact_id: "c5", total_score: 74, engagement_score: 28, fit_score: 22, intent_score: 24,
    signals: [
      { type: "page_view", value: 8, timestamp: "2026-04-17T10:15:00Z", description: "Besökte /send-a-gift/ (2 ggr)" },
      { type: "search", value: 5, timestamp: "2026-04-17T10:10:00Z", description: 'Google: "digital personalbeloning"' },
    ],
  },
  {
    contact_id: "c6", total_score: 71, engagement_score: 26, fit_score: 25, intent_score: 20,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-16T15:30:00Z", description: "Klickade pa LinkedIn-annons Gamification" },
      { type: "page_view", value: 8, timestamp: "2026-04-16T15:32:00Z", description: "Besökte /interactive-engage/" },
    ],
  },
  {
    contact_id: "c8", total_score: 68, engagement_score: 24, fit_score: 24, intent_score: 20,
    signals: [
      { type: "email_open", value: 9, timestamp: "2026-04-17T08:30:00Z", description: "Oppnade 3 mail i rad denna vecka" },
    ],
  },
  {
    contact_id: "c9", total_score: 65, engagement_score: 22, fit_score: 20, intent_score: 23,
    signals: [
      { type: "page_view", value: 10, timestamp: "2026-04-17T09:28:00Z", description: "Besökte kontaktsidan" },
      { type: "page_view", value: 8, timestamp: "2026-04-17T09:25:00Z", description: "Besökte /customer-care/" },
    ],
  },
  { contact_id: "c10", total_score: 62, engagement_score: 20, fit_score: 25, intent_score: 17, signals: [] },
  { contact_id: "c11", total_score: 58, engagement_score: 18, fit_score: 25, intent_score: 15, signals: [] },
  { contact_id: "c12", total_score: 55, engagement_score: 17, fit_score: 23, intent_score: 15, signals: [] },
  { contact_id: "c13", total_score: 52, engagement_score: 16, fit_score: 22, intent_score: 14, signals: [] },
  { contact_id: "c14", total_score: 48, engagement_score: 14, fit_score: 20, intent_score: 14, signals: [] },
  { contact_id: "c16", total_score: 45, engagement_score: 13, fit_score: 22, intent_score: 10, signals: [] },
  { contact_id: "c17", total_score: 43, engagement_score: 12, fit_score: 21, intent_score: 10, signals: [] },
  { contact_id: "c18", total_score: 38, engagement_score: 10, fit_score: 18, intent_score: 10, signals: [] },
  { contact_id: "c19", total_score: 35, engagement_score: 10, fit_score: 15, intent_score: 10, signals: [] },
  { contact_id: "c20", total_score: 61, engagement_score: 19, fit_score: 24, intent_score: 18, signals: [] },
  { contact_id: "c2", total_score: 30, engagement_score: 8, fit_score: 15, intent_score: 7, signals: [] },
  { contact_id: "c3", total_score: 42, engagement_score: 12, fit_score: 20, intent_score: 10, signals: [] },
  { contact_id: "c4", total_score: 33, engagement_score: 10, fit_score: 15, intent_score: 8, signals: [] },
  { contact_id: "c7", total_score: 28, engagement_score: 6, fit_score: 15, intent_score: 7, signals: [] },
  { contact_id: "c15", total_score: 40, engagement_score: 12, fit_score: 18, intent_score: 10, signals: [] },
];

// ---- PRODUCT SCORES (for top leads) ----
export const productScores: ProductScore[] = [
  { contact_id: "c1", product_slug: "sales-promotion", score: 82 },
  { contact_id: "c1", product_slug: "interactive-engage", score: 34 },
  { contact_id: "c1", product_slug: "customer-care", score: 12 },
  { contact_id: "c5", product_slug: "send-a-gift", score: 76 },
  { contact_id: "c5", product_slug: "customer-care", score: 18 },
  { contact_id: "c6", product_slug: "interactive-engage", score: 71 },
  { contact_id: "c6", product_slug: "sales-promotion", score: 22 },
  { contact_id: "c8", product_slug: "sales-promotion", score: 64 },
  { contact_id: "c8", product_slug: "kampanja", score: 28 },
  { contact_id: "c9", product_slug: "customer-care", score: 68 },
  { contact_id: "c9", product_slug: "send-a-gift", score: 15 },
  { contact_id: "c10", product_slug: "sales-promotion", score: 58 },
  { contact_id: "c11", product_slug: "sales-promotion", score: 52 },
  { contact_id: "c12", product_slug: "sales-promotion", score: 48 },
  { contact_id: "c13", product_slug: "interactive-engage", score: 44 },
  { contact_id: "c14", product_slug: "kampanja", score: 42 },
  { contact_id: "c16", product_slug: "sales-promotion", score: 40 },
  { contact_id: "c17", product_slug: "sales-promotion", score: 38 },
  { contact_id: "c18", product_slug: "customer-care", score: 30 },
  { contact_id: "c19", product_slug: "send-a-gift", score: 62 },
  { contact_id: "c20", product_slug: "interactive-engage", score: 56 },
];

// ---- LIVE ACTIVITY FEED ----
export const activityFeed: Activity[] = [
  {
    id: "act1", timestamp: "2026-04-17T09:42:00Z", contact_name: "Maria Eriksson",
    company: "Fazer", description: 'Laddade ner "Clear Insights"-rapporten',
    type: "download", cta: "Skicka uppfoljningsmail",
  },
  {
    id: "act2", timestamp: "2026-04-17T09:39:00Z", contact_name: "Johan Lindstrom",
    company: "Volvo Cars", description: 'Ny lead via Google "personalbeloning"',
    type: "page_view", score_change: 74, cta: "Visa profil",
  },
  {
    id: "act3", timestamp: "2026-04-17T09:37:00Z", contact_name: "",
    company: "", description: 'Meta-kampanj "Kupongguiden" genererade 2 nya leads',
    type: "ad_click", cta: "Visa leads",
  },
  {
    id: "act4", timestamp: "2026-04-17T09:33:00Z", contact_name: "Per Nilsson",
    company: "Lantmannen", description: "Oppnade tredje mailet denna vecka",
    type: "email", cta: "Ring Per",
  },
  {
    id: "act5", timestamp: "2026-04-17T09:30:00Z", contact_name: "",
    company: "Stellar", description: 'Slutforde task: "Landningssida Kampanja klar"',
    type: "task", cta: "Visa i ClickUp",
  },
  {
    id: "act6", timestamp: "2026-04-17T09:28:00Z", contact_name: "Sara Bergstrom",
    company: "Telia", description: "Besökte Customer Care-sidan",
    type: "page_view", score_change: 8, cta: "Visa profil",
  },
  {
    id: "act7", timestamp: "2026-04-17T09:24:00Z", contact_name: "",
    company: "", description: 'LinkedIn-annons "Gamification" fick 340 impressions, 12 klick',
    type: "ad_click", cta: "Visa prestanda",
  },
  {
    id: "act8", timestamp: "2026-04-17T09:20:00Z", contact_name: "",
    company: "ICA", description: "Befintlig kund lade till ny kontakt i Upsales",
    type: "crm", cta: "Visa account",
  },
];

// ---- AI SUGGESTIONS ----
export const aiSuggestions: AiSuggestion[] = [
  {
    id: "sug1", category: "HET LEAD", priority: "kritiskt",
    title: "Fazer: Maria Eriksson visar tydliga kopsignaler",
    description: "Score 87. 3 sidbesok + rapport-nedladdning igar. Chef Anders Johansson (CMO) finns redan i CRM.",
    metric: "FAZER / SCORE 87",
    cta_primary: "Ring Maria", cta_secondary: "Visa org.karta",
  },
  {
    id: "sug2", category: "SEGMENT", priority: "hog",
    title: "14 HR-chefer har besökt Send a Gift utan att konvertera",
    description: "Senaste 30 dagarna. Skicka case study-mail med Volvo-exemplet. Prognos: 3 moten.",
    metric: "SEND A GIFT / 14 LEADS",
    cta_primary: "Skicka kampanjmail", cta_secondary: "Visa segment",
  },
  {
    id: "sug3", category: "ANNONSERING", priority: "hog",
    title: 'Kupongguiden-kampanjen overtraffar mal',
    description: "ROAS 6.2x. CPL 89 kr mot budget 120 kr. Forslar att oka budget med 40% och skapa lookalike-audience.",
    metric: "META / ROAS 6.2x",
    cta_primary: "Oka budget", cta_secondary: "Visa detaljer",
  },
  {
    id: "sug4", category: "SOVANDE", priority: "medel",
    title: "23 befintliga kunder utan aktivitet pa 6+ manader",
    description: "Historiskt aterenagagerar personligt mail 18% av sovande kunder.",
    metric: "23 KUNDER / 6+ MAN",
    cta_primary: "Skicka re-engagement", cta_secondary: "Visa lista",
  },
  {
    id: "sug5", category: "TIMING", priority: "kritiskt",
    title: "Anna Svensson pa Orkla: na henne inom 48h",
    description: "Klickade pa LinkedIn-annonsen for gamification igar. Kollega Erik redan kund. Agera medan intresset ar varmt.",
    metric: "INTERACTIVE ENGAGE / 48H",
    cta_primary: "Ring Anna", cta_secondary: "Visa org.karta",
  },
  {
    id: "sug6", category: "STELLAR UPDATE", priority: "medel",
    title: "Vecka 16: 8 uppgifter slutforda",
    description: "Landningssida Kampanja live. Meta A/B-test klart, variant B vann (+34% CTR). SEO-audit levererad.",
    metric: "VECKA 16 / 8 TASKS",
    cta_primary: "Las sammanfattning", cta_secondary: "Visa alla tasks",
  },
];

// ---- CLICKUP TASKS ----
export const clickupTasks: ClickUpTask[] = [
  { id: "t1", clickup_id: "abc1", name: "Landningssida Kampanja", description: "Bygg landningssida for Kampanja-tjansten pa clearon.live/kampanja", status: "done", assignee: "Anton Larsson", priority: 2, due_date: "2026-04-14", date_created: "2026-03-20", date_updated: "2026-04-14", date_closed: "2026-04-14", list_name: "Webb", folder_name: "ClearOn" },
  { id: "t2", clickup_id: "abc2", name: "Meta A/B-test Kupongguiden", description: "Kor A/B-test pa Meta-kampanjen for Kupongguiden", status: "done", assignee: "Kaveh Sabeghi", priority: 2, due_date: "2026-04-15", date_created: "2026-03-25", date_updated: "2026-04-15", date_closed: "2026-04-15", list_name: "Annonsering", folder_name: "ClearOn" },
  { id: "t3", clickup_id: "abc3", name: "SEO-audit clearon.se", description: "Genomfor SEO-audit och leverera rapport", status: "done", assignee: "Anton Larsson", priority: 3, due_date: "2026-04-16", date_created: "2026-04-01", date_updated: "2026-04-16", date_closed: "2026-04-16", list_name: "SEO", folder_name: "ClearOn" },
  { id: "t4", clickup_id: "abc4", name: "Bloggartiklar (3 st)", description: "Skriv och publicera 3 artiklar om kupongkampanjer", status: "done", assignee: "Anton Larsson", priority: 3, due_date: "2026-04-16", date_created: "2026-04-05", date_updated: "2026-04-16", date_closed: "2026-04-16", list_name: "Content", folder_name: "ClearOn" },
  { id: "t5", clickup_id: "abc5", name: "Google Ads Send a Gift", description: "Lansera Google Ads-kampanj for Send a Gift", status: "in progress", assignee: "Kaveh Sabeghi", priority: 2, due_date: "2026-04-21", date_created: "2026-04-10", date_updated: "2026-04-17", date_closed: null, list_name: "Annonsering", folder_name: "ClearOn" },
  { id: "t6", clickup_id: "abc6", name: "Design Interactive Engage-sidan", description: "Nytt designkoncept for Interactive Engage-sidan", status: "in progress", assignee: "Anton Larsson", priority: 2, due_date: "2026-04-22", date_created: "2026-04-12", date_updated: "2026-04-17", date_closed: null, list_name: "Webb", folder_name: "ClearOn" },
  { id: "t7", clickup_id: "abc7", name: "LinkedIn-kampanj Q2", description: "Planera och bygga LinkedIn-kampanj for Q2", status: "to do", assignee: "Kaveh Sabeghi", priority: 2, due_date: "2026-04-28", date_created: "2026-04-15", date_updated: "2026-04-15", date_closed: null, list_name: "Annonsering", folder_name: "ClearOn" },
  { id: "t8", clickup_id: "abc8", name: "Uppdatera ClearOn Event-sida", description: "Uppdatera event-sidan med nytt innehall", status: "to do", assignee: "Anton Larsson", priority: 3, due_date: "2026-04-30", date_created: "2026-04-16", date_updated: "2026-04-16", date_closed: null, list_name: "Webb", folder_name: "ClearOn" },
  { id: "t9", clickup_id: "abc9", name: "Email-automation setup", description: "Satt upp automatiska mailfloden i Upsales", status: "to do", assignee: "Kaveh Sabeghi", priority: 3, due_date: "2026-05-02", date_created: "2026-04-16", date_updated: "2026-04-16", date_closed: null, list_name: "CRM", folder_name: "ClearOn" },
  { id: "t10", clickup_id: "abc10", name: "Konverteringsoptimering clearon.live", description: "Optimera konverteringsflode pa landningssidan", status: "in progress", assignee: "Anton Larsson", priority: 1, due_date: "2026-04-18", date_created: "2026-04-14", date_updated: "2026-04-17", date_closed: null, list_name: "Webb", folder_name: "ClearOn" },
];

// ---- WEEKLY SUMMARIES ----
export const weeklySummaries = [
  {
    week_number: 16, year: 2026,
    summary_text: "Den har veckan har Stellar slutfort 8 uppgifter for ClearOn. Landningssidan for Kampanja-tjansten ar klar och live pa clearon.live/kampanja. Meta-kampanjens A/B-test har avslutats med variant B som vinnare (+34% CTR). SEO-auditen av clearon.se ar levererad med 47 atgardspunkter. Tre bloggartiklar om kupongkampanjer ar publicerade. Google Ads-kampanjen for Send a Gift ar under uppbyggnad och planeras lanseras mandag. Nytt designkoncept for Interactive Engage-sidan pagar.",
    tasks_completed: 8, tasks_in_progress: 3,
  },
  {
    week_number: 15, year: 2026,
    summary_text: "Vecka 15 fokuserade pa innehallsproduktion och annonseringsoptimering. 5 uppgifter slutfordes: ny hero-sektion pa clearon.live, tva kundcase (Orkla, Lantmannen) publicerade, Meta-kampanjens budget justerad (+20%), och tracking-setup for GA4 slutfort. Konverteringsgraden pa clearon.live okade fran 2.1% till 3.4%.",
    tasks_completed: 5, tasks_in_progress: 4,
  },
  {
    week_number: 14, year: 2026,
    summary_text: "Stellar pabörjade tre nya initiativ: SEO-audit, LinkedIn-annonsering och email-automationsflode. 4 tasks slutfordes: produktsidorna for Sales Promotion och Customer Care uppdaterade, nytt bildbibliotek uppladdat, och Google Ads-kontot restrukturerat. CPL sjönk med 18% totalt.",
    tasks_completed: 4, tasks_in_progress: 5,
  },
  {
    week_number: 13, year: 2026,
    summary_text: "Fokus pa teknisk grund. Stellar levererade: ny responsiv design for clearon.live (mobiltrafik +22%), integration med Upsales for automatisk lead-fangst, och Meta Pixel-setup for retargeting. 6 tasks slutforda.",
    tasks_completed: 6, tasks_in_progress: 2,
  },
];

// ---- KPI DATA ----
export const kpis = {
  activeLeads: { value: 342, change: 23, period: "denna vecka" },
  hotLeads: { value: 28, change: 3, period: "idag" },
  pipelineValue: { value: 4200000, change: 12, period: "vs forra manaden" },
  conversionRate: { value: 8.4, change: 1.2, period: "vs forra manaden" },
};

// ---- AD CAMPAIGNS ----
export const adCampaigns: AdCampaign[] = [
  { id: "ad1", platform: "meta", campaign_name: "Kupongguiden 2026", product_slug: "sales-promotion", status: "active", budget: 25000, spend: 18400, impressions: 245000, clicks: 3200, leads_generated: 34, conversions: 4, date: "2026-04-17" },
  { id: "ad2", platform: "meta", campaign_name: "Send a Gift HR", product_slug: "send-a-gift", status: "active", budget: 15000, spend: 8900, impressions: 128000, clicks: 1800, leads_generated: 18, conversions: 2, date: "2026-04-17" },
  { id: "ad3", platform: "google", campaign_name: "Kupongkampanj butik", product_slug: "sales-promotion", status: "active", budget: 20000, spend: 14200, impressions: 89000, clicks: 2100, leads_generated: 22, conversions: 3, date: "2026-04-17" },
  { id: "ad4", platform: "google", campaign_name: "Personalbeloning digital", product_slug: "send-a-gift", status: "active", budget: 12000, spend: 7600, impressions: 56000, clicks: 980, leads_generated: 12, conversions: 1, date: "2026-04-17" },
  { id: "ad5", platform: "linkedin", campaign_name: "Gamification retail", product_slug: "interactive-engage", status: "active", budget: 18000, spend: 12300, impressions: 67000, clicks: 890, leads_generated: 8, conversions: 1, date: "2026-04-17" },
  { id: "ad6", platform: "linkedin", campaign_name: "Customer Care B2B", product_slug: "customer-care", status: "paused", budget: 10000, spend: 10000, impressions: 82000, clicks: 1100, leads_generated: 11, conversions: 2, date: "2026-04-10" },
  { id: "ad7", platform: "meta", campaign_name: "Kampanja lansering", product_slug: "kampanja", status: "active", budget: 8000, spend: 3200, impressions: 45000, clicks: 620, leads_generated: 6, conversions: 0, date: "2026-04-17" },
  { id: "ad8", platform: "google", campaign_name: "Clearing kedjor", product_slug: "clearing-solutions", status: "active", budget: 5000, spend: 2800, impressions: 22000, clicks: 340, leads_generated: 4, conversions: 0, date: "2026-04-17" },
];

// Helper: get lead with score and product interest
export function getLeadWithDetails(contactId: string) {
  const contact = contacts.find((c) => c.id === contactId);
  const score = leadScores.find((s) => s.contact_id === contactId);
  const products = productScores
    .filter((p) => p.contact_id === contactId)
    .sort((a, b) => b.score - a.score);
  return { contact, score, products };
}

// Helper: hot leads (sorted by score)
export function getHotLeads(limit = 5) {
  return leadScores
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, limit)
    .map((score) => {
      const contact = contacts.find((c) => c.id === score.contact_id);
      const topProduct = productScores
        .filter((p) => p.contact_id === score.contact_id)
        .sort((a, b) => b.score - a.score)[0];
      return { ...score, contact, topProduct };
    });
}

// Helper: get contacts by account (for org chart)
export function getOrgChart(accountId: string) {
  return contacts
    .filter((c) => c.account_id === accountId)
    .map((c) => ({
      ...c,
      score: leadScores.find((s) => s.contact_id === c.id),
    }));
}
