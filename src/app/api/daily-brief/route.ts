// GET — returnerar dagens cached brief (eller null om inte genererad).
// POST — tvinga regenerering (för "uppdatera"-knapp på dashboarden).

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  generateDailyBrief,
  saveDailyBrief,
  getCachedDailyBrief,
} from "@/lib/daily-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const supabase = getServiceClient();
    const cached = await getCachedDailyBrief(supabase);
    if (cached) return NextResponse.json(cached);

    // Inget cachat? Generera nu (sker första gången brevid om cron inte
    // hunnit köra — typisk för local dev).
    const fresh = await generateDailyBrief(supabase);
    await saveDailyBrief(supabase, fresh);
    return NextResponse.json(fresh);
  } catch (e) {
    console.error("daily-brief GET error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = getServiceClient();
    const fresh = await generateDailyBrief(supabase);
    await saveDailyBrief(supabase, fresh);
    return NextResponse.json(fresh);
  } catch (e) {
    console.error("daily-brief POST error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
