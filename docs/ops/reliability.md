# Reliability

Produktionsmedveten från MVP, utan att överarbeta.

1. Varje viktigt flöde måste vara testbart.
2. Varje kritiskt jobb måste vara observerbart.
3. Varje integration måste hantera fel mjukt.
4. Varje env-variabel måste vara dokumenterad.
5. Varje schemalagd uppgift måste vara idempotent, loggad och säker att köra om.
6. Varje release måste passera automatiska kontroller före deploy.
7. Manuell testning är aldrig enda skyddsnätet.
8. Bygg MVP-snabbt, men produktionsmedvetet.

## Teststrategi
- Unit: ren affärslogik.
- Integration: API, databas och externa tjänster.
- E2E: de viktigaste användarresorna.
- Smoke: produktionshälsa.
- Regression: buggar som redan hänt.
- Agent-evals: AI-output, prompts och automationer.

## Minsta automatiska kontroller per ändring
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm test:integration
- pnpm test:e2e
- pnpm build
- pnpm check
