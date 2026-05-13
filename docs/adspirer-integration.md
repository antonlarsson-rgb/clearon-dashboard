# Adspirer Integration Brief

**For:** Agent working in `clearon-dashboard` repo
**Goal:** Plug the Adspirer MCP server into the existing AI Agent chat so users on `dashboard.clearon.live/ai-agent` can analyze and act on Meta + Google + LinkedIn ad campaigns through natural-language chat.

---

## Context

ClearOn (Stellar's client) runs paid social across Meta (live), and plans to add Google Ads and LinkedIn. Anton wants the existing AI Agent chat in this dashboard to become a multi-platform ads command center: ask Claude about ROAS, pause underperformers, draft new audiences, all in chat.

**Adspirer** (adspirer.ai) is a third-party MCP server that wraps Meta/Google/LinkedIn/TikTok ad APIs into a single endpoint with 175+ tools (37 Meta-specific). One Bearer token authenticates all platforms. Anton's account is on the **Plus** tier (150 calls/month). His Meta ad account `1771733670071985` is already connected and the API is verified working with 8 live (paused) campaigns visible.

---

## Current State

| File | What it does today |
|---|---|
| `src/app/api/ai-agent/route.ts` | **Mock-only.** Hardcoded SSE responses based on keyword matching in the user's message. No actual Anthropic API call. Tool schemas for future use are sitting commented-out at the top of the file. |
| `src/app/(dashboard)/ai-agent/page.tsx` | Chat UI. Sends `{messages: ChatMessage[]}` to `/api/ai-agent`, expects SSE stream of `data: {content: "..."}` chunks ending with `data: [DONE]`. |
| `src/app/(dashboard)/kampanjer/page.tsx` | Renders static campaign data from Supabase `ad_campaigns` table. Not in scope for this integration. |
| `package.json` | `@anthropic-ai/sdk` already installed (^0.90.0). |

---

## What to Build

### 1. Rewrite `/api/ai-agent/route.ts` to call Anthropic API with Adspirer MCP

**Replace the entire mock-response logic** with a real Anthropic Messages API call using the MCP connector.

Key requirements:

- **Model:** `claude-opus-4-7` (latest Opus)
- **Thinking:** adaptive (`thinking: {type: "adaptive"}`)
- **Streaming:** required (use `client.beta.messages.create({...stream: true})`)
- **MCP connector:** pass `mcp_servers` parameter with Adspirer URL + Bearer token
- **Beta header:** `mcp-client-2025-04-04`
- **Prompt caching:** wrap the system prompt in `{type: "text", cache_control: {type: "ephemeral"}}` for cost efficiency across turns
- **SSE format preserved:** the existing chat UI expects `data: {content: "..."}\n\n` chunks and `data: [DONE]\n\n` at the end. Don't change the wire format.

#### Skeleton code

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `Du är ClearOns AI-agent. Du hjälper Stellar och ClearOn-teamet att:
- Analysera annonsprestanda på Meta, Google och LinkedIn
- Föreslå optimeringar (budget, target, creative)
- Pausa underpresterande kampanjer (alltid efter bekräftelse)
- Skapa nya kampanjer (alltid i PAUSED status först)

Du har tillgång till Adspirer MCP-servern (Meta + Google + LinkedIn ad-tools).

Säkerhet:
- Bekräfta ALLTID med användaren innan du skapar kampanjer eller ändrar live-budgetar
- Skapa kampanjer i PAUSED status om inte användaren explicit godkänt aktivering
- Aldrig autoretry kampanjskapande vid fel

Svara på svenska om inte användaren skriver engelska. Använd inte em-dashes.`;

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages as Array<{ role: "user" | "assistant"; content: string }>;

  if (!messages || messages.length === 0) {
    return new Response("Messages required", { status: 400 });
  }

  const adspirerToken = process.env.ADSPIRER_TOKEN;
  if (!adspirerToken) {
    return new Response("ADSPIRER_TOKEN not configured", { status: 500 });
  }

  const stream = await client.beta.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    mcp_servers: [
      {
        type: "url",
        name: "adspirer",
        url: "https://mcp.adspirer.com/mcp",
        authorization_token: adspirerToken,
      },
    ],
    messages,
    stream: true,
    betas: ["mcp-client-2025-04-04"],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            // Match existing wire format: {content: "..."} per chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: event.delta.text })}\n\n`,
              ),
            );
          }
          // Optional: surface tool calls to UI as separate events
          // else if (event.type === "content_block_start" && event.content_block.type === "mcp_tool_use") { ... }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: `[Fel: ${msg}]` })}\n\n`),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Delete:** the entire `mockResponses` object, the `getMockResponse` function, and the commented tool schemas at the top. They're replaced by live MCP tools.

**Keep:** the existing `interface ChatMessage` type if used elsewhere; otherwise inline it.

---

### 2. Env config

Already added to `.env.example`:
```
ADSPIRER_TOKEN=sk_live_...
```

Anton needs to paste his actual token into `.env.local` (NOT commit). Token starts with `sk_live_`. He can find it at https://adspirer.ai/account.

Verify with:
```bash
grep "^ADSPIRER_TOKEN" .env.local | head -1
```

---

### 3. Adspirer skill (already in repo)

`.claude/skills/ad-campaign-management/SKILL.md` — Adspirer's official skill, dropped into this repo. It activates automatically when Claude Code is run in this directory and the user asks about ads. It documents all 175 tools, workflows for campaign creation/optimization/research, asset limits, safety rules, etc.

Use it as the source of truth for tool names and workflows. Don't reinvent the patterns documented there.

---

### 4. `.mcp.json` (already in repo)

`.mcp.json` declares Adspirer as a project-local MCP server for Claude Code (the CLI agent — separate from the app's runtime use). With it, the agent working in this repo can also test Adspirer tool calls directly while coding. Reads token from `$ADSPIRER_TOKEN` env var.

---

## Testing

After env is set and route rewritten:

1. **Smoke test the chat UI:**
   ```
   npm run dev
   # navigate to dashboard.clearon.live/ai-agent (or localhost:3000/ai-agent)
   # ask: "Vilka Meta-kampanjer har vi aktiva just nu?"
   ```
   Expected: Claude calls `list_meta_campaigns`, returns table of campaigns from Anton's ad account.

2. **Cross-platform test:**
   - Add Google + LinkedIn at https://adspirer.ai/connections first
   - Then ask: "Ge mig en cross-platform performance dashboard senaste 30 dagarna"
   - Expected: Claude calls `get_meta_campaign_performance`, `get_campaign_performance` (Google), `get_linkedin_campaign_performance` and presents a unified table.

3. **Action test (with caution):**
   - Ask: "Pausa kampanjen Wallet Smarkify"
   - Expected: Claude confirms before calling `pause_meta_campaign`. User must say yes.

4. **Quota awareness:**
   - Plus tier = 150 calls/month. Test calls count toward this.
   - Check usage anytime: ask Claude "vad är min Adspirer-quota?"

---

## Safety Rules (from the SKILL.md)

These are NOT advisory — they're required:

1. **Always confirm with the user** before creating campaigns or changing spend.
2. **Never retry campaign creation automatically** on error. Show the error to the user.
3. **Never modify live budgets** without explicit user approval.
4. All campaigns created in **PAUSED status** when possible.
5. When in doubt about any spend-affecting action, **ask first**.

These are enforced via the system prompt and Claude's own behavior, but the agent (you) should also make sure prompt edits don't loosen them.

---

## ClearOn Codebase Conventions (from CLAUDE.md / AGENTS.md)

- **No em-dashes** anywhere in code or UI text (use `-` or `—` → never `—`)
- **Swedish characters** (å, ä, ö) must be used in Swedish text — not transliterated to a/o
- **Env vars must be read at runtime**, not module-load (otherwise empty on Vercel)
- **Trim env vars:** `process.env.FOO?.trim()` is the safe pattern (trailing newlines from Vercel env)
- **Next.js 16 calls middleware "proxy"** — export `proxy()` not `middleware()`

Apply the trim pattern to `ADSPIRER_TOKEN`:
```ts
const adspirerToken = process.env.ADSPIRER_TOKEN?.trim();
```

---

## Deploy

After verifying locally:

1. Push `ADSPIRER_TOKEN` to Vercel:
   ```bash
   vercel env add ADSPIRER_TOKEN production
   # paste sk_live_... when prompted
   ```
2. Deploy: `vercel --prod` (per CLAUDE.md, GitHub auto-deploy is off)
3. Test at https://dashboard.clearon.live/ai-agent (basic auth: admin/password per CLAUDE.md)

---

## Scope for This Pass

**In scope:**
- Rewrite `/api/ai-agent/route.ts` with real Anthropic + Adspirer MCP
- Add env var, verify on Vercel
- Test the basic chat flow

**Out of scope (next pass):**
- Update `/kampanjer` page to show live Adspirer data (currently Supabase-only)
- Add tool-call visualization (showing which MCP tools Claude is using mid-stream)
- Persist conversation history (currently per-session only)
- TikTok integration (Adspirer supports it but ClearOn doesn't run TikTok ads yet)

---

## Quick Reference Links

- Adspirer dashboard (manage connections, view quota): https://adspirer.ai
- Adspirer Meta docs: https://www.adspirer.com/docs/ad-platforms/meta-ads
- Anthropic MCP connector docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Skill file: `.claude/skills/ad-campaign-management/SKILL.md`
- MCP config: `.mcp.json`

---

## Definition of Done

- [ ] `/api/ai-agent/route.ts` calls Anthropic API with `mcp_servers: [adspirer]`
- [ ] `ADSPIRER_TOKEN` is set in `.env.local` and Vercel production env
- [ ] User can ask "lista mina Meta-kampanjer" and get real data from the ad account
- [ ] User can ask Claude to pause a campaign and Claude confirms before acting
- [ ] No regressions on the existing chat UI (SSE format preserved)
- [ ] Quota counter visible: ask "vad är min Adspirer-quota?" returns current usage
- [ ] Deployed to dashboard.clearon.live and tested live
