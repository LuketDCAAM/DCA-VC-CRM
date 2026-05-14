# Analyst Agent — Plan

Builds on the existing `/assistant` (Phase 1). Adds an autonomous Analyst that ranks new deals against your thesis, pulls external research, and reads Notion call transcripts.

## 1. Investment Thesis (settings page)

New route `/settings/thesis` + table `investment_thesis` (one row per workspace, editable by admins). Fields:

- Sectors (multi), Stages (multi), Check size min/max
- Geographies (multi), Business models (multi)
- Must-haves (free text list), Deal-breakers (free text list)
- Scoring rubric weights (sector fit, stage fit, traction, team, market — 0-100, sums to 100)
- Free-form thesis narrative (markdown)

The agent reads this row at runtime and passes it into the system prompt + the scoring tool.

## 2. Connectors

- **Firecrawl** — connect via `standard_connectors--connect`. Used for `web_search` and `scrape_url` tools.
- **Notion** — connect via `standard_connectors--connect`. User picks the call-transcripts database ID, stored in `investment_thesis.notion_transcripts_db_id`.
- Lovable AI Gateway already wired (no change).

## 3. New agent tools (added to `supabase/functions/agent/index.ts`)

Read:
- `get_investment_thesis` — returns the thesis row
- `web_search(query)` — Firecrawl `/v2/search`
- `scrape_url(url)` — Firecrawl `/v2/scrape` (markdown)
- `notion_search_transcripts(deal_or_company)` — query the configured Notion DB
- `notion_get_page(pageId)` — fetch full transcript markdown

Write (proposals — go through existing `agent_actions` approval queue):
- `propose_score_deal` — already exists; extended to include `rubric_breakdown` JSON + `rationale`
- `propose_update_deal` — already exists (sector, stage, traction notes, etc.)
- `propose_create_task` — already exists (next steps)

## 4. Two new edge functions

- `analyst-run` — runs the full analyst loop for one deal. Inputs: `dealId`, `mode: 'auto' | 'manual'`. Loads thesis + deal + call notes + Notion transcripts, runs `streamText` with all tools, writes proposals into `agent_actions`. Returns the run summary.
- `on-deal-created` — DB trigger via `pg_net` (or Supabase webhook) calls `analyst-run` with `mode: 'auto'` whenever a row lands in `deals`.

## 5. UI changes

- **`/settings/thesis`** — form to edit thesis, connect Firecrawl/Notion, pick Notion DB.
- **Deal detail page** — new "Analyst" panel:
  - "Run Analyst" button (manual trigger)
  - Latest run: score, rubric breakdown, key findings, sources (citations), proposed next steps
  - Linked entries from the existing `agent_actions` approval queue
- **Header** — small badge on Assistant link showing pending analyst proposals.

## 6. Autonomy model

- New deal inserted → `on-deal-created` fires → analyst runs → writes proposals (score, enrich, tasks) into approval queue. Nothing is applied automatically.
- User can also click "Run Analyst" on any deal to re-run.
- Risky writes always go through the existing approve/reject UI (`useAgentActions`).

## Technical notes

- Stack: Vercel AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`), `stepCountIs(50)`.
- Firecrawl + Notion called server-side only (edge function), via connector gateway with `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key`.
- Thesis table: workspace-scoped, RLS so only approved users read, only admins write.
- New table `analyst_runs(id, deal_id, status, summary, score, rubric jsonb, sources jsonb, created_by, created_at)` to keep history beyond the proposal queue.
- Trigger uses `pg_net.http_post` to the `analyst-run` function with the service role key (stored as DB setting, not in a public table).

## Out of scope (next phase)

- Auto-applying any writes
- Slack/email notifications when proposals land
- Investor matching against the proposed deal (Phase 4)
