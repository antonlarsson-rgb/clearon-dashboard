// Cron: dagligen kl 06:00. Genererar morgonbriefen och cachar i daily_briefs.
// Kan också anropas manuellt — då skrivs raden över med fresh content.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateDailyBrief, saveDailyBrief } from "@/lib/daily-brief";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const t0 = Date.now();

  const result = await generateDailyBrief(supabase);
  await saveDailyBrief(supabase, result);

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    brief_length: result.brief.length,
    summary: result.context_summary,
  });
}

export const POST = GET;
