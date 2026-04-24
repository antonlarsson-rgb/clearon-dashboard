#!/usr/bin/env bash
# Kör en Supabase-migration via psql.
# Användning: bash scripts/run-migration.sh supabase/migrations/file.sql

set -e

FILE="${1:-}"
if [ -z "$FILE" ]; then
  echo "Usage: $0 <migration-file.sql>"
  exit 1
fi

# Load .env.local
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [ -z "${POSTGRES_URL_NON_POOLING:-}" ]; then
  echo "POSTGRES_URL_NON_POOLING saknas i .env.local"
  exit 1
fi

PSQL="${PSQL:-/opt/homebrew/opt/libpq/bin/psql}"
if [ ! -x "$PSQL" ]; then
  PSQL="psql"
fi

echo "Kör $FILE…"
"$PSQL" "$POSTGRES_URL_NON_POOLING" -f "$FILE"
echo "Klart."
