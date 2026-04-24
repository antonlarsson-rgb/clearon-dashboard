import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { findOrCreateContact } from "@/lib/upsales";
import { computeDemoReadiness, computeSegment } from "@/lib/scoring";
import { resolveOrCreatePerson } from "@/lib/identity";
import { logEvent } from "@/lib/events";
import { recomputePerson } from "@/lib/person-scoring";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "live.se",
  "icloud.com",
  "telia.com",
  "me.com",
]);

interface VainuCompany {
  name: string;
  industry: string | null;
  website: string | null;
  employees: number | null;
  revenue: number | null;
  domain: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, visitorId, email, company, role, interests } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Hjälpfunktion för att plocka ut fält från interests-listan
    const interestsArr = (interests as string[]) || [];
    const getField = (prefix: string) => {
      const item = interestsArr.find((i: string) => i.startsWith(prefix));
      return item ? item.slice(prefix.length) : undefined;
    };

    const contactName = getField("name:") || email.split("@")[0];
    const phone = getField("phone:");
    const bossPhone = getField("bossPhone:");
    const submittedIndustry = getField("industry:") || "";

    // --- 1. Vainu-berikning (email-domän → företagsnamn fallback) ---
    const emailDomain = email.split("@")[1]?.toLowerCase() || null;
    let vainuMatch: VainuCompany | null = null;
    if (emailDomain && !FREE_EMAIL_DOMAINS.has(emailDomain)) {
      const { data } = await supabase
        .from("vainu_companies")
        .select("name, industry, website, employees, revenue, domain")
        .eq("domain", emailDomain)
        .limit(1)
        .maybeSingle<VainuCompany>();
      if (data) vainuMatch = data;
    }
    if (!vainuMatch && company) {
      const { data } = await supabase
        .from("vainu_companies")
        .select("name, industry, website, employees, revenue, domain")
        .ilike("name", company)
        .limit(1)
        .maybeSingle<VainuCompany>();
      if (data) vainuMatch = data;
    }

    const resolvedCompany = company || vainuMatch?.name || null;
    const resolvedIndustry = submittedIndustry || vainuMatch?.industry || null;
    const resolvedWebsite = vainuMatch?.website || emailDomain || null;

    // --- 2. Hitta eller skapa account ---
    let accountId: string | null = null;
    if (resolvedCompany) {
      const { data: existingAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", resolvedCompany)
        .limit(1)
        .maybeSingle();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        const { data: newAccount } = await supabase
          .from("accounts")
          .insert({
            upsales_id: Math.floor(Date.now() / 1000),
            name: resolvedCompany,
            industry: resolvedIndustry,
            website: resolvedWebsite,
          })
          .select("id")
          .single();
        accountId = newAccount?.id || null;
      }
    }

    // --- 3. Skapa contact ---
    const roleCategoryMap: Record<string, string> = {
      vd: "executive",
      cfo: "executive",
      marketing: "marketing",
      hr: "hr",
      operations: "customer_service",
      multiple: "other",
    };

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

    // --- 4. Lead score baserat på form-signaler ---
    const phoneProvided = phone && phone !== "ej angiven";
    const bossPhoneProvided = bossPhone && bossPhone !== "ej angiven";
    const companyProvided = !!resolvedCompany;
    const isBusinessEmail = emailDomain && !FREE_EMAIL_DOMAINS.has(emailDomain);

    const engagementScore = 15 + (phoneProvided ? 5 : 0) + (bossPhoneProvided ? 5 : 0);
    const fitScore =
      (companyProvided ? 10 : 0) +
      (isBusinessEmail ? 5 : 0) +
      (resolvedIndustry && ["retail", "ecommerce", "telecom"].includes(resolvedIndustry) ? 10 : 5) +
      (vainuMatch ? 5 : 0);
    const intentScore = 15 + (bossPhoneProvided ? 5 : 0);
    const totalScore = Math.min(100, engagementScore + fitScore + intentScore);

    const signals: Array<{ type: string; value: number; timestamp: string; description: string }> = [
      { type: "form_submit", value: 15, timestamp: new Date().toISOString(), description: "Skickade kontaktformulär via landningssidan" },
    ];
    if (phoneProvided) signals.push({ type: "phone_provided", value: 5, timestamp: new Date().toISOString(), description: "Angav telefonnummer" });
    if (bossPhoneProvided) signals.push({ type: "boss_phone_provided", value: 10, timestamp: new Date().toISOString(), description: "Angav chefens telefonnummer" });
    if (vainuMatch) signals.push({ type: "vainu_match", value: 5, timestamp: new Date().toISOString(), description: `Matchad mot Vainu: ${vainuMatch.name}` });

    await supabase.from("lead_scores").insert({
      contact_id: contactData?.id,
      total_score: totalScore,
      engagement_score: engagementScore,
      fit_score: fitScore,
      intent_score: intentScore,
      signals,
    });

    // --- 5. Produkt-scores från roll/bransch ---
    const productSignals: { slug: string; score: number }[] = [];
    if (role === "hr") productSignals.push({ slug: "send-a-gift", score: 40 });
    if (role === "marketing") {
      productSignals.push({ slug: "sales-promotion", score: 30 });
      productSignals.push({ slug: "interactive-engage", score: 20 });
      productSignals.push({ slug: "kampanja", score: 15 });
    }
    if (role === "operations" || role === "vd") {
      productSignals.push({ slug: "customer-care", score: 25 });
    }
    if (resolvedIndustry === "retail" || resolvedIndustry === "ecommerce") {
      productSignals.push({ slug: "sales-promotion", score: 20 });
      productSignals.push({ slug: "clearing-solutions", score: 10 });
    }

    const productMap = new Map<string, number>();
    for (const ps of productSignals) {
      productMap.set(ps.slug, Math.max(productMap.get(ps.slug) || 0, ps.score));
    }

    for (const [slug, score] of productMap) {
      await supabase.from("product_scores").upsert(
        {
          contact_id: contactData?.id,
          product_slug: slug,
          score,
          signals: [
            {
              type: "landing_form",
              value: score,
              timestamp: new Date().toISOString(),
              description: `Roll: ${role || "okänd"}, Bransch: ${resolvedIndustry || "okänd"}`,
            },
          ],
        },
        { onConflict: "contact_id,product_slug" }
      );
    }

    // --- 6. Bind visitor_id (cookie) → contact_id + aggregera beteende ---
    if (visitorId) {
      const { data: existingVisitor } = await supabase
        .from("visitors")
        .select(
          "id, engagement_score, intent_score, visits_count, max_scroll_depth, total_dwell_seconds, product_affinities, signals"
        )
        .eq("visitor_id", visitorId)
        .maybeSingle();

      const mergedEngagement = (existingVisitor?.engagement_score || 0) + engagementScore;
      const mergedIntent = (existingVisitor?.intent_score || 0) + intentScore;
      const demoReadiness = computeDemoReadiness({
        intentScore: mergedIntent,
        engagementScore: mergedEngagement,
        visitsCount: existingVisitor?.visits_count || 1,
        maxScrollDepth: existingVisitor?.max_scroll_depth || 0,
        dwellSeconds: existingVisitor?.total_dwell_seconds || 0,
        hasIdentified: true,
        hasCompany: !!resolvedCompany,
      });

      // Merga befintliga visitor-signals med form-signals
      const existingSigs = (existingVisitor?.signals as unknown as Array<unknown>) || [];
      const mergedSignals = [...existingSigs, ...signals];

      if (existingVisitor) {
        await supabase
          .from("visitors")
          .update({
            contact_id: contactData?.id,
            email,
            name: contactName,
            company: resolvedCompany,
            phone: phoneProvided ? phone : null,
            engagement_score: mergedEngagement,
            intent_score: mergedIntent,
            score: Math.min(100, (existingVisitor as { engagement_score: number }).engagement_score + mergedIntent + 10),
            demo_readiness: demoReadiness,
            segment: computeSegment(mergedEngagement + mergedIntent),
            signals: mergedSignals,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingVisitor.id);
      } else {
        await supabase.from("visitors").insert({
          visitor_id: visitorId,
          contact_id: contactData?.id,
          email,
          name: contactName,
          company: resolvedCompany,
          phone: phoneProvided ? phone : null,
          engagement_score: engagementScore,
          intent_score: intentScore,
          score: totalScore,
          demo_readiness: demoReadiness,
          segment: computeSegment(totalScore),
          signals,
          visits_count: 1,
        });
      }
    }

    // Link session → contact
    if (sessionId) {
      await supabase
        .from("web_sessions")
        .update({ contact_id: contactData?.id })
        .eq("anonymous_id", sessionId);
    }

    // --- Person graph: resolve + log lead event + recompute score ---
    const personId = await resolveOrCreatePerson(
      supabase,
      {
        email,
        phone: phoneProvided ? (phone as string) : null,
        visitor_cookie: visitorId || null,
      },
      {
        name: contactName,
        title: role || null,
        role_category: roleCategoryMap[role || ""] || "other",
        account_id: accountId,
        contact_id: contactData?.id,
        source: "form",
      }
    );

    if (personId) {
      await logEvent(supabase, {
        person_id: personId,
        account_id: accountId,
        source: "form",
        event_type: "lead_submitted",
        product_slug: getField("product:") || null,
        metadata: {
          role,
          industry: resolvedIndustry,
          company: resolvedCompany,
          variant: getField("variant:"),
          source_channel: getField("utm_source:") || getField("variant:"),
          phone_provided: phoneProvided,
          boss_phone_provided: bossPhoneProvided,
          vainu_matched: !!vainuMatch,
        },
      });

      // Recompute i bakgrund (non-blocking)
      recomputePerson(supabase, personId).catch((e) =>
        console.error("recomputePerson failed:", e)
      );
    }

    // --- 7. Upsales sync (non-blocking) ---
    const product = getField("product:") || "";
    const variant = getField("variant:") || "main";
    const utmSource = getField("utm_source:") || variant;

    findOrCreateContact({
      name: contactName !== "ej angiven" ? contactName : email.split("@")[0],
      email,
      phone: phone && phone !== "ej angiven" ? phone : undefined,
      company: resolvedCompany || undefined,
      product: product || undefined,
      source: utmSource,
    })
      .then((result) => {
        if (result.contact?.id && contactData?.id) {
          supabase
            .from("contacts")
            .update({ upsales_id: result.contact.id })
            .eq("id", contactData.id)
            .then(() => {});
        }
        console.log(
          `Upsales sync: ${result.isNew ? "NEW" : "EXISTING"} contact ${result.contact?.name} (ID: ${result.contact?.id}), product: ${product}`
        );
      })
      .catch((e) => {
        console.error("Upsales sync failed (non-blocking):", e);
      });

    return NextResponse.json({
      success: true,
      leadId: contactData?.id,
      score: totalScore,
      vainuMatched: !!vainuMatch,
      company: resolvedCompany,
    });
  } catch (error) {
    console.error("Lead error:", error);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
