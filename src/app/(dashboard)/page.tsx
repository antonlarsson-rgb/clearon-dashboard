import { DailyBrief } from "@/components/dashboard/daily-brief";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { HotLeads } from "@/components/dashboard/hot-leads";
import { AiSuggestions } from "@/components/dashboard/ai-suggestions";
import { LiveFeed } from "@/components/dashboard/live-feed";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Daily Brief */}
      <DailyBrief />

      {/* KPI Cards */}
      <KpiCards />

      {/* Hot Leads */}
      <HotLeads />

      {/* Two-column: Live Feed + AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <LiveFeed />
        </div>
        <div className="lg:col-span-2">
          <AiSuggestions />
        </div>
      </div>
    </div>
  );
}
