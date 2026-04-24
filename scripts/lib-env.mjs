import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(__dirname, "..");

export function loadEnv() {
  try {
    const content = readFileSync(resolve(PROJECT_ROOT, ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim();
        const wasQuoted = v.startsWith('"') && v.endsWith('"');
        if (wasQuoted) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        // Vercel pull representerar newline som literal \n i kvoterade strängar
        if (wasQuoted) {
          v = v.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
        }
        process.env[m[1]] = v;
      }
    }
  } catch {
    console.warn(".env.local saknas, använder process.env");
  }
}

loadEnv();

export const UPSALES_TOKEN = (process.env.UPSALES_API_KEY || "").trim();
export const UPSALES_BASE = "https://power.upsales.com/api/v2";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function upsalesFetch(path, params = {}) {
  const url = new URL(`${UPSALES_BASE}${path}`);
  url.searchParams.set("token", UPSALES_TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upsales ${path} ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}
