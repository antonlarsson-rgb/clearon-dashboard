# ClearOn Intelligence Dashboard

Lead scoring och sales intelligence-dashboard for ClearOn AB. Byggt av Stellar.

**Live:** https://clearon-dashboard.vercel.app
**Landing page:** https://clearon-dashboard.vercel.app/landing

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 + shadcn/ui-inspirerade komponenter
- Framer Motion for animationer
- Recharts for diagram
- Supabase (PostgreSQL, Auth, Edge Functions)
- Anthropic Claude API (Sonnet 4.6) for AI-agenten
- Vercel for deploy

## Kom igang

```bash
# Installera beroenden
npm install

# Kopiera env-filen och fyll i nycklar
cp .env.example .env.local

# Starta dev-servern
npm run dev
```

Oppna http://localhost:3000

## Miljovariabler

Se `.env.example` for alla nycklar som behovs. De viktigaste:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Supabase (provisionerad via Vercel)
- `ANTHROPIC_API_KEY` - For AI-agenten
- `UPSALES_API_KEY` - CRM-data
- `CLICKUP_API_KEY` / `CLICKUP_TEAM_ID` - Stellar task-synk
- `META_ACCESS_TOKEN` / `GOOGLE_ADS_*` - Annonsdata (kommer senare)

## Projektstruktur

```
src/
  app/
    (dashboard)/          # Dashboard (kravs inloggning)
      page.tsx            # / Oversikt (daily brief, KPIs, heta leads, AI-forslag, live feed)
      leads/
        page.tsx          # / Leads (tabell med scoring, filter, segment)
        [id]/page.tsx     # / Lead-profil (score-breakdown, org.karta, tidslinje)
      produkter/
        page.tsx          # / Produkter (6 ClearOn-produkter med leads per produkt)
        [slug]/page.tsx   # / Produktdetalj
      ai-agent/page.tsx   # / AI Agent (chat med tool-calling, split layout)
      kampanjer/page.tsx  # / Kampanjer (Meta/Google/LinkedIn, CPL, ROAS)
      kanaler/page.tsx    # / Kanaler (per-kanal oversikt)
      stellar/page.tsx    # / Stellar (ClickUp kanban, veckosammanfattning)
      installningar/      # / Installningar (integrationer, scoring-vikter, team)
    (landing)/
      landing/page.tsx    # Landningssida (portad fran clearon.live)
    api/
      ai-agent/route.ts   # AI Agent streaming API (mock, redo for Claude)
      tracking/route.ts    # Server-side event tracking -> Supabase
      leads/route.ts       # Lead submission -> contacts + lead_scores + product_scores
  components/
    ui/                   # Button, Card, Badge, ScoreBadge, Input, Checkbox, Slider
    dashboard/            # Sidebar, TopBar, DailyBrief, KpiCards, HotLeads, AiSuggestions,
                          # LiveFeed, LeadsTable, OrgChart, ScoreBreakdown, KanbanBoard, etc.
    landing/              # ConsentBanner, Footer, IceCreamPopup
  lib/
    mock-data.ts          # Realistisk mock-data (200 leads, 50 accounts, kampanjer, tasks)
    products.ts           # ClearOns 6 produktlinjer
    supabase.ts           # Supabase-klient (anon + service role)
    utils.ts              # cn(), formatNumber(), formatCurrency(), scoreColor(), timeAgo()
    tracking.ts           # Session tracking, UTM, Meta Pixel
    meta-pixel.ts         # Facebook/Meta pixel helpers
  hooks/
    use-tracking.ts       # React hook for event tracking

supabase/
  migrations/             # SQL-schema (12 tabeller)
  seed.sql                # Seed-data (50 accounts, 20 kontakter, scores, kampanjer, tasks)
```

## Supabase

Projektet ar kopplat till Supabase via Vercel-integrationen (`supabase-violet-leaf`).

### Databas-schema (12 tabeller)

- `accounts` - Foretag (synkas fran Upsales)
- `contacts` - Kontakter/leads
- `opportunities` - Affarsmojligheter
- `lead_scores` - Total score + engagement/fit/intent per kontakt
- `product_scores` - Score per produkt per kontakt
- `web_sessions` - Besok (fran GA4 + landningssidan)
- `web_events` - Klick, sidvisningar, nedladdningar
- `ad_campaigns` - Annonsdata (Meta, Google, LinkedIn)
- `email_events` - Mail/SMS-handelser
- `clickup_tasks` - Tasks fran Stellars ClickUp-workspace
- `weekly_summaries` - AI-genererade veckosammanfattningar
- `ai_suggestions` - AI-genererade forslag

### Kor migrationen manuellt

```bash
# Med psql (kraver libpq)
source .env.local
/opt/homebrew/opt/libpq/bin/psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/20260417000000_initial_schema.sql
/opt/homebrew/opt/libpq/bin/psql "$POSTGRES_URL_NON_POOLING" -f supabase/seed.sql
```

## Lead scoring-modell

Varje lead far en total score (0-100) baserad pa tre dimensioner:

- **Engagement (0-40):** Sidbesok, nedladdningar, mailinteraktion, annonsklick
- **Fit (0-30):** Bransch, foretagsstorlek, roll, geografi
- **Intent (0-30):** Besok pa kontaktsida/prissida, offertforfragan, aterkommande besok

Parallellt scoreas varje lead per produkt (Sales Promotion, Customer Care, Interactive Engage, Kampanja, Send a Gift, Clearing Solutions).

## Nasta steg

- [ ] Koppla riktig Upsales API (synka accounts, contacts, opportunities)
- [ ] Koppla riktig ClickUp API (synka tasks fran Stellars workspace)
- [ ] Koppla Claude API for AI-agenten (byt fran mock till riktig tool-calling)
- [ ] Koppla GA4 Data API for webbtrafik
- [ ] Koppla Meta/Google/LinkedIn Ads API:er
- [ ] Bygg Edge Functions for cron-synk (var 15 min Upsales, var 30 min ClickUp)
- [ ] Peka om clearon.live-domanen till Vercel
- [ ] Lagg till autentisering (Supabase Auth)
- [ ] Polish: Framer Motion-overgongar, loading states, Cmd+K sok, tomma states

## Deploy

Deployat till Vercel. Varje push till `main` triggar auto-deploy.

```bash
# Manuell deploy
vercel deploy --prod
```

## ClearOn AB

Sveriges marknadsledare inom kuponghantering och digitala kampanjverktyg sedan 1968. 55+ ar, ~149 MSEK omsattning, 49 anstallda. Clearar kuponger, presentkort, betalningar och vardeavier for 5 miljarder SEK arligen i samarbete med 6 000 butiker.

VD: Johnny Lonnberg. Moderbolag: DLF (Dagligvaruleverantorernas Forbund).

Dashboarden ar byggd for ClearOns B2B-saljteam. Inloggad anvandare: **Kaveh Sabeghi** (Sales Director).
