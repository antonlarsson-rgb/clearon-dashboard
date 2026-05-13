// Cron: måndag 08:00. Genererar veckosammanfattning från Stellar.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateWeeklyStellar, saveWeeklyStellar } from "@/lib/weekly-stellar";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const t0 = Date.now();
  const result = await generateWeeklyStellar(supabase);
  await saveWeeklyStellar(supabase, result);

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    week_start: result.week_start,
    summary: result.context_summary,
  });
}

export const POST = GET;
