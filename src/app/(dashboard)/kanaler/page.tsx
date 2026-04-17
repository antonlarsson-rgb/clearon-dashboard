import { adCampaigns, channelFlows, landingPageStats } from "@/lib/mock-data";
import { products } from "@/lib/products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Sparkles, ExternalLink, ArrowRight, Eye, Users, Target, TrendingUp } from "lucide-react";

type ChannelData = {
  label: string;
  platform: string;
  colorClass: string;
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  conversions: number;
  byProduct: Record<
    string,
    { spend: number; leads: number; conversions: number }
  >;
};

function aggregateChannels(): ChannelData[] {
  const channelConfig: Record<
    string,
    { label: string; colorClass: string }
  > = {
    meta: { label: "Meta Ads", colorClass: "bg-blue-100 text-blue-800" },
    google: { label: "Google Ads", colorClass: "bg-red-100 text-red-800" },
    linkedin: {
      label: "LinkedIn Ads",
      colorClass: "bg-sky-100 text-sky-800",
    },
  };

  const map: Record<string, ChannelData> = {};

  for (const c of adCampaigns) {
    if (!map[c.platform]) {
      const cfg = channelConfig[c.platform] ?? {
        label: c.platform,
        colorClass: "bg-gray-100 text-gray-800",
      };
      map[c.platform] = {
        ...cfg,
        platform: c.platform,
        spend: 0,
        leads: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        byProduct: {},
      };
    }
    const ch = map[c.platform];
    ch.spend += c.spend;
    ch.leads += c.leads_generated;
    ch.impressions += c.impressions;
    ch.clicks += c.clicks;
    ch.conversions += c.conversions;

    if (!ch.byProduct[c.product_slug]) {
      ch.byProduct[c.product_slug] = { spend: 0, leads: 0, conversions: 0 };
    }
    ch.byProduct[c.product_slug].spend += c.spend;
    ch.byProduct[c.product_slug].leads += c.leads_generated;
    ch.byProduct[c.product_slug].conversions += c.conversions;
  }

  return Object.values(map).sort((a, b) => b.spend - a.spend);
}

// Static organic/email channels for completeness
const additionalChannels = [
  {
    label: "Email",
    platform: "email",
    colorClass: "bg-purple-100 text-purple-800",
    spend: 0,
    leads: 14,
    impressions: 4200,
    clicks: 680,
    conversions: 3,
  },
  {
    label: "Organic",
    platform: "organic",
    colorClass: "bg-green-100 text-green-800",
    spend: 0,
    leads: 22,
    impressions: 18500,
    clicks: 2100,
    conversions: 5,
  },
];

function getProductName(slug: string) {
  return products.find((p) => p.slug === slug)?.name ?? slug;
}

function getProductColor(slug: string) {
  return products.find((p) => p.slug === slug)?.color ?? "#6B7280";
}

export default function KanalerPage() {
  const channels = aggregateChannels();

  // Add email and organic with empty byProduct
  const allChannels = [
    ...channels,
    ...additionalChannels.map((c) => ({ ...c, byProduct: {} })),
  ];

  const totalSpend = allChannels.reduce((s, c) => s + c.spend, 0);
  const totalLeads = allChannels.reduce((s, c) => s + c.leads, 0);
  const totalConversions = allChannels.reduce(
    (s, c) => s + c.conversions,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="section-prefix">/ Kanaler</span>
        <h1 className="font-display text-2xl mt-1">Kanaloversikt</h1>
        <p className="text-text-secondary text-sm mt-1">
          Flode fran kanal till landningssida till lead till konvertering
        </p>
      </div>

      {/* Channel flow funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Kanalflode</CardTitle>
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
                {/* Totals */}
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
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Landing page performance */}
      <Card>
        <CardHeader>
          <CardTitle>Landningssidor per produkt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {landingPageStats.map((lp) => {
              const product = products.find((p) => p.slug === lp.product_slug);
              return (
                <div key={lp.path} className="border border-border rounded-lg p-4 hover:border-accent/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getProductColor(lp.product_slug) }} />
                      <span className="text-sm font-medium">{product?.name}</span>
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
        </CardContent>
      </Card>

      {/* Channel cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {allChannels.map((channel) => {
          const cpl =
            channel.leads > 0 && channel.spend > 0
              ? Math.round(channel.spend / channel.leads)
              : 0;
          const estimatedRevenue = channel.conversions * 25000;
          const roas =
            channel.spend > 0
              ? (estimatedRevenue / channel.spend).toFixed(1)
              : "-";
          const productEntries = Object.entries(channel.byProduct) as [string, { spend: number; leads: number; conversions: number }][];

          return (
            <Card key={channel.platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className={channel.colorClass}>
                    {channel.label}
                  </Badge>
                  {channel.spend > 0 && (
                    <span className="font-mono text-xs text-text-muted">
                      ROAS {roas.toString().replace(".", ",")}x
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-text-muted">Spend</p>
                    <p className="font-display text-lg">
                      {channel.spend > 0
                        ? formatCurrency(channel.spend)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Leads</p>
                    <p className="font-display text-lg">
                      {formatNumber(channel.leads)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">CPL</p>
                    <p className="font-display text-lg">
                      {cpl > 0 ? formatCurrency(cpl) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Konverteringar</p>
                    <p className="font-display text-lg">
                      {channel.conversions}
                    </p>
                  </div>
                </div>

                {/* Per-product breakdown */}
                {productEntries.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                      Per produkt
                    </p>
                    <div className="space-y-1.5">
                      {productEntries.map(([slug, data]) => (
                        <div
                          key={slug}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-1.5 text-text-secondary">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getProductColor(slug) }} />
                            {getProductName(slug)}
                          </span>
                          <div className="flex gap-3 font-mono">
                            <span>{formatCurrency(data.spend)}</span>
                            <span className="text-text-muted">
                              {data.leads} leads
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle>Jamforelse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="pb-2 pr-4">Kanal</th>
                  <th className="pb-2 pr-4 text-right">Spend</th>
                  <th className="pb-2 pr-4 text-right">Impressions</th>
                  <th className="pb-2 pr-4 text-right">Klick</th>
                  <th className="pb-2 pr-4 text-right">CTR</th>
                  <th className="pb-2 pr-4 text-right">Leads</th>
                  <th className="pb-2 pr-4 text-right">CPL</th>
                  <th className="pb-2 pr-4 text-right">Konv.</th>
                  <th className="pb-2 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {allChannels.map((ch) => {
                  const cpl =
                    ch.leads > 0 && ch.spend > 0
                      ? Math.round(ch.spend / ch.leads)
                      : 0;
                  const ctr =
                    ch.impressions > 0
                      ? ((ch.clicks / ch.impressions) * 100).toFixed(1)
                      : "0,0";
                  const estimatedRevenue = ch.conversions * 25000;
                  const roas =
                    ch.spend > 0
                      ? (estimatedRevenue / ch.spend).toFixed(1)
                      : "-";

                  return (
                    <tr
                      key={ch.platform}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <Badge className={ch.colorClass}>{ch.label}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {ch.spend > 0 ? formatCurrency(ch.spend) : "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {formatNumber(ch.impressions)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {formatNumber(ch.clicks)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {ctr.replace(".", ",")}%
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {ch.leads}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {cpl > 0 ? formatCurrency(cpl) : "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {ch.conversions}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">
                        {roas === "-" ? "-" : `${roas.replace(".", ",")}x`}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="border-t-2 border-border font-medium">
                  <td className="py-2.5 pr-4 text-xs uppercase tracking-wide">
                    Totalt
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    {formatCurrency(totalSpend)}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    {formatNumber(
                      allChannels.reduce((s, c) => s + c.impressions, 0)
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    {formatNumber(
                      allChannels.reduce((s, c) => s + c.clicks, 0)
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    -
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    {totalLeads}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    {totalLeads > 0
                      ? formatCurrency(Math.round(totalSpend / totalLeads))
                      : "-"}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs">
                    {totalConversions}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs">
                    {totalSpend > 0
                      ? `${((totalConversions * 25000) / totalSpend)
                          .toFixed(1)
                          .replace(".", ",")}x`
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-accent/20 bg-accent-subtle/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <CardTitle className="text-accent">AI-rekommendation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              <strong>Meta Ads</strong> levererar lagst CPL och hogst volym, sarskilt for Sales Promotion (Kupongguiden).
              Rekommendation: oka budget med 30% och skapa lookalike-audience baserat pa konverterade leads.
            </p>
            <p>
              <strong>LinkedIn Ads</strong> har hogre CPL men genererar mer kvalificerade leads, sarskilt for Interactive Engage och Customer Care.
              B2B-beslutsfattare konverterar battre. Behall nuvarande budget men optimera targeting.
            </p>
            <p>
              <strong>Google Ads</strong> gar stabilt med bra CPL for Sales Promotion. Send a Gift-kampanjen ar under uppbyggnad och behover
              optimerad landningssida innan full lansering.
            </p>
            <p>
              <strong>Email</strong> har hogsta konverteringsgraden per lead (21%) trots laga kostnader. Bygg ut automationsflodena.
              <strong>Organic</strong> levererar 22 leads till noll kostnad tack vare SEO-satsningen. Fortsatt content-produktion rekommenderas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
