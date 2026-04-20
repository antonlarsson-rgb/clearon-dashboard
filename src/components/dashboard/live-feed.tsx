"use client";

import { Card } from "@/components/ui/card";
import type { DashboardActivity } from "@/lib/dashboard-data";
import { Phone, Mail, Globe, FileText, BarChart3, Users, Briefcase } from "lucide-react";

interface LiveFeedProps {
  activities: DashboardActivity[];
}

const typeIcons: Record<string, React.ElementType> = {
  Telefonsamtal: Phone,
  "E-post": Mail,
  Todo: FileText,
  Webbbesok: Globe,
  Rapport: BarChart3,
  Mote: Users,
};

export function LiveFeed({ activities }: LiveFeedProps) {
  return (
    <Card>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <span className="section-prefix">/ SENASTE AKTIVITET</span>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent pulse-live" />
          <span className="text-xs text-text-muted">Live fran Upsales</span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => {
          const Icon = typeIcons[activity.type] || Briefcase;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-5 py-3 hover:bg-surface-elevated transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {activity.contactName && (
                    <span className="text-xs text-text-secondary">{activity.contactName}</span>
                  )}
                  {activity.company && (
                    <span className="text-xs text-text-muted">{activity.company}</span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-text-muted shrink-0">
                {activity.date}
              </span>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div className="px-5 py-8 text-center text-text-muted text-sm">
            Inga aktiviteter att visa
          </div>
        )}
      </div>
    </Card>
  );
}
