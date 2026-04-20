import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.UPSALES_API_KEY || "";

  // Fetch 10 contacts directly
  const res = await fetch(
    `https://power.upsales.com/api/v2/contacts?token=${token}&limit=10&sort=-score`,
    { cache: "no-store" }
  );
  const raw = await res.json();
  const rawContacts = raw.data || [];

  // Process them inline - same logic as dashboard-data.ts
  const INTERNAL_DOMAINS = ["clearon.se", "wearestellar.se", "clearon-test.se"];
  const INTERNAL_COMPANIES = ["testbolag", "test företag", "e2e test", "persisttest", "poangtest"];

  const processed = [];
  for (const c of rawContacts) {
    const client = c.client || {};
    const email = c.email || "";
    const company = (client.name as string) || "";
    const domain = email.split("@")[1] || "";

    const isInternalDomain = INTERNAL_DOMAINS.some(d => domain.includes(d));
    const isInternalCompany = INTERNAL_COMPANIES.some(ic => company.toLowerCase().includes(ic));
    const isInternal = isInternalDomain || isInternalCompany;

    processed.push({
      name: c.name,
      email,
      company,
      domain,
      score: c.score,
      isInternalDomain,
      isInternalCompany,
      isInternal,
      filtered: isInternal ? "YES - REMOVED" : "NO - KEPT",
    });
  }

  // Now test getContacts
  const { getContacts, clearCache } = await import("@/lib/dashboard-data");
  clearCache();

  let getContactsResult;
  let getContactsError;
  try {
    getContactsResult = await getContacts(10);
  } catch (e) {
    getContactsError = e instanceof Error ? { msg: e.message, stack: e.stack } : String(e);
  }

  return NextResponse.json({
    rawCount: raw.metadata?.total,
    processed,
    getContactsCount: getContactsResult?.length ?? "error",
    getContactsError,
    getContactsSample: (getContactsResult || []).slice(0, 3).map((c) => ({
      name: c.name, company: c.company, category: c.category
    })),
  });
}
