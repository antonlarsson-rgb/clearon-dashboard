"use client";

import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { cn, scoreColor } from "@/lib/utils";
import type { LeadScore } from "@/lib/mock-data";

interface ScoreBreakdownProps {
  score: LeadScore;
}

function ProgressBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary font-body">{label}</span>
        <span className={cn("text-sm font-display", colorClass)}>{value}</span>
      </div>
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-score-high": colorClass.includes("high"),
            "bg-score-medium": colorClass.includes("medium"),
            "bg-score-low": colorClass.includes("low"),
            "bg-accent": !colorClass.includes("high") && !colorClass.includes("medium") && !colorClass.includes("low"),
          })}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const subMax = 40;

  return (
    <Card>
      <div className="p-5 border-b border-border">
        <span className="section-prefix">/ SCORE</span>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-4">
          <ScoreBadge score={score.total_score} size="lg" />
          <div>
            <div className="text-sm text-text-secondary">Totalpoang</div>
            <div className="text-xs text-text-muted">
              Engagement + Fit + Intent
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <ProgressBar
            label="Engagement"
            value={score.engagement_score}
            max={subMax}
            colorClass={`text-${scoreColor(score.engagement_score * 2.5)}`}
          />
          <ProgressBar
            label="Fit"
            value={score.fit_score}
            max={subMax}
            colorClass={`text-${scoreColor(score.fit_score * 2.5)}`}
          />
          <ProgressBar
            label="Intent"
            value={score.intent_score}
            max={subMax}
            colorClass={`text-${scoreColor(score.intent_score * 2.5)}`}
          />
        </div>
      </div>
    </Card>
  );
}
