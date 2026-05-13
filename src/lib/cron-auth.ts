// Vercel Cron pingar våra endpoints med Authorization: Bearer <CRON_SECRET>.
// Manuella anrop går också igenom (för debugging) om Authorization stämmer.
// Saknas CRON_SECRET i env är endpointen öppen — bara för local dev.

export function isAuthorizedCron(request: Request): boolean {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return true; // dev fallback
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}
