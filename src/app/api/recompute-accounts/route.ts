import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { recomputeAllAccounts, recomputeAccount } from "@/lib/account-scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get("account_id");
    const onlyRecent = url.searchParams.get("onlyRecent") === "1";
    const limit = Number(url.searchParams.get("limit")) || 10000;

    const supabase = getServiceClient();

    if (accountId) {
      const result = await recomputeAccount(supabase, accountId);
      return NextResponse.json({ success: true, result });
    }

    const res = await recomputeAllAccounts(supabase, { limit, onlyRecent });
    return NextResponse.json({
      success: true,
      processed: res.processed,
      hot: res.hot,
      elapsedMs: res.t,
    });
  } catch (e) {
    console.error("recompute-accounts error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export const GET = POST;
