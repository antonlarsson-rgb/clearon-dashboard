import { NextResponse } from "next/server";
import { getContacts, getKpis, getHotLeads } from "@/lib/dashboard-data";

export async function GET() {
  const token = process.env.UPSALES_API_KEY || "";
  const hasToken = token.length > 0;

  let contacts: Awaited<ReturnType<typeof getContacts>> = [];
  let kpis = null;
  let hotLeads: Awaited<ReturnType<typeof getHotLeads>> = [];
  let error = null;

  try {
    contacts = await getContacts(50);
    kpis = await getKpis();
    hotLeads = await getHotLeads(5);
  } catch (e) {
    error = String(e);
  }

  return NextResponse.json({
    hasToken,
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
