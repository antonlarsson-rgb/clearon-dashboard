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

  // Test raw processing of first contact
  let processError = null;
  try {
    const rawRes2 = await fetch(
      `https://power.upsales.com/api/v2/contacts?token=${token}&limit=10&sort=-score`,
      { cache: "no-store" }
    );
    const rawData2 = await rawRes2.json();
    const firstContact = rawData2.data?.[1]; // skip first (internal), use second
    if (firstContact) {
      const client = firstContact.client || {};
      const segments = (firstContact.segments || []).map((s: {name: string}) => s.name);
      const projects = (firstContact.projects || []).map((p: {name: string}) => p.name);
      processError = JSON.stringify({
        name: firstContact.name,
        company: client.name,
        email: firstContact.email,
        segments,
        projects,
        score: firstContact.score,
      });
    }
  } catch (e) {
    processError = `Processing error: ${e}`;
  }

  // Test through data layer with explicit error capture
  let dataLayerError = null;
  try {
    clearCache();
    contacts = await getContacts(50);
  } catch (e) {
    dataLayerError = `getContacts threw: ${e instanceof Error ? e.message + '\n' + e.stack : String(e)}`;
  }
  try {
    kpis = await getKpis();
  } catch (e) {
    // ignore
  }
  try {
    hotLeads = await getHotLeads(5);
  } catch (e) {
    // ignore
  }

  return NextResponse.json({
    hasToken,
    rawApiCount: rawCount,
    rawApiSample: rawSample,
    processError,
    dataLayerError,
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
