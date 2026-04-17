"use client";

import { Card } from "@/components/ui/card";
import { channelFlows, landingPageStats } from "@/lib/mock-data";
import { products } from "@/lib/products";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export function ChannelFlow() {
  const totalVisitors = channelFlows.reduce((s, f) => s + f.visitors, 0);
  const totalLeads = channelFlows.reduce((s, f) => s + f.leads, 0);
  const totalQualified = channelFlows.reduce((s, f) => s + f.qualified, 0);
  const totalDeals = channelFlows.reduce((s, f) => s + f.deals, 0);

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <span className="section-prefix">/ KANALFLODE</span>
        <Link href="/kanaler" className="text-xs text-text-secondary hover:text-accent transition-colors">
          Visa alla kanaler &rarr;
        </Link>
      </div>

      {/* Funnel overview */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Besokare</p>
            <p className="font-display text-2xl">{formatNumber(totalVisitors)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Leads</p>
            <p className="font-display text-2xl">{totalLeads}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Kvalificerade</p>
            <p className="font-display text-2xl">{totalQualified}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Deals</p>
            <p className="font-display text-2xl text-accent">{totalDeals}</p>
          </div>
        </div>

        {/* Channel breakdown bars */}
        <div className="mt-5 pt-4 border-t border-border space-y-2">
          {channelFlows.map((flow) => {
            const barWidth = (flow.leads / totalLeads) * 100;
            return (
              <div key={flow.channel} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-24 shrink-0">{flow.channel}</span>
                <div className="flex-1 h-5 bg-surface-elevated rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-accent/20 rounded-full flex items-center"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-[10px] font-mono text-accent pl-2 whitespace-nowrap">
                      {flow.leads} leads
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-text-muted w-16 text-right shrink-0">
                  {flow.deals} deals
                </span>
              </div>
            );
          })}
        </div>

        {/* Top landing pages */}
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Top landningssidor</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {landingPageStats
              .sort((a, b) => b.leads - a.leads)
              .slice(0, 3)
              .map((lp) => {
                const product = products.find((p) => p.slug === lp.product_slug);
                return (
                  <div key={lp.path} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: product?.color ?? "#6B7280" }} />
                    <span className="text-text-secondary">{product?.name}</span>
                    <span className="font-mono text-text-muted">{lp.leads} leads</span>
                    <span className="font-mono text-text-muted">{lp.conversion_rate.toString().replace(".", ",")}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Card>
  );
}
