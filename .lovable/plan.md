# Let the agent edit its own instruction markdown (with approval)

Today the prompts live as files inside the deployed edge function (`supabase/functions/agent/prompts/*.md` and `playbooks/*.md`). Those files are read-only at runtime — they only change on redeploy. To let the agent itself propose edits that you approve, we move the markdown into the database and add a new `propose_*` tool that flows through the existing Approvals panel.

## What you'll be able to do after

- Ask the agent: "Update the bulk-import playbook to also dedupe by company name" → it drafts the new markdown, creates a pending action, you click Approve, the next chat turn uses the new instructions.
- Edit prompts yourself from a simple admin page (Settings → Agent Instructions) without touching code or redeploying.
- See full version history of every prompt edit.

## Data model

New table `agent_prompts`:

| column | type | notes |
| --- | --- | --- |
| `id` uuid pk | | |
| `slug` text unique | e.g. `prompts/system`, `playbooks/weekly-review` | |
| `kind` text | `prompt` or `playbook` | |
| `title` text | human label | |
| `body` text | the markdown | |
| `updated_at` timestamptz | | |
| `updated_by` uuid | references `auth.users` | |

New table `agent_prompt_versions` (append-only history): `id, prompt_id, body, created_at, created_by, change_note`.

RLS: readable by any authenticated user in the workspace; writes only via the `apply-actions` edge function (service role).

Seed migration copies the current 6 markdown files into `agent_prompts` rows so behavior is unchanged on day one.

## Agent changes

1. **Loader switch** — `prompt-loader.ts` queries `agent_prompts` (ordered: prompts first, then playbooks) instead of reading files. Same `{{PIPELINE_STAGES}}` substitution. Cached per cold-start with a 60s TTL so approved edits show up quickly without spamming the DB.
2. **New tool** `propose_edit_prompt({ slug, new_body, change_note })`:
   - Validates the slug exists.
   - Inserts an `agent_actions` row with `kind = 'edit_prompt'`, payload `{ slug, new_body, change_note, old_body_preview }`.
   - Returns `{ proposed: true }`. Agent tells user it's in the Approvals panel.
3. **System prompt addendum** — new short section telling the agent: "You may propose edits to your own instructions via `propose_edit_prompt`. Use it when the user asks you to remember a rule, add a playbook step, or change how you handle a task. Always pass the FULL new body, not a diff."

## Approvals flow

- `apply-actions` edge function gets a new branch for `kind = 'edit_prompt'`:
  1. Update `agent_prompts.body` for the matching slug.
  2. Insert a row in `agent_prompt_versions` with the prior body.
  3. Invalidate the in-process prompt cache (best-effort; 60s TTL guarantees pickup on next cold-start).
- Existing Approvals panel renders the action; we add a custom preview that shows a diff (old vs new) using a lightweight inline diff component. Approve / Reject buttons reuse the current handlers.

## Admin UI (small)

New route `/settings/agent-instructions`:

- Left: list of prompts + playbooks (grouped).
- Right: monaco-lite textarea with markdown preview tab and a "Save" button.
- Save → also inserts into `agent_prompt_versions`. No approval required for direct human edits (you're already authenticated).
- "History" drawer lists prior versions with restore button.

## Migration steps

1. DB migration: create `agent_prompts` + `agent_prompt_versions`, RLS policies, seed rows from current markdown.
2. Update `prompt-loader.ts` to query the table; delete the file-reading path. Keep the markdown files in the repo for one release as a backup, then remove.
3. Add `propose_edit_prompt` tool definition in `agent/index.ts` and a one-paragraph addition to `prompts/system.md` (which the seed then carries into the DB).
4. Extend `apply-actions/index.ts` with the `edit_prompt` branch.
5. Add the Approvals panel renderer for `edit_prompt` (diff preview).
6. Build `/settings/agent-instructions` page + route + nav entry.
7. Smoke test: ask the agent "remember that we never invest in crypto" → approve → confirm next turn refuses a crypto deal.

## Out of scope

- Per-user prompt overrides (everyone in the workspace shares one set).
- Branching / A-B testing of prompts.
- Letting the agent create brand-new playbook slugs on its own (v1: agent can only edit existing slugs; humans create new ones from the admin UI).

## Technical notes

- The 60s loader cache means an approved edit takes up to a minute to take effect on warm instances. We can drop this to 10s or invalidate via a Postgres NOTIFY if you want instant pickup.
- Diff rendering uses `diff` (npm) — small dep, ~5KB.
- `agent_prompt_versions` is append-only; no delete UI. Good for auditability.
