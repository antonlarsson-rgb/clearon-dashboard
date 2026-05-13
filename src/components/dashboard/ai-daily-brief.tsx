"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";

interface BriefData {
  brief: string;
  generated_at: string;
  context_summary: {
    top_person: string | null;
    top_account: string | null;
    qualified_count: number;
    rising_count: number;
    new_opps_24h: number;
  };
}

export function AiDailyBrief() {
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/daily-brief", { cache: "no-store" });
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
      const res = await fetch("/api/daily-brief", { method: "POST", cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setRegenerating(false);
    }
  }

  // Datumet visas baserat på brief.generated_at (server-tid) snarare än
  // klienturet — undviker hydration-mismatch och eliminerar render-purity-
  // problem med Date.now() i komponent-body.
  const generatedDate = data?.generated_at ? new Date(data.generated_at) : null;
  const today = generatedDate
    ? generatedDate
        .toLocaleDateString("sv-SE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toUpperCase()
    : "";
  const ctx = data?.context_summary;
  const generatedAt = generatedDate
    ? generatedDate.toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="p-8 relative overflow-hidden">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="section-prefix">{today} / DAILY BRIEF</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
              <Sparkles className="h-2.5 w-2.5" />
              Claude
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-6 bg-surface-elevated rounded-md w-3/4 animate-pulse" />
              <div className="h-4 bg-surface-elevated rounded-md w-full animate-pulse" />
              <div className="h-4 bg-surface-elevated rounded-md w-5/6 animate-pulse" />
            </div>
          ) : data ? (
            <>
              <p className="text-base text-text-primary leading-relaxed whitespace-pre-wrap font-body">
                {data.brief}
              </p>
              {ctx && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
                  {ctx.qualified_count > 0 && (
                    <span>
                      <strong className="text-text-secondary">{ctx.qualified_count}</strong> qualified
                    </span>
                  )}
                  {ctx.rising_count > 0 && (
                    <span>
                      <strong className="text-[#8bb347]">{ctx.rising_count}</strong> stigande
                    </span>
                  )}
                  {ctx.new_opps_24h > 0 && (
                    <span>
                      <strong className="text-text-secondary">{ctx.new_opps_24h}</strong> nya/rörda opps 24h
                    </span>
                  )}
                  {generatedAt && (
                    <span className="ml-auto font-mono">Genererad {generatedAt}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-text-muted">
              Kunde inte ladda briefen. Kontrollera att ANTHROPIC_API_KEY är satt.
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
    </Card>
  );
}
