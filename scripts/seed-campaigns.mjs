#!/usr/bin/env node
/**
 * Seedar realistiska ClearOn-annonskampanjer fördelat på Meta, LinkedIn, Google
 * mappat mot samma produkter som /site (clearon.live).
 * Ersätter befintlig test-data.
 */
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SERVICE_KEY } from "./lib-env.mjs";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const today = new Date().toISOString().slice(0, 10);
const d30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
const d60 = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
const d7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

// Använder svg data-URLs så bilder alltid laddar utan externa dependencies
function svg(color, emoji, label) {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 420'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='${color}'/>
      <stop offset='100%' stop-color='#2a3326'/>
    </linearGradient></defs>
    <rect width='800' height='420' fill='url(#g)'/>
    <text x='60' y='140' font-family='sans-serif' font-size='120'>${emoji}</text>
    <text x='60' y='280' font-family='sans-serif' font-size='42' font-weight='700' fill='white'>${label}</text>
    <text x='60' y='340' font-family='sans-serif' font-size='22' fill='white' opacity='0.8'>ClearOn</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
}

const campaigns = [
  // === META ===
  {
    platform: "meta",
    campaign_name: "Kupongguiden 2026 – Retail",
    headline: "Driv försäljning i butik med digitala kuponger",
    body_copy: "Nå rätt kund, rätt stund. 6 000+ butiker i ClearOns nätverk. Få mer av varje kampanjkrona.",
    cta_text: "Boka demo",
    creative_image_url: svg("#ff6b35", "🎟️", "Kupongguiden"),
    destination_url: "https://clearon.live/sales-promotion",
    product_slug: "sales-promotion",
    audience_name: "Retail marketing managers, SE",
    status: "active",
    budget: 25000, spend: 18400, impressions: 245000, clicks: 3200, leads_generated: 34, conversions: 5,
    start_date: d30, end_date: null, date: today, creative_format: "single-image",
    campaign_id: "meta_23851234"
  },
  {
    platform: "meta",
    campaign_name: "Send a Gift – HR Q2",
    headline: "Belöna era anställda på 60 sekunder",
    body_copy: "Sverigechecken: presentkort som funkar hos 6 000+ butiker. Skatteoptimerat. Digitalt.",
    cta_text: "Läs mer",
    creative_image_url: svg("#416125", "🎁", "Send a Gift"),
    destination_url: "https://clearon.live/send-a-gift",
    product_slug: "send-a-gift",
    audience_name: "HR-chefer 50+ anställda, SE",
    status: "active",
    budget: 15000, spend: 8900, impressions: 128000, clicks: 1800, leads_generated: 18, conversions: 3,
    start_date: d30, end_date: null, date: today, creative_format: "carousel",
    campaign_id: "meta_23851235"
  },
  {
    platform: "meta",
    campaign_name: "Interactive Engage – Beauty",
    headline: "Gamifiera er kampanj",
    body_copy: "Spin-the-wheel, skrapa-och-vinn, quiz. Färre klick, högre engagemang. Redo på 2 veckor.",
    cta_text: "Se demos",
    creative_image_url: svg("#c8e66b", "🎰", "Engage"),
    destination_url: "https://clearon.live/interactive-engage",
    product_slug: "interactive-engage",
    audience_name: "Marketing, FMCG beauty/food",
    status: "paused",
    budget: 12000, spend: 6200, impressions: 89000, clicks: 890, leads_generated: 6, conversions: 1,
    start_date: d60, end_date: d7, date: today, creative_format: "video",
    campaign_id: "meta_23851236"
  },
  {
    platform: "meta",
    campaign_name: "Mobila Presentkort – Julkampanj",
    headline: "Sverigechecken digitalt",
    body_copy: "Skicka presentkort direkt i mobilen. Perfekt för Black Friday och julkampanjer.",
    cta_text: "Kom igång",
    creative_image_url: svg("#e8864c", "📱", "Mobila presentkort"),
    destination_url: "https://clearon.live/mobila-presentkort",
    product_slug: "mobila-presentkort",
    audience_name: "E-handel, retail",
    status: "completed",
    budget: 20000, spend: 19800, impressions: 310000, clicks: 2400, leads_generated: 22, conversions: 7,
    start_date: "2025-11-01", end_date: "2025-12-31", date: "2025-12-31", creative_format: "carousel",
    campaign_id: "meta_23850891"
  },

  // === LINKEDIN ===
  {
    platform: "linkedin",
    campaign_name: "Clearing Solutions – Kommuner",
    headline: "Modernisera er värdeavier-hantering",
    body_copy: "Sveriges kommuner och banker litar på ClearOn. Digitalt, säkert, compliance-ready.",
    cta_text: "Boka 20-min intro",
    creative_image_url: svg("#4a9df0", "🏛️", "Clearing Solutions"),
    destination_url: "https://clearon.live/clearing",
    product_slug: "clearing-solutions",
    audience_name: "Ekonomichef / CFO, offentlig sektor + bank",
    status: "active",
    budget: 30000, spend: 22300, impressions: 67000, clicks: 890, leads_generated: 14, conversions: 3,
    start_date: d30, end_date: null, date: today, creative_format: "single-image",
    campaign_id: "li_613289121"
  },
  {
    platform: "linkedin",
    campaign_name: "Send a Gift – HR C-level",
    headline: "Belöningar som faktiskt används",
    body_copy: "97% inlösensgrad vs. 23% för vanliga presentkort. Skatteoptimerat. Ingen admin.",
    cta_text: "Ladda ner whitepaper",
    creative_image_url: svg("#416125", "💼", "HR Rewards"),
    destination_url: "https://clearon.live/send-a-gift",
    product_slug: "send-a-gift",
    audience_name: "CHRO, HR-chef, SE 200+ anst",
    status: "active",
    budget: 22000, spend: 15800, impressions: 42000, clicks: 620, leads_generated: 11, conversions: 2,
    start_date: d30, end_date: null, date: today, creative_format: "single-image",
    campaign_id: "li_613289122"
  },
  {
    platform: "linkedin",
    campaign_name: "Customer Care – Retail CX",
    headline: "Automatisera er kundtjänst",
    body_copy: "AI-driven kupong- och reklamationshantering. 80% ärendevolym hanterad utan människa.",
    cta_text: "Se product tour",
    creative_image_url: svg("#8bb347", "💬", "Customer Care"),
    destination_url: "https://clearon.live/customer-care",
    product_slug: "customer-care",
    audience_name: "CX / COO retail",
    status: "paused",
    budget: 18000, spend: 8400, impressions: 28000, clicks: 340, leads_generated: 4, conversions: 0,
    start_date: d60, end_date: d7, date: today, creative_format: "video",
    campaign_id: "li_613289123"
  },

  // === GOOGLE ===
  {
    platform: "google",
    campaign_name: "Kupongkampanj butik – Search",
    headline: "Digitala kuponger för retail",
    body_copy: "Få fler kunder i butiken med ClearOns kupongkampanjer. 6 000+ butiker i nätverk.",
    cta_text: "Läs mer",
    creative_image_url: svg("#ff6b35", "🔎", "Search: kupongkampanj"),
    destination_url: "https://clearon.live/sales-promotion",
    product_slug: "sales-promotion",
    audience_name: "Keywords: kupongkampanj, digitala kuponger, sales promotion",
    status: "active",
    budget: 20000, spend: 14200, impressions: 89000, clicks: 2100, leads_generated: 22, conversions: 4,
    start_date: d30, end_date: null, date: today, creative_format: "single-image",
    campaign_id: "g_4829103"
  },
  {
    platform: "google",
    campaign_name: "Personalbelöning – Performance Max",
    headline: "Sverigechecken som personalbelöning",
    body_copy: "Digitala presentkort som fungerar i 6 000+ butiker. Klart på 24h.",
    cta_text: "Få offert",
    creative_image_url: svg("#416125", "🎯", "PMax"),
    destination_url: "https://clearon.live/personalbeloning",
    product_slug: "send-a-gift",
    audience_name: "Keywords: personalbelöning, presentkort till anställda",
    status: "active",
    budget: 12000, spend: 7600, impressions: 56000, clicks: 980, leads_generated: 12, conversions: 2,
    start_date: d30, end_date: null, date: today, creative_format: "single-image",
    campaign_id: "g_4829104"
  },
  {
    platform: "google",
    campaign_name: "Värdeavier – Kommun Display",
    headline: "Värdeavier för kommuner",
    body_copy: "ClearOn hanterar värdeavier för svenska kommuner och banker sedan 1968.",
    cta_text: "Kontakta oss",
    creative_image_url: svg("#4a9df0", "🏦", "Värdeavier"),
    destination_url: "https://clearon.live/clearing",
    product_slug: "clearing-solutions",
    audience_name: "Keywords: värdeavier, checkinlösen, clearing",
    status: "paused",
    budget: 15000, spend: 2800, impressions: 18000, clicks: 140, leads_generated: 2, conversions: 0,
    start_date: d60, end_date: d7, date: today, creative_format: "single-image",
    campaign_id: "g_4829105"
  },
  {
    platform: "google",
    campaign_name: "Interactive Engage – YouTube",
    headline: "Gör kampanjen till ett spel",
    body_copy: "Spin-to-win, skraplotter, quizzar. Integrerat med ClearOns nätverk.",
    cta_text: "Se exempel",
    creative_image_url: svg("#c8e66b", "📺", "YouTube"),
    destination_url: "https://clearon.live/interactive-engage",
    product_slug: "interactive-engage",
    audience_name: "In-market: marketing software",
    status: "completed",
    budget: 10000, spend: 9800, impressions: 210000, clicks: 1400, leads_generated: 9, conversions: 2,
    start_date: "2025-10-01", end_date: "2025-11-30", date: "2025-11-30", creative_format: "video",
    campaign_id: "g_4829102"
  },
];

async function main() {
  // Radera befintlig test-data och sätt in nya
  const { error: delErr } = await supabase.from("ad_campaigns").delete().not("id", "is", null);
  if (delErr) console.warn("delete:", delErr.message);

  const { data, error } = await supabase.from("ad_campaigns").insert(campaigns).select("id");
  if (error) {
    console.error("insert error:", error.message);
    process.exit(1);
  }
  console.log(`Seedade ${data.length} kampanjer (${campaigns.filter(c => c.platform === 'meta').length} Meta + ${campaigns.filter(c => c.platform === 'linkedin').length} LinkedIn + ${campaigns.filter(c => c.platform === 'google').length} Google)`);
  console.log(`- Active: ${campaigns.filter(c => c.status === 'active').length}`);
  console.log(`- Paused: ${campaigns.filter(c => c.status === 'paused').length}`);
  console.log(`- Completed: ${campaigns.filter(c => c.status === 'completed').length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
