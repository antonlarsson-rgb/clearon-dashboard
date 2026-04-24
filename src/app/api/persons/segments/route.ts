import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/persons/segments — aggregat: antal i varje (lifecycle × segment)-cell
 * per produkt + totalt.
 */
export async function GET() {
  try {
    const supabase = getServiceClient();

    // Totala counts per lifecycle × segment
    const { data: buckets } = await supabase
      .from("persons")
      .select("lifecycle_stage, segment, id.count()" as unknown as string)
      .order("lifecycle_stage");

    // Eftersom Supabase count-aggregering är bökigt, gör vi det via plain query
    // och räknar i JS:
    const { data: allPersons } = await supabase
      .from("persons")
      .select("lifecycle_stage, segment, top_product_slug, demo_readiness, score")
      .gte("last_event_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    const matrix: Record<string, Record<string, number>> = {};
    const productCounts: Record<string, number> = {};
    const demoReady: Record<string, number> = {}; // lifecycle → count with demo_readiness >= 60

    for (const p of allPersons || []) {
      const ls = p.lifecycle_stage || "prospect";
      const seg = p.segment || "cold";
      matrix[ls] = matrix[ls] || {};
      matrix[ls][seg] = (matrix[ls][seg] || 0) + 1;

      if (p.top_product_slug) {
        productCounts[p.top_product_slug] = (productCounts[p.top_product_slug] || 0) + 1;
      }
      if ((p.demo_readiness || 0) >= 60) {
        demoReady[ls] = (demoReady[ls] || 0) + 1;
      }
    }

    // Top-level counts
    const { count: totalPersons } = await supabase
      .from("persons")
      .select("id", { count: "exact", head: true });

    const { count: activeCustomers } = await supabase
      .from("persons")
      .select("id", { count: "exact", head: true })
      .eq("lifecycle_stage", "customer");

    const { count: hotProspects } = await supabase
      .from("persons")
      .select("id", { count: "exact", head: true })
      .eq("lifecycle_stage", "prospect")
      .eq("segment", "hot");

    const { count: demoReadyTotal } = await supabase
      .from("persons")
      .select("id", { count: "exact", head: true })
      .gte("demo_readiness", 60);

    return NextResponse.json({
      totals: {
        persons: totalPersons,
        active_customers: activeCustomers,
        hot_prospects: hotProspects,
        demo_ready: demoReadyTotal,
      },
      matrix, // matrix[lifecycle][segment] = count
      top_products: Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([slug, count]) => ({ slug, count })),
      demo_ready_by_lifecycle: demoReady,
    });
  } catch (e) {
    console.error("persons/segments error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
