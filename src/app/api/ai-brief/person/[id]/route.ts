import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generatePersonBrief } from "@/lib/ai-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();

    const { data: person } = await supabase
      .from("persons")
      .select(
        "name, primary_email, title, journey_step, score, demo_readiness, segment, lifecycle_stage, is_customer, total_events, account:accounts(name, industry)"
      )
      .eq("id", id)
      .maybeSingle();
    if (!person) return NextResponse.json({ error: "not found" }, { status: 404 });

    const [productScores, events] = await Promise.all([
      supabase
        .from("person_product_scores")
        .select("product_slug, score, intent_score, event_count")
        .eq("person_id", id)
        .order("score", { ascending: false }),
      supabase
        .from("events")
        .select("source, event_type, product_slug, metadata, occurred_at")
        .eq("person_id", id)
        .order("occurred_at", { ascending: false })
        .limit(50),
    ]);

    const acc = Array.isArray(person.account) ? person.account[0] : person.account;

    const brief = await generatePersonBrief({
      name: person.name || "Okänd",
      email: person.primary_email,
      title: person.title,
      company: acc?.name || null,
      industry: acc?.industry || null,
      journey_step: person.journey_step,
      score: person.score || 0,
      demo_readiness: person.demo_readiness || 0,
      segment: person.segment || "cold",
      lifecycle_stage: person.lifecycle_stage || "prospect",
      is_customer: !!person.is_customer,
      total_events: person.total_events || 0,
      product_scores: productScores.data || [],
      recent_events: events.data || [],
    });

    return NextResponse.json({ brief });
  } catch (e) {
    console.error("ai-brief/person error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "AI-brief failed" },
      { status: 500 }
    );
  }
}
