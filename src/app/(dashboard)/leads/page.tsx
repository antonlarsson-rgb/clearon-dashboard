import Link from "next/link";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { getContacts } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  let contacts: Awaited<ReturnType<typeof getContacts>> = [];
  try {
    contacts = await getContacts(200);
  } catch (e) {
    console.error("Leads data fetch error:", e);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text-primary">Upsales CRM-leads</h1>
        <p className="text-sm text-text-secondary mt-1">
          {contacts.length} kontakter direkt fran Upsales sorterade efter Upsales-score
          (rule-based). Innehaller Glass-kampanjer, MG-leverantorer, formularsvar och
          andra Upsales-kategorier.
        </p>
        <div className="mt-3 rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-text-secondary">
          Letar du efter buying-intent, beteende-monster eller anonyma webb-besokare?{" "}
          <Link href="/persons" className="font-medium text-accent hover:underline">
            Ga till Leads &amp; Personer
          </Link>{" "}
          for hela bilden — clearon.live, mail, ads, opportunities och Upsales i samma vy.
        </div>
      </div>
      <LeadsTable contacts={contacts} />
    </div>
  );
}
