"use client";

import { useEffect, useState } from "react";
import { getVisitorId } from "@/lib/tracking";

export interface VisitorState {
  loading: boolean;
  known: boolean;
  identified: boolean;
  visitorId: string;
  name: string | null;
  email: string | null;
  company: string | null;
  score: number;
  demoReadiness: number;
  segment: "cold" | "curious" | "warm" | "hot" | string;
  topProduct: { slug: string; score: number } | null;
  productAffinities: Record<string, number>;
  visitsCount: number;
}

const INITIAL: VisitorState = {
  loading: true,
  known: false,
  identified: false,
  visitorId: "",
  name: null,
  email: null,
  company: null,
  score: 0,
  demoReadiness: 0,
  segment: "cold",
  topProduct: null,
  productAffinities: {},
  visitsCount: 0,
};

/**
 * Läser cookie-baserat visitor_id, pollar /api/identify och returnerar
 * vad vi vet om besökaren. Används för att skippa popup för återkommande
 * identifierade besökare och visa "välkommen tillbaka"-läge.
 */
export function useVisitor(): VisitorState {
  const [state, setState] = useState<VisitorState>(INITIAL);

  useEffect(() => {
    const visitorId = getVisitorId();
    setState((p) => ({ ...p, visitorId }));

    fetch(`/api/identify?visitor_id=${encodeURIComponent(visitorId)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.known) {
          setState((p) => ({ ...p, loading: false, visitorId }));
          return;
        }
        setState({
          loading: false,
          known: true,
          identified: !!data.identified,
          visitorId: data.visitor_id || visitorId,
          name: data.name || null,
          email: data.email || null,
          company: data.company || null,
          score: data.score || 0,
          demoReadiness: data.demo_readiness || 0,
          segment: data.segment || "cold",
          topProduct: data.top_product || null,
          productAffinities: data.product_affinities || {},
          visitsCount: data.visits_count || 0,
        });
      })
      .catch(() => setState((p) => ({ ...p, loading: false, visitorId })));
  }, []);

  return state;
}
