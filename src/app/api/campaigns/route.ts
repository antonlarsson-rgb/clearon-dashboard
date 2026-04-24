import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("ad_campaigns")
      .select("*")
      .order("status", { ascending: true }) // active först
      .order("spend", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ campaigns: data || [] });
  } catch (e) {
    console.error("campaigns error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
