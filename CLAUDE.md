@AGENTS.md

# ClearOn Intelligence Dashboard + Landing Pages

## Projekt
Lead intelligence dashboard + publika landningssidor for ClearOn AB, byggt av Stellar.

## Domaner
- `clearon.live` - Publika landningssidor (proxy rewrites till /site)
- `dashboard.clearon.live` - Dashboard (basic auth: admin/password)
- Deploy: `vercel --prod` (GitHub auto-deploy ej aktivt)

## Arkitektur

### Routing (src/proxy.ts)
Hostname-baserad routing via Next.js 16 Proxy (inte "middleware"):
- clearon.live -> /site (landningssidor)
- dashboard.clearon.live -> / (dashboard med basic auth)
- Produktslugs: sales-promotion, customer-care, engage, kuponger, etc.

### Landningssidor (src/components/landing-v2/)
16 sektioner: ColdTrafficFilter, SiteNav, Hero, PackagesHub, MixItUp, GamesSection, UseCases, FitQuiz, SmsDemo, HowItWorks, ProductExplorer, RoiCalculator, StoreFinder, Testimonials, CtaFooter, SignalProvider.

SignalProvider wrappar allt och ger useSignal() for behavior tracking.
Signal-panel synlig med ?debug=1 i URL:en.

### Dashboard (src/app/(dashboard)/)
Hamtar riktig data fran Upsales CRM via src/lib/dashboard-data.ts.
5 min cache. Kontakter kategoriseras (glass_lead, landing_page, mg_leverantor, etc.)

### API-integrationer
- Upsales CRM: src/lib/upsales.ts (sok, skapa, uppdatera kontakter + aktiviteter)
- Lead submission: /api/leads (Supabase + Upsales sync)
- Tracking: /api/tracking (web events till Supabase)
- Meta Pixel: src/lib/meta-pixel.ts (pixel-ID ej satt an)

## Regler
- ALDRIG anvand em-dashes i kod eller UI-text
- Env-variabler maste lases vid runtime (inte module-load), annars blir de tomma pa Vercel
- UPSALES_API_KEY maste trimmas (.trim()) pga trailing newline i Vercel env
- Next.js 16 kallar middleware for "proxy" - exportera `proxy()` inte `middleware()`
- Svenska tecken (a, a, o) maste anvandas i all svensk text
