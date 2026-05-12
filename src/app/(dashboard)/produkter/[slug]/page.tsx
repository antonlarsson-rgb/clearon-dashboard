import Link from "next/link";
import { notFound } from "next/navigation";
import { products, getProduct } from "@/lib/products";
import {
  getContacts,
  getContactsForProduct,
  getProductChannelBreakdown,
  getProductLandingStats,
} from "@/lib/dashboard-data";
import {
  getLandingAnalyticsForProduct,
  getLandingPageAnalytics,
  mergeLandingStats,
} from "@/lib/web-analytics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/score-badge";
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
  Target,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const iconMap: Record<string, React.ElementType> = {
  ticket: Ticket,
  "heart-handshake": HeartHandshake,
  "gamepad-2": Gamepad2,
  megaphone: Megaphone,
  gift: Gift,
  "arrow-left-right": ArrowLeftRight,
};

export default async function ProductDetailPage(
  props: PageProps<"/produkter/[slug]">
) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const [contacts, landingPageStats] = await Promise.all([
    getContacts(200),
    getLandingPageAnalytics(30),
  ]);
  const allLeads = getContactsForProduct(contacts, slug);
  const lpStat = mergeLandingStats(
    getLandingAnalyticsForProduct(landingPageStats, slug),
    getProductLandingStats(contacts, slug)
  );
  const channelBreakdown = getProductChannelBreakdown(contacts, slug);
  const Icon = iconMap[product.icon];
  const topLead = allLeads[0];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/produkter">
            <ArrowLeft className="h-3.5 w-3.5" />
            Alla produkter
          </Link>
        </Button>
      </div>

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <th className="pb-2 pr-4 text-right">Score</th>
                    <th className="pb-2 text-center">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-border/50 last:border-0 ${lead.contactNow ? "bg-amber-50/30" : ""}`}
                    >
                      <td className="py-2.5 pr-4">
                        <Link href={`/leads/${lead.id}`} className="font-medium hover:text-accent transition-colors">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {lead.company}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {lead.title || "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary text-xs">
                        {lead.sourceChannel}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <ScoreBadge score={lead.score} size="sm" />
                      </td>
                      <td className="py-2.5 text-center">
                        {lead.contactNow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <Zap className="h-2.5 w-2.5" />
                            Kontakta nu
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
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

      <Card>
        <CardHeader>
          <CardTitle>Kanalfordelning</CardTitle>
        </CardHeader>
        <CardContent>
          {channelBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                    <th className="pb-2 pr-4">Kanal</th>
                    <th className="pb-2 pr-4 text-right">Leads</th>
                    <th className="pb-2 pr-4 text-right">Heta</th>
                    <th className="pb-2 text-right">Att kontakta nu</th>
                  </tr>
                </thead>
                <tbody>
                  {channelBreakdown.map((row) => (
                    <tr
                      key={row.channel}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2.5 pr-4">{row.channel}</td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {row.leads}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {row.hot}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">
                        {row.contactNow}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Ingen kanaldata for denna produkt
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent-subtle/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <CardTitle className="text-accent">AI-rekommendation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {topLead
              ? `${topLead.name} på ${topLead.company} är den starkaste leaden just nu med score ${topLead.score}. ${topLead.contactNow ? `Prioritera uppföljning: ${topLead.contactNowReason}.` : "Bevaka fler signaler innan aktiv uppföljning."}`
              : "Ingen specifik rekommendation tillganglig for denna produkt just nu."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
