import { NextResponse } from "next/server";
import { getContacts, getKpis, getHotLeads, clearCache } from "@/lib/dashboard-data";

export async function GET() {
  const token = process.env.UPSALES_API_KEY || "";
  const hasToken = token.length > 0;

  let contacts: Awaited<ReturnType<typeof getContacts>> = [];
  let kpis = null;
  let hotLeads: Awaited<ReturnType<typeof getHotLeads>> = [];
  let error = null;

  // Test raw API first
  let rawCount = 0;
  let rawSample: string[] = [];
  try {
    const rawRes = await fetch(
      `https://power.upsales.com/api/v2/contacts?token=${token}&limit=5&sort=-score`,
      { cache: "no-store" }
    );
    const rawData = await rawRes.json();
    rawCount = rawData.metadata?.total || 0;
    rawSample = (rawData.data || []).map((c: Record<string, unknown>) => {
      const cl = (c.client as Record<string, unknown>) || {};
      return `${c.name} | ${(cl.name as string) || "no-company"} | score:${c.score}`;
    });
  } catch (e) {
    error = `Raw API error: ${e}`;
  }

  // Then test through our data layer
  try {
    clearCache();
    contacts = await getContacts(50);
    kpis = await getKpis();
    hotLeads = await getHotLeads(5);
  } catch (e) {
    error = String(e);
  }

  return NextResponse.json({
    hasToken,
    rawApiCount: rawCount,
    rawApiSample: rawSample,
    error,
    contactsCount: contacts.length,
    contactsSample: contacts.slice(0, 5).map((c) => ({
      name: c.name,
      company: c.company,
      score: c.score,
      category: c.category,
      categoryLabel: c.categoryLabel,
      status: c.status,
      contactNow: c.contactNow,
    })),
    kpis,
    hotLeadsCount: hotLeads.length,
    hotLeadsSample: hotLeads.slice(0, 3).map((l) => ({
      name: l.name,
      score: l.score,
      category: l.category,
    })),
  });
}
