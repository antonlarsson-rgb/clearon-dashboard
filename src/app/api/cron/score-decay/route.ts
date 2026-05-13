// Cron: var 30:e min. Räknar om scoring för persons + accounts som rört
// sig senaste 24h. Decay appliceras, segment/lifecycle uppdateras.
// Ingen LLM, billigt.

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { recomputeAll } from "@/lib/person-scoring";
import { recomputeAllAccounts } from "@/lib/account-scoring";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const t0 = Date.now();

  const [persons, accounts] = await Promise.all([
    recomputeAll(supabase, { onlyRecent: true, limit: 1000 }),
    recomputeAllAccounts(supabase, { onlyRecent: true, limit: 500 }),
  ]);

  return NextResponse.json({
    success: true,
    elapsedMs: Date.now() - t0,
    persons,
    accounts,
  });
}

export const POST = GET;
