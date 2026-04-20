import { NextResponse } from "next/server";
import { getContacts, clearCache, lastFetchDebug } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export async function GET() {
  clearCache();

  // Direct test of getContacts
  let result: Awaited<ReturnType<typeof getContacts>> = [];
  let error: string | null = null;
  try {
    result = await getContacts(10);
  } catch (e) {
    error = e instanceof Error ? e.message + "\n" + e.stack : String(e);
  }

  // Also test raw
  const token = process.env.UPSALES_API_KEY || "";
  const rawRes = await fetch(
    `https://power.upsales.com/api/v2/contacts?token=${token}&limit=3&sort=-score`,
    { cache: "no-store" }
  );
  const raw = await rawRes.json();

  return NextResponse.json({
    envAvailable: !!process.env.UPSALES_API_KEY,
    rawTotal: raw.metadata?.total,
    getContactsLength: result?.length,
    getContactsError: error || null,
    first3: (result || []).slice(0, 3).map((c) => ({ name: c.name, company: c.company, score: c.score, category: c.category })),
    lastFetchDebug,
  });
}
