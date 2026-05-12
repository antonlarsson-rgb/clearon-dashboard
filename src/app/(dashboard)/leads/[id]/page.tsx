import {
  buildLeadScoreBreakdown,
  buildLeadSignals,
  buildLeadSummary,
  getContactActivities,
  getContactById,
} from "@/lib/dashboard-data";
import { getProduct } from "@/lib/products";
import { notFound } from "next/navigation";
import { LeadProfileClient } from "./lead-profile-client";

export const dynamic = "force-dynamic";

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contactId = Number(id);
  if (!Number.isFinite(contactId)) {
    notFound();
  }

  const contact = await getContactById(contactId);
  if (!contact) {
    notFound();
  }

  const activities = await getContactActivities(contactId, 20);
  const score = buildLeadScoreBreakdown(contact);
  const signals = buildLeadSignals(contact, activities);
  const contactProducts = contact.topProduct
    ? [
        {
          product_slug: contact.topProduct,
          score: contact.score,
          product: getProduct(contact.topProduct),
        },
      ]
    : [];

  return (
    <LeadProfileClient
      contact={contact}
      score={score}
      signals={signals}
      contactProducts={contactProducts}
      aiSummary={buildLeadSummary(contact)}
    />
  );
}
