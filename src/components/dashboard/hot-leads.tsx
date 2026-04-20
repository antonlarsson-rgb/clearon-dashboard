"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import type { DashboardContact } from "@/lib/dashboard-data";
import { products } from "@/lib/products";
import { Phone, Mail, Zap } from "lucide-react";

interface HotLeadsProps {
  leads: DashboardContact[];
}

export function HotLeads({ leads }: HotLeadsProps) {
  const contactNowCount = leads.filter((l) => l.contactNow).length;

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <span className="section-prefix">/ HETA LEADS JUST NU</span>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>{contactNowCount} ska kontaktas idag</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {leads.map((lead) => {
          const product = lead.topProduct
            ? products.find((p) => p.slug === lead.topProduct)
            : null;

          return (
            <div
              key={lead.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-surface-elevated transition-colors group"
            >
              <ScoreBadge score={Math.min(lead.score, 100)} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {lead.name}
                  </span>
                  {lead.contactNow && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      Kontakta nu
                    </Badge>
                  )}
                  <span className="text-xs text-text-muted truncate">
                    {lead.title ? `${lead.title}, ` : ""}{lead.company}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {product && (
                    <span className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: product.color }}
                      />
                      <span className="text-xs text-text-secondary">
                        {product.name}
                      </span>
                    </span>
                  )}
                  {lead.contactNow ? (
                    <span className="text-xs text-amber-600 font-medium">
                      {lead.contactNowReason}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">
                      Score: {lead.score} | {lead.sourceChannel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {lead.phone && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                  </Button>
                )}
                {lead.email && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" /></a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
