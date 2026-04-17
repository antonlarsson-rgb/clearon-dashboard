"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { activityFeed } from "@/lib/mock-data";
import {
  Download,
  Eye,
  MousePointerClick,
  Mail,
  FolderKanban,
  UserPlus,
} from "lucide-react";

const typeIcons: Record<string, typeof Download> = {
  download: Download,
  page_view: Eye,
  ad_click: MousePointerClick,
  email: Mail,
  task: FolderKanban,
  crm: UserPlus,
};

const typeColors: Record<string, string> = {
  download: "text-accent",
  page_view: "text-accent-light",
  ad_click: "text-[#7B68EE]",
  email: "text-[#4A90A4]",
  task: "text-[#E07A5F]",
  crm: "text-text-muted",
};

export function LiveFeed() {
  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="section-prefix">/ LIVE</span>
          <span className="text-sm text-text-secondary">Pagaende just nu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span className="text-[11px] text-accent font-medium">Live</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {activityFeed.map((activity) => {
          const Icon = typeIcons[activity.type] || Eye;
          const iconColor = typeColors[activity.type] || "text-text-muted";
          const time = new Date(activity.timestamp).toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={activity.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-surface-elevated transition-colors group"
            >
              <span className="font-mono text-[11px] text-text-muted w-10 shrink-0">
                {time}
              </span>
              <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-text-primary">
                  {activity.contact_name && (
                    <span className="font-medium">{activity.contact_name}</span>
                  )}
                  {activity.contact_name && activity.company && (
                    <span className="text-text-muted"> ({activity.company}) </span>
                  )}
                  {!activity.contact_name && activity.company && (
                    <span className="font-medium">{activity.company}: </span>
                  )}
                  {activity.description}
                </span>
                {activity.score_change && (
                  <span className="ml-2 text-xs text-accent font-medium">
                    [Score: {activity.score_change}]
                  </span>
                )}
              </div>
              {activity.cta && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  {activity.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
