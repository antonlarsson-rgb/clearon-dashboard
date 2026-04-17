-- ClearOn Intelligence Dashboard: Initial Schema
-- All tables for lead scoring, CRM sync, analytics, and AI suggestions

-- Accounts (synced from Upsales)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upsales_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts (synced from Upsales)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upsales_id INTEGER UNIQUE NOT NULL,
  account_id UUID REFERENCES accounts(id),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  role_category TEXT,
  reports_to_contact_id UUID REFERENCES contacts(id),
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Opportunities (synced from Upsales)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upsales_id INTEGER UNIQUE NOT NULL,
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  stage TEXT NOT NULL,
  value DECIMAL,
  product_slug TEXT,
  close_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead scores (calculated by Edge Function)
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) UNIQUE,
  total_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  fit_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  signals JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product interest scores per contact
CREATE TABLE product_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  product_slug TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  signals JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, product_slug)
);

-- Web sessions (synced from GA4)
CREATE TABLE web_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  anonymous_id TEXT,
  page_path TEXT NOT NULL,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  duration_seconds INTEGER,
  timestamp TIMESTAMPTZ NOT NULL
);

-- Web events
CREATE TABLE web_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES web_sessions(id),
  event_name TEXT NOT NULL,
  page_path TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL
);

-- Ad campaigns (Meta, Google, LinkedIn)
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT NOT NULL,
  product_slug TEXT,
  status TEXT,
  budget DECIMAL,
  spend DECIMAL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  date DATE NOT NULL
);

-- Email/SMS events
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  campaign_name TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL
);

-- ClickUp tasks (synced from Stellar workspace)
CREATE TABLE clickup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clickup_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  assignee TEXT,
  priority INTEGER,
  due_date TIMESTAMPTZ,
  date_created TIMESTAMPTZ,
  date_updated TIMESTAMPTZ,
  date_closed TIMESTAMPTZ,
  list_name TEXT,
  folder_name TEXT
);

-- Weekly summaries (AI-generated)
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  tasks_completed INTEGER,
  tasks_in_progress INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_number, year)
);

-- AI suggestions
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  suggestion_type TEXT NOT NULL,
  category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  value_proposition TEXT,
  priority INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_role ON contacts(role_category);
CREATE INDEX idx_lead_scores_total ON lead_scores(total_score DESC);
CREATE INDEX idx_product_scores_product ON product_scores(product_slug);
CREATE INDEX idx_product_scores_score ON product_scores(score DESC);
CREATE INDEX idx_web_sessions_contact ON web_sessions(contact_id);
CREATE INDEX idx_web_sessions_timestamp ON web_sessions(timestamp DESC);
CREATE INDEX idx_web_events_session ON web_events(session_id);
CREATE INDEX idx_ad_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX idx_ad_campaigns_product ON ad_campaigns(product_slug);
CREATE INDEX idx_email_events_contact ON email_events(contact_id);
CREATE INDEX idx_clickup_tasks_status ON clickup_tasks(status);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clickup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data (dashboard users)
CREATE POLICY "Authenticated users can read accounts" ON accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read contacts" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read opportunities" ON opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lead_scores" ON lead_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read product_scores" ON product_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read web_sessions" ON web_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read web_events" ON web_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read ad_campaigns" ON ad_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read email_events" ON email_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read clickup_tasks" ON clickup_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read weekly_summaries" ON weekly_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read ai_suggestions" ON ai_suggestions FOR SELECT TO authenticated USING (true);

-- Also allow anon access for initial dev (remove in production)
CREATE POLICY "Anon can read accounts" ON accounts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read contacts" ON contacts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read opportunities" ON opportunities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read lead_scores" ON lead_scores FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read product_scores" ON product_scores FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read web_sessions" ON web_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read web_events" ON web_events FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read ad_campaigns" ON ad_campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read email_events" ON email_events FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read clickup_tasks" ON clickup_tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read weekly_summaries" ON weekly_summaries FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read ai_suggestions" ON ai_suggestions FOR SELECT TO anon USING (true);

-- Service role policies for Edge Functions (write access)
CREATE POLICY "Service role can manage accounts" ON accounts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage contacts" ON contacts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage opportunities" ON opportunities FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage lead_scores" ON lead_scores FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage product_scores" ON product_scores FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage web_sessions" ON web_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage web_events" ON web_events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage ad_campaigns" ON ad_campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage email_events" ON email_events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage clickup_tasks" ON clickup_tasks FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage weekly_summaries" ON weekly_summaries FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage ai_suggestions" ON ai_suggestions FOR ALL TO service_role USING (true);
