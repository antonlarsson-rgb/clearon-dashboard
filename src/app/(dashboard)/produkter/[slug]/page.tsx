import Link from "next/link";
import { notFound } from "next/navigation";
import { products, getProduct } from "@/lib/products";
import {
  productScores,
  contacts,
  leadScores,
  adCampaigns,
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
                    <th className="pb-2 pr-4 text-right">Produktscore</th>
                    <th className="pb-2 text-right">Total score</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeads.map((lead) => (
                    <tr
                      key={lead.contact_id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium">
                        {lead.contact?.name ?? "Okand"}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {lead.contact?.account_name}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {lead.contact?.title}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <ScoreBadge score={lead.score} size="sm" />
                      </td>
                      <td className="py-2.5 text-right">
                        <ScoreBadge
                          score={lead.totalScore}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
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
