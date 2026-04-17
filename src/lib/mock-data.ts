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
  source_channel?: string;
  landing_page?: string;
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
    source_channel: "Google Ads", landing_page: "/sales-promotion",
  },
  {
    id: "c2", upsales_id: 2002, account_id: "a1", account_name: "Fazer",
    name: "Anders Johansson", title: "CMO", email: "anders.johansson@fazer.se",
    phone: "+46 70 234 5678", role_category: "executive", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/andersjohansson",
    source_channel: "Email", landing_page: "/sales-promotion",
  },
  {
    id: "c3", upsales_id: 2003, account_id: "a1", account_name: "Fazer",
    name: "Erik Lind", title: "Trade Marketing Manager", email: "erik.lind@fazer.se",
    phone: "+46 70 345 6789", role_category: "trade_marketing", reports_to_contact_id: "c2",
    linkedin_url: "linkedin.com/in/eriklind",
    source_channel: "LinkedIn Ads", landing_page: "/interactive-engage",
  },
  {
    id: "c4", upsales_id: 2004, account_id: "a1", account_name: "Fazer",
    name: "Sofia Holm", title: "Digital Marketing Specialist", email: "sofia.holm@fazer.se",
    phone: "+46 70 456 7890", role_category: "marketing", reports_to_contact_id: "c1",
    linkedin_url: "linkedin.com/in/sofiaholm",
    source_channel: "Meta Ads", landing_page: "/kampanja",
  },
  {
    id: "c5", upsales_id: 2005, account_id: "a5", account_name: "Volvo Cars",
    name: "Johan Lindstrom", title: "HR-chef", email: "johan.lindstrom@volvocars.com",
    phone: "+46 70 567 8901", role_category: "hr", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/johanlindstrom",
    source_channel: "Google Ads", landing_page: "/send-a-gift",
  },
  {
    id: "c6", upsales_id: 2006, account_id: "a2", account_name: "Orkla",
    name: "Anna Svensson", title: "Trade Marketing Manager", email: "anna.svensson@orkla.se",
    phone: "+46 70 678 9012", role_category: "trade_marketing", reports_to_contact_id: "c7",
    linkedin_url: "linkedin.com/in/annasvensson",
    source_channel: "LinkedIn Ads", landing_page: "/interactive-engage",
  },
  {
    id: "c7", upsales_id: 2007, account_id: "a2", account_name: "Orkla",
    name: "Henrik Dahl", title: "Marketing Director", email: "henrik.dahl@orkla.se",
    phone: "+46 70 789 0123", role_category: "executive", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/henrikdahl",
    source_channel: "Organic", landing_page: "/sales-promotion",
  },
  {
    id: "c8", upsales_id: 2008, account_id: "a4", account_name: "Lantmannen",
    name: "Per Nilsson", title: "Marknadschef", email: "per.nilsson@lantmannen.se",
    phone: "+46 70 890 1234", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/pernilsson",
    source_channel: "Email", landing_page: "/sales-promotion",
  },
  {
    id: "c9", upsales_id: 2009, account_id: "a6", account_name: "Telia",
    name: "Sara Bergstrom", title: "Kundtjanstchef", email: "sara.bergstrom@telia.se",
    phone: "+46 70 901 2345", role_category: "customer_service", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/sarabergstrom",
    source_channel: "LinkedIn Ads", landing_page: "/customer-care",
  },
  {
    id: "c10", upsales_id: 2010, account_id: "a3", account_name: "ICA",
    name: "Lars Pettersson", title: "Category Manager", email: "lars.pettersson@ica.se",
    phone: "+46 70 012 3456", role_category: "trade_marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/larspettersson",
    source_channel: "Google Ads", landing_page: "/clearing",
  },
  {
    id: "c11", upsales_id: 2011, account_id: "a7", account_name: "Axfood",
    name: "Karin Lundgren", title: "Brand Manager", email: "karin.lundgren@axfood.se",
    phone: "+46 70 111 2233", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/karinlundgren",
    source_channel: "Meta Ads", landing_page: "/sales-promotion",
  },
  {
    id: "c12", upsales_id: 2012, account_id: "a8", account_name: "Arla",
    name: "Oskar Berg", title: "Trade Marketing Specialist", email: "oskar.berg@arla.se",
    phone: "+46 70 222 3344", role_category: "trade_marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/oskarberg",
    source_channel: "Google Ads", landing_page: "/sales-promotion",
  },
  {
    id: "c13", upsales_id: 2013, account_id: "a10", account_name: "Unilever Nordics",
    name: "Emma Franzen", title: "Shopper Marketing Manager", email: "emma.franzen@unilever.com",
    phone: "+46 70 333 4455", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/emmafranzen",
    source_channel: "Meta Ads", landing_page: "/interactive-engage",
  },
  {
    id: "c14", upsales_id: 2014, account_id: "a9", account_name: "Coop",
    name: "David Nordin", title: "Marknadschef", email: "david.nordin@coop.se",
    phone: "+46 70 444 5566", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/davidnordin",
    source_channel: "Email", landing_page: "/kampanja",
  },
  {
    id: "c15", upsales_id: 2015, account_id: "a5", account_name: "Volvo Cars",
    name: "Anna Svensson", title: "Inkopschef", email: "anna.s@volvocars.com",
    phone: "+46 70 555 6677", role_category: "other", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/annasvensson2",
    source_channel: "Organic", landing_page: "/send-a-gift",
  },
  {
    id: "c16", upsales_id: 2016, account_id: "a11", account_name: "Procter & Gamble",
    name: "Therese Aberg", title: "Brand Manager", email: "therese.aberg@pg.com",
    phone: "+46 70 666 7788", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/thereseaberg",
    source_channel: "Meta Ads", landing_page: "/sales-promotion",
  },
  {
    id: "c17", upsales_id: 2017, account_id: "a12", account_name: "Nestle Nordics",
    name: "Fredrik Ek", title: "Marketing Manager", email: "fredrik.ek@nestle.se",
    phone: "+46 70 777 8899", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/fredrikek",
    source_channel: "Google Ads", landing_page: "/kampanja",
  },
  {
    id: "c18", upsales_id: 2018, account_id: "a13", account_name: "H&M",
    name: "Louise Sjoberg", title: "CRM Manager", email: "louise.sjoberg@hm.com",
    phone: "+46 70 888 9900", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/louisesjoberg",
    source_channel: "LinkedIn Ads", landing_page: "/customer-care",
  },
  {
    id: "c19", upsales_id: 2019, account_id: "a19", account_name: "Scandic Hotels",
    name: "Marcus Wahl", title: "HR-direktor", email: "marcus.wahl@scandichotels.com",
    phone: "+46 70 999 0011", role_category: "hr", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/marcuswahl",
    source_channel: "Meta Ads", landing_page: "/send-a-gift",
  },
  {
    id: "c20", upsales_id: 2020, account_id: "a17", account_name: "Mondelez",
    name: "Ida Karlsson", title: "Shopper Marketing Lead", email: "ida.karlsson@mondelez.com",
    phone: "+46 70 100 2233", role_category: "marketing", reports_to_contact_id: null,
    linkedin_url: "linkedin.com/in/idakarlsson",
    source_channel: "LinkedIn Ads", landing_page: "/interactive-engage",
  },
];

// ---- LEAD SCORES (all with rich signals) ----
export const leadScores: LeadScore[] = [
  {
    contact_id: "c1", total_score: 87, engagement_score: 36, fit_score: 25, intent_score: 26,
    signals: [
      { type: "page_view", value: 8, timestamp: "2026-04-17T09:15:00Z", description: "Besökte /sales-promotion/ (3 ggr senaste 48h)" },
      { type: "download", value: 10, timestamp: "2026-04-17T09:42:00Z", description: 'Laddade ner "Clear Insights"-rapport' },
      { type: "email_click", value: 6, timestamp: "2026-04-16T11:20:00Z", description: 'Klickade pa "Boka demo"-lank i nyhetsbrev' },
      { type: "email_open", value: 3, timestamp: "2026-04-15T08:15:00Z", description: 'Oppnade "Kupongkampanjer 2026"' },
      { type: "search", value: 5, timestamp: "2026-04-14T16:00:00Z", description: 'Forsta besok via Google "kupongkampanj butik"' },
      { type: "page_view", value: 4, timestamp: "2026-04-17T09:50:00Z", description: "Besökte prissidan" },
    ],
  },
  {
    contact_id: "c5", total_score: 79, engagement_score: 32, fit_score: 24, intent_score: 23,
    signals: [
      { type: "page_view", value: 8, timestamp: "2026-04-17T10:15:00Z", description: "Besökte /send-a-gift/ (4 ggr senaste veckan)" },
      { type: "search", value: 5, timestamp: "2026-04-17T10:10:00Z", description: 'Google: "digital personalbeloning foretag"' },
      { type: "download", value: 8, timestamp: "2026-04-16T14:30:00Z", description: 'Laddade ner "Personalbeloning Guide 2026"' },
      { type: "page_view", value: 6, timestamp: "2026-04-17T10:22:00Z", description: "Besökte kontaktsidan" },
      { type: "email_open", value: 3, timestamp: "2026-04-15T09:00:00Z", description: "Oppnade Send a Gift-nyhetsbrev" },
    ],
  },
  {
    contact_id: "c6", total_score: 76, engagement_score: 30, fit_score: 25, intent_score: 21,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-16T15:30:00Z", description: "Klickade pa LinkedIn-annons Interactive Engage" },
      { type: "page_view", value: 8, timestamp: "2026-04-16T15:32:00Z", description: "Besökte /interactive-engage/ via annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-17T08:45:00Z", description: "Aterkom till /interactive-engage/ direkt" },
      { type: "page_view", value: 4, timestamp: "2026-04-17T08:52:00Z", description: "Besökte kundcase-sidan" },
      { type: "email_open", value: 3, timestamp: "2026-04-14T10:00:00Z", description: "Oppnade Gamification-nyhetsbrev" },
    ],
  },
  {
    contact_id: "c9", total_score: 72, engagement_score: 28, fit_score: 22, intent_score: 22,
    signals: [
      { type: "page_view", value: 10, timestamp: "2026-04-17T09:28:00Z", description: "Besökte kontaktsidan (stark kopsignal)" },
      { type: "page_view", value: 8, timestamp: "2026-04-17T09:25:00Z", description: "Besökte /customer-care/ fran LinkedIn" },
      { type: "ad_click", value: 4, timestamp: "2026-04-17T09:23:00Z", description: "Klickade pa LinkedIn Customer Care-annons" },
      { type: "email_click", value: 5, timestamp: "2026-04-15T11:00:00Z", description: "Klickade pa case study i mail" },
    ],
  },
  {
    contact_id: "c8", total_score: 68, engagement_score: 24, fit_score: 24, intent_score: 20,
    signals: [
      { type: "email_open", value: 3, timestamp: "2026-04-17T08:30:00Z", description: "Oppnade 3 mail i rad denna vecka" },
      { type: "email_click", value: 5, timestamp: "2026-04-16T09:15:00Z", description: "Klickade pa Sales Promotion-lank i mail" },
      { type: "page_view", value: 6, timestamp: "2026-04-16T09:18:00Z", description: "Besökte /sales-promotion/ via mail" },
      { type: "page_view", value: 4, timestamp: "2026-04-15T14:00:00Z", description: "Besökte bloggartikeln om kupongkampanjer" },
    ],
  },
  {
    contact_id: "c20", total_score: 66, engagement_score: 22, fit_score: 24, intent_score: 20,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-16T16:00:00Z", description: "Klickade pa LinkedIn Interactive Engage-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-16T16:02:00Z", description: "Besökte /interactive-engage/ via annons" },
      { type: "page_view", value: 4, timestamp: "2026-04-17T07:30:00Z", description: "Aterkom till /interactive-engage/ organiskt" },
      { type: "email_open", value: 3, timestamp: "2026-04-14T08:00:00Z", description: "Oppnade Shopper Marketing-nyhetsbrev" },
    ],
  },
  {
    contact_id: "c10", total_score: 62, engagement_score: 20, fit_score: 25, intent_score: 17,
    signals: [
      { type: "search", value: 5, timestamp: "2026-04-15T11:00:00Z", description: 'Google: "clearing dagligvaruhandel"' },
      { type: "page_view", value: 6, timestamp: "2026-04-15T11:02:00Z", description: "Besökte /clearing/ via sok" },
      { type: "page_view", value: 4, timestamp: "2026-04-16T13:00:00Z", description: "Aterkom och besökte Sales Promotion-sidan" },
    ],
  },
  {
    contact_id: "c11", total_score: 58, engagement_score: 18, fit_score: 25, intent_score: 15,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-15T10:00:00Z", description: "Klickade pa Meta-annons Kupongguiden" },
      { type: "page_view", value: 6, timestamp: "2026-04-15T10:02:00Z", description: "Besökte /sales-promotion/ via annons" },
      { type: "email_open", value: 3, timestamp: "2026-04-16T08:00:00Z", description: "Oppnade vecko-nyhetsbrev" },
    ],
  },
  {
    contact_id: "c19", total_score: 57, engagement_score: 18, fit_score: 20, intent_score: 19,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-16T11:00:00Z", description: "Klickade pa Meta Send a Gift HR-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-16T11:02:00Z", description: "Besökte /send-a-gift/ via annons" },
      { type: "page_view", value: 4, timestamp: "2026-04-17T09:00:00Z", description: "Besökte prissidan for Send a Gift" },
    ],
  },
  {
    contact_id: "c12", total_score: 55, engagement_score: 17, fit_score: 23, intent_score: 15,
    signals: [
      { type: "search", value: 5, timestamp: "2026-04-14T14:00:00Z", description: 'Google: "kupongkampanj mejeri"' },
      { type: "page_view", value: 6, timestamp: "2026-04-14T14:02:00Z", description: "Besökte /sales-promotion/ via sok" },
      { type: "email_open", value: 3, timestamp: "2026-04-16T07:30:00Z", description: "Oppnade kampanjmail" },
    ],
  },
  {
    contact_id: "c13", total_score: 52, engagement_score: 16, fit_score: 22, intent_score: 14,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-15T14:00:00Z", description: "Klickade pa Meta Interactive Engage-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-15T14:02:00Z", description: "Besökte /interactive-engage/ via annons" },
      { type: "page_view", value: 4, timestamp: "2026-04-16T09:30:00Z", description: "Besökte kundcase Gamification" },
    ],
  },
  {
    contact_id: "c14", total_score: 48, engagement_score: 14, fit_score: 20, intent_score: 14,
    signals: [
      { type: "email_click", value: 5, timestamp: "2026-04-15T08:30:00Z", description: "Klickade pa Kampanja-lank i mail" },
      { type: "page_view", value: 6, timestamp: "2026-04-15T08:32:00Z", description: "Besökte /kampanja/ via mail" },
    ],
  },
  {
    contact_id: "c16", total_score: 45, engagement_score: 13, fit_score: 22, intent_score: 10,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-14T12:00:00Z", description: "Klickade pa Meta Kupongguiden-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-14T12:02:00Z", description: "Besökte /sales-promotion/ via annons" },
    ],
  },
  {
    contact_id: "c17", total_score: 43, engagement_score: 12, fit_score: 21, intent_score: 10,
    signals: [
      { type: "search", value: 5, timestamp: "2026-04-13T10:00:00Z", description: 'Google: "kampanjsida SMS kupong"' },
      { type: "page_view", value: 6, timestamp: "2026-04-13T10:02:00Z", description: "Besökte /kampanja/ via sok" },
    ],
  },
  {
    contact_id: "c18", total_score: 41, engagement_score: 12, fit_score: 18, intent_score: 11,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-16T14:00:00Z", description: "Klickade pa LinkedIn Customer Care-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-16T14:02:00Z", description: "Besökte /customer-care/ via annons" },
    ],
  },
  {
    contact_id: "c3", total_score: 42, engagement_score: 12, fit_score: 20, intent_score: 10,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-15T16:00:00Z", description: "Klickade pa LinkedIn Interactive Engage-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-15T16:02:00Z", description: "Besökte /interactive-engage/ via annons" },
    ],
  },
  {
    contact_id: "c15", total_score: 40, engagement_score: 12, fit_score: 18, intent_score: 10,
    signals: [
      { type: "page_view", value: 6, timestamp: "2026-04-14T09:00:00Z", description: "Besökte /send-a-gift/ organiskt" },
      { type: "page_view", value: 4, timestamp: "2026-04-15T10:00:00Z", description: "Aterkom till /send-a-gift/" },
    ],
  },
  { contact_id: "c4", total_score: 33, engagement_score: 10, fit_score: 15, intent_score: 8,
    signals: [
      { type: "ad_click", value: 4, timestamp: "2026-04-12T14:00:00Z", description: "Klickade pa Meta Kampanja-annons" },
      { type: "page_view", value: 6, timestamp: "2026-04-12T14:02:00Z", description: "Besökte /kampanja/ via annons" },
    ],
  },
  { contact_id: "c2", total_score: 30, engagement_score: 8, fit_score: 15, intent_score: 7,
    signals: [
      { type: "email_open", value: 3, timestamp: "2026-04-10T08:00:00Z", description: "Oppnade Sales Promotion-mail" },
    ],
  },
  { contact_id: "c7", total_score: 28, engagement_score: 6, fit_score: 15, intent_score: 7,
    signals: [
      { type: "page_view", value: 4, timestamp: "2026-04-08T11:00:00Z", description: "Besökte /sales-promotion/ organiskt" },
    ],
  },
];

// ---- PRODUCT SCORES (comprehensive - all products have leads) ----
export const productScores: ProductScore[] = [
  // Sales Promotion
  { contact_id: "c1", product_slug: "sales-promotion", score: 85 },
  { contact_id: "c8", product_slug: "sales-promotion", score: 64 },
  { contact_id: "c10", product_slug: "sales-promotion", score: 58 },
  { contact_id: "c11", product_slug: "sales-promotion", score: 55 },
  { contact_id: "c12", product_slug: "sales-promotion", score: 52 },
  { contact_id: "c16", product_slug: "sales-promotion", score: 44 },
  { contact_id: "c17", product_slug: "sales-promotion", score: 38 },
  { contact_id: "c7", product_slug: "sales-promotion", score: 25 },
  // Customer Care
  { contact_id: "c9", product_slug: "customer-care", score: 72 },
  { contact_id: "c18", product_slug: "customer-care", score: 41 },
  { contact_id: "c14", product_slug: "customer-care", score: 35 },
  { contact_id: "c1", product_slug: "customer-care", score: 18 },
  { contact_id: "c5", product_slug: "customer-care", score: 15 },
  // Interactive Engage
  { contact_id: "c6", product_slug: "interactive-engage", score: 76 },
  { contact_id: "c20", product_slug: "interactive-engage", score: 66 },
  { contact_id: "c13", product_slug: "interactive-engage", score: 52 },
  { contact_id: "c3", product_slug: "interactive-engage", score: 42 },
  { contact_id: "c1", product_slug: "interactive-engage", score: 28 },
  // Kampanja
  { contact_id: "c14", product_slug: "kampanja", score: 48 },
  { contact_id: "c17", product_slug: "kampanja", score: 43 },
  { contact_id: "c4", product_slug: "kampanja", score: 33 },
  { contact_id: "c8", product_slug: "kampanja", score: 28 },
  { contact_id: "c11", product_slug: "kampanja", score: 22 },
  // Send a Gift
  { contact_id: "c5", product_slug: "send-a-gift", score: 79 },
  { contact_id: "c19", product_slug: "send-a-gift", score: 57 },
  { contact_id: "c15", product_slug: "send-a-gift", score: 40 },
  { contact_id: "c9", product_slug: "send-a-gift", score: 15 },
  // Clearing Solutions
  { contact_id: "c10", product_slug: "clearing-solutions", score: 58 },
  { contact_id: "c12", product_slug: "clearing-solutions", score: 30 },
  { contact_id: "c7", product_slug: "clearing-solutions", score: 22 },
  { contact_id: "c14", product_slug: "clearing-solutions", score: 18 },
];

// ---- LIVE ACTIVITY FEED ----
export const activityFeed: Activity[] = [
  {
    id: "act1", timestamp: "2026-04-17T09:50:00Z", contact_name: "Maria Eriksson",
    company: "Fazer", description: "Besökte prissidan for Sales Promotion",
    type: "page_view", score_change: 4, cta: "Ring Maria nu",
  },
  {
    id: "act2", timestamp: "2026-04-17T09:42:00Z", contact_name: "Maria Eriksson",
    company: "Fazer", description: 'Laddade ner "Clear Insights"-rapporten',
    type: "download", cta: "Skicka uppfoljningsmail",
  },
  {
    id: "act3", timestamp: "2026-04-17T09:28:00Z", contact_name: "Sara Bergstrom",
    company: "Telia", description: "Besökte kontaktsidan via LinkedIn-annons (stark kopsignal)",
    type: "page_view", score_change: 10, cta: "Ring Sara",
  },
  {
    id: "act4", timestamp: "2026-04-17T09:22:00Z", contact_name: "Johan Lindstrom",
    company: "Volvo Cars", description: "Besökte kontaktsidan for Send a Gift",
    type: "page_view", score_change: 6, cta: "Visa profil",
  },
  {
    id: "act5", timestamp: "2026-04-17T09:15:00Z", contact_name: "",
    company: "", description: 'Meta-kampanj "Kupongguiden 2026" genererade 3 nya leads idag',
    type: "ad_click", cta: "Visa leads",
  },
  {
    id: "act6", timestamp: "2026-04-17T08:45:00Z", contact_name: "Anna Svensson",
    company: "Orkla", description: "Aterkom till /interactive-engage/ (2:a besok pa 24h)",
    type: "page_view", score_change: 6, cta: "Ring Anna",
  },
  {
    id: "act7", timestamp: "2026-04-17T08:30:00Z", contact_name: "Per Nilsson",
    company: "Lantmannen", description: "Oppnade tredje mailet denna vecka (stark engagemangssignal)",
    type: "email", cta: "Ring Per",
  },
  {
    id: "act8", timestamp: "2026-04-17T07:30:00Z", contact_name: "Ida Karlsson",
    company: "Mondelez", description: "Aterkom till /interactive-engage/ organiskt",
    type: "page_view", score_change: 4, cta: "Visa profil",
  },
  {
    id: "act9", timestamp: "2026-04-17T09:00:00Z", contact_name: "Marcus Wahl",
    company: "Scandic Hotels", description: "Besökte prissidan for Send a Gift",
    type: "page_view", score_change: 4, cta: "Visa profil",
  },
  {
    id: "act10", timestamp: "2026-04-16T16:00:00Z", contact_name: "",
    company: "", description: 'LinkedIn-kampanj "Gamification retail" genererade 2 nya leads',
    type: "ad_click", cta: "Visa leads",
  },
  {
    id: "act11", timestamp: "2026-04-16T15:30:00Z", contact_name: "",
    company: "Stellar", description: 'Slutforde task: "Landningssida Kampanja klar och live"',
    type: "task", cta: "Visa i ClickUp",
  },
  {
    id: "act12", timestamp: "2026-04-16T14:30:00Z", contact_name: "Johan Lindstrom",
    company: "Volvo Cars", description: 'Laddade ner "Personalbeloning Guide 2026"',
    type: "download", cta: "Skicka uppfoljningsmail",
  },
];

// ---- AI SUGGESTIONS ----
export const aiSuggestions: AiSuggestion[] = [
  {
    id: "sug1", category: "HET LEAD", priority: "kritiskt",
    title: "Fazer: Maria Eriksson visar tydliga kopsignaler",
    description: "Score 87. Besökte prissidan idag + rapport-nedladdning + 3 sidbesok pa 48h. Chef Anders Johansson (CMO) finns redan i CRM. Agera inom 24h.",
    metric: "FAZER / SCORE 87",
    cta_primary: "Ring Maria", cta_secondary: "Visa org.karta",
  },
  {
    id: "sug2", category: "TIMING", priority: "kritiskt",
    title: "Volvo Cars: Johan Lindstrom besökte kontaktsidan idag",
    description: "Score 79. Laddade ner personalbelonings-guiden igar + besökte kontaktsidan idag. Kollekan Anna Svensson (Inkopschef) ar ocksa aktiv. Tva kontakter pa samma bolag = starkt kopsignal.",
    metric: "VOLVO / SCORE 79 / KONTAKTSIDA",
    cta_primary: "Ring Johan", cta_secondary: "Visa org.karta",
  },
  {
    id: "sug3", category: "TIMING", priority: "kritiskt",
    title: "Anna Svensson (Orkla): na henne inom 48h",
    description: "Score 76. Aterkom till Interactive Engage-sidan idag efter LinkedIn-annonsklick igar. Kollega Henrik ar redan kund for Sales Promotion. Cross-sell-mojlighet.",
    metric: "INTERACTIVE ENGAGE / 48H",
    cta_primary: "Ring Anna", cta_secondary: "Visa org.karta",
  },
  {
    id: "sug4", category: "HET LEAD", priority: "hog",
    title: "Telia: Sara Bergstrom besökte kontaktsidan via LinkedIn",
    description: "Score 72. Klickade pa LinkedIn-annons och gick direkt till kontaktsidan. Kundtjanstchef med beslutsmandat for Customer Care. Ring idag.",
    metric: "TELIA / SCORE 72 / KONTAKTSIDA",
    cta_primary: "Ring Sara", cta_secondary: "Visa profil",
  },
  {
    id: "sug5", category: "ANNONSERING", priority: "hog",
    title: 'Kupongguiden-kampanjen overtraffar mal',
    description: "ROAS 6.2x. CPL 89 kr mot budget 120 kr. 3 nya leads bara idag. Forslar att oka budget med 40% och skapa lookalike-audience baserat pa konverterade leads.",
    metric: "META / ROAS 6.2x / CPL 89 KR",
    cta_primary: "Oka budget", cta_secondary: "Visa kampanj",
  },
  {
    id: "sug6", category: "SEGMENT", priority: "hog",
    title: "3 HR-leads visar intresse for Send a Gift",
    description: "Johan (Volvo), Marcus (Scandic) och Anna (Volvo) har alla besökt Send a Gift. Skicka case study-mail med Volvo-exemplet till alla HR-kontakter.",
    metric: "SEND A GIFT / 3 AKTIVA HR-LEADS",
    cta_primary: "Skicka kampanjmail", cta_secondary: "Visa segment",
  },
  {
    id: "sug7", category: "SOVANDE", priority: "medel",
    title: "23 befintliga kunder utan aktivitet pa 6+ manader",
    description: "Historiskt aterenagagerar personligt mail 18% av sovande kunder. Forsla att starta re-engagement-kampanj med produktnyheter.",
    metric: "23 KUNDER / 6+ MAN",
    cta_primary: "Skicka re-engagement", cta_secondary: "Visa lista",
  },
  {
    id: "sug8", category: "STELLAR UPDATE", priority: "medel",
    title: "Vecka 16: 8 uppgifter slutforda",
    description: "Landningssida Kampanja live. Meta A/B-test klart, variant B vann (+34% CTR). SEO-audit levererad. Google Ads Send a Gift under uppbyggnad.",
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

// ---- AD CAMPAIGNS (all products across all channels) ----
export const adCampaigns: AdCampaign[] = [
  // Sales Promotion - alla kanaler
  { id: "ad1", platform: "meta", campaign_name: "Kupongguiden 2026", product_slug: "sales-promotion", status: "active", budget: 25000, spend: 18400, impressions: 245000, clicks: 3200, leads_generated: 34, conversions: 4, date: "2026-04-17" },
  { id: "ad2", platform: "google", campaign_name: "Kupongkampanj butik", product_slug: "sales-promotion", status: "active", budget: 20000, spend: 14200, impressions: 89000, clicks: 2100, leads_generated: 22, conversions: 3, date: "2026-04-17" },
  { id: "ad3", platform: "linkedin", campaign_name: "Sales Promotion B2B", product_slug: "sales-promotion", status: "active", budget: 12000, spend: 8400, impressions: 45000, clicks: 620, leads_generated: 6, conversions: 1, date: "2026-04-17" },
  // Customer Care - alla kanaler
  { id: "ad4", platform: "linkedin", campaign_name: "Customer Care B2B", product_slug: "customer-care", status: "active", budget: 15000, spend: 11200, impressions: 82000, clicks: 1100, leads_generated: 11, conversions: 2, date: "2026-04-17" },
  { id: "ad5", platform: "meta", campaign_name: "Kundvard digital", product_slug: "customer-care", status: "active", budget: 10000, spend: 6800, impressions: 98000, clicks: 1400, leads_generated: 14, conversions: 1, date: "2026-04-17" },
  { id: "ad6", platform: "google", campaign_name: "Digital kompensation", product_slug: "customer-care", status: "active", budget: 8000, spend: 5200, impressions: 34000, clicks: 780, leads_generated: 8, conversions: 1, date: "2026-04-17" },
  // Interactive Engage - alla kanaler
  { id: "ad7", platform: "linkedin", campaign_name: "Gamification retail", product_slug: "interactive-engage", status: "active", budget: 18000, spend: 12300, impressions: 67000, clicks: 890, leads_generated: 8, conversions: 1, date: "2026-04-17" },
  { id: "ad8", platform: "meta", campaign_name: "Spel & tavlingar FMCG", product_slug: "interactive-engage", status: "active", budget: 12000, spend: 8100, impressions: 134000, clicks: 1800, leads_generated: 16, conversions: 2, date: "2026-04-17" },
  { id: "ad9", platform: "google", campaign_name: "Gamification kupong", product_slug: "interactive-engage", status: "active", budget: 6000, spend: 3800, impressions: 28000, clicks: 560, leads_generated: 5, conversions: 0, date: "2026-04-17" },
  // Kampanja - alla kanaler
  { id: "ad10", platform: "meta", campaign_name: "Kampanja lansering", product_slug: "kampanja", status: "active", budget: 8000, spend: 3200, impressions: 45000, clicks: 620, leads_generated: 6, conversions: 0, date: "2026-04-17" },
  { id: "ad11", platform: "google", campaign_name: "Kampanjsida SMS", product_slug: "kampanja", status: "active", budget: 6000, spend: 4100, impressions: 32000, clicks: 480, leads_generated: 5, conversions: 1, date: "2026-04-17" },
  { id: "ad12", platform: "linkedin", campaign_name: "Kampanja B2B", product_slug: "kampanja", status: "paused", budget: 5000, spend: 3800, impressions: 22000, clicks: 310, leads_generated: 3, conversions: 0, date: "2026-04-10" },
  // Send a Gift - alla kanaler
  { id: "ad13", platform: "meta", campaign_name: "Send a Gift HR", product_slug: "send-a-gift", status: "active", budget: 15000, spend: 8900, impressions: 128000, clicks: 1800, leads_generated: 18, conversions: 2, date: "2026-04-17" },
  { id: "ad14", platform: "google", campaign_name: "Personalbeloning digital", product_slug: "send-a-gift", status: "active", budget: 12000, spend: 7600, impressions: 56000, clicks: 980, leads_generated: 12, conversions: 1, date: "2026-04-17" },
  { id: "ad15", platform: "linkedin", campaign_name: "Send a Gift foretag", product_slug: "send-a-gift", status: "active", budget: 10000, spend: 6200, impressions: 38000, clicks: 520, leads_generated: 5, conversions: 1, date: "2026-04-17" },
  // Clearing Solutions - alla kanaler
  { id: "ad16", platform: "google", campaign_name: "Clearing kedjor", product_slug: "clearing-solutions", status: "active", budget: 5000, spend: 2800, impressions: 22000, clicks: 340, leads_generated: 4, conversions: 0, date: "2026-04-17" },
  { id: "ad17", platform: "linkedin", campaign_name: "Clearing B2B", product_slug: "clearing-solutions", status: "active", budget: 4000, spend: 2400, impressions: 18000, clicks: 260, leads_generated: 3, conversions: 0, date: "2026-04-17" },
  { id: "ad18", platform: "meta", campaign_name: "Clearing solutions", product_slug: "clearing-solutions", status: "paused", budget: 3000, spend: 1800, impressions: 28000, clicks: 380, leads_generated: 2, conversions: 0, date: "2026-04-08" },
];

// ---- CHANNEL FLOW DATA (aggregated for overview) ----
export interface ChannelFlow {
  channel: string;
  visitors: number;
  leads: number;
  qualified: number;
  opportunities: number;
  deals: number;
  topLandingPage: string;
  topProduct: string;
}

export const channelFlows: ChannelFlow[] = [
  { channel: "Meta Ads", visitors: 4820, leads: 90, qualified: 34, opportunities: 12, deals: 4, topLandingPage: "/sales-promotion", topProduct: "Sales Promotion" },
  { channel: "Google Ads", visitors: 3410, leads: 56, qualified: 22, opportunities: 8, deals: 3, topLandingPage: "/sales-promotion", topProduct: "Sales Promotion" },
  { channel: "LinkedIn Ads", visitors: 1890, leads: 36, qualified: 16, opportunities: 6, deals: 2, topLandingPage: "/interactive-engage", topProduct: "Interactive Engage" },
  { channel: "Email", visitors: 4200, leads: 14, qualified: 8, opportunities: 4, deals: 3, topLandingPage: "/kampanja", topProduct: "Kampanja" },
  { channel: "Organic", visitors: 18500, leads: 22, qualified: 12, opportunities: 5, deals: 2, topLandingPage: "/sales-promotion", topProduct: "Sales Promotion" },
];

// ---- LANDING PAGE STATS ----
export interface LandingPageStat {
  path: string;
  product_slug: string;
  visitors: number;
  leads: number;
  conversion_rate: number;
  avg_time_on_page: string;
  bounce_rate: number;
  top_source: string;
}

export const landingPageStats: LandingPageStat[] = [
  { path: "/sales-promotion", product_slug: "sales-promotion", visitors: 8420, leads: 62, conversion_rate: 7.4, avg_time_on_page: "2:34", bounce_rate: 38, top_source: "Meta Ads" },
  { path: "/customer-care", product_slug: "customer-care", visitors: 4180, leads: 33, conversion_rate: 7.9, avg_time_on_page: "2:12", bounce_rate: 42, top_source: "LinkedIn Ads" },
  { path: "/interactive-engage", product_slug: "interactive-engage", visitors: 5640, leads: 29, conversion_rate: 5.1, avg_time_on_page: "1:58", bounce_rate: 45, top_source: "Meta Ads" },
  { path: "/kampanja", product_slug: "kampanja", visitors: 3200, leads: 14, conversion_rate: 4.4, avg_time_on_page: "1:45", bounce_rate: 52, top_source: "Email" },
  { path: "/send-a-gift", product_slug: "send-a-gift", visitors: 6100, leads: 35, conversion_rate: 5.7, avg_time_on_page: "2:08", bounce_rate: 40, top_source: "Google Ads" },
  { path: "/clearing", product_slug: "clearing-solutions", visitors: 1850, leads: 9, conversion_rate: 4.9, avg_time_on_page: "2:22", bounce_rate: 48, top_source: "Google Ads" },
];

// Helper: determine if a lead should be contacted now
export function shouldContactNow(contactId: string): { should: boolean; reason: string } {
  const score = leadScores.find((s) => s.contact_id === contactId);
  if (!score) return { should: false, reason: "" };

  // High score with recent activity = contact now
  if (score.total_score >= 70) {
    const recentSignals = score.signals.filter((s) => {
      const signalTime = new Date(s.timestamp).getTime();
      const now = new Date("2026-04-17T10:00:00Z").getTime();
      return now - signalTime < 48 * 60 * 60 * 1000; // 48h
    });
    if (recentSignals.length >= 2) {
      return { should: true, reason: "Het lead med flera signaler senaste 48h" };
    }
  }

  // Contact page visit = always contact
  const hasContactPageVisit = score.signals.some(
    (s) => s.description.toLowerCase().includes("kontaktsida") || s.description.toLowerCase().includes("prissida")
  );
  if (hasContactPageVisit && score.total_score >= 50) {
    return { should: true, reason: "Besökte kontakt-/prissidan" };
  }

  // Score 60+ with download
  const hasDownload = score.signals.some((s) => s.type === "download");
  if (hasDownload && score.total_score >= 60) {
    return { should: true, reason: "Laddade ner material med hog score" };
  }

  // Score 55+ with return visit
  const hasReturnVisit = score.signals.some((s) => s.description.toLowerCase().includes("aterkom"));
  if (hasReturnVisit && score.total_score >= 55) {
    return { should: true, reason: "Aterkommande besokare" };
  }

  return { should: false, reason: "" };
}

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
      const contactNow = shouldContactNow(score.contact_id);
      return { ...score, contact, topProduct, contactNow };
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
