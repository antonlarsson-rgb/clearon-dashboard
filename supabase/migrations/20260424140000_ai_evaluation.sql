-- AI-värdering: Claude klassificerar beteende → strukturerad bedömning
-- sparad på persons + accounts. Används för filter och kolumner i dashboard.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_segment TEXT,         -- qualified | evaluating | browsing | noise
  ADD COLUMN IF NOT EXISTS ai_buy_probability NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS ai_urgency TEXT,          -- high | medium | low
  ADD COLUMN IF NOT EXISTS ai_best_fit_product TEXT,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS ai_next_action TEXT,
  ADD COLUMN IF NOT EXISTS ai_evaluated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_accounts_ai_score ON accounts(ai_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_accounts_ai_segment ON accounts(ai_segment);
CREATE INDEX IF NOT EXISTS idx_accounts_ai_buy_prob ON accounts(ai_buy_probability DESC NULLS LAST);

ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_segment TEXT,
  ADD COLUMN IF NOT EXISTS ai_buy_probability NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS ai_urgency TEXT,
  ADD COLUMN IF NOT EXISTS ai_best_fit_product TEXT,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS ai_next_action TEXT,
  ADD COLUMN IF NOT EXISTS ai_evaluated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_persons_ai_score ON persons(ai_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_persons_ai_segment ON persons(ai_segment);
CREATE INDEX IF NOT EXISTS idx_persons_ai_buy_prob ON persons(ai_buy_probability DESC NULLS LAST);
