# Make the CRM Agent faster and less clunky

The agent works but feels heavy. Four real performance/UX problems are visible in the code, and each has a tight fix.

## Problems we'll fix

1. **Every chat turn replays the entire thread.** `agent/index.ts` loads ALL `agent_messages` for the thread on each request and ships them to the model. As threads grow this gets slow and expensive, and tool-result blobs balloon the prompt.
2. **Bulk operations explode into N tool calls.** "Add these 10 deals" forces 10+ `propose_create_deal` round-trips. With `stepCountIs(50)` we can hit the cap, and each propose hits 2 duplicate-check queries (`ilike '%domain%'` — non-indexable). This is the #1 reason the agent feels slow.
3. **"Approve all" is serial in the browser.** `Assistant.tsx` loops `for (const a of actions) await apply(a)`. 16 approvals = 16 sequential round-trips, plus the realtime channel re-fires `refresh()` after each one (and a 5s polling interval on top). The panel re-renders constantly.
4. **Approvals panel polls every 5s AND subscribes to realtime AND refetches on focus.** Triple-refresh. Now that realtime is enabled on `agent_actions`, polling is redundant.

## Proposed changes

### A. Slimmer chat context (edge function)
- Cap history to the last **20 messages** (configurable) instead of unbounded.
- Strip large `tool` parts older than the last 2 turns down to a one-line summary (`{ tool, ok: true }`) — keeps reasoning continuity, drops kilobytes.
- Switch model selector to a constant so we can A/B Gemini Flash vs. Pro from one place.

### B. Batch + indexed duplicate checks (edge function)
- Add `propose_create_deals_bulk({ deals: [...] })` — one tool call inserts N pending actions in a single round-trip. Update the system prompt: "for bulk imports, ALWAYS use the bulk tool."
- Add a Postgres migration: index `lower(regexp_replace(website, '^https?://(www\\.)?', ''))` and `lower(company_name)` for O(log n) duplicate lookups. Replace the `ilike '%domain%'` scans with exact lookups against the normalized domain.
- Add `propose_create_tasks_bulk` for the same reason.

### C. Server-side bulk apply (new edge function `apply-actions`)
- New function takes `{ action_ids: [...] }` and applies them inside a single transaction-like loop on the server (service role with `user_id` check). Returns `{ ok, failed }`.
- `Assistant.tsx` "Approve all" becomes ONE network call instead of N. Re-render once at the end.
- Single-row approve can still go through the existing client path, or also use the same endpoint.

### D. De-clunk the Approvals panel (`useAgentActions.tsx`)
- Remove the 5-second `setInterval` and the focus/visibility listeners. Realtime is enough now.
- Debounce realtime-triggered `refresh()` (250ms) so a bulk apply doesn't fire 16 fetches.
- Only fetch columns the panel renders, not `select('*')`.

### E. Better in-chat feedback
- In `AgentChat`, render tool parts with a compact "Proposing: Update deal Acme → score 78" row that shows immediately on `input-available`, instead of waiting for `output-available`. Users stop wondering "is it stuck?"
- Toast "X proposals ready" on stream finish so users know to check the side panel.

## Technical notes

- New tool shape:
  ```ts
  propose_create_deals_bulk: tool({
    inputSchema: z.object({
      deals: z.array(z.object({ company_name: z.string(), fields: DealFieldsSchema.optional(), rationale: z.string() })).max(50),
    }),
    execute: async ({ deals }) => { /* one .insert([...]) into agent_actions */ }
  })
  ```
- Migration sketch:
  ```sql
  create extension if not exists pg_trgm;
  create index if not exists deals_company_name_lower_idx on deals (lower(company_name));
  create index if not exists deals_website_domain_idx
    on deals (lower(regexp_replace(coalesce(website,''), '^https?://(www\.)?', '')));
  ```
- `apply-actions` reuses the per-table allow-lists currently in `useAgentActions.tsx` (move them to `supabase/functions/_shared/action-schemas.ts` so both sides import them).
- History trim: keep all `user`/`assistant` text parts; for older `tool` parts replace `output` with `{ summary: '...' }` before `convertToModelMessages`.

## Out of scope

- Switching models, adding new agent capabilities, changing the Approvals UI layout. This plan is purely about responsiveness.

## Expected impact

- "Add 10 deals" goes from ~10 sequential LLM tool calls + 20 ilike scans → 1 tool call + 1 indexed batch insert.
- "Approve all (16)" goes from 16 round-trips + 16 realtime refreshes → 1 round-trip + 1 refresh.
- Each chat turn payload shrinks (bounded history) → lower latency to first token.
- Panel feels live without the 5s flicker.
