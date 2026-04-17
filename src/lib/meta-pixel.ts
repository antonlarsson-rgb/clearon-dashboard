declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  fbq("trackCustom", eventName, params);
}

export function trackMetaStandard(eventName: string, params?: Record<string, unknown>) {
  fbq("track", eventName, params);
}

export function trackClick(element: string, variant: string, section?: string) {
  trackMetaEvent("ButtonClick", {
    content_name: element,
    variant,
    page_section: section,
  });
}

export function trackLead(variant: string, params?: Record<string, unknown>) {
  trackMetaStandard("Lead", {
    content_name: `form_submission_${variant}`,
    variant,
    ...params,
  });
}

export function trackIceCreamCoupon(variant: string, source: string) {
  trackMetaEvent("IceCreamCoupon", {
    content_name: "ice_cream_coupon_request",
    variant,
    source,
  });
}
