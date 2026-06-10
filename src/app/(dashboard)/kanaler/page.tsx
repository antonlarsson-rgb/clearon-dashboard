// Kanaler — översikt över alla källor som driver trafik och leads.
// Datakällor:
// - Windsor.ai: Google + Meta + LinkedIn live-data
// - Supabase web_sessions: clearon.live-trafik
// - Upsales /visits: clearon.se IP-identifierade besök (synkat till events)
// - Upsales mail-events: open/click (synkat till events)
// - DB ad_campaigns: kreativ + mail-utskick

import { getContacts } from "@/lib/dashboard-data";
import {
  buildWebChannelFlows,
  getClearonSeWebTraffic,
  getLandingPageAnalytics,
} from "@/lib/web-analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { AdsOverview } from "@/components/dashboard/ads-overview";
import { ChannelHealth } from "@/components/dashboard/channel-health";
import { ChannelRoi } from "@/components/dashboard/channel-roi";
import { ArrowRight, Megaphone, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KanalerPage() {
  const [landingPageStats, contacts] = await Promise.all([
    getLandingPageAnalytics(30),
    getContacts(200),
  ]);
  const clearonSeTraffic = getClearonSeWebTraffic(contacts);
  const channelFlows = buildWebChannelFlows(landingPageStats, clearonSeTraffic);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <BarChart3 className="h-6 w-6 text-accent" />
          Kanaler
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Översikt över alla kanaler som genererar trafik och leads — webb, e-post och annonser.
          Välj period nedan så uppdateras allt.
        </p>
      </div>

      {/* Hero: kanal-hälsa över alla källor */}
      <ChannelHealth defaultLookback={30} />

      {/* ROI: annons-spend mot pipeline och vunna affärer */}
      <ChannelRoi defaultLookback={90} />

      {/* Webb-funnel: visitors per webbkälla */}
      <Card>
        <CardHeader>
          <CardTitle>Webb-funnel</CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Antal unika besökare och leads per webbkälla senaste 30 dagarna.
            Leads = identifierade via form-submit eller mail-länk.
            clearon.live är vår landningssida; clearon.se är ClearOns huvudsajt där
            Upsales IP-identifierar besökande företag.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="pb-2 pr-4">Källa</th>
                  <th className="pb-2 pr-4 text-right">Besökare</th>
                  <th className="pb-2 pr-4 text-center"></th>
                  <th className="pb-2 pr-4 text-right">Leads</th>
                  <th className="pb-2 pr-4 text-center"></th>
                  <th className="pb-2 pr-4 text-right">Kvalificerade</th>
                  <th className="pb-2 pr-4">Top landningssida</th>
                  <th className="pb-2">Top produkt</th>
                </tr>
              </thead>
              <tbody>
                {channelFlows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-text-muted">
                      Ingen webbdata än. Tracking via /api/tracking aktiveras när första besöket sker.
                    </td>
                  </tr>
                )}
                {channelFlows.map((flow) => (
                  <tr key={flow.channel} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium">{flow.channel}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{formatNumber(flow.visitors)}</td>
                    <td className="py-3 pr-4 text-center text-text-muted"><ArrowRight className="h-3 w-3 inline" /></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{flow.leads}</td>
                    <td className="py-3 pr-4 text-center text-text-muted"><ArrowRight className="h-3 w-3 inline" /></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{flow.qualified}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-text-secondary font-mono">{flow.topLandingPage}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-text-secondary">{flow.topProduct}</span>
                    </td>
                  </tr>
                ))}
                {channelFlows.length > 0 && (
                  <tr className="border-t-2 border-border font-medium">
                    <td className="py-3 pr-4 text-xs uppercase tracking-wide">Totalt</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{formatNumber(channelFlows.reduce((s, f) => s + f.visitors, 0))}</td>
                    <td className="py-3 pr-4"></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{channelFlows.reduce((s, f) => s + f.leads, 0)}</td>
                    <td className="py-3 pr-4"></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{channelFlows.reduce((s, f) => s + f.qualified, 0)}</td>
                    <td className="py-3 pr-4"></td>
                    <td className="py-3"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Annons-drilldown med egen period */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <CardTitle>Annons-drilldown — kampanj-nivå</CardTitle>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Live från annonsplattformarna via Windsor.ai. Klicka på en
            plattform-sektion för att se kampanjlistor och dagliga trender.
          </p>
        </CardHeader>
        <CardContent>
          <AdsOverview />
        </CardContent>
      </Card>
    </div>
  );
}
