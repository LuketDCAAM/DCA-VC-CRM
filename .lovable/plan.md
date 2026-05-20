## Why the Deals tab is slow

Findings from the codebase + DB:

- `fetchDeals` pulls **every column of every deal** (`select('*')`, `limit(MAX_SAFE_INTEGER)`) — currently 3,759 rows — on every Deals page load, with no pagination and no field projection.
- Stage distribution: **2,880 Inactive + 551 Passed = ~91% of all deals** live in two dead-end columns. The Kanban renders all of them anyway.
- `DealPipelineBoard` uses `@hello-pangea/dnd`, which does **not** virtualize. Every deal becomes a `<Draggable>` with a full Card subtree → thousands of DOM nodes + drag listeners on first paint.
- `DealCardMini` is declared **inside** the parent component, so it's a brand-new component identity on every render → React can't memoize, and `memo()` on the parent doesn't help.
- Several hot paths log on every render/filter: `fetchDeals` (10+ `console.log`s incl. dumping the full data array), `useOptimizedFilteredDeals` (`🔍 FILTERING DEALS` + `🔍 FILTERED RESULTS`), `DealsPageContent`, `Deals`, `DealsGrid`. Console output of large arrays is itself a measurable cost.
- `fetchDeals` makes an extra `rpc('is_user_approved')` round-trip on every load purely for debugging.
- No DB index on `pipeline_stage` (and full-table reads make `created_at` ordering scan everything).

## Plan

### 1. Trim the network payload (biggest win)

In `src/hooks/deals/fetchDeals.ts`:
- Replace `select('*')` with an explicit column list containing only the fields actually used by the table/grid/kanban/filters (company_name, pipeline_stage, round_stage, round_size, deal_score, next_steps, updated_at, created_at, source_date, scored_at, sector, country, state_province, city, location, deal_source, contact_name, description, last_call_date, total_calls, id, plus anything the detail dialog opens lazily).
- Drop the `limit(MAX_SAFE_INTEGER)` and the `count: 'exact'` — pass a real cap (e.g. 5,000) and let the detail dialog fetch the full row on demand.
- Remove the `is_user_approved` RPC and the verbose `console.log`s.

### 2. Exclude Inactive/Passed from the default working set

Add a default filter so the page initially loads only "active" pipeline stages (everything except `Inactive` and `Passed`). That alone drops the rendered set from 3,759 → ~330.
- Implement as a server-side filter in `fetchDeals` parameterised by stage list, OR
- Keep client-side but seed `activeFilters.pipeline_stage` with the active stages in `useDealsPageState`, with a UI toggle "Show archived (Inactive/Passed)" that opts back in.

### 3. Make the Kanban cheap to render

In `src/components/deals/DealPipelineBoard.tsx`:
- Move `DealCardMini` **out of** the parent function and wrap it in `React.memo` so cards don't re-render on every parent update.
- Cap visible cards per column (e.g. first 50) with a "Show N more" button per column. Dead-end columns (Inactive, Passed) get a collapsed/empty state by default.
- Memoize `formatCurrency` results via a stable formatter instance (already top-level — fine).

### 4. Remove debug noise from hot paths

Strip the `console.log`s from `fetchDeals.ts`, `useOptimizedFilteredDeals.tsx`, `DealsPageContent.tsx`, `Deals.tsx`, and `DealsGrid` render path (or guard them behind `import.meta.env.DEV` only when explicitly debugging).

### 5. DB index

Add a migration: `CREATE INDEX IF NOT EXISTS deals_pipeline_stage_idx ON deals (pipeline_stage);` and a composite `(pipeline_stage, created_at DESC)` to support stage-filtered ordered queries once #2 moves filtering server-side.

### Out of scope (not needed)

- No queue/background worker. The slowness is client-side rendering + payload size, not edge-function timeouts. (The `<lovable-stack-overflow>` queue suggestion does not apply here.)
- No change to the table/grid views' existing pagination/virtualization — they already work.

### Expected impact

- Initial Deals page load: ~1 large query of full rows → ~1 query of ~330 active deals with narrow columns. Should cut JSON payload by ~10×.
- Kanban first paint: thousands of Draggables → low hundreds. Drag interactions become snappy.
- Filter typing latency: removing per-keystroke console dumps of the full deals array noticeably improves INP.
