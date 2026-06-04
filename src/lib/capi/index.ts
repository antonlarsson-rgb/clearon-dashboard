import { matchEvent, FUNNEL_LABELS } from "@/lib/event-taxonomy";
import { sendToMetaCapi } from "./meta";
import { sendToLinkedInCapi } from "./linkedin";

export interface RelayContext {
  eventName: string;
  /** UUID som matchar klient-pixelns eventID for dedup. */
  eventId: string;
  /** Sekunder sedan epoch nar eventet skedde. */
  eventTimeSeconds: number;
  /** Full URL dar eventet skedde. */
  eventSourceUrl: string;
  /** Klient-IP fran request. */
  clientIpAddress?: string;
  /** Klient-UA. */
  clientUserAgent?: string;
  /** _fbp-cookie eller server-genererad. */
  fbp?: string;
  /** _fbc-cookie eller hopbyggd fran fbclid. */
  fbc?: string;
  /** li_fat_id-cookie eller URL-param. */
  liFatId?: string;
  /** Email om identifierad. */
  email?: string;
  /** Telefon om identifierad. */
  phone?: string;
  /** Vart visitor_id, anvands som external_id mot Meta. */
  visitorId?: string;
  /** Alla properties fran original-eventet (utm, page_path, product, ...). */
  properties?: Record<string, unknown>;
}

/**
 * Fan-out till Meta + LinkedIn parallellt. Fire-and-forget med kort
 * timeout i underliggande sender. Returnerar inget - kallas inte med await
 * fran request-handlern (se trackingRouteHelper).
 */
export async function relayEventToAdPlatforms(ctx: RelayContext): Promise<void> {
  const match = matchEvent(ctx.eventName, { properties: ctx.properties });

  const customData: Record<string, unknown> = {
    funnel_stage: match.funnelStage,
    funnel_label: FUNNEL_LABELS[match.funnelStage],
    source_event: ctx.eventName,
  };
  const props = ctx.properties || {};
  if (props.product || props.product_slug) {
    customData.content_name = props.product ?? props.product_slug;
    customData.content_category = "product";
  }
  if (props.page_path) customData.page_path = props.page_path;
  if (props.page_section) customData.page_section = props.page_section;
  if (props.utm_source) customData.utm_source = props.utm_source;
  if (props.utm_campaign) customData.utm_campaign = props.utm_campaign;
  if (props.utm_medium) customData.utm_medium = props.utm_medium;
  if (props.variant) customData.variant = props.variant;

  const metaPromise = sendToMetaCapi({
    eventId: ctx.eventId,
    eventName: match.metaEventName,
    eventTime: ctx.eventTimeSeconds,
    eventSourceUrl: ctx.eventSourceUrl,
    clientIpAddress: ctx.clientIpAddress,
    clientUserAgent: ctx.clientUserAgent,
    fbp: ctx.fbp,
    fbc: ctx.fbc,
    email: ctx.email,
    phone: ctx.phone,
    externalId: ctx.visitorId,
    customData,
  });

  // LinkedIn bara om regeln finns OCH vi har nagot matchbart ID.
  const liPromise = match.linkedinRuleId
    ? sendToLinkedInCapi({
        email: ctx.email,
        phone: ctx.phone,
        liFatId: ctx.liFatId,
        conversionRuleId: match.linkedinRuleId,
        conversionHappenedAt: ctx.eventTimeSeconds * 1000,
      })
    : Promise.resolve(false);

  const [metaRes, liRes] = await Promise.allSettled([metaPromise, liPromise]);

  // Lightweight observability i dev. Skippas i prod for att inte spamma logs.
  if (process.env.NODE_ENV !== "production") {
    const metaOk = metaRes.status === "fulfilled" && metaRes.value === true;
    const liOk = liRes.status === "fulfilled" && liRes.value === true;
    const metaLabel = metaOk ? "ok" : process.env.META_CAPI_ACCESS_TOKEN ? "fail" : "skip(no-env)";
    const liLabel = liOk
      ? "ok"
      : match.linkedinRuleId
      ? process.env.LINKEDIN_CAPI_ACCESS_TOKEN
        ? "fail(no-match?)"
        : "skip(no-env)"
      : "skip(no-rule)";
    console.log(
      `[capi] ${ctx.eventName} -> ${match.metaEventName}/f${match.funnelStage} meta=${metaLabel} li=${liLabel}`
    );
  }
}

/**
 * Wrapper som tar vad /api/tracking har och kor relayen utan att blockera
 * responsen. Vi anvander Next 16's after-modell nar vi kallar.
 */
export function relayInBackground(ctx: RelayContext): Promise<void> {
  return relayEventToAdPlatforms(ctx).catch((err) => {
    console.warn("CAPI relay error:", err instanceof Error ? err.message : err);
  });
}
