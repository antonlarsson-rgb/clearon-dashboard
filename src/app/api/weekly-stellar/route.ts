import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  generateWeeklyStellar,
  saveWeeklyStellar,
  getCachedWeeklyStellar,
} from "@/lib/weekly-stellar";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const supabase = getServiceClient();
    const cached = await getCachedWeeklyStellar(supabase);
    if (cached) return NextResponse.json(cached);
    const fresh = await generateWeeklyStellar(supabase);
    await saveWeeklyStellar(supabase, fresh);
    return NextResponse.json(fresh);
  } catch (e) {
    console.error("weekly-stellar GET error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = getServiceClient();
    const fresh = await generateWeeklyStellar(supabase);
    await saveWeeklyStellar(supabase, fresh);
    return NextResponse.json(fresh);
  } catch (e) {
    console.error("weekly-stellar POST error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
