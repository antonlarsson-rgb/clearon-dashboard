import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  envVars: string[];
  docsUrl?: string;
}

function hasEnv(name: string): boolean {
  const v = process.env[name]?.trim();
  return Boolean(v && !v.startsWith("your-") && v !== "sk_live_..." && v !== "sk-ant-...");
}

function hasAny(...names: string[]): boolean {
  return names.some(hasEnv);
}

function hasAll(...names: string[]): boolean {
  return names.every(hasEnv);
}

export async function GET() {
  const integrations: IntegrationStatus[] = [
    {
      id: "supabase",
      name: "Supabase",
      description: "Databas: events, accounts, persons, web_sessions",
      connected: hasAll("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"),
      envVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      description: "AI-agent + AI-briefer + AI-scoring",
      connected: hasEnv("ANTHROPIC_API_KEY"),
      envVars: ["ANTHROPIC_API_KEY"],
      docsUrl: "https://console.anthropic.com",
    },
    {
      id: "windsor",
      name: "Windsor.ai",
      description: "Live ad-data: Google Ads + LinkedIn (Meta vantar pa anslutning)",
      connected: hasEnv("WINDSOR_API_KEY"),
      envVars: ["WINDSOR_API_KEY"],
      docsUrl: "https://windsor.ai/api-keys",
    },
    {
      id: "upsales",
      name: "Upsales",
      description: "CRM: kontakter, kampanjer, aktiviteter, mail-historik",
      connected: hasEnv("UPSALES_API_KEY"),
      envVars: ["UPSALES_API_KEY"],
      docsUrl: "https://power.upsales.com",
    },
    {
      id: "clickup",
      name: "ClickUp",
      description: "Stellar-uppgifter, leveranser, sprints",
      connected: hasAll("CLICKUP_API_KEY", "CLICKUP_TEAM_ID"),
      envVars: ["CLICKUP_API_KEY", "CLICKUP_TEAM_ID"],
      docsUrl: "https://app.clickup.com",
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      description: "Webbtrafik clearon.live + clearon.se",
      connected: hasAll("GA4_PROPERTY_ID", "GA4_CREDENTIALS"),
      envVars: ["GA4_PROPERTY_ID", "GA4_CREDENTIALS"],
      docsUrl: "https://analytics.google.com",
    },
    {
      id: "meta",
      name: "Meta Marketing API (direkt)",
      description: "Direktintegration. Adspirer foredras for live-data.",
      connected: hasAll("META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"),
      envVars: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
      docsUrl: "https://developers.facebook.com/apps",
    },
    {
      id: "google-ads",
      name: "Google Ads API (direkt)",
      description: "Direktintegration. Adspirer foredras for live-data.",
      connected: hasAll("GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET"),
      envVars: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET"],
      docsUrl: "https://ads.google.com",
    },
    {
      id: "linkedin",
      name: "LinkedIn Marketing API (direkt)",
      description: "Direktintegration. Adspirer foredras for live-data.",
      connected: hasAny("LINKEDIN_ACCESS_TOKEN", "LINKEDIN_CLIENT_ID"),
      envVars: ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_CLIENT_ID"],
      docsUrl: "https://business.linkedin.com/marketing-solutions",
    },
  ];

  return NextResponse.json({
    checked_at: new Date().toISOString(),
    integrations,
    summary: {
      total: integrations.length,
      connected: integrations.filter((i) => i.connected).length,
    },
  });
}
