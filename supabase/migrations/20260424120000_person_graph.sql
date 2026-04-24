-- Person graph: master identity-lager + unified event log + per-produkt scoring.
-- Sitter OVANPÅ befintliga contacts/accounts/visitors. Contacts behålls som Upsales-länkad
-- kontaktdata, persons är den unika identiteten som stitchar web-cookies, Upsales,
-- Meta/LinkedIn etc. En person kan ha 0 eller 1 contact.

-- =====================
-- PERSONS
-- =====================
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- primär identitet
  primary_email TEXT UNIQUE,
  primary_phone TEXT,

  name TEXT,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  role_category TEXT,
  linkedin_url TEXT,

  -- länkar till befintliga tabeller
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),

  -- Upsales-specifikt
  upsales_contact_id INTEGER UNIQUE,
  journey_step TEXT,

  -- cachad scoring (recompute uppdaterar)
  score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  demo_readiness INTEGER DEFAULT 0,

  -- lifecycle
  lifecycle_stage TEXT DEFAULT 'prospect',  -- prospect | customer | at_risk | dormant | churned
  segment TEXT DEFAULT 'cold',              -- hot | warm | curious | cold
  is_customer BOOLEAN DEFAULT false,
  has_purchased BOOLEAN DEFAULT false,

  -- top produkt (cachad)
  top_product_slug TEXT,
  top_product_score INTEGER DEFAULT 0,

  -- aktivitet
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  total_events INTEGER DEFAULT 0,
  visits_count INTEGER DEFAULT 0,

  -- ursprung
  source TEXT,                  -- upsales | vainu | web | manual | form
  first_utm_source TEXT,
  first_utm_campaign TEXT,
  first_referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_persons_email ON persons(primary_email);
CREATE INDEX idx_persons_score ON persons(score DESC);
CREATE INDEX idx_persons_demo_readiness ON persons(demo_readiness DESC);
CREATE INDEX idx_persons_lifecycle ON persons(lifecycle_stage, segment);
CREATE INDEX idx_persons_last_event ON persons(last_event_at DESC NULLS LAST);
CREATE INDEX idx_persons_account ON persons(account_id);
CREATE INDEX idx_persons_top_product ON persons(top_product_slug, top_product_score DESC);

-- =====================
-- PERSON_IDENTITIES (stitching keys)
-- =====================
CREATE TABLE person_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,

  -- identity_type: email | phone | visitor_cookie | upsales_anon_id | linkedin | meta_hash | domain
  identity_type TEXT NOT NULL,
  identity_value TEXT NOT NULL,

  verified BOOLEAN DEFAULT false,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),

  UNIQUE(identity_type, identity_value)
);

CREATE INDEX idx_identities_person ON person_identities(person_id);
CREATE INDEX idx_identities_value ON person_identities(identity_value) WHERE identity_type = 'email';
CREATE INDEX idx_identities_type ON person_identities(identity_type);

-- =====================
-- EVENTS (unified log — alla källor)
-- =====================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,

  -- source: web | upsales_visit | upsales_mail | upsales_activity | upsales_order | upsales_opportunity | vainu | meta | linkedin | form
  source TEXT NOT NULL,

  -- event_type: page_view | mail_open | mail_click | ad_click | form_submit | demo_booked | order_placed |
  --             opportunity_stage_change | journey_step_change | product_expand | quiz_complete | scroll_depth | lead_submitted
  event_type TEXT NOT NULL,

  product_slug TEXT,
  metadata JSONB DEFAULT '{}',

  -- score-vikt vid inmatning (base; decay applicerar vid scoring)
  weight INTEGER DEFAULT 0,
  intent_weight INTEGER DEFAULT 0,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_person_time ON events(person_id, occurred_at DESC);
CREATE INDEX idx_events_account_time ON events(account_id, occurred_at DESC);
CREATE INDEX idx_events_source_type ON events(source, event_type);
CREATE INDEX idx_events_product ON events(product_slug, occurred_at DESC) WHERE product_slug IS NOT NULL;
CREATE INDEX idx_events_occurred ON events(occurred_at DESC);

-- dedupe-nyckel för backfill (undvik dubbletter vid re-run)
CREATE UNIQUE INDEX idx_events_dedupe ON events(source, event_type, (metadata->>'external_id'))
  WHERE metadata->>'external_id' IS NOT NULL;

-- =====================
-- PERSON_PRODUCT_SCORES (cachade per-produkt-affiniteter)
-- =====================
CREATE TABLE person_product_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,

  score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,

  event_count INTEGER DEFAULT 0,
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(person_id, product_slug)
);

CREATE INDEX idx_pps_product_score ON person_product_scores(product_slug, score DESC);
CREATE INDEX idx_pps_person ON person_product_scores(person_id);

-- =====================
-- RLS
-- =====================
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_product_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read persons" ON persons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read persons" ON persons FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage persons" ON persons FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated read identities" ON person_identities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read identities" ON person_identities FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage identities" ON person_identities FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated read events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read events" ON events FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage events" ON events FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated read pps" ON person_product_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read pps" ON person_product_scores FOR SELECT TO anon USING (true);
CREATE POLICY "Service manage pps" ON person_product_scores FOR ALL TO service_role USING (true);
