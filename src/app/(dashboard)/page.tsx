import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief";
import { KpiCardsGraph } from "@/components/dashboard/kpi-cards-graph";
import { IntentLeaderboard } from "@/components/dashboard/intent-leaderboard";
import { EventsFeed } from "@/components/dashboard/events-feed";
import { ChannelFlow } from "@/components/dashboard/channel-flow";
import { getContacts } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  // ChannelFlow får fortsatt Upsales-kontakter — de ger källa per lead-batch
  // som inte finns i webb-grafen (mg-leverantörer, glass-leads etc).
  let contacts: Awaited<ReturnType<typeof getContacts>> = [];
  try {
    contacts = await getContacts(200);
  } catch {
    contacts = [];
  }

  return (
    <div className="space-y-6">
      <AiDailyBrief />
      <KpiCardsGraph />
      <IntentLeaderboard />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <EventsFeed />
        </div>
        <div className="lg:col-span-2">
          <ChannelFlow contacts={contacts} />
        </div>
      </div>
    </div>
  );
}
