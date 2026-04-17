"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import { getHotLeads } from "@/lib/mock-data";
import { getProduct } from "@/lib/products";
import { Phone, Mail, Zap } from "lucide-react";
import Link from "next/link";

export function HotLeads() {
  const hotLeads = getHotLeads(5);

  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <span className="section-prefix">/ HETA LEADS JUST NU</span>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>{hotLeads.filter((l) => l.contactNow.should).length} ska kontaktas idag</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {hotLeads.map((lead) => {
          const product = lead.topProduct
            ? getProduct(lead.topProduct.product_slug)
            : null;

          return (
            <Link
              key={lead.contact_id}
              href={`/leads/${lead.contact_id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-surface-elevated transition-colors group"
            >
              <ScoreBadge score={lead.total_score} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {lead.contact?.name}
                  </span>
                  {lead.contactNow.should && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      Kontakta nu
                    </Badge>
                  )}
                  <span className="text-xs text-text-muted truncate">
                    {lead.contact?.title}, {lead.contact?.account_name}
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
                  {lead.contactNow.should ? (
                    <span className="text-xs text-amber-600 font-medium">
                      {lead.contactNow.reason}
                    </span>
                  ) : lead.signals[0] ? (
                    <span className="text-xs text-text-muted">
                      {lead.signals[0].description}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Phone className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
