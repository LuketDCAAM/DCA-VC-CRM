
# Notion → Call Notes Integration

The existing workspace Notion connector authenticates only the workspace owner. Since every user needs to bring their own Notion workspace/transcripts, we need a **per-user OAuth** flow (not the Lovable connector). This will be built in phases.

## Phase 1 — Notion OAuth (per user)

**You'll need to do once (outside Lovable):**
1. Create a public Notion integration at https://www.notion.so/profile/integrations
2. Set redirect URI to `https://arfyltduzmkrzdxjnodb.supabase.co/functions/v1/notion-oauth-callback`
3. Provide `NOTION_OAUTH_CLIENT_ID` and `NOTION_OAUTH_CLIENT_SECRET` as secrets

**Build:**
- New table `user_notion_connections` (user_id, access_token (encrypted), workspace_id, workspace_name, workspace_icon, bot_id, connected_at) with RLS so each user sees only their own row
- Edge function `notion-oauth-start` — generates state, returns Notion auth URL
- Edge function `notion-oauth-callback` — exchanges code for token, stores row, redirects back to `/settings/integrations`
- Settings page `/settings/integrations` with "Connect Notion" / "Disconnect" UI showing workspace name + icon

## Phase 2 — Source selection

Once connected, the user picks where call notes live in Notion:
- Edge function `notion-list-sources` — uses the user's token to search pages/databases the integration has access to
- UI to pick a database (preferred — structured) or parent page; persist selection in `user_notion_connections.source_config` JSON (e.g. `{ type: 'database', id, title_prop, date_prop, content_prop, deal_prop }`)
- Property mapper UI: map Notion DB columns → `title`, `call_date`, `content`, optional `deal` link

## Phase 3 — Import / sync

- Edge function `notion-sync-call-notes` — pulls pages from the selected source (paginated, `last_edited_time` cursor), converts blocks → markdown, upserts into `call_notes`
- Dedup table `notion_sync_state` (user_id, notion_page_id → call_note_id, last_edited_time)
- Deal matching strategies (in order): explicit Notion relation/select → fuzzy match on company name → unassigned bucket the user can triage
- Trigger paths:
  - Manual "Sync now" button on `/settings/integrations` and on the call-notes panel
  - Scheduled cron (every 15 min) via `supabase/config.toml` cron
- Sync log table for visibility (rows imported, errors, last run)

## Phase 4 — Transcripts & enrichment (later)

- Detect transcript blocks (toggle named "Transcript", child page, or specific property) and store separately on `call_notes` (new `transcript` column)
- Pipe transcripts into the scorecard AI draft (already reads from `call_notes`) — no extra work once stored
- Optional: support Granola / Fireflies as additional sources later, same per-user OAuth pattern

## Technical notes

- Token storage: encrypt at rest using pgsodium or a `SERVICE_ROLE`-only edge function path; never expose token to client
- All Notion API calls go from edge functions using the user's stored token directly (NOT the Lovable connector gateway — gateway is workspace-scoped to the builder's account)
- RLS: `user_notion_connections` policies = `auth.uid() = user_id` for select/delete; insert only via edge function with service role
- Rate limit Notion (3 req/s) — batch with small delays in sync function

## Open questions

1. Do users keep call notes in a **Notion database** (structured, recommended) or free-form pages under a parent? Database makes mapping much cleaner.
2. How should we link a Notion call note to a deal? Options: (a) a Notion relation/select property the user maps, (b) auto-match by company name, (c) manual triage after import.
3. Sync frequency: every 15 min cron OK, or do you want webhook-style on-demand only?

I'll wait for the Notion integration credentials and your answers above before starting Phase 1.
