import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, email, company, role, interests } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Extract fields from interests array
    const interestsArr = (interests as string[]) || [];
    const getField = (prefix: string) => {
      const item = interestsArr.find((i: string) => i.startsWith(prefix));
      return item ? item.slice(prefix.length) : undefined;
    };

    const contactName = getField("name:") || email.split("@")[0];
    const phone = getField("phone:");
    const bossPhone = getField("bossPhone:");
    const industry = getField("industry:") || "";

    // First, find or create an account for the company
    let accountId: string | null = null;
    if (company) {
      const { data: existingAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", company)
        .limit(1)
        .single();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Create a new account with a unique upsales_id (timestamp-based for landing leads)
        const { data: newAccount } = await supabase
          .from("accounts")
          .insert({
            upsales_id: Math.floor(Date.now() / 1000),
            name: company,
            industry: industry || null,
            website: email.split("@")[1] || null,
          })
          .select("id")
          .single();
        accountId = newAccount?.id || null;
      }
    }

    // Map role to role_category
    const roleCategoryMap: Record<string, string> = {
      vd: "executive",
      cfo: "executive",
      marketing: "marketing",
      hr: "hr",
      operations: "customer_service",
      multiple: "other",
    };

    // Insert into contacts (matches schema: upsales_id, account_id, name, title, email, phone, role_category, linkedin_url)
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .insert({
        upsales_id: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
        account_id: accountId,
        name: contactName !== "ej angiven" ? contactName : email.split("@")[0],
        title: role || null,
        email,
        phone: phone && phone !== "ej angiven" ? phone : null,
        role_category: roleCategoryMap[role || ""] || "other",
      })
      .select("id")
      .single();

    if (contactError) {
      console.error("Supabase contacts insert error:", contactError);
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    // Calculate lead score based on engagement signals
    const phoneProvided = phone && phone !== "ej angiven";
    const bossPhoneProvided = bossPhone && bossPhone !== "ej angiven";
    const companyProvided = !!company;

    // Engagement: form submission = strong signal
    const engagementScore = 15 + (phoneProvided ? 5 : 0) + (bossPhoneProvided ? 5 : 0);
    // Fit: company + industry signals
    const fitScore = (companyProvided ? 10 : 0) + (industry && ["retail", "ecommerce", "telecom"].includes(industry) ? 10 : 5);
    // Intent: submitted contact form = high intent
    const intentScore = 15 + (bossPhoneProvided ? 5 : 0);
    const totalScore = Math.min(100, engagementScore + fitScore + intentScore);

    // Insert into lead_scores (matches schema: contact_id UUID FK, total_score, engagement_score, fit_score, intent_score, signals JSONB)
    const signals = [
      { type: "form_submit", value: 15, timestamp: new Date().toISOString(), description: "Skickade kontaktformulär via landningssidan" },
    ];
    if (phoneProvided) {
      signals.push({ type: "phone_provided", value: 5, timestamp: new Date().toISOString(), description: "Angav telefonnummer" });
    }
    if (bossPhoneProvided) {
      signals.push({ type: "boss_phone_provided", value: 10, timestamp: new Date().toISOString(), description: "Angav chefens telefonnummer" });
    }

    const { error: scoreError } = await supabase.from("lead_scores").insert({
      contact_id: contactData?.id,
      total_score: totalScore,
      engagement_score: engagementScore,
      fit_score: fitScore,
      intent_score: intentScore,
      signals,
    });

    if (scoreError) {
      console.error("Supabase lead_scores insert error:", scoreError);
    }

    // Also create product_scores based on role/industry signals
    const productSignals: { slug: string; score: number }[] = [];
    if (role === "hr") {
      productSignals.push({ slug: "send-a-gift", score: 40 });
    }
    if (role === "marketing") {
      productSignals.push({ slug: "sales-promotion", score: 30 });
      productSignals.push({ slug: "interactive-engage", score: 20 });
      productSignals.push({ slug: "kampanja", score: 15 });
    }
    if (role === "operations" || role === "vd") {
      productSignals.push({ slug: "customer-care", score: 25 });
    }
    if (industry === "retail" || industry === "ecommerce") {
      productSignals.push({ slug: "sales-promotion", score: 20 });
      productSignals.push({ slug: "clearing-solutions", score: 10 });
    }

    // Deduplicate and take highest score per product
    const productMap = new Map<string, number>();
    for (const ps of productSignals) {
      const current = productMap.get(ps.slug) || 0;
      productMap.set(ps.slug, Math.max(current, ps.score));
    }

    for (const [slug, score] of productMap) {
      await supabase.from("product_scores").insert({
        contact_id: contactData?.id,
        product_slug: slug,
        score,
        signals: [{ type: "landing_form", value: score, timestamp: new Date().toISOString(), description: `Roll: ${role || "okänd"}, Bransch: ${industry || "okänd"}` }],
      });
    }

    // Link the session to the contact by creating a web_session if we have a sessionId
    if (sessionId) {
      await supabase
        .from("web_sessions")
        .update({ contact_id: contactData?.id })
        .eq("anonymous_id", sessionId);
    }

    return NextResponse.json({
      success: true,
      leadId: contactData?.id,
      score: totalScore,
    });
  } catch (error) {
    console.error("Lead error:", error);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
