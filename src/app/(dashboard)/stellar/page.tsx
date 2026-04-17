import { WeeklySummary } from "@/components/dashboard/weekly-summary";
import { KanbanBoard } from "@/components/dashboard/kanban-board";

export default function StellarPage() {
  return (
    <div className="space-y-6">
      <WeeklySummary />

      <div>
        <div className="mb-4">
          <span className="section-prefix">/ UPPGIFTER</span>
        </div>
        <KanbanBoard />
      </div>
    </div>
  );
}
