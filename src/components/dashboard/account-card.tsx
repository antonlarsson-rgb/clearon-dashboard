"use client";

import Link from "next/link";
import { Flame, TrendingUp, Users, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const productLabels: Record<string, string> = {
  "sales-promotion": "Sales Promotion",
  "customer-care": "Customer Care",
  "interactive-engage": "Interactive Engage",
  kampanja: "Kampanja",
  "send-a-gift": "Send a Gift",
  "clearing-solutions": "Clearing Solutions",
  kuponger: "Kuponger",
  "mobila-presentkort": "Mobila Presentkort",
};

const segmentColors: Record<string, string> = {
  hot: "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30",
  warm: "bg-[#c8e66b]/15 text-[#8bb347] border-[#c8e66b]/30",
  curious: "bg-[#4a9df0]/10 text-[#4a9df0] border-[#4a9df0]/25",
  cold: "bg-text-muted/10 text-text-muted border-text-muted/20",
};

const lifecycleColors: Record<string, string> = {
  customer: "bg-[#416125]/15 text-[#8bb347]",
  at_risk: "bg-[#e8864c]/15 text-[#e8864c]",
  dormant: "bg-text-muted/10 text-text-muted",
  churned: "bg-red-500/10 text-red-400",
  prospect: "bg-[#4a9df0]/10 text-[#4a9df0]",
};

export interface AccountCardData {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  segment?: string;
  lifecycle_stage?: string;
  is_customer?: boolean;
  score?: number;
  intent_score?: number;
  engagement_score?: number;
  demo_readiness?: number;
  top_product_slug?: string | null;
  top_product_score?: number;
  identified_persons_count?: number;
  total_events?: number;
  last_event_at?: string | null;
}

export function AccountCard({ account }: { account: AccountCardData }) {
  const timeAgo = account.last_event_at
    ? formatTimeAgo(new Date(account.last_event_at))
    : "—";
  const topProduct = account.top_product_slug
    ? productLabels[account.top_product_slug] || account.top_product_slug
    : null;

  const isHot = account.segment === "hot";

  return (
    <Link
      href={`/accounts/${account.id}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border bg-surface p-4 transition-all hover:border-accent/50 hover:bg-surface-elevated",
        isHot ? "border-[#ff6b35]/40" : "border-border"
      )}
    >
      {isHot && (
        <div className="absolute -top-2 -right-2">
          <div className="flex h-6 items-center gap-1 rounded-full bg-[#ff6b35] px-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
            <Flame className="h-3 w-3" />
            Hot
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text-primary truncate">{account.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
            {account.industry && <span className="truncate">{account.industry}</span>}
            {account.website && (
              <a
                href={account.website.startsWith("http") ? account.website : `https://${account.website}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 hover:text-text-primary"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-2xl font-bold tabular-nums text-text-primary">
            {account.score || 0}
          </div>
          <div className="text-[9px] uppercase tracking-wide text-text-muted">score</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {account.segment && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              segmentColors[account.segment] || segmentColors.cold
            )}
          >
            {account.segment}
          </span>
        )}
        {account.lifecycle_stage && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              lifecycleColors[account.lifecycle_stage] || lifecycleColors.prospect
            )}
          >
            {account.lifecycle_stage === "at_risk" ? "at risk" : account.lifecycle_stage}
          </span>
        )}
        {topProduct && (
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-text-secondary">
            {topProduct}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-border/50 pt-3">
        <Metric label="Intent" value={account.intent_score || 0} icon={TrendingUp} />
        <Metric label="Demo" value={account.demo_readiness || 0} suffix="%" />
        <Metric label="Personer" value={account.identified_persons_count || 0} icon={Users} />
        <Metric label="Events" value={account.total_events || 0} />
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </span>
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  suffix = "",
  icon: Icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-text-muted">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-text-primary">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function formatTimeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m sen`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sen`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d sen`;
  const months = Math.floor(days / 30);
  return `${months}mån sen`;
}
