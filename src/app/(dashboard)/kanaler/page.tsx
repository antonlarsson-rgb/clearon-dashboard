// Datakallor:
// - Webbkanaler: clearon.live (Supabase web_events) + clearon.se (Upsales)
// - Annonskanaler: live via Adspirer MCP (Google + Meta + LinkedIn)
import { getContacts } from "@/lib/dashboard-data";
import {
  buildWebChannelFlows,
  getClearonSeWebTraffic,
  getLandingPageAnalytics,
} from "@/lib/web-analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { AdsOverview } from "@/components/dashboard/ads-overview";
import { ArrowRight, Megaphone } from "lucide-react";

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
        <span className="section-prefix">/ Kanaler</span>
        <h1 className="font-display text-2xl mt-1">Kanaloversikt</h1>
        <p className="text-text-secondary text-sm mt-1">
          clearon.live fran landningssidans tracking, clearon.se fran Upsales webbbesok, annonser via Adspirer.
        </p>
      </div>

      {/* Web-funnel: bara kolumner vi faktiskt har data för. Opportunities och
          deals visas på /accounts och i KPI:erna på hemskärmen (events-graf).
          Att inkludera dem här utan attribution skulle vara missvisande. */}
      <Card>
        <CardHeader>
          <CardTitle>Webbkanaler</CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Besökare och leads per webbkälla. För opportunities-attribution per kanal,
            se /accounts och hemskärmens KPI-kort.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="pb-2 pr-4">Kanal</th>
                  <th className="pb-2 pr-4 text-right">Besokare</th>
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
                      Ingen webbdata an. Landningssidans events och Upsales webbbesok visas har nar de finns.
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <CardTitle>Annonskanaler - vad spenderas och vad ger det?</CardTitle>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Live spend, klick och konverteringar fran Google Ads, Meta och LinkedIn via Adspirer.
            Valj period (rullande dagar eller specifik manad) for att se exakt vad som hant.
          </p>
        </CardHeader>
        <CardContent>
          <AdsOverview />
        </CardContent>
      </Card>
    </div>
  );
}
