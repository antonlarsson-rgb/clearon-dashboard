"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Sparkles, Users, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface GraphKpis {
  hot_accounts: number;
  qualified_accounts: number;
  active_persons_7d: number;
  new_opps_24h: number;
  open_opp_count: number;
  open_opp_value: number;
  win_rate_pct: number;
}

function formatKr(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MSEK`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value} kr`;
}

export function KpiCardsGraph() {
  const [kpis, setKpis] = useState<GraphKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/kpis");
        const data = await res.json();
        if (!cancelled) setKpis(data);
      } catch {
        if (!cancelled) setKpis(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <div className="h-4 bg-surface-elevated rounded w-1/2 animate-pulse mb-3" />
            <div className="h-8 bg-surface-elevated rounded w-1/3 animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 hover:border-text-muted/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <span className="section-prefix">/ HETA FÖRETAG</span>
          <Flame className="h-4 w-4 text-[#ff6b35]" />
        </div>
        <div className="font-display text-4xl text-text-primary mb-1">
          {formatNumber(kpis.hot_accounts)}
        </div>
        <div className="text-xs text-text-muted">
          varav <strong className="text-text-secondary">{kpis.qualified_accounts}</strong> AI-qualified
        </div>
      </Card>

      <Card className="p-5 hover:border-text-muted/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <span className="section-prefix">/ AKTIVA PERSONER</span>
          <Users className="h-4 w-4 text-text-muted" />
        </div>
        <div className="font-display text-4xl text-text-primary mb-1">
          {formatNumber(kpis.active_persons_7d)}
        </div>
        <div className="text-xs text-text-muted">senaste 7 dagarna</div>
      </Card>

      <Card className="p-5 hover:border-text-muted/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <span className="section-prefix">/ OPEN PIPELINE</span>
          <TrendingUp className="h-4 w-4 text-text-muted" />
        </div>
        <div className="font-display text-4xl text-text-primary mb-1">
          {formatKr(kpis.open_opp_value)}
        </div>
        <div className="text-xs text-text-muted">
          {kpis.open_opp_count} öppna opps · {kpis.win_rate_pct}% win rate
        </div>
      </Card>

      <Card className="p-5 hover:border-text-muted/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <span className="section-prefix">/ RÖRELSE 24H</span>
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="font-display text-4xl text-text-primary mb-1">
          {formatNumber(kpis.new_opps_24h)}
        </div>
        <div className="text-xs text-text-muted">
          nya / förflyttade opportunities senaste dygnet
        </div>
      </Card>
    </div>
  );
}
