## Problem

Every recent `create_deal` action from the agent has `status = failed`, but the stored `error` column is the literal string `"[object Object]"`, so we can't see what's actually wrong. Root cause is in `src/hooks/agent/useAgentActions.tsx`:

```ts
error: String(e)   // PostgrestError → "[object Object]"
```

On top of that, the agent's `propose_create_deal` accepts a free-form `fields: Record<string, unknown>`, with nothing pinning it to the actual `deals` schema. The model is currently sending:
- `next_steps` duplicating the deck URL (fine, but noisy)
- `pipeline_stage: "Inactive"` (valid enum, OK)
- `round_size` as a number (OK)
- but no validation against the real column list / enum values, so any typo (e.g. `stage: "Seed"` instead of `round_stage`, or `pipeline_stage: "Sourced"`) silently lands in the queue and blows up only on apply.

Finally, once an action is `failed`, the UI has no way to retry after we fix the payload.

## Plan

### 1. Capture real Postgres errors (the actual bug)

In `src/hooks/agent/useAgentActions.tsx`:
- Replace `String(e)` with a helper that extracts `message`, `details`, `hint`, `code` from a `PostgrestError` and falls back to `JSON.stringify`.
- Also surface the error string in the Assistant approvals panel (already shown for failed items — just need real text).

### 2. Constrain the agent's `propose_create_deal` / `propose_update_deal` payload

In `supabase/functions/agent/index.ts`:
- Tighten the Zod schema for `propose_create_deal.fields` to an explicit object with the real `deals` columns (description, sector, website, linkedin_url, location, contact_name/email/phone, deal_source, source_date, next_steps, round_size, post_money_valuation, revenue, tags, founded_year, headquarters_location, employee_count_range, etc.).
- Use `z.enum([...])` for `pipeline_stage`, `round_stage`, `investment_vehicle` so the model can only pick valid values:
  - pipeline_stage: Inactive, Watchlist, Initial Review, Scorecard, Decision Making, One Pager, Due Diligence, Memo, Legal Review, Invested, Passed
  - round_stage: Pre-Seed, Seed, Series A, Series B, Series C, Bridge, Growth
  - investment_vehicle: Preferred Equity, Common Equity, Convertible Note, SAFE Note, Other
- Same treatment for `propose_update_deal.changes` (partial of the same shape).
- Update the system prompt to tell the model which fields and enum values exist.

### 3. Strip unknown keys before insert/update (defense in depth)

In `useAgentActions.tsx`, before `supabase.from("deals").insert(...)`, filter `payload` to a known allow-list of `deals` columns so any leftover junk the model adds (e.g. `stage`, `valuation`, `deck_url`) gets dropped instead of crashing the insert.

Same allow-list applied to `update_deal`, `create_investor`, `update_investor`, `create_contact`, `update_contact`, `create_task`.

### 4. Let the user retry failed actions

In `src/components/agent/AgentActionsPanel.tsx` (and the Assistant page tab):
- For `failed` actions, show the real error message and add a "Retry" button that calls `apply()` again after we flip status back to `pending`.
- Add an "Edit payload" affordance later if needed — not in scope now.

### Technical details

- Files touched:
  - `src/hooks/agent/useAgentActions.tsx` — better error capture, payload allow-list, retry helper
  - `src/components/agent/AgentActionsPanel.tsx` — show real error text, Retry button
  - `src/pages/Assistant.tsx` — pass retry through; show failed count
  - `supabase/functions/agent/index.ts` — Zod enums + explicit field schema + prompt update

- No DB migration required; this is all client + edge-function code.

- Verification: after the fix, re-run one of the failed actions; if it still fails, the panel will display the real Postgres message (e.g. "invalid input value for enum pipeline_stage: …") and we can iterate from there.
