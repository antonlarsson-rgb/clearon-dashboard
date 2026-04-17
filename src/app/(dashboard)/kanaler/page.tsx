import { adCampaigns } from "@/lib/mock-data";
import { products } from "@/lib/products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Sparkles } from "lucide-react";

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
          Prestanda per marknadsforingskanal
        </p>
      </div>

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
                          <span className="text-text-secondary">
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
          <p className="text-sm leading-relaxed">
            Meta Ads levererar lagst CPL och hogst volym. Rekommendation: flytta
            15% av LinkedIn-budgeten till Meta for att maximera lead-volym pa
            kort sikt. LinkedIn ar dock starkast for B2B-beslutsfattare med
            hogre konverteringsgrad per lead. For Organic: de 22 organiska
            leadsen kostar ingenting men kravde SEO-investeringen i vecka 14/15.
            Fortsatt content-satsning rekommenderas da CPL effektivt ar noll.
            Email-kanalen visar 3 konverteringar pa 14 leads, hogsta
            konverteringsgraden av alla kanaler, overvag att bygga ut
            automationsflodena.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
