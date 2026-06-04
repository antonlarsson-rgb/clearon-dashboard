import { createHash } from "crypto";

/**
 * SHA-256 hex lowercase per Metas/LinkedIns krav for PII.
 * Returnerar undefined for tomma vardena sa CAPI inte skickar tomma falt.
 */
export function sha256(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

/** Telefonnummer normaliseras till E.164-liknande (bara siffror) fore hashning. */
export function sha256Phone(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D+/g, "");
  if (!digits) return undefined;
  return createHash("sha256").update(digits).digest("hex");
}
