# Cron-jobb

Varje cron i detta repo måste dokumenteras här med:
- Tydlig ägare och syfte
- Schema
- Idempotent beteende
- Retry-strategi och timeout
- Loggning av start, slut, varaktighet, status, fel
- Felrapportering och larm vid upprepade fel
- Säker hantering av delvisa fel, aldrig tyst fel
- Job-lock mot dubbelkörning
- Dry-run för riskfyllda jobb
- Dokumentation: vad, hur ofta, läser/skriver, vid fel, om-körning, avstängning, verifiering

## Jobb
Inga dokumenterade än. Lägg till ett stycke per jobb: vad det gör, hur ofta, vad det läser, vad det
skriver, vad som händer vid fel, hur man kör om säkert, hur man stänger av, hur man verifierar.
