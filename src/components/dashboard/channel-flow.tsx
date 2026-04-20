"use client";

import { Card } from "@/components/ui/card";
import type { DashboardContact } from "@/lib/dashboard-data";
import { formatNumber } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ChannelFlowProps {
  contacts: DashboardContact[];
}

export function ChannelFlow({ contacts }: ChannelFlowProps) {
  // Aggregate by source channel
  const byChannel: Record<string, { total: number; hot: number; contactNow: number }> = {};
  for (const c of contacts) {
    const ch = c.sourceChannel || "Okand";
    if (!byChannel[ch]) byChannel[ch] = { total: 0, hot: 0, contactNow: 0 };
    byChannel[ch].total++;
    if (c.status === "hot") byChannel[ch].hot++;
    if (c.contactNow) byChannel[ch].contactNow++;
  }

  const channels = Object.entries(byChannel)
    .sort((a, b) => b[1].total - a[1].total);

  // Aggregate by status
  const totalLeads = contacts.length;
  const hotLeads = contacts.filter((c) => c.status === "hot").length;
  const warmLeads = contacts.filter((c) => c.status === "warm").length;
  const contactNow = contacts.filter((c) => c.contactNow).length;

  // By product
  const byProduct: Record<string, number> = {};
  for (const c of contacts) {
    if (c.topProduct) byProduct[c.topProduct] = (byProduct[c.topProduct] || 0) + 1;
  }

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <span className="section-prefix">/ LEAD-OVERSIKT</span>
        <Link href="/leads" className="text-xs text-text-secondary hover:text-accent transition-colors">
          Visa alla leads &rarr;
        </Link>
      </div>

      <div className="p-5">
        {/* Funnel overview */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Totalt</p>
            <p className="font-display text-2xl">{formatNumber(totalLeads)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Varma</p>
            <p className="font-display text-2xl">{warmLeads}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Heta</p>
            <p className="font-display text-2xl">{hotLeads}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Kontakta nu</p>
            <p className="font-display text-2xl text-accent">{contactNow}</p>
          </div>
        </div>

        {/* Channel breakdown bars */}
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Per kalla</p>
          {channels.map(([channel, data]) => {
            const barWidth = totalLeads > 0 ? (data.total / totalLeads) * 100 : 0;
            return (
              <div key={channel} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-28 shrink-0 truncate">{channel}</span>
                <div className="flex-1 h-5 bg-surface-elevated rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-accent/20 rounded-full flex items-center"
                    style={{ width: `${Math.max(barWidth, 5)}%` }}
                  >
                    <span className="text-[10px] font-mono text-accent pl-2 whitespace-nowrap">
                      {data.total}
                    </span>
                  </div>
                </div>
                {data.hot > 0 && (
                  <span className="text-xs font-mono text-text-muted w-16 text-right shrink-0">
                    {data.hot} heta
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Product distribution */}
        {Object.keys(byProduct).length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Per produktintresse</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byProduct)
                .sort((a, b) => b[1] - a[1])
                .map(([slug, count]) => (
                  <span key={slug} className="text-xs bg-surface-elevated rounded-full px-3 py-1 text-text-secondary">
                    {slug} <span className="font-mono text-text-muted">{count}</span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
