import { LeadsTable } from "@/components/dashboard/leads-table";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text-primary">Leads</h1>
        <p className="text-sm text-text-secondary mt-1">
          Oversikt av alla leads, segmenterade efter score, produkt och aktivitet.
        </p>
      </div>
      <LeadsTable />
    </div>
  );
}
