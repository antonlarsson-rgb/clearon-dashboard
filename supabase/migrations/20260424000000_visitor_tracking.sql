-- Visitor tracking: long-lived cookie-based visitor_id that survives across sessions.
-- Links anonymous behavior to contact_id once the visitor identifies.

CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,
  contact_id UUID REFERENCES contacts(id),

  -- identity hints (best-effort, may be filled before full contact exists)
  email TEXT,
  name TEXT,
  company TEXT,
  phone TEXT,

  -- aggregate behavior (updated by /api/tracking + /api/leads)
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  visits_count INTEGER DEFAULT 1,
  events_count INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  max_scroll_depth INTEGER DEFAULT 0,
  total_dwell_seconds INTEGER DEFAULT 0,

  -- scoring
  score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  demo_readiness INTEGER DEFAULT 0,
  segment TEXT DEFAULT 'cold',

  -- per-product affinity: { "sales-promotion": 42, "customer-care": 8, ... }
  product_affinities JSONB DEFAULT '{}',

  -- free-form signals list for explainability
  signals JSONB DEFAULT '[]',

  -- marketing attribution from first visit
  first_utm_source TEXT,
  first_utm_medium TEXT,
  first_utm_campaign TEXT,
  first_referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visitors_contact ON visitors(contact_id);
CREATE INDEX idx_visitors_score ON visitors(score DESC);
CREATE INDEX idx_visitors_demo_readiness ON visitors(demo_readiness DESC);
CREATE INDEX idx_visitors_last_seen ON visitors(last_seen DESC);
CREATE INDEX idx_visitors_email ON visitors(email);

-- Link web_sessions to visitor so scoring aggregates across sessions
ALTER TABLE web_sessions ADD COLUMN IF NOT EXISTS visitor_id TEXT;
CREATE INDEX IF NOT EXISTS idx_web_sessions_visitor ON web_sessions(visitor_id);

-- Vainu company data imported from CSV dump
CREATE TABLE vainu_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vainu_id TEXT UNIQUE,
  business_id TEXT,
  name TEXT NOT NULL,
  website TEXT,
  domain TEXT,
  industry TEXT,
  industry_codes TEXT,
  employees INTEGER,
  revenue BIGINT,
  city TEXT,
  country TEXT,
  phone TEXT,
  description TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vainu_domain ON vainu_companies(domain);
CREATE INDEX idx_vainu_name ON vainu_companies(name);
CREATE INDEX idx_vainu_business_id ON vainu_companies(business_id);

-- RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vainu_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read visitors" ON visitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read visitors" ON visitors FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage visitors" ON visitors FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated read vainu" ON vainu_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read vainu" ON vainu_companies FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage vainu" ON vainu_companies FOR ALL TO service_role USING (true);
