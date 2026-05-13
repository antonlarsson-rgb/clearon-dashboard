"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";

interface WeeklyData {
  brief: string;
  generated_at: string;
  week_start: string;
  context_summary: {
    closed_tasks: number;
    in_progress_tasks: number;
    new_leads: number;
    new_opps: number;
    won_opps: number;
    total_event_count: number;
  };
}

export function WeeklySummary() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/weekly-stellar", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function regen() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/weekly-stellar", {
        method: "POST",
        cache: "no-store",
      });
      const json = await res.json();
      setData(json);
    } finally {
      setRegenerating(false);
    }
  }

  const ctx = data?.context_summary;
  const generatedDate = data?.generated_at ? new Date(data.generated_at) : null;
  const generatedAt = generatedDate
    ? generatedDate.toLocaleString("sv-SE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>
              <span className="section-prefix">/ STELLAR UPDATE</span>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
                <Sparkles className="h-2.5 w-2.5" />
                Claude
              </span>
            </CardTitle>
            {data?.week_start && (
              <p className="mt-1 text-xs text-text-muted">
                Vecka från {data.week_start}
              </p>
            )}
          </div>
          <button
            onClick={regen}
            disabled={regenerating}
            className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Skriver..." : "Uppdatera"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-surface-elevated rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-surface-elevated rounded w-full animate-pulse" />
            <div className="h-4 bg-surface-elevated rounded w-5/6 animate-pulse" />
          </div>
        ) : data ? (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
              {data.brief}
            </p>
            {ctx && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-text-muted border-t border-border pt-3">
                {ctx.closed_tasks > 0 && (
                  <span>
                    <strong className="text-text-secondary">{ctx.closed_tasks}</strong> closed tasks
                  </span>
                )}
                {ctx.in_progress_tasks > 0 && (
                  <span>
                    <strong className="text-text-secondary">{ctx.in_progress_tasks}</strong> in progress
                  </span>
                )}
                {ctx.new_leads > 0 && (
                  <span>
                    <strong className="text-text-secondary">{ctx.new_leads}</strong> nya leads
                  </span>
                )}
                {ctx.new_opps > 0 && (
                  <span>
                    <strong className="text-text-secondary">{ctx.new_opps}</strong> nya opps
                  </span>
                )}
                {ctx.won_opps > 0 && (
                  <span>
                    <strong className="text-[#8bb347]">{ctx.won_opps}</strong> won
                  </span>
                )}
                <span>
                  <strong className="text-text-secondary">{ctx.total_event_count}</strong> events
                </span>
                {generatedAt && (
                  <span className="ml-auto font-mono">Genererad {generatedAt}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-muted">Kunde inte ladda veckosammanfattningen.</p>
        )}
      </CardContent>
    </Card>
  );
}
