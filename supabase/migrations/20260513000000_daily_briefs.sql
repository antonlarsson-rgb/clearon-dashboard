-- Cachad daglig morgon-brief. En rad per datum (UTC). Cron skriver kl 06:00,
-- dashboarden läser därifrån.

CREATE TABLE IF NOT EXISTS daily_briefs (
  date DATE PRIMARY KEY,
  brief TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_summary JSONB
);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_generated_at ON daily_briefs(generated_at DESC);
