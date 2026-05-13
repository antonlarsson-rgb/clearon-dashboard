// GET /api/buying-intent/top
//   ?limit=10
//   ?days=14
//   ?product=sales-promotion
//   ?level=person|account  (default: person)
//
// Returnerar de personer/accounts som har högst buying-intent JUST NU.
// Cachas inte — körs vid varje request på den lilla mängden recent-aktivitet.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  getTopBuyingIntent,
  getTopAccountBuyingIntent,
} from "@/lib/buying-intent";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(300, Number(url.searchParams.get("limit")) || 10);
    const days = Number(url.searchParams.get("days")) || 14;
    const productSlug = url.searchParams.get("product") || undefined;
    const level = url.searchParams.get("level") || "person";

    const supabase = getServiceClient();

    if (level === "account") {
      const results = await getTopAccountBuyingIntent(supabase, {
        limit,
        lookbackDays: days,
      });
      return NextResponse.json({ level, days, results });
    }

    const results = await getTopBuyingIntent(supabase, {
      limit,
      lookbackDays: days,
      productSlug,
    });
    return NextResponse.json({ level, days, results });
  } catch (e) {
    console.error("buying-intent/top error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
