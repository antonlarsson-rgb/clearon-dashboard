// Scoring-modell för visitors och produkt-affinity.
// Körs server-side i /api/tracking och /api/leads.

export type ProductSlug =
  | "sales-promotion"
  | "customer-care"
  | "interactive-engage"
  | "kampanja"
  | "send-a-gift"
  | "clearing-solutions"
  | "personalbeloning"
  | "kuponger"
  | "mobila-presentkort";

// Vilka event bidrar till totalt engagemang
export const ENGAGEMENT_POINTS: Record<string, number> = {
  page_view: 1,
  scroll_depth: 1, // +1 per milestone (25/50/75/100) = max 4
  "hero:role": 8,
  "product:expand": 5,
  "product:hover": 2,
  "product:cta": 10,
  "game:start": 6,
  "game:win": 12,
  "quiz:answer": 4,
  "quiz:complete": 12,
  "quiz:cta": 8,
  "usecase:expand": 4,
  "sms-demo:send": 8,
  "roi:adjust": 6,
  "roi:compute": 6,
  "cold-traffic:answer": 2,
  "module:engage": 8,
  popup_shown: 1,
  popup_dismissed: -2,
  lead_submitted: 25,
  cta_clicked: 4,
};

// Vilka event är starka intent-signaler (demo-readiness)
export const INTENT_POINTS: Record<string, number> = {
  "product:cta": 10,
  "quiz:cta": 12,
  "quiz:complete": 8,
  "roi:compute": 8,
  "sms-demo:send": 6,
  "module:engage": 6,
  cta_clicked: 5,
  lead_submitted: 20,
  return_visit: 15, // adderas när visits_count > 1
};

// Mappa event → vilken produkt de påverkar (+ hur mycket)
export function productAffinityFromEvent(
  eventName: string,
  metadata: Record<string, unknown>
): { product: string; points: number } | null {
  const product =
    (metadata.product as string) ||
    (metadata.product_slug as string) ||
    (metadata.page_section as string) ||
    "";

  if (!product) return null;

  // Normalisera slug (vissa sektioner heter sales-promotion-section t.ex.)
  const slug = product
    .toLowerCase()
    .replace(/-section$/, "")
    .replace(/_/g, "-");

  const eventWeights: Record<string, number> = {
    "product:expand": 5,
    "product:hover": 1,
    "product:cta": 12,
    "usecase:expand": 4,
    page_view: 2,
    "quiz:cta": 8,
    "module:engage": 6,
  };

  const points = eventWeights[eventName] || 0;
  if (points === 0) return null;
  return { product: slug, points };
}

export function computeSegment(score: number): string {
  if (score >= 80) return "hot";
  if (score >= 40) return "warm";
  if (score >= 15) return "curious";
  return "cold";
}

// Demo-readiness 0-100 — hur troligt att personen är öppen för en demo
export function computeDemoReadiness(params: {
  intentScore: number;
  engagementScore: number;
  visitsCount: number;
  maxScrollDepth: number;
  dwellSeconds: number;
  hasIdentified: boolean;
  hasCompany: boolean;
}): number {
  const intent = Math.min(40, params.intentScore); // max 40
  const engage = Math.min(20, params.engagementScore / 3); // upp till 20
  const recur = Math.min(15, params.visitsCount * 5); // 5 per besök, max 15
  const scroll = Math.min(10, params.maxScrollDepth / 10); // 1 per 10%
  const dwell = Math.min(5, params.dwellSeconds / 60); // 1 per minut, max 5
  const ident = params.hasIdentified ? 5 : 0;
  const biz = params.hasCompany ? 5 : 0;
  return Math.round(intent + engage + recur + scroll + dwell + ident + biz);
}
