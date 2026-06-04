import { sha256, sha256Phone } from "./hash";

/**
 * LinkedIn Conversions API (a.k.a. CAPI / Restli Conversions).
 * Endpoint: POST https://api.linkedin.com/rest/conversionEvents
 * Docs: https://learn.microsoft.com/linkedin/marketing/integrations/ads-reporting/conversions-api
 *
 * LinkedIn kan bara matcha event dar vi har email/telefon (hashad)
 * eller li_fat_id (LinkedIn First-Party Ad Tracking cookie). Saknas alla
 * tre laggs eventet aldrig till - vi sparar API-anropet.
 */

export interface LinkedInCapiEvent {
  /** Klartext-email. Vi hashar. */
  email?: string;
  /** Klartext-telefon. Vi hashar. */
  phone?: string;
  /** li_fat_id-cookie eller URL-param fran LinkedIn-klick. */
  liFatId?: string;
  /** Conversion rule-ID i kontot (ex 26457801). */
  conversionRuleId: number;
  /** Millisekunder sedan epoch. */
  conversionHappenedAt: number;
  /** Valfritt monetart varde (SEK). */
  conversionValue?: { amount: string; currencyCode: string };
}

interface LinkedInCapiConfig {
  accessToken: string;
  /** urn:li:sponsoredAccount:<numeric-id> for kontot conversion rules tillhor. */
  adAccountUrn: string;
}

function readConfig(): LinkedInCapiConfig | null {
  const accessToken = (process.env.LINKEDIN_CAPI_ACCESS_TOKEN || "").trim();
  const adAccountUrn = (process.env.LINKEDIN_AD_ACCOUNT_URN || "").trim();
  if (!accessToken || !adAccountUrn) return null;
  return { accessToken, adAccountUrn };
}

export async function sendToLinkedInCapi(event: LinkedInCapiEvent): Promise<boolean> {
  const config = readConfig();
  if (!config) return false;

  // Bygg userIds-array. Minst ett ID kravs for att eventet ska matchas.
  const userIds: Array<{ idType: string; idValue: string }> = [];
  const emHash = sha256(event.email);
  const phHash = sha256Phone(event.phone);
  if (emHash) userIds.push({ idType: "SHA256_EMAIL", idValue: emHash });
  if (phHash) userIds.push({ idType: "SHA256_PHONE_NUMBER", idValue: phHash });
  if (event.liFatId) userIds.push({ idType: "LINKEDIN_FIRST_PARTY_ADS_TRACKING_UUID", idValue: event.liFatId });
  if (userIds.length === 0) return false;

  const payload: Record<string, unknown> = {
    conversion: `urn:lla:llaPartnerConversion:${event.conversionRuleId}`,
    conversionHappenedAt: event.conversionHappenedAt,
    user: { userIds },
  };
  if (event.conversionValue) {
    payload.conversionValue = event.conversionValue;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("https://api.linkedin.com/rest/conversionEvents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
        "LinkedIn-Version": "202601",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `LinkedIn CAPI ${res.status} rule=${event.conversionRuleId}:`,
        text.slice(0, 300)
      );
      return false;
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`LinkedIn CAPI fetch error rule=${event.conversionRuleId}:`, msg);
    return false;
  }
}
