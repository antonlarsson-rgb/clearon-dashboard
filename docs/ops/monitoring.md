# Monitoring

Övervaka minst: app-uptime, API-fel, misslyckade cron-jobb, långsamma jobb, misslyckade externa anrop,
auth-fel, betalningsfel om relevant, AI-agent-fel eller lågkonfidens-output.

## Health checks
Varje deploybar app exponerar /health (uptime), /ready (beroenden), /version (build).
