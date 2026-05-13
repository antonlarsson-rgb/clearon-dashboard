import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import {
  getContacts,
  getContactsForProduct,
  getProductChannelBreakdown,
} from "@/lib/dashboard-data";
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
  ExternalLink,
  Zap,
} from "lucide-react";

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

  const contacts = await getContacts(200);
  const allLeads = getContactsForProduct(contacts, slug);
  const channelBreakdown = getProductChannelBreakdown(contacts, slug);
  const Icon = iconMap[product.icon];

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
          <a
            href={product.landingPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-accent hover:underline"
          >
            {product.landingPageUrl}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

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

    </div>
  );
}
