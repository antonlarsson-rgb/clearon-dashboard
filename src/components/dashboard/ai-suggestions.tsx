"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiSuggestions } from "@/lib/mock-data";
import { X } from "lucide-react";

const priorityLabel: Record<string, string> = {
  kritiskt: "KRITISKT",
  hog: "HOG",
  medel: "MEDEL",
};

const priorityColor: Record<string, string> = {
  kritiskt: "text-danger",
  hog: "text-warning",
  medel: "text-text-muted",
};

export function AiSuggestions() {
  return (
    <Card>
      <div className="p-5 border-b border-border">
        <span className="section-prefix">/ AI AGENT FORESLAR</span>
        <p className="text-sm text-text-secondary mt-1">Prioriterade atgarder</p>
      </div>
      <div className="divide-y divide-border">
        {aiSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-5 hover:bg-surface-elevated transition-colors group relative"
          >
            {/* Dismiss button */}
            <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Priority + metric */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-mono text-[10px] font-medium tracking-wider ${priorityColor[suggestion.priority]}`}>
                / {priorityLabel[suggestion.priority]}
              </span>
              <span className="font-mono text-[10px] text-text-muted tracking-wider">
                {suggestion.metric}
              </span>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-text-primary mb-1">
              {suggestion.title}
            </p>

            {/* Description */}
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              {suggestion.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button size="sm" className="text-xs">
                {suggestion.cta_primary}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                {suggestion.cta_secondary}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
