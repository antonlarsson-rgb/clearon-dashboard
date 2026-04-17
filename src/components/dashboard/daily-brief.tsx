"use client";

import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";

export function DailyBrief() {
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
            God morgon Kaveh. 12 nya leads senaste 24h, varav 3 med score over 70.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
            Maria Eriksson pa Fazer (score 87) besökte Sales Promotion-sidan 3 ganger
            igar och laddade ner insiktsrapporten. Meta-kampanjen &quot;Kupongguiden&quot; har
            genererat 34 leads senaste veckan med CPL 89 kr. Johan Lindstrom pa Volvo
            Cars sokte pa &quot;digital personalbeloning&quot; och landade pa Send a Gift-sidan
            tva ganger.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-elevated transition-colors cursor-pointer">
            <Play className="h-3.5 w-3.5 fill-accent text-accent" />
            Lyssna pa briefingen
          </button>
          {/* Audio waveform */}
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
