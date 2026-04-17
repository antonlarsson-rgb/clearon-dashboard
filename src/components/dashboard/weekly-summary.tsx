import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { weeklySummaries } from "@/lib/mock-data";

export function WeeklySummary() {
  const latest = weeklySummaries[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <span className="section-prefix">/ STELLAR UPDATE VECKA {latest.week_number}</span>
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span>{latest.tasks_completed} slutforda</span>
            <span className="text-text-muted">|</span>
            <span>{latest.tasks_in_progress} pagar</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-text-primary">
          {latest.summary_text}
        </p>
      </CardContent>
    </Card>
  );
}
