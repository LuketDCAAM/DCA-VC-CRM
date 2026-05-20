# Externalize agent instructions to Markdown

Today the agent's behavior is hard-coded in a single TypeScript template literal at the top of `supabase/functions/agent/index.ts`. Editing it requires touching code and redeploying. This plan moves the instructions into versioned markdown files that are easier for you to read, edit, and grow over time — and adds room for task-specific "playbooks" (e.g. bulk imports, weekly reviews, company research).

## What you'll be able to do after

- Open a `.md` file, edit the agent's rules in plain English, and the next chat turn picks them up.
- Add new playbooks (e.g. `playbooks/weekly-review.md`) without touching agent code.
- See the full prompt in one place, with proper formatting, headings, and diff-friendly history.

## File layout

```text
supabase/functions/agent/
  index.ts
  prompts/
    system.md              # core identity, tools, mutation/duplicate rules
    field-rules.md         # enums, numeric/date formatting, column hygiene
    bulk-operations.md     # when to use *_bulk tools
  playbooks/
    bulk-import-deals.md   # step-by-step recipe
    research-company.md
    weekly-review.md
    (add more over time)
```

## How it loads

- A new helper `loadPrompt()` in `supabase/functions/agent/prompt-loader.ts` reads the markdown files at function cold-start using `Deno.readTextFile(new URL("./prompts/system.md", import.meta.url))`.
- Dynamic values that today are interpolated into the template (the pipeline/round/vehicle enum lists) are injected via simple `{{PIPELINE_STAGES}}` placeholders so the markdown stays readable.
- Playbooks are concatenated under a `## Playbooks` section so the model sees them as reference recipes it can follow when the user's request matches.
- Edge functions bundle adjacent files automatically on deploy — no config changes needed.

## Migration steps

1. Create `prompts/system.md`, `prompts/field-rules.md`, `prompts/bulk-operations.md` containing the exact text from the current `SYSTEM_PROMPT` constant, split by topic. No behavior change.
2. Create three starter playbooks (`bulk-import-deals.md`, `research-company.md`, `weekly-review.md`) capturing patterns you already rely on.
3. Add `prompt-loader.ts` that reads + concatenates the files, substitutes `{{PIPELINE_STAGES}}` / `{{ROUND_STAGES}}` / `{{INVESTMENT_VEHICLES}}`, and caches the result per cold-start.
4. Replace the inline `SYSTEM_PROMPT` constant in `index.ts` with `const SYSTEM_PROMPT = await loadPrompt();` and remove the old template literal.
5. Smoke-test in the Approvals/Assistant flow: send "create 3 deals", verify bulk tool still fires; send "update deal X", verify duplicate rules still apply.

## Out of scope (can be follow-ups)

- A UI in the app to edit the markdown (would need an admin page + storage).
- Per-user or per-fund prompt overrides.
- Versioning/A-B testing of prompts.

## Technical notes

- Markdown is included verbatim in the model's `system` message; headings and bullets are fine, the model handles them well.
- File reads happen once per cold-start (cached in a module-level variable), so there's no per-request latency cost.
- Keeping placeholders (`{{...}}`) instead of importing TS constants into markdown means the enum lists stay the single source of truth in `_shared/action-schemas.ts` style files.
