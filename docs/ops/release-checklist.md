# Release-checklista

Innan deploy måste detta passera:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm test:integration
- pnpm test:e2e
- pnpm build
- pnpm check
- env-validering, säkerhetskoll på beroenden
- migrationsstrategi klar, destruktiva migrationer dokumenterade
- rollback-instruktion finns

## Miljöer
Lokal, preview/staging, produktion. Separata env.
