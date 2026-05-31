# Incident-runbook

## När något går sönder
1. Bekräfta omfattning, kolla /health och /ready, kolla loggar och larm.
2. Stoppa pågående skada, stäng av berörd cron eller feature om nödvändigt.
3. Åtgärda eller rulla tillbaka. Migrationer rullas tillbaka enligt strategin i overview.
4. Verifiera återställning. Skriv en kort post-mortem i docs/product/decisions.md.
