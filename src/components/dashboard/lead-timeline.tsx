"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import type { Signal } from "@/lib/mock-data";
import {
  Eye,
  Download,
  Mail,
  MousePointerClick,
  Search,
  MailOpen,
} from "lucide-react";

interface LeadTimelineProps {
  signals: Signal[];
}

function getSignalIcon(type: string) {
  switch (type) {
    case "page_view":
      return <Eye className="h-3.5 w-3.5" />;
    case "download":
      return <Download className="h-3.5 w-3.5" />;
    case "email_click":
      return <MousePointerClick className="h-3.5 w-3.5" />;
    case "email_open":
      return <MailOpen className="h-3.5 w-3.5" />;
    case "ad_click":
      return <MousePointerClick className="h-3.5 w-3.5" />;
    case "search":
      return <Search className="h-3.5 w-3.5" />;
    default:
      return <Mail className="h-3.5 w-3.5" />;
  }
}

function getSignalLabel(type: string) {
  switch (type) {
    case "page_view":
      return "Webbbesok";
    case "download":
      return "Nedladdning";
    case "email_click":
      return "E-postklick";
    case "email_open":
      return "E-post oppnad";
    case "ad_click":
      return "Annonsklick";
    case "search":
      return "Sokmotor";
    default:
      return type;
  }
}

export function LeadTimeline({ signals }: LeadTimelineProps) {
  const sorted = [...signals].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <div className="p-5 border-b border-border">
          <span className="section-prefix">/ TIDSLINJE</span>
        </div>
        <div className="p-5 text-sm text-text-muted">
          Ingen registrerad aktivitet.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-5 border-b border-border">
        <span className="section-prefix">/ TIDSLINJE</span>
      </div>
      <div className="p-5">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {sorted.map((signal, i) => (
              <div key={i} className="relative flex gap-4 pl-9">
                <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-surface border-2 border-border z-10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-text-muted">
                      {getSignalIcon(signal.type)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {getSignalLabel(signal.type)}
                    </Badge>
                    <span className="text-xs text-text-muted font-mono">
                      +{signal.value} poang
                    </span>
                  </div>
                  <p className="text-sm text-text-primary mt-1">
                    {signal.description}
                  </p>
                  <span className="text-xs text-text-muted mt-0.5 block">
                    {timeAgo(signal.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
