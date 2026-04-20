import { DailyBrief } from "@/components/dashboard/daily-brief";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { HotLeads } from "@/components/dashboard/hot-leads";
import { AiSuggestions } from "@/components/dashboard/ai-suggestions";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { ChannelFlow } from "@/components/dashboard/channel-flow";
import { getKpis, getHotLeads, getActivities, getContacts } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [kpis, hotLeads, activities, allContacts] = await Promise.all([
    getKpis(),
    getHotLeads(8),
    getActivities(12),
    getContacts(200),
  ]);

  const contactNowCount = hotLeads.filter((l) => l.contactNow).length;

  return (
    <div className="space-y-6">
      <DailyBrief
        hotLeadCount={hotLeads.filter((l) => l.status === "hot").length}
        contactNowCount={contactNowCount}
        topLead={hotLeads[0] || null}
      />
      <KpiCards kpis={kpis} />
      <HotLeads leads={hotLeads} />
      <ChannelFlow contacts={allContacts} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <LiveFeed activities={activities} />
        </div>
        <div className="lg:col-span-2">
          <AiSuggestions leads={hotLeads} />
        </div>
      </div>
    </div>
  );
}
