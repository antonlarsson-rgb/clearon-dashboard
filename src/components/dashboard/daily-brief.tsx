"use client";

import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import type { DashboardContact } from "@/lib/dashboard-data";

interface DailyBriefProps {
  hotLeadCount: number;
  contactNowCount: number;
  topLead: DashboardContact | null;
}

export function DailyBrief({ hotLeadCount, contactNowCount, topLead }: DailyBriefProps) {
  const today = new Date().toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();

  return (
    <Card className="p-8">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <p className="section-prefix mb-4">{today} / DAILY BRIEF</p>
          <h2 className="font-display text-2xl text-text-primary mb-3">
            God morgon. {hotLeadCount} heta leads, {contactNowCount} att kontakta idag.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            {topLead ? (
              <>
                Hetaste lead: <strong>{topLead.name}</strong> pa {topLead.company} (score {topLead.score}).
                {topLead.contactNow && ` ${topLead.contactNowReason}.`}
                {topLead.hasVisit && " Har besökt webbplatsen."}
                {topLead.hasForm && " Har skickat formularet."}
                {topLead.hasMail && " Har interagerat med mail."}
                {topLead.topProduct && ` Troligt intresse: ${topLead.topProduct}.`}
              </>
            ) : (
              "Inga aktiva leads just nu. Fokusera pa att driva trafik till landningssidorna."
            )}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-elevated transition-colors cursor-pointer">
            <Play className="h-3.5 w-3.5 fill-accent text-accent" />
            Lyssna pa briefingen
          </button>
          <div className="flex items-end gap-0.5 h-6">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-accent/40 pulse-live"
                style={{
                  height: `${4 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-text-muted">01:18</span>
        </div>
      </div>
    </Card>
  );
}
