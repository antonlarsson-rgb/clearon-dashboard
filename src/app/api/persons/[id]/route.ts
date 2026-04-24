import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/persons/[id] — full 360: person, product-scores, events timeline
 */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();

    const { data: person } = await supabase
      .from("persons")
      .select(
        "id, name, first_name, last_name, primary_email, primary_phone, title, role_category, linkedin_url, journey_step, upsales_contact_id, score, engagement_score, intent_score, demo_readiness, segment, lifecycle_stage, is_customer, has_purchased, top_product_slug, top_product_score, total_events, visits_count, first_event_at, last_event_at, first_utm_source, first_utm_campaign, first_referrer, account:accounts(id, name, industry, website, upsales_id)"
      )
      .eq("id", id)
      .maybeSingle();

    if (!person) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const [productScores, events, identities] = await Promise.all([
      supabase
        .from("person_product_scores")
        .select("*")
        .eq("person_id", id)
        .order("score", { ascending: false }),
      supabase
        .from("events")
        .select("id, source, event_type, product_slug, metadata, weight, intent_weight, occurred_at")
        .eq("person_id", id)
        .order("occurred_at", { ascending: false })
        .limit(200),
      supabase
        .from("person_identities")
        .select("identity_type, identity_value, verified, first_seen, last_seen")
        .eq("person_id", id),
    ]);

    return NextResponse.json({
      person,
      product_scores: productScores.data || [],
      events: events.data || [],
      identities: identities.data || [],
    });
  } catch (e) {
    console.error("persons/[id] error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
