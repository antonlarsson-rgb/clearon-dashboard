"use client";

import { Card } from "@/components/ui/card";
import { kpis } from "@/lib/mock-data";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import { Users, Flame, TrendingUp, Target } from "lucide-react";

const kpiConfig = [
  {
    key: "activeLeads" as const,
    label: "AKTIVA LEADS",
    icon: Users,
    format: (v: number) => formatNumber(v),
    suffix: "",
    link: "Se alla leads",
  },
  {
    key: "hotLeads" as const,
    label: "LEADS SCORE >70",
    icon: Flame,
    format: (v: number) => formatNumber(v),
    suffix: "",
    link: "Se heta leads",
  },
  {
    key: "pipelineValue" as const,
    label: "PIPELINE-VARDE",
    icon: TrendingUp,
    format: (v: number) => formatCurrency(v),
    suffix: "",
    link: "Se pipeline",
  },
  {
    key: "conversionRate" as const,
    label: "KONVERTERING",
    icon: Target,
    format: (v: number) => formatPercent(v),
    suffix: "",
    link: "Se detaljer",
  },
];

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map(({ key, label, icon: Icon, format, link }) => {
        const data = kpis[key];
        const isPositive = data.change > 0;

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
              <span className={`text-xs font-medium ${isPositive ? "text-success" : "text-danger"}`}>
                {isPositive ? "+" : ""}{key === "conversionRate" ? `${data.change}pp` : data.change}
              </span>
              <span className="text-xs text-text-muted">{data.period}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-text-secondary hover:text-accent transition-colors">
                {link} &rarr;
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
