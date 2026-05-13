import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function WeeklySummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="section-prefix">/ STELLAR UPDATE</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-surface-elevated/40 p-4">
          <Sparkles className="h-5 w-5 shrink-0 text-accent mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-medium text-text-primary">
              Veckosammanfattning genereras snart automatiskt
            </div>
            <div className="text-xs text-text-secondary leading-relaxed">
              Sammanfattningen kommer baseras pa riktig data fran ClickUp (slutforda uppgifter)
              och Upsales (nya leads + aktiviteter). Anslut ClickUp i{" "}
              <Link href="/installningar" className="text-accent hover:underline">
                installningar
              </Link>{" "}
              for att aktivera.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
