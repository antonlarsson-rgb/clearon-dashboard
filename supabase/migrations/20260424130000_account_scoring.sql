-- Account-level scoring. Aggregerar events där account_id är satt men person_id null
-- (t.ex. Upsales IP-identifierade företagsbesök). Kompletterar person-scoring.

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demo_readiness INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS top_product_slug TEXT,
  ADD COLUMN IF NOT EXISTS top_product_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_events INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS identified_persons_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_accounts_score ON accounts(score DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_lifecycle ON accounts(lifecycle_stage, segment);
CREATE INDEX IF NOT EXISTS idx_accounts_last_event ON accounts(last_event_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_accounts_demo_readiness ON accounts(demo_readiness DESC);

-- account_product_scores — affinity per produkt per konto
CREATE TABLE IF NOT EXISTS account_product_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, product_slug)
);

CREATE INDEX IF NOT EXISTS idx_aps_product_score ON account_product_scores(product_slug, score DESC);
CREATE INDEX IF NOT EXISTS idx_aps_account ON account_product_scores(account_id);

ALTER TABLE account_product_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read aps" ON account_product_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read aps" ON account_product_scores FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage aps" ON account_product_scores FOR ALL TO service_role USING (true);
