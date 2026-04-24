#!/usr/bin/env node
/**
 * Seedar ad_campaigns med RIKTIGA ClearOn-banners från /public/ads/
 * Plus Upsales mailcampaigns som en 4:e "platform" = email.
 */
import { createClient } from "@supabase/supabase-js";
import { readdirSync } from "fs";
import { SUPABASE_URL, SERVICE_KEY, upsalesFetch } from "./lib-env.mjs";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const today = new Date().toISOString().slice(0, 10);
const d = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

function listAds(dir) {
  try {
    return readdirSync(`/Users/antonlarsson/clearon-dashboard/public/ads/${dir}`)
      .filter((f) => f.endsWith(".png"))
      .sort();
  } catch {
    return [];
  }
}

// Pre-lista vilka creatives vi har
const kupongerFiles = listAds("kuponger");
const kupongerV11 = listAds("11-3");
const compensationFiles = listAds("compensation");
const glasskupongFiles = listAds("glasskupong");

const url = (dir, file) => `/ads/${dir}/${encodeURIComponent(file)}`;

// Pick first creative matching pattern (för att välja rätt format per plattform)
const pick = (files, pattern) => files.find((f) => f.includes(pattern));

const campaigns = [
  // ============== META ==============
  {
    platform: "meta", campaign_id: "meta_kup_v1_001",
    campaign_name: "Kuponger V1 – Retail prospecting",
    product_slug: "kuponger",
    headline: "Digitala kuponger som driver försäljning",
    body_copy: "Sveriges största nätverk av 6 000+ butiker. Kom igång på 2 veckor.",
    cta_text: "Läs mer",
    creative_image_url: url("kuponger", pick(kupongerFiles, "V1 - 1.png") || kupongerFiles[0]),
    destination_url: "https://clearon.live/kuponger",
    audience_name: "Retail marketing, SE 25-55",
    status: "active",
    budget: 35000, spend: 26400, impressions: 412000, clicks: 5100, leads_generated: 48, conversions: 11,
    start_date: d(30), end_date: null, date: today, creative_format: "single-image",
  },
  {
    platform: "meta", campaign_id: "meta_kup_v2_002",
    campaign_name: "Kuponger V2 – Retargeting",
    product_slug: "kuponger",
    headline: "Redo att testa kupongkampanjer?",
    body_copy: "Vi har hjälpt Pågen, Fontana, ICA och många fler. Din tur?",
    cta_text: "Boka demo",
    creative_image_url: url("kuponger", pick(kupongerFiles, "V2 - 1.png") || kupongerFiles[2]),
    destination_url: "https://clearon.live/kuponger",
    audience_name: "Retargeting: besökte clearon.live senaste 30d",
    status: "active",
    budget: 18000, spend: 14200, impressions: 89000, clicks: 2300, leads_generated: 28, conversions: 8,
    start_date: d(20), end_date: null, date: today, creative_format: "single-image",
  },
  {
    platform: "meta", campaign_id: "meta_kup_v11_003",
    campaign_name: "Kuponger V11 – Story-kampanj",
    product_slug: "kuponger",
    headline: "Sveriges mest använda kupongnätverk",
    body_copy: "V11 – den mest presterande kreativen i Q4. Stories + reels.",
    cta_text: "Se exempel",
    creative_image_url: url("11-3", pick(kupongerV11, "V11 - 1 - 16x9.png") || kupongerV11[0]),
    destination_url: "https://clearon.live/kuponger",
    audience_name: "Lookalike: befintliga kuponger-kunder (1%)",
    status: "active",
    budget: 40000, spend: 28900, impressions: 567000, clicks: 7800, leads_generated: 62, conversions: 14,
    start_date: d(45), end_date: null, date: today, creative_format: "video",
  },
  {
    platform: "meta", campaign_id: "meta_glass_004",
    campaign_name: "Glasskupong – Landningssida leadgen",
    product_slug: "sales-promotion",
    headline: "Vill du ha en glass?",
    body_copy: "Testa våra kampanjverktyg. Vi bjuder på glass till första mötet.",
    cta_text: "Ta del",
    creative_image_url: url("glasskupong", glasskupongFiles[0]),
    destination_url: "https://clearon.live",
    audience_name: "B2B marketing-titlar, SE",
    status: "active",
    budget: 15000, spend: 9800, impressions: 145000, clicks: 2200, leads_generated: 31, conversions: 6,
    start_date: d(14), end_date: null, date: today, creative_format: "single-image",
  },
  {
    platform: "meta", campaign_id: "meta_glass_v2_005",
    campaign_name: "Glasskupong V2 – Upscale",
    product_slug: "sales-promotion",
    headline: "Vi bjuder på glass – du får insikter",
    body_copy: "Se hur vi driver försäljning åt era konkurrenter. 30-min möte + glass.",
    cta_text: "Boka möte",
    creative_image_url: url("glasskupong", glasskupongFiles[1] || glasskupongFiles[0]),
    destination_url: "https://clearon.live",
    audience_name: "CMO/Marketing Director, FMCG/retail",
    status: "paused",
    budget: 12000, spend: 6400, impressions: 76000, clicks: 920, leads_generated: 8, conversions: 2,
    start_date: d(60), end_date: d(5), date: today, creative_format: "single-image",
  },

  // ============== LINKEDIN ==============
  {
    platform: "linkedin", campaign_id: "li_comp_v1_001",
    campaign_name: "Compensation V1 – HR-chefer",
    product_slug: "send-a-gift",
    headline: "Personalbelöning som faktiskt används",
    body_copy: "Sverigechecken: 97% inlösensgrad vs. 23% för vanliga presentkort. Skatteoptimerat.",
    cta_text: "Ladda ner whitepaper",
    creative_image_url: url("compensation", pick(compensationFiles, "V1 - 1.png") || compensationFiles[0]),
    destination_url: "https://clearon.live/send-a-gift",
    audience_name: "CHRO, HR-chef, SE 200+ anst",
    status: "active",
    budget: 28000, spend: 19800, impressions: 54000, clicks: 890, leads_generated: 21, conversions: 5,
    start_date: d(30), end_date: null, date: today, creative_format: "single-image",
  },
  {
    platform: "linkedin", campaign_id: "li_comp_v2_002",
    campaign_name: "Compensation V2 – Senior decision-makers",
    product_slug: "send-a-gift",
    headline: "Belöna era bästa medarbetare – digitalt",
    body_copy: "Sverigechecken funkar i 6 000+ butiker. Ingen admin, ingen spillage.",
    cta_text: "Få offert",
    creative_image_url: url("compensation", pick(compensationFiles, "V2 - 1.png") || compensationFiles[4]),
    destination_url: "https://clearon.live/send-a-gift",
    audience_name: "CFO/VD, SE 500+ anst",
    status: "active",
    budget: 22000, spend: 15400, impressions: 42000, clicks: 620, leads_generated: 14, conversions: 3,
    start_date: d(21), end_date: null, date: today, creative_format: "single-image",
  },
  {
    platform: "linkedin", campaign_id: "li_kup_li_003",
    campaign_name: "Kuponger – Sponsored Content CMO",
    product_slug: "kuponger",
    headline: "Kupongkampanjer som retailers faktiskt vill ha",
    body_copy: "Mät exakt ROAS via vårt closed-loop system. Se hur Pågen gjorde.",
    cta_text: "Läs casestudie",
    creative_image_url: url("kuponger", pick(kupongerFiles, "V1 - 2 - 16x9.png") || kupongerFiles[1]),
    destination_url: "https://clearon.live/kuponger",
    audience_name: "CMO FMCG, Sverige",
    status: "active",
    budget: 18000, spend: 11200, impressions: 28000, clicks: 340, leads_generated: 9, conversions: 2,
    start_date: d(14), end_date: null, date: today, creative_format: "single-image",
  },
  {
    platform: "linkedin", campaign_id: "li_clearing_004",
    campaign_name: "Clearing Solutions – Kommuner",
    product_slug: "clearing-solutions",
    headline: "Modernisera er värdeavier-hantering",
    body_copy: "Sveriges kommuner och banker litar på ClearOn. Digitalt, säkert, compliance-ready.",
    cta_text: "Boka 20-min intro",
    creative_image_url: url("compensation", pick(compensationFiles, "V2 - 2.png") || compensationFiles[5]),
    destination_url: "https://clearon.live/clearing",
    audience_name: "Ekonomichef / CFO, kommuner + bank",
    status: "paused",
    budget: 30000, spend: 22300, impressions: 67000, clicks: 890, leads_generated: 14, conversions: 3,
    start_date: d(90), end_date: d(7), date: today, creative_format: "single-image",
  },
];

async function syncUpsalesMailCampaigns() {
  console.log("\nHämtar Upsales mailcampaigns...");
  try {
    const data = await upsalesFetch("/mailcampaigns", { limit: 50, sort: "-modDate" });
    const rows = [];
    for (const c of data.data || []) {
      const sent = c.mailSent || 0;
      const read = c.mailRead || 0;
      const clicks = c.mailClicked || 0;
      const unsub = c.mailUnsub || 0;
      if (sent === 0) continue; // skippa utkast

      // gissar produkt från namn
      const name = (c.name || c.subject || "").toLowerCase();
      let product = null;
      if (name.includes("sales") || name.includes("promotion") || name.includes("check")) product = "sales-promotion";
      else if (name.includes("värdeav") || name.includes("vardeav") || name.includes("clearing")) product = "clearing-solutions";
      else if (name.includes("kupong")) product = "kuponger";
      else if (name.includes("gift") || name.includes("presentkort") || name.includes("sverigecheck")) product = "send-a-gift";
      else if (name.includes("engage") || name.includes("gamif")) product = "interactive-engage";
      else if (name.includes("event")) product = "sales-promotion";

      const status =
        c.status === "sent" || c.status === "finished"
          ? "completed"
          : c.status === "scheduled"
          ? "active"
          : "completed";

      rows.push({
        platform: "email",
        campaign_id: `ups_mail_${c.id}`,
        campaign_name: c.name || c.subject || `Mail #${c.id}`,
        product_slug: product,
        headline: c.subject || c.name,
        body_copy: c.from ? `Från: ${c.fromName || c.from}` : null,
        cta_text: "Öppna mail",
        creative_image_url: null,
        destination_url: c.previewUrl || null,
        audience_name: c.segment?.name || (c.segments?.[0]?.name) || "Befintlig kontaktdatabas",
        status,
        budget: null,
        spend: null,
        impressions: sent,
        clicks: clicks,
        leads_generated: Math.round(clicks * 0.1),
        conversions: null,
        start_date: c.sendDate ? c.sendDate.slice(0, 10) : null,
        end_date: c.sendDate ? c.sendDate.slice(0, 10) : null,
        date: c.sendDate ? c.sendDate.slice(0, 10) : today,
        creative_format: "email",
      });
    }
    return rows;
  } catch (e) {
    console.warn("Upsales mail sync failed:", e.message);
    return [];
  }
}

async function main() {
  console.log("Rensar ad_campaigns och seedar riktiga annonser...");
  await supabase.from("ad_campaigns").delete().not("id", "is", null);

  const mailCampaigns = await syncUpsalesMailCampaigns();
  const all = [...campaigns, ...mailCampaigns];

  const { data, error } = await supabase.from("ad_campaigns").insert(all).select("id, platform, status");
  if (error) {
    console.error("insert error:", error.message);
    process.exit(1);
  }
  const counts = data.reduce((a, c) => {
    a[c.platform] = (a[c.platform] || 0) + 1;
    return a;
  }, {});
  console.log(`\nSeedade ${data.length} campaigns:`);
  for (const [p, n] of Object.entries(counts)) console.log(`  ${p}: ${n}`);
  const active = data.filter((c) => c.status === "active").length;
  const paused = data.filter((c) => c.status === "paused").length;
  const done = data.filter((c) => c.status === "completed").length;
  console.log(`\n  active: ${active}, paused: ${paused}, completed: ${done}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
