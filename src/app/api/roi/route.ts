import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getChannelRoi } from "@/lib/roi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** ROI per kanal: annons-spend mot pipeline-varde och vunna affarer. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lookback = Number(url.searchParams.get("lookback")) || 90;
    const supabase = getServiceClient();
    const result = await getChannelRoi(supabase, lookback);
    return NextResponse.json(result);
  } catch (e) {
    console.error("roi error:", e);
    return NextResponse.json({ error: "roi-failed" }, { status: 500 });
  }
}
