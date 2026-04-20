import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.UPSALES_API_KEY || "";
  const hasToken = token.length > 0;
  const tokenPreview = token ? token.slice(0, 8) + "..." : "MISSING";

  let apiResult = "not tested";
  let contactCount = 0;

  if (hasToken) {
    try {
      const res = await fetch(
        `https://power.upsales.com/api/v2/contacts?token=${token}&limit=3&sort=-score`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        contactCount = data.metadata?.total || 0;
        const names = (data.data || []).map((c: Record<string, unknown>) => c.name);
        apiResult = `OK - ${contactCount} total contacts, top: ${names.join(", ")}`;
      } else {
        apiResult = `HTTP ${res.status}: ${await res.text()}`;
      }
    } catch (e) {
      apiResult = `Error: ${e}`;
    }
  }

  return NextResponse.json({
    hasToken,
    tokenPreview,
    apiResult,
    contactCount,
    env: process.env.NODE_ENV,
  });
}
