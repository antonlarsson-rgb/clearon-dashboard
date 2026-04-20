"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardContact } from "@/lib/dashboard-data";
import { X } from "lucide-react";

interface AiSuggestionsProps {
  leads: DashboardContact[];
}

interface Suggestion {
  id: string;
  priority: "kritiskt" | "hog" | "medel";
  category: string;
  metric: string;
  title: string;
  description: string;
  cta_primary: string;
  cta_secondary: string;
}

function generateSuggestions(leads: DashboardContact[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Contact now leads
  const contactNow = leads.filter((l) => l.contactNow);
  if (contactNow.length > 0) {
    const top = contactNow[0];
    suggestions.push({
      id: "contact-now",
      priority: "kritiskt",
      category: "HET LEAD",
      metric: `${top.company} / SCORE ${top.score}`,
      title: `${top.name} (${top.company}) bor kontaktas nu`,
      description: `Score ${top.score}. ${top.contactNowReason}. ${top.hasVisit ? "Har besökt webbplatsen. " : ""}${top.hasForm ? "Har skickat formularet. " : ""}${top.hasMail ? "Har interagerat med mail. " : ""}${top.topProduct ? `Troligt intresse: ${top.topProduct}.` : ""}`,
      cta_primary: top.phone ? `Ring ${top.name.split(" ")[0]}` : `Maila ${top.name.split(" ")[0]}`,
      cta_secondary: "Visa profil",
    });
  }

  // More contact-now leads
  if (contactNow.length > 1) {
    suggestions.push({
      id: "more-contact-now",
      priority: "hog",
      category: "ATT KONTAKTA",
      metric: `${contactNow.length} LEADS`,
      title: `${contactNow.length} leads bor kontaktas idag`,
      description: contactNow.slice(0, 4).map((l) => `${l.name} (${l.company})`).join(", ") + (contactNow.length > 4 ? ` och ${contactNow.length - 4} till` : ""),
      cta_primary: "Visa alla",
      cta_secondary: "Exportera lista",
    });
  }

  // Leads with visits but no form
  const visitNoForm = leads.filter((l) => l.hasVisit && !l.hasForm && l.score >= 30);
  if (visitNoForm.length > 0) {
    suggestions.push({
      id: "visit-no-form",
      priority: "hog",
      category: "WEBB-BESOKARE",
      metric: `${visitNoForm.length} BESOKARE`,
      title: `${visitNoForm.length} aktiva webbbesokare har inte konverterat`,
      description: `Dessa har besökt webbplatsen och har score over 30, men har inte skickat nagot formularer. Overvag att rikta mail-kampanj eller retargeting.`,
      cta_primary: "Skicka kampanjmail",
      cta_secondary: "Visa segment",
    });
  }

  // Product interest clusters
  const productCounts: Record<string, number> = {};
  for (const l of leads) {
    if (l.topProduct) productCounts[l.topProduct] = (productCounts[l.topProduct] || 0) + 1;
  }
  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
  if (topProduct) {
    suggestions.push({
      id: "product-cluster",
      priority: "medel",
      category: "PRODUKTINTRESSE",
      metric: `${topProduct[0].toUpperCase()} / ${topProduct[1]} LEADS`,
      title: `${topProduct[1]} leads visar intresse for ${topProduct[0]}`,
      description: `Baserat pa titlar och roller. Se till att landningssidan for denna produkt ar optimerad och att kampanjerna riktas ratt.`,
      cta_primary: "Visa leads",
      cta_secondary: "Visa landningssida",
    });
  }

  // Cold leads with mail engagement
  const mailNoCta = leads.filter((l) => l.hasMail && !l.hasVisit && l.score < 50);
  if (mailNoCta.length > 3) {
    suggestions.push({
      id: "mail-no-visit",
      priority: "medel",
      category: "EMAIL-SEGMENT",
      metric: `${mailNoCta.length} KONTAKTER`,
      title: `${mailNoCta.length} kontakter oppnar mail men besöker inte webben`,
      description: `Dessa interagerar med mail men har aldrig besökt webbplatsen. Testa att inkludera starkare CTA eller erbjudande i nasta utskick.`,
      cta_primary: "Skapa kampanj",
      cta_secondary: "Visa segment",
    });
  }

  return suggestions.slice(0, 5);
}

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

export function AiSuggestions({ leads }: AiSuggestionsProps) {
  const suggestions = generateSuggestions(leads);

  return (
    <Card>
      <div className="p-5 border-b border-border">
        <span className="section-prefix">/ AI AGENT FORESLAR</span>
        <p className="text-sm text-text-secondary mt-1">Prioriterade atgarder baserat pa riktig data</p>
      </div>
      <div className="divide-y divide-border">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-5 hover:bg-surface-elevated transition-colors group relative"
          >
            <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`font-mono text-[10px] font-medium tracking-wider ${priorityColor[suggestion.priority]}`}>
                / {priorityLabel[suggestion.priority]}
              </span>
              <span className="font-mono text-[10px] text-text-muted tracking-wider">
                {suggestion.metric}
              </span>
            </div>

            <p className="text-sm font-medium text-text-primary mb-1">
              {suggestion.title}
            </p>

            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              {suggestion.description}
            </p>

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
        {suggestions.length === 0 && (
          <div className="p-5 text-center text-text-muted text-sm">
            Inga forslag just nu. Mer data behövs.
          </div>
        )}
      </div>
    </Card>
  );
}
