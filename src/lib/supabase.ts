import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Läs env vid användning, inte vid module-load, annars kraschar Next build
// när page data samlas in utan env (och Vercel env är trimmade på newline).
let _anon: SupabaseClient | null = null;

function getAnon(): SupabaseClient {
  if (_anon) return _anon;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) {
    // Ge en tom mock vid build-tid då env saknas
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  _anon = createClient(url, key);
  return _anon;
}

// Bakåtkompatibel export — lazy proxy som återanvänder anon-klient
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getAnon() as unknown as Record<string, unknown>)[prop as string];
  },
});

export function getServiceClient(): SupabaseClient {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  return createClient(url, key);
}
