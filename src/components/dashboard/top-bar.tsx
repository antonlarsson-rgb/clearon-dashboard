"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

interface IntegrationSummary {
  total: number;
  connected: number;
}

export function TopBar() {
  const [summary, setSummary] = useState<IntegrationSummary | null>(null);

  useEffect(() => {
    const cancelled = { current: false };
    (async () => {
      try {
        const res = await fetch("/api/integrations/status", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled.current) setSummary(json.summary || null);
      } catch {
        if (!cancelled.current) setSummary(null);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm px-6">
      <div className="text-sm text-text-muted">
        ClearOn Intelligence — riktig data från Upsales, Supabase, Adspirer, ClickUp.
      </div>

      <div className="flex items-center gap-4">
        {summary && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span
              className={`relative flex h-2 w-2 ${
                summary.connected === summary.total ? "" : "opacity-60"
              }`}
            >
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  summary.connected === summary.total
                    ? "bg-accent animate-ping"
                    : "bg-warning"
                } opacity-50`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  summary.connected === summary.total ? "bg-accent" : "bg-warning"
                }`}
              />
            </span>
            <span>
              {summary.connected}/{summary.total} integrationer
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated">
            <ShieldCheck className="h-4 w-4 text-text-secondary" />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-text-primary">Admin</div>
            <div className="text-[11px] text-text-muted">basic auth</div>
          </div>
        </div>
      </div>
    </header>
  );
}
