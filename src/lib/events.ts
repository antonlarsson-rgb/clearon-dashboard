// Event-ingestion. logEvent() skriver till events-tabellen + applicerar base-vikt.
// Scoring-motorn läser events + appliserar decay.

import type { SupabaseClient } from "@supabase/supabase-js";
import { weightFor } from "@/lib/event-weights";

export interface LogEventInput {
  person_id: string | null;
  account_id?: string | null;
  source: string;
  event_type: string;
  product_slug?: string | null;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
  external_id?: string | null;
  // overrides
  weight?: number;
  intent_weight?: number;
}

export async function logEvent(
  supabase: SupabaseClient,
  e: LogEventInput
): Promise<string | null> {
  const w = weightFor(e.event_type);
  const weight = e.weight ?? w.weight;
  const intent = e.intent_weight ?? w.intent_weight;

  const metadata = {
    ...(e.metadata || {}),
    ...(e.external_id ? { external_id: e.external_id } : {}),
  };

  const { data, error } = await supabase
    .from("events")
    .insert({
      person_id: e.person_id,
      account_id: e.account_id,
      source: e.source,
      event_type: e.event_type,
      product_slug: e.product_slug,
      metadata,
      weight,
      intent_weight: intent,
      occurred_at: e.occurred_at || new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    console.error("logEvent error:", error.message);
    return null;
  }
  return data?.id || null;
}

// Batched insert för backfill (mycket snabbare än 1-och-1)
export async function logEventsBatch(
  supabase: SupabaseClient,
  events: LogEventInput[]
): Promise<number> {
  if (events.length === 0) return 0;

  const rows = events.map((e) => {
    const w = weightFor(e.event_type);
    return {
      person_id: e.person_id,
      account_id: e.account_id,
      source: e.source,
      event_type: e.event_type,
      product_slug: e.product_slug,
      metadata: {
        ...(e.metadata || {}),
        ...(e.external_id ? { external_id: e.external_id } : {}),
      },
      weight: e.weight ?? w.weight,
      intent_weight: e.intent_weight ?? w.intent_weight,
      occurred_at: e.occurred_at || new Date().toISOString(),
    };
  });

  // Insert utan onConflict — Supabase kan inte hantera expression-baserade
  // unique-indexer vid onConflict. Unique-indexet stoppar dubbletter på DB-nivå
  // vilket triggar fel 23505 — vi fortsätter då på nästa rad.
  const { error } = await supabase.from("events").insert(rows);
  if (error && error.code !== "23505") {
    console.error("logEventsBatch error:", error.message);
    return 0;
  }
  return rows.length;
}
