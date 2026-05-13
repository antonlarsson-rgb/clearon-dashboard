"use client";

import { Card } from "@/components/ui/card";
import type { DashboardContact } from "@/lib/dashboard-data";
import Link from "next/link";

interface ChannelFlowProps {
  contacts: DashboardContact[];
}

/**
 * Visar fördelning av Upsales-kontakter per källa och per produkt. Detta är
 * Upsales CRM-källor (Glass-kampanj, MG, formulär, etc) — distinkt från
 * web-funnel som visas på /kanaler. Heta-/varma-/kontakta nu-funneln har
 * tagits bort eftersom samma data redan visas i KPI-korten överst med en
 * annan definition (person-graf + AI-segment).
 */
export function ChannelFlow({ contacts }: ChannelFlowProps) {
  const byChannel: Record<string, { total: number; hasForm: number }> = {};
  for (const c of contacts) {
    const ch = c.sourceChannel || "Okand";
    if (!byChannel[ch]) byChannel[ch] = { total: 0, hasForm: 0 };
    byChannel[ch].total++;
    if (c.hasForm) byChannel[ch].hasForm++;
  }

  const channels = Object.entries(byChannel).sort((a, b) => b[1].total - a[1].total);
  const totalLeads = contacts.length;

  const byProduct: Record<string, number> = {};
  for (const c of contacts) {
    if (c.topProduct) byProduct[c.topProduct] = (byProduct[c.topProduct] || 0) + 1;
  }

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <span className="section-prefix">/ UPSALES-KÄLLOR</span>
          <p className="text-[11px] text-text-muted mt-1">
            Fördelning av {totalLeads} Upsales-kontakter per källa.
          </p>
        </div>
        <Link
          href="/persons"
          className="text-xs text-text-secondary hover:text-accent transition-colors"
        >
          Visa alla leads &rarr;
        </Link>
      </div>

      <div className="p-5">
        <div className="space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Per källa</p>
          {channels.map(([channel, data]) => {
            const barWidth = totalLeads > 0 ? (data.total / totalLeads) * 100 : 0;
            return (
              <div key={channel} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-32 shrink-0 truncate">
                  {channel}
                </span>
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
                {data.hasForm > 0 && (
                  <span className="text-xs font-mono text-text-muted w-20 text-right shrink-0">
                    {data.hasForm} formulär
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(byProduct).length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Per produktintresse
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byProduct)
                .sort((a, b) => b[1] - a[1])
                .map(([slug, count]) => (
                  <span
                    key={slug}
                    className="text-xs bg-surface-elevated rounded-full px-3 py-1 text-text-secondary"
                  >
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
