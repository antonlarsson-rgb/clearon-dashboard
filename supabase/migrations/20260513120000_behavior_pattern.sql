-- Beteende-mönster per person: decision_maker_evaluating, frequent_returner,
-- mail_engaged_only, etc. Skrivs av score-decay-cron via classifyBehaviorPattern.

ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS behavior_pattern TEXT;

CREATE INDEX IF NOT EXISTS idx_persons_behavior_pattern ON persons(behavior_pattern);

-- För identifiering: capture IP (truncerad till /24 för privacy + GDPR).
-- Indexerad så vi snabbt kan hitta vilka anonyma sessions som matchar
-- IP-prefixet av en känd Upsales-visit på samma företag.
ALTER TABLE web_sessions
  ADD COLUMN IF NOT EXISTS ip_prefix TEXT;
CREATE INDEX IF NOT EXISTS idx_web_sessions_ip_prefix ON web_sessions(ip_prefix);

ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS suggested_account_id UUID REFERENCES accounts(id),
  ADD COLUMN IF NOT EXISTS identification_method TEXT,
  ADD COLUMN IF NOT EXISTS identification_confidence NUMERIC(3,2);
-- identification_method: form | mail_link | ip_match | domain_match | upsales_contact | manual
-- identification_confidence: 0.00-1.00
