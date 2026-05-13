-- Cachad veckosammanfattning från Stellar. En rad per ISO-vecka (måndag som key).
CREATE TABLE IF NOT EXISTS weekly_stellar_updates (
  week_start DATE PRIMARY KEY,
  brief TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_summary JSONB
);

CREATE INDEX IF NOT EXISTS idx_weekly_stellar_generated_at
  ON weekly_stellar_updates(generated_at DESC);
