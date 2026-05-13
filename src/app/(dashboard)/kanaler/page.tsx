// Datakallor:
// - Webbkanaler: clearon.live (Supabase web_events) + clearon.se (Upsales)
// - Landningssidor: Supabase web_sessions per landningssida
// - Annonskanaler: live via Adspirer MCP (Google + Meta, LinkedIn ej exponerat an)
import { getContacts } from "@/lib/dashboard-data";
import {
  buildWebChannelFlows,
  getClearonSeWebTraffic,
  getLandingPageAnalytics,
} from "@/lib/web-analytics";
import { products } from "@/lib/products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { AdsOverview } from "@/components/dashboard/ads-overview";
import { ExternalLink, ArrowRight, Eye, Users, Target, TrendingUp, Megaphone } from "lucide-react";

function getProductColor(slug: string) {
  return products.find((p) => p.slug === slug)?.color ?? "#6B7280";
}

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

      {/* Channel flow funnel - LIVE Supabase + Upsales */}
      <Card>
        <CardHeader>
          <CardTitle>Webbkanaler</CardTitle>
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
                  <th className="pb-2 pr-4 text-center"></th>
                  <th className="pb-2 pr-4 text-right">Mojligheter</th>
                  <th className="pb-2 pr-4 text-center"></th>
                  <th className="pb-2 pr-4 text-right">Deals</th>
                  <th className="pb-2 pr-4">Top landningssida</th>
                  <th className="pb-2">Top produkt</th>
                </tr>
              </thead>
              <tbody>
                {channelFlows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-6 text-center text-sm text-text-muted">
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
                    <td className="py-3 pr-4 text-center text-text-muted"><ArrowRight className="h-3 w-3 inline" /></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs">{flow.opportunities}</td>
                    <td className="py-3 pr-4 text-center text-text-muted"><ArrowRight className="h-3 w-3 inline" /></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs font-medium text-accent">{flow.deals}</td>
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
                    <td className="py-3 pr-4 text-right font-mono text-xs">{channelFlows.reduce((s, f) => s + f.opportunities, 0)}</td>
                    <td className="py-3 pr-4"></td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-accent">{channelFlows.reduce((s, f) => s + f.deals, 0)}</td>
                    <td className="py-3 pr-4"></td>
                    <td className="py-3"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Landing page performance - LIVE Supabase */}
      <Card>
        <CardHeader>
          <CardTitle>Landningssidor per produkt</CardTitle>
        </CardHeader>
        <CardContent>
          {landingPageStats.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-text-muted">
              Inga landningssidor har samlat trafik an. Tracking via /api/tracking ar aktiv.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {landingPageStats.map((lp) => {
                const product = products.find((p) => p.slug === lp.product_slug);
                return (
                  <div key={lp.path} className="border border-border rounded-lg p-4 hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: lp.product_slug ? getProductColor(lp.product_slug) : "#6B7280",
                          }}
                        />
                        <span className="text-sm font-medium">{product?.name || lp.path}</span>
                      </div>
                      <a
                        href={product?.landingPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                      >
                        <span className="font-mono">{lp.path}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-text-muted" />
                        <div>
                          <p className="text-[10px] text-text-muted uppercase">Besokare</p>
                          <p className="font-mono text-sm">{formatNumber(lp.visitors)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-text-muted" />
                        <div>
                          <p className="text-[10px] text-text-muted uppercase">Leads</p>
                          <p className="font-mono text-sm">{lp.leads}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-text-muted" />
                        <div>
                          <p className="text-[10px] text-text-muted uppercase">Conv. rate</p>
                          <p className="font-mono text-sm">{lp.conversion_rate.toString().replace(".", ",")}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-text-muted" />
                        <div>
                          <p className="text-[10px] text-text-muted uppercase">Top kalla</p>
                          <p className="text-xs">{lp.top_source}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annonskanaler - LIVE via Adspirer MCP */}
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
