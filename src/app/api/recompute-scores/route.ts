import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { recomputeAll, recomputePerson } from "@/lib/person-scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const personId = url.searchParams.get("person_id");
    const onlyRecent = url.searchParams.get("onlyRecent") === "1";
    const limit = Number(url.searchParams.get("limit")) || 5000;

    const supabase = getServiceClient();

    if (personId) {
      const result = await recomputePerson(supabase, personId);
      return NextResponse.json({ success: true, result });
    }

    const t0 = Date.now();
    const res = await recomputeAll(supabase, { limit, onlyRecent });
    const elapsed = Date.now() - t0;

    return NextResponse.json({
      success: true,
      processed: res.processed,
      hot: res.topHotCount,
      elapsedMs: elapsed,
    });
  } catch (e) {
    console.error("recompute-scores error:", e);
    return NextResponse.json({ error: "Failed to recompute" }, { status: 500 });
  }
}

export const GET = POST;
