"use client";

import { Card } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboard-data";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { Users, Flame, TrendingUp, Target } from "lucide-react";

interface KpiCardsProps {
  kpis: DashboardKpis;
}

const kpiConfig = [
  {
    key: "activeLeads" as const,
    label: "AKTIVA LEADS",
    icon: Users,
    format: (v: number) => formatNumber(v),
  },
  {
    key: "hotLeads" as const,
    label: "HETA LEADS",
    icon: Flame,
    format: (v: number) => formatNumber(v),
  },
  {
    key: "pipelineValue" as const,
    label: "PIPELINE-VARDE",
    icon: TrendingUp,
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "conversionRate" as const,
    label: "KONVERTERING",
    icon: Target,
    format: (v: number) => formatPercent(v),
  },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map(({ key, label, icon: Icon, format }) => {
        const data = kpis[key];

        return (
          <Card key={key} className="p-5 hover:border-text-muted/30 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="section-prefix">{`/ ${label}`}</span>
              <Icon className="h-4 w-4 text-text-muted" />
            </div>
            <div className="font-display text-4xl text-text-primary mb-1">
              {format(data.value)}
            </div>
            <div className="flex items-center gap-2">
              {data.change > 0 && (
                <span className="text-xs font-medium text-success">
                  {data.change}
                </span>
              )}
              <span className="text-xs text-text-muted">{data.period}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
