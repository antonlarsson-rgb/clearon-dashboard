"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ui/score-badge";
import { ScoreBreakdown } from "@/components/dashboard/score-breakdown";
import { LeadTimeline } from "@/components/dashboard/lead-timeline";
import type {
  DashboardContact,
  DashboardLeadScore,
  DashboardSignal,
} from "@/lib/dashboard-data";
import {
  Phone,
  Mail,
  MessageSquare,
  Users,
  CalendarPlus,
  ExternalLink,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface ProductWithMeta {
  product_slug: string;
  score: number;
  product:
    | {
        slug: string;
        name: string;
        description: string;
        icon: string;
        color: string;
      }
    | undefined;
}

interface LeadProfileClientProps {
  contact: DashboardContact;
  score: DashboardLeadScore;
  signals: DashboardSignal[];
  contactProducts: ProductWithMeta[];
  aiSummary: string;
}

export function LeadProfileClient({
  contact,
  score,
  signals,
  contactProducts,
  aiSummary,
}: LeadProfileClientProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka till leads
      </Link>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-start gap-4">
            <ScoreBadge score={score.total_score} size="lg" />
            <div>
              <h1 className="font-display text-2xl text-text-primary">
                {contact.name}
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {contact.title ? `${contact.title}, ` : ""}
                {contact.company}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {contact.email}
                {contact.phone ? ` / ${contact.phone}` : ""}
              </p>
            </div>
          </div>

          <Card>
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="section-prefix">/ AI-SAMMANFATTNING</span>
            </div>
            <CardContent className="pt-5">
              <p className="text-sm text-text-primary leading-relaxed">
                {aiSummary}
              </p>
            </CardContent>
          </Card>

          <ScoreBreakdown score={score} />

          <Card>
            <div className="p-5 border-b border-border">
              <span className="section-prefix">/ PRODUKTINTRESSE</span>
            </div>
            <CardContent className="pt-5 space-y-3">
              {contactProducts.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Inget registrerat produktintresse.
                </p>
              ) : (
                contactProducts.map((productInterest) => (
                  <div key={productInterest.product_slug} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: productInterest.product?.color ?? "#999",
                          }}
                        />
                        <span className="text-sm text-text-primary">
                          {productInterest.product?.name ?? productInterest.product_slug}
                        </span>
                      </span>
                      <span className="text-sm font-display text-text-secondary">
                        {productInterest.score}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(productInterest.score, 100)}%`,
                          backgroundColor: productInterest.product?.color ?? "#999",
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <LeadTimeline signals={signals} />
        </div>

        <div className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-6 space-y-3">
            <Card>
              <div className="p-4 border-b border-border">
                <span className="section-prefix">/ ATGARDER</span>
              </div>
              <div className="p-4 space-y-2">
                <Button variant="default" className="w-full justify-start gap-2" asChild>
                  <a href={contact.phone ? `tel:${contact.phone}` : "#"}>
                    <Phone className="h-4 w-4" />
                    Ring
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a href={contact.email ? `mailto:${contact.email}` : "#"}>
                    <Mail className="h-4 w-4" />
                    Skicka mail
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Skicka SMS
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Lagg till i Meta-audience
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  Boka mote
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a
                    href={`https://power.upsales.com/#/contacts/${contact.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visa i Upsales
                  </a>
                </Button>
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b border-border">
                <span className="section-prefix">/ KONTAKTINFO</span>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <div className="text-text-muted text-xs font-mono uppercase">
                    E-post
                  </div>
                  <div className="text-text-primary">{contact.email || "-"}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs font-mono uppercase">
                    Telefon
                  </div>
                  <div className="text-text-primary">{contact.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs font-mono uppercase">
                    Foretag
                  </div>
                  <div className="text-text-primary">{contact.company}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs font-mono uppercase">
                    Roll
                  </div>
                  <div className="text-text-primary">{contact.title || "-"}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs font-mono uppercase">
                    Kalla
                  </div>
                  <div className="text-text-primary">{contact.sourceChannel}</div>
                </div>
                <div>
                  <div className="text-text-muted text-xs font-mono uppercase">
                    Kategori
                  </div>
                  <div className="text-text-primary">{contact.categoryLabel}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
