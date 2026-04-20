import { LeadsTable } from "@/components/dashboard/leads-table";
import { getContacts } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const contacts = await getContacts(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text-primary">Leads</h1>
        <p className="text-sm text-text-secondary mt-1">
          Riktig data fran Upsales CRM. {contacts.length} leads sorterade efter score.
        </p>
      </div>
      <LeadsTable contacts={contacts} />
    </div>
  );
}
