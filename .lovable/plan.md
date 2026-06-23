## Goal

Let each user paste their own Anthropic API key so every AI call the app makes (agent chat, scorecard fill, analyst run, deal scoring) runs on Claude under **their** account and is billed to **them**, not to the workspace's Lovable AI credits.

Quick terminology note: this isn't actually MCP — MCP is for exposing tools to an AI client like Claude Desktop. What you're describing is "bring your own key" (BYOK) for the app's existing AI agent. The plan below implements BYOK; happy to also add a real MCP server later if you want Claude Desktop to reach into the CRM.

## What we'll build

### 1. Per-user credentials storage
New table `user_ai_credentials`:
- `user_id` (PK, FK to auth)
- `provider` ('anthropic' for now, leaves room for openai/gemini later)
- `api_key` (encrypted via pgsodium; only accessible to the owning user and service role)
- `default_model` (e.g. `claude-sonnet-4-5`, `claude-opus-4-5`, `claude-haiku-4-5`)
- `created_at`, `updated_at`, `last_used_at`, `last_status`

RLS: user can only see/update their own row. Service role (edge functions) reads to make calls.

### 2. Settings UI
New section in Profile / Settings:
- "Connect your Claude account" panel
- Input for Anthropic API key (masked, with link to console.anthropic.com)
- Model dropdown (Sonnet / Opus / Haiku)
- "Test connection" button (calls a small edge function that pings Anthropic with the key)
- Status badge: Connected / Not connected / Last error
- Disconnect button

### 3. Edge function changes
Add a shared helper `_shared/ai-provider.ts` that, given the caller's user id:
1. Looks up their `user_ai_credentials`
2. If a valid Anthropic key exists, returns an `@ai-sdk/anthropic` model bound to that key
3. Otherwise falls back to the existing Lovable AI gateway (or returns an error, configurable)

Wire this helper into:
- `agent/index.ts` (chat agent — `streamText` / tools)
- `fill-scorecard-blanks/index.ts`
- `analyst-run/index.ts`
- `score-deal/index.ts`

Each function updates `last_used_at` / `last_status` after a call so the settings UI can show health.

### 4. UX in chat
- If the user has no key connected, the agent shows a one-time banner: "Using shared AI credits — connect your Claude account in Settings to use your own."
- Errors from Anthropic (401, 429, quota) surface as friendly inline messages with a link back to settings.

## Technical details

- Use `npm:@ai-sdk/anthropic` inside Deno edge functions — same AI SDK shape as today, only the model factory changes, so existing tool-calling / streaming code stays intact.
- Encryption: use pgsodium `pgp_sym_encrypt`/`decrypt` with a key stored in vault; edge functions decrypt via a `SECURITY DEFINER` SQL function scoped to the calling user.
- No key ever returned to the browser after save — UI only shows "•••• last 4".
- Audit: a `user_ai_credentials_events` log row on connect / disconnect / test / failure.
- Models exposed initially: `claude-sonnet-4-5` (default), `claude-opus-4-5`, `claude-haiku-4-5`. Configurable list in one place.

## Out of scope (ask if you want them)

- Real MCP server exposing CRM data to Claude Desktop
- OpenAI / Gemini BYOK (table is structured to allow it later)
- Per-call cost tracking dashboard
