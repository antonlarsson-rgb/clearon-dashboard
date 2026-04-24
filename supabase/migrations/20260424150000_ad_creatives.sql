-- Utökad ad_campaigns-tabell med creative-fält för visuell kampanjvy

ALTER TABLE ad_campaigns
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS body_copy TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS creative_image_url TEXT,
  ADD COLUMN IF NOT EXISTS destination_url TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS creative_format TEXT DEFAULT 'single-image',  -- single-image | carousel | video
  ADD COLUMN IF NOT EXISTS audience_name TEXT;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status_platform ON ad_campaigns(status, platform);
