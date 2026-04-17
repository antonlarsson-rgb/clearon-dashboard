"use client";

import { useState, useMemo } from "react";
import { adCampaigns } from "@/lib/mock-data";
import { products } from "@/lib/products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatNumber,
  formatCurrency,
} from "@/lib/utils";
import {
  DollarSign,
  Users,
  Target,
  Trophy,
} from "lucide-react";

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

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  paused: "Pausad",
  completed: "Avslutad",
};

const statusColors: Record<string, string> = {
  active: "bg-accent-subtle text-accent",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-gray-100 text-text-secondary",
};

function getProductName(slug: string) {
  return products.find((p) => p.slug === slug)?.name ?? slug;
}

export default function KampanjerPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return adCampaigns.filter((c) => {
      if (platformFilter !== "all" && c.platform !== platformFilter)
        return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (productFilter !== "all" && c.product_slug !== productFilter)
        return false;
      return true;
    });
  }, [platformFilter, statusFilter, productFilter]);

  const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
  const totalLeads = filtered.reduce((s, c) => s + c.leads_generated, 0);
  const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const bestCampaign = [...filtered].sort((a, b) => {
    const roasA = a.spend > 0 ? a.conversions / a.spend : 0;
    const roasB = b.spend > 0 ? b.conversions / b.spend : 0;
    return roasB - roasA;
  })[0];

  const uniquePlatforms = [...new Set(adCampaigns.map((c) => c.platform))];
  const uniqueStatuses = [...new Set(adCampaigns.map((c) => c.status))];
  const uniqueProducts = [...new Set(adCampaigns.map((c) => c.product_slug))];

  return (
    <div className="space-y-6">
      <div>
        <span className="section-prefix">/ Kampanjer</span>
        <h1 className="font-display text-2xl mt-1">Annonskampanjer</h1>
        <p className="text-text-secondary text-sm mt-1">
          Oversikt av alla aktiva och avslutade kampanjer
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle">
                <DollarSign className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  Total spend
                </p>
                <p className="font-display text-xl">
                  {formatCurrency(totalSpend)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  Totala leads
                </p>
                <p className="font-display text-xl">
                  {formatNumber(totalLeads)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  Snitt CPL
                </p>
                <p className="font-display text-xl">
                  {formatCurrency(avgCPL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle">
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  Bast presterande
                </p>
                <p className="font-display text-sm truncate max-w-[180px]">
                  {bestCampaign?.campaign_name ?? "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Plattform:</span>
          <div className="flex gap-1">
            <Button
              variant={platformFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("all")}
            >
              Alla
            </Button>
            {uniquePlatforms.map((p) => (
              <Button
                key={p}
                variant={platformFilter === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPlatformFilter(p)}
              >
                {platformLabels[p]}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Status:</span>
          <div className="flex gap-1">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Alla
            </Button>
            {uniqueStatuses.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {statusLabels[s]}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Produkt:</span>
          <div className="flex gap-1">
            <Button
              variant={productFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setProductFilter("all")}
            >
              Alla
            </Button>
            {uniqueProducts.map((slug) => (
              <Button
                key={slug}
                variant={productFilter === slug ? "default" : "outline"}
                size="sm"
                onClick={() => setProductFilter(slug)}
              >
                {getProductName(slug)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign table */}
      <Card>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="pb-2 pr-4">Namn</th>
                  <th className="pb-2 pr-4">Plattform</th>
                  <th className="pb-2 pr-4">Produkt</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4 text-right">Budget</th>
                  <th className="pb-2 pr-4 text-right">Spend</th>
                  <th className="pb-2 pr-4 text-right">Leads</th>
                  <th className="pb-2 pr-4 text-right">CPL</th>
                  <th className="pb-2 pr-4 text-right">Konv.</th>
                  <th className="pb-2 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((campaign) => {
                  const cpl =
                    campaign.leads_generated > 0
                      ? Math.round(
                          campaign.spend / campaign.leads_generated
                        )
                      : 0;
                  // Estimate ROAS: assume avg deal value 25 000 kr per conversion
                  const estimatedRevenue = campaign.conversions * 25000;
                  const roas =
                    campaign.spend > 0
                      ? (estimatedRevenue / campaign.spend).toFixed(1)
                      : "0,0";

                  return (
                    <tr
                      key={campaign.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium">
                        {campaign.campaign_name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge className={platformColors[campaign.platform]}>
                          {platformLabels[campaign.platform]}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {getProductName(campaign.product_slug)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge className={statusColors[campaign.status]}>
                          {statusLabels[campaign.status]}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {formatCurrency(campaign.budget)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {campaign.leads_generated}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {cpl > 0 ? formatCurrency(cpl) : "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs">
                        {campaign.conversions}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">
                        {roas.replace(".", ",")}x
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-text-muted"
                    >
                      Inga kampanjer matchar filtret
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
