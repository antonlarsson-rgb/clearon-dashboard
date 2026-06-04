/**
 * Event-taxonomi: mappar interna site-event till
 *  - Meta Pixel/CAPI event-namn (standard nar mojligt, custom annars)
 *  - LinkedIn conversion rule (om matchbart med email/telefon/li_fat_id)
 *  - funnel_stage 1-5 (1 = top, 5 = bottom) per Antons setup
 *
 * Smart bundling: relaterade interaktioner (knappklick, hjulsnurr, slider, val)
 * mappas till samma Meta-event-namn (`Interaction`) men behaller ursprungligt
 * namn i custom_data.source_event sa vi kan filtrera per typ i Events Manager.
 */

export type FunnelStage = 1 | 2 | 3 | 4 | 5;

export const FUNNEL_LABELS: Record<FunnelStage, string> = {
  1: "Awareness",
  2: "Engagement",
  3: "Interaction",
  4: "Intent",
  5: "Conversion",
};

/**
 * LinkedIn conversion rules som finns i ClearOn-kontot (514197293).
 * Verifierade via /rest/conversions?q=account 2026-06-04.
 * Tidigare hade koden 26457801=LEAD och 26457809=PHONE - det var fel,
 * 26457801 ar "Landing" (CONTACT-typ) och 26457809 ar "Glass Popup" (SIGN_UP).
 */
export const LINKEDIN_RULES = {
  /** "Glass Popup" - SIGN_UP. Passar popup_filled (lagfriktions email-capture). */
  POPUP_FILLED: 26457809,
  /** "Lead formulär" - LEAD. Riktig lead via kontaktformular. */
  LEAD_FORM: 23533217,
  /** "Tack-sida" - QUALIFIED_LEAD. Bokad demo / passerat thank-you. */
  QUALIFIED_LEAD: 20994401,
  /** "Landing" - CONTACT. Landningssidebesok (kraver li_fat_id for match). */
  LANDING: 26457801,
  /** "Klick pa Kupong-sidan" - DOWNLOAD. */
  KUPONG_DOWNLOAD: 24479929,
  /** "Kop" - PURCHASE. */
  PURCHASE: 20994417,
} as const;

export interface TaxonomyMatch {
  /** Meta Pixel/CAPI event-namn (PageView, ViewContent, Lead, ... eller custom). */
  metaEventName: string;
  /** Ar Meta-eventet ett standard-event (vs custom)? */
  metaIsStandard: boolean;
  /** Funnel-steg 1-5. */
  funnelStage: FunnelStage;
  /** LinkedIn conversion rule-ID (om eventet ska skickas till LinkedIn). */
  linkedinRuleId?: number;
}

interface MatchContext {
  /** Egenskaper som skickas med eventet (source, product, page_path, ...). */
  properties?: Record<string, unknown>;
}

/**
 * Returnerar taxonomi-matchning for ett site-event. Om eventet ar okant
 * fan­gas det i en fallback (custom `Engagement`, stage 2) sa ingen data
 * forloras nar nya event laggs till framover.
 */
export function matchEvent(eventName: string, ctx: MatchContext = {}): TaxonomyMatch {
  const props = ctx.properties ?? {};
  const pagePath = String(props.page_path ?? "");
  const product = props.product ?? props.product_slug;
  const isProductPage =
    !!product || (pagePath !== "/" && pagePath !== "/site" && pagePath !== "");

  switch (eventName) {
    // ---- Stage 1: Awareness ----
    case "page_load":
      // Riktigt route-load. Pa produktsida = ViewContent (stage 2), annars PageView (stage 1).
      if (isProductPage) {
        return { metaEventName: "ViewContent", metaIsStandard: true, funnelStage: 2 };
      }
      return { metaEventName: "PageView", metaIsStandard: true, funnelStage: 1 };

    case "page_view":
      // page_view fyrar per sektion som scrollas in i vy - inte per route. Engagement.
      return { metaEventName: "Engagement", metaIsStandard: false, funnelStage: 2 };

    case "popup_filled":
      // Email-capture via lagfriktions-popup ("Glass Popup"). Per Antons design = stage 1.
      // Meta-event = Lead (sa annonsoptimering far signalen), funnel_stage=1 i custom_data.
      return {
        metaEventName: "Lead",
        metaIsStandard: true,
        funnelStage: 1,
        linkedinRuleId: LINKEDIN_RULES.POPUP_FILLED,
      };

    // ---- Stage 2: Engagement ----
    case "scroll_depth":
    case "role_selected":
    case "info_opened":
    case "popup_opened":
    case "popup_shown":
    case "time_milestone":
    case "video_played":
    case "video_play":
      return {
        metaEventName: "Engagement",
        metaIsStandard: false,
        funnelStage: 2,
      };

    // ---- Stage 3: Interaction ----
    case "cta_clicked":
    case "button_clicked":
    case "scenario_choice":
    case "wheel_spin":
    case "game_played":
    case "slider_changed":
    case "toolbox_selected":
    case "fit_quiz_step":
    case "quiz_step":
    case "product_explored":
      return {
        metaEventName: "Interaction",
        metaIsStandard: false,
        funnelStage: 3,
      };

    // ---- Stage 4: Intent ----
    case "quiz_completed":
    case "calculator_completed":
    case "store_finder_used":
    case "return_visit":
    case "multi_product_view":
    case "demo_video_completed":
      return {
        metaEventName: "IntentSignal",
        metaIsStandard: false,
        funnelStage: 4,
      };

    // ---- Stage 5: Conversion ----
    case "lead_submitted":
      return {
        metaEventName: "Lead",
        metaIsStandard: true,
        funnelStage: 5,
        linkedinRuleId: LINKEDIN_RULES.LEAD_FORM,
      };
    case "phone_lead_captured":
    case "phone_captured":
      return {
        metaEventName: "Contact",
        metaIsStandard: true,
        funnelStage: 5,
        linkedinRuleId: LINKEDIN_RULES.LEAD_FORM,
      };
    case "demo_booked":
      return {
        metaEventName: "Schedule",
        metaIsStandard: true,
        funnelStage: 5,
        linkedinRuleId: LINKEDIN_RULES.QUALIFIED_LEAD,
      };

    // ---- Fallback: okant event blir Engagement/stage 2 ----
    default:
      return {
        metaEventName: "Engagement",
        metaIsStandard: false,
        funnelStage: 2,
      };
  }
}
