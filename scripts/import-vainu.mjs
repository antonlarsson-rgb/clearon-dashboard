#!/usr/bin/env node
/**
 * Importerar Vainu CSV-export till Supabase vainu_companies-tabell.
 *
 * Användning:
 *   node scripts/import-vainu.mjs "/path/to/Vainu ClearOn 2026-02-12 15_45/base.csv"
 *
 * Läser .env.local automatiskt.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// --- Load .env.local ---
function loadEnv() {
  try {
    const content = readFileSync(resolve(projectRoot, ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        let v = m[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  } catch {
    console.warn(".env.local hittades inte, använder process.env direkt");
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Saknar NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const csvPath =
  process.argv[2] ||
  resolve(
    process.env.HOME || "",
    "Downloads/Vainu ClearOn 2026-02-12 15_45/base.csv"
  );

console.log(`Läser CSV: ${csvPath}`);

// --- CSV-parser som hanterar semikolon-separator + latin-1 + quoted fields med newlines ---
function parseCsv(rawBytes) {
  // Latin-1 (ISO-8859-1) till UTF-8-sträng
  const decoder = new TextDecoder("iso-8859-1");
  const text = decoder.decode(rawBytes);

  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ";") {
        row.push(field);
        field = "";
      } else if (c === "\r") {
        // skip
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function extractDomain(website) {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const host = new URL(url).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function parseNum(s) {
  if (!s || s === "") return null;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseInt2(s) {
  const n = parseNum(s);
  return n == null ? null : Math.round(n);
}

async function main() {
  const raw = readFileSync(csvPath);
  const rows = parseCsv(raw);
  const headers = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));

  console.log(`Hittade ${rows.length - 1} företag`);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const BATCH = 200;
  let inserted = 0;
  let skipped = 0;

  for (let i = 1; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const batch = [];

    for (const r of chunk) {
      if (r.length < 5) continue;
      const get = (col) => {
        const j = idx[col];
        return j != null ? r[j] || null : null;
      };

      const businessId = get("Business ID");
      const name = get("Business name");
      if (!name) {
        skipped++;
        continue;
      }

      const website = get("Website");
      const domain = extractDomain(website);

      batch.push({
        vainu_id: businessId,
        business_id: businessId,
        name,
        website,
        domain,
        industry:
          get("Main industry") ||
          get("Primary Industry") ||
          null,
        industry_codes: get("Primary Industry code") || null,
        employees: parseInt2(get("Reported employees")),
        revenue: parseInt2(get("Revenue (latest)")),
        city: get("City"),
        country: "SE",
        phone: get("Phone"),
        description:
          get("Description\nWebsite") ||
          get("Description\nLinkedIn") ||
          null,
        raw: {
          legal_entity: get("Legal entity"),
          size_linkedin: get("Predicted company size\nLinkedIn"),
          size_ml: get("Predicted company size\nVainu ML model"),
          custom_industries: get("Vainu Custom Industries (high class)"),
          technologies: get("Technologies"),
          linkedin: get("LinkedIn link"),
          group_name: get("Group name"),
          group_revenue: get("Group revenue"),
          visiting_city: get("Visiting city"),
        },
      });
    }

    if (batch.length === 0) continue;

    const { error } = await supabase
      .from("vainu_companies")
      .upsert(batch, { onConflict: "vainu_id", ignoreDuplicates: false });

    if (error) {
      console.error(`Batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  Importerade ${inserted} / ${rows.length - 1}…`);
    }
  }

  console.log(`\nKlart. ${inserted} importerade, ${skipped} skippade.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
