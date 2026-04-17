import Link from "next/link";
import { notFound } from "next/navigation";
import { products, getProduct } from "@/lib/products";
import {
  productScores,
  contacts,
  leadScores,
  adCampaigns,
  landingPageStats,
  shouldContactNow,
} from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket,
  HeartHandshake,
  Gamepad2,
  Megaphone,
  Gift,
  ArrowLeftRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Zap,
  Users,
  Eye,
  MousePointerClick,
  Target,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  ticket: Ticket,
  "heart-handshake": HeartHandshake,
  "gamepad-2": Gamepad2,
  megaphone: Megaphone,
  gift: Gift,
  "arrow-left-right": ArrowLeftRight,
};

const aiRecommendations: Record<string, string> = {
  "sales-promotion":
    "Fazer och Orkla visar starka kopsignaler. Rekommendation: boka demo med Maria Eriksson (Fazer) inom 48h. Hon har laddat ner rapporten och besokat produktsidan 3 ganger. Skicka aven case study till Lantmannen som oppnat tre mail denna vecka.",
  "customer-care":
    "Telia visar tydligt intresse for Customer Care. Sara Bergstrom besoke kontaktsidan idag. Forsla att skicka en personlig demo-inbjudan med referens till Telias befintliga kundserviceprocess. LinkedIn-kampanjen ar pausad men genererade bra leads, overvag att ateruppta med justerad budget.",
  "interactive-engage":
    "Anna Svensson (Orkla) klickade pa LinkedIn-annonsen for Gamification igar. Hennes kollega ar redan kund. Agera inom 48h. Ida Karlsson (Mondelez) har ocksa visat intresse. Forslag: skapa en branschspecifik demo for FMCG-segmentet.",
  kampanja:
    "Kampanja ar en ny produkt med vaxande intresse. Meta-kampanjen genererar leads till lag kostnad. Rekommendation: oka budget med 30% och rikta mot FMCG-segment som redan visat intresse for Sales Promotion, da Kampanja ar ett naturligt nasta steg.",
  "send-a-gift":
    "HR-segmentet ar starkt for Send a Gift. Johan Lindstrom (Volvo Cars) och Marcus Wahl (Scandic Hotels) ar de hetaste leads. Rekommendation: skicka Volvo-caset till alla HR-chefer i pipelinen. Google Ads-kampanjen ar under uppbyggnad, se till att landningssidan ar optimerad innan lansering.",
  "clearing-solutions":
    "Clearing Solutions har lagre lead-volym men hogre deal-varde. Fokusera pa befintliga kunder som redan anvander Sales Promotion och presentera Clearing som ett naturligt tillagg. Google Ads-kampanjen gar stabilt men CPL ar hogt, overvag att testa LinkedIn for B2B-beslutsfattare.",
};

export default async function ProductDetailPage(
  props: PageProps<"/produkter/[slug]">
) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const Icon = iconMap[product.icon];

  const allLeads = productScores
    .filter((ps) => ps.product_slug === slug)
    .sort((a, b) => b.score - a.score)
    .map((ps) => {
      const contact = contacts.find((c) => c.id === ps.contact_id);
      const totalScore = leadScores.find(
        (ls) => ls.contact_id === ps.contact_id
      );
      return { ...ps, contact, totalScore: totalScore?.total_score ?? 0 };
    });

  const campaigns = adCampaigns.filter(
    (c) => c.product_slug === slug
  );

  const channelBreakdown = campaigns.reduce(
    (acc, c) => {
      if (!acc[c.platform]) {
        acc[c.platform] = {
          spend: 0,
          leads: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
        };
      }
      acc[c.platform].spend += c.spend;
      acc[c.platform].leads += c.leads_generated;
      acc[c.platform].impressions += c.impressions;
      acc[c.platform].clicks += c.clicks;
      acc[c.platform].conversions += c.conversions;
      return acc;
    },
    {} as Record<
      string,
      {
        spend: number;
        leads: number;
        impressions: number;
        clicks: number;
        conversions: number;
      }
    >
  );

  const platformLabels: Record<string, string> = {
    meta: "Meta Ads",
    google: "Google Ads",
    linkedin: "LinkedIn Ads",
  };

  const platformColors: Record<string, string> = {
    meta: "bg-blue-100 text-blue-800",
    google: "bg-red-100 text-red-800",
    linkedin: "bg-sky-100 text-sky-800",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/produkter">
            <ArrowLeft className="h-3.5 w-3.5" />
            Alla produkter
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: product.color + "1A" }}
        >
          {Icon && (
            <Icon className="h-7 w-7" style={{ color: product.color }} />
          )}
        </div>
        <div>
          <span className="section-prefix">/ Produkt</span>
          <h1 className="font-display text-2xl">{product.name}</h1>
          <p className="text-sm text-text-secondary mt-0.5 max-w-2xl">
            {product.description}
          </p>
        </div>
      </div>

      {/* Landing page stats */}
      {(() => {
        const lpStat = landingPageStats.find((lp) => lp.product_slug === slug);
        if (!lpStat) return null;
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Landningssida</CardTitle>
                <a
                  href={product.landingPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors"
                >
                  {product.landingPageUrl}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle">
                    <Eye className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Besokare</p>
                    <p className="font-display text-lg">{formatNumber(lpStat.visitors)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Leads</p>
                    <p className="font-display text-lg">{lpStat.leads}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle">
                    <Target className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Conv. rate</p>
                    <p className="font-display text-lg">{lpStat.conversion_rate.toString().replace(".", ",")}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle">
                    <MousePointerClick className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Bounce rate</p>
                    <p className="font-display text-lg">{lpStat.bounce_rate}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Snitt tid</p>
                  <p className="font-display text-lg">{lpStat.avg_time_on_page}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Top kalla</p>
                  <p className="font-display text-sm">{lpStat.top_source}</p>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-3">
                Malgrupp: {product.targetAudience}
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Lead table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Leads sorterade efter produktintresse ({allLeads.length} st)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                    <th className="pb-2 pr-4">Namn</th>
                    <th className="pb-2 pr-4">Foretag</th>
                    <th className="pb-2 pr-4">Titel</th>
                    <th className="pb-2 pr-4">Kalla</th>
                    <th className="pb-2 pr-4 text-right">Produktscore</th>
                    <th className="pb-2 pr-4 text-right">Total score</th>
                    <th className="pb-2 text-center">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeads.map((lead) => {
                    const cn = shouldContactNow(lead.contact_id);
                    return (
                      <tr
                        key={lead.contact_id}
                        className={`border-b border-border/50 last:border-0 ${cn.should ? "bg-amber-50/30" : ""}`}
                      >
                        <td className="py-2.5 pr-4">
                          <Link href={`/leads/${lead.contact_id}`} className="font-medium hover:text-accent transition-colors">
                            {lead.contact?.name ?? "Okand"}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-text-secondary">
                          {lead.contact?.account_name}
                        </td>
                        <td className="py-2.5 pr-4 text-text-secondary">
                          {lead.contact?.title}
                        </td>
                        <td className="py-2.5 pr-4 text-text-secondary text-xs">
                          {lead.contact?.source_channel ?? "-"}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <ScoreBadge score={lead.score} size="sm" />
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <ScoreBadge
                            score={lead.totalScore}
                            size="sm"
                          />
                        </td>
                        <td className="py-2.5 text-center">
                          {cn.should ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              <Zap className="h-2.5 w-2.5" />
                              Kontakta nu
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Inga leads registrerade for denna produkt
            </p>
          )}
        </CardContent>
      </Card>

      {/* Channel breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kanalfordelning</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(channelBreakdown).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                    <th className="pb-2 pr-4">Kanal</th>
                    <th className="pb-2 pr-4 text-right">Spend</th>
                    <th className="pb-2 pr-4 text-right">Impressions</th>
                    <th className="pb-2 pr-4 text-right">Klick</th>
                    <th className="pb-2 pr-4 text-right">Leads</th>
                    <th className="pb-2 pr-4 text-right">CPL</th>
                    <th className="pb-2 text-right">Konverteringar</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(channelBreakdown).map(
                    ([platform, data]) => (
                      <tr
                        key={platform}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2.5 pr-4">
                          <Badge className={platformColors[platform]}>
                            {platformLabels[platform] ?? platform}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs">
                          {formatCurrency(data.spend)}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs">
                          {formatNumber(data.impressions)}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs">
                          {formatNumber(data.clicks)}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs">
                          {data.leads}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono text-xs">
                          {data.leads > 0
                            ? formatCurrency(
                                Math.round(data.spend / data.leads)
                              )
                            : "-"}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs">
                          {data.conversions}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Inga annonskampanjer for denna produkt
            </p>
          )}
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
            {aiRecommendations[slug] ??
              "Ingen specifik rekommendation tillganglig for denna produkt just nu."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
