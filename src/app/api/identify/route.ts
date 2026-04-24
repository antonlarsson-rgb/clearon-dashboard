import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { computeSegment } from "@/lib/scoring";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const visitorId =
      url.searchParams.get("visitor_id") ||
      request.headers
        .get("cookie")
        ?.split("; ")
        .find((c) => c.startsWith("clearon_vid="))
        ?.split("=")[1];

    if (!visitorId) {
      return NextResponse.json({ known: false });
    }

    const supabase = getServiceClient();

    const { data: visitor } = await supabase
      .from("visitors")
      .select(
        "visitor_id, contact_id, email, name, company, score, engagement_score, intent_score, demo_readiness, segment, product_affinities, visits_count, last_seen"
      )
      .eq("visitor_id", visitorId)
      .maybeSingle();

    if (!visitor) {
      return NextResponse.json({ known: false, visitor_id: visitorId });
    }

    // Om kopplad till contact — hämta account-info + lead_score
    let contact: {
      id: string;
      name: string;
      email: string | null;
      title: string | null;
      role_category: string | null;
      phone: string | null;
      account: { id: string; name: string; industry: string | null; website: string | null } | null;
    } | null = null;
    if (visitor.contact_id) {
      const { data } = await supabase
        .from("contacts")
        .select(
          "id, name, email, title, role_category, phone, account:accounts(id, name, industry, website)"
        )
        .eq("id", visitor.contact_id)
        .maybeSingle();
      if (data) {
        const accRaw = (data as { account?: unknown }).account;
        const acc = Array.isArray(accRaw) ? accRaw[0] : accRaw;
        contact = {
          id: (data as { id: string }).id,
          name: (data as { name: string }).name,
          email: (data as { email: string | null }).email,
          title: (data as { title: string | null }).title,
          role_category: (data as { role_category: string | null }).role_category,
          phone: (data as { phone: string | null }).phone,
          account: acc
            ? {
                id: acc.id,
                name: acc.name,
                industry: acc.industry,
                website: acc.website,
              }
            : null,
        };
      }
    }

    // Top produkt
    const affinities = (visitor.product_affinities as Record<string, number>) || {};
    const topProduct = Object.entries(affinities).sort(
      (a, b) => b[1] - a[1]
    )[0] || null;

    return NextResponse.json({
      known: true,
      identified: !!visitor.contact_id,
      visitor_id: visitor.visitor_id,
      contact,
      name: visitor.name || contact?.name || null,
      email: visitor.email || contact?.email || null,
      company: visitor.company || contact?.account?.name || null,
      score: visitor.score,
      demo_readiness: visitor.demo_readiness,
      segment: visitor.segment || computeSegment(visitor.score),
      product_affinities: affinities,
      top_product: topProduct ? { slug: topProduct[0], score: topProduct[1] } : null,
      visits_count: visitor.visits_count,
      last_seen: visitor.last_seen,
    });
  } catch (e) {
    console.error("identify error:", e);
    return NextResponse.json({ known: false, error: "identify failed" });
  }
}
