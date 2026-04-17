import Link from "next/link";
import { products } from "@/lib/products";
import { productScores, contacts, leadScores, landingPageStats, shouldContactNow } from "@/lib/mock-data";
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
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Zap,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  ticket: Ticket,
  "heart-handshake": HeartHandshake,
  "gamepad-2": Gamepad2,
  megaphone: Megaphone,
  gift: Gift,
  "arrow-left-right": ArrowLeftRight,
};

const trendData: Record<string, number> = {
  "sales-promotion": 12,
  "customer-care": 8,
  "interactive-engage": -3,
  kampanja: 22,
  "send-a-gift": 15,
  "clearing-solutions": -5,
};

function getProductLeads(slug: string) {
  const scores = productScores
    .filter((ps) => ps.product_slug === slug && ps.score > 50)
    .sort((a, b) => b.score - a.score);

  return scores.map((ps) => {
    const contact = contacts.find((c) => c.id === ps.contact_id);
    return { ...ps, contact };
  });
}

export default function ProdukterPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="section-prefix">/ Produkter</span>
        <h1 className="font-display text-2xl mt-1">Produktportfolj</h1>
        <p className="text-text-secondary text-sm mt-1">
          ClearOns sex produkter och deras lead-intresse
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {products.map((product) => {
          const Icon = iconMap[product.icon];
          const hotLeads = getProductLeads(product.slug);
          const trend = trendData[product.slug] ?? 0;
          const top3 = hotLeads.slice(0, 3);
          const lpStat = landingPageStats.find((lp) => lp.product_slug === product.slug);
          const contactNowCount = hotLeads.filter((l) => shouldContactNow(l.contact_id).should).length;

          return (
            <Card key={product.slug}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: product.color + "1A" }}
                    >
                      {Icon && (
                        <Icon
                          className="h-5 w-5"
                          style={{ color: product.color }}
                        />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {product.name}
                      </CardTitle>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {formatNumber(hotLeads.length)} leads med score &gt;50
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono">
                    {trend >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-danger" />
                    )}
                    <span
                      className={trend >= 0 ? "text-success" : "text-danger"}
                    >
                      {trend >= 0 ? "+" : ""}
                      {trend}% vs fg. manad
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Landing page stats */}
                {lpStat && (
                  <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-border">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">Besokare</p>
                      <p className="font-mono text-sm">{formatNumber(lpStat.visitors)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">Conv. rate</p>
                      <p className="font-mono text-sm">{lpStat.conversion_rate.toString().replace(".", ",")}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">Leads</p>
                      <p className="font-mono text-sm">{lpStat.leads}</p>
                    </div>
                  </div>
                )}

                {contactNowCount > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                    <Zap className="h-3 w-3" />
                    <span className="font-medium">{contactNowCount} leads att kontakta nu</span>
                  </div>
                )}

                {top3.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                      Hetaste leads
                    </p>
                    {top3.map((lead) => {
                      const cn = shouldContactNow(lead.contact_id);
                      return (
                        <div
                          key={lead.contact_id}
                          className="flex items-center justify-between"
                        >
                          <div className="min-w-0 flex items-center gap-1.5">
                            <div>
                              <p className="text-sm font-body truncate">
                                {lead.contact?.name ?? "Okand"}
                              </p>
                              <p className="text-xs text-text-secondary truncate">
                                {lead.contact?.account_name}
                              </p>
                            </div>
                            {cn.should && (
                              <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <ScoreBadge score={lead.score} size="sm" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">
                    Inga leads med score over 50
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/produkter/${product.slug}`}>
                      Visa detaljer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <a
                    href={product.landingPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                  >
                    Landningssida
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
