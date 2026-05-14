
# Agentic Workflows for the CRM — Roadmap

Goal: layer AI agents on top of the existing deals/investors/tasks data using Lovable AI Gateway + Vercel AI SDK in Supabase Edge Functions. Default autonomy is **mixed by risk**: research/reads are automatic, writes require user approval (or are auto-logged for undo).

---

## Phase 0 — Shared agent foundation (build once, reuse)

Before any individual workflow, we put the plumbing in place so every agent shares the same runtime, audit trail, and tool catalog.

1. **Enable Lovable AI Gateway** so edge functions can call models without per-provider keys.
2. **`agent_runs` table** — every agent invocation is persisted: id, user_id, agent_type (`triage` | `enrich` | `assistant` | `match` | `email`), trigger (`manual` | `on_change` | `chat`), input payload, status, model, token usage, created_at, completed_at.
3. **`agent_actions` table** — proposed/applied changes per run: run_id, action_type (`update_deal` | `create_task` | `score_deal` | `draft_email` | `match_investors`), target_id, payload (JSONB), status (`pending` | `approved` | `applied` | `rejected`), reviewer_id, applied_at. This is the "audit log + approval queue."
4. **Single `agent` edge function** that all workflows route through. Uses Vercel AI SDK `streamText` + `tool()` and the Lovable Gateway provider helper. `stopWhen: stepCountIs(50)`.
5. **Reusable tool library** (server-side, all gated by RLS / user_id):
   - `search_deals`, `get_deal`, `update_deal`, `score_deal`
   - `search_investors`, `get_investor`
   - `create_task`, `assign_task`, `list_open_tasks`
   - `add_call_note`, `list_call_notes`
   - `web_search` (Lovable web search)
   - `draft_email` (returns draft, never sends without approval)
   Mutating tools use `needsApproval` so writes land in `agent_actions` as `pending` for "Mixed by risk" autonomy.
6. **Tool deferral pattern** (`tool_search` + `tool_invoke`) so input tokens stay small as more tools are added.

---

## Phase 1 — Conversational CRM Assistant (first user-facing workflow)

Chat sidebar that can answer questions and propose actions across deals, investors, tasks. Best first ship — it exercises every tool and validates the foundation.

- New route `/assistant` + a slide-over panel reachable from the header.
- Vercel AI SDK `useChat` on the client, `streamText` on the server, render `message.parts` (so tool calls and approval prompts display inline).
- Threaded conversations stored in `agent_threads` / `agent_messages` (database persistence, scoped by user).
- Tool calls render as expandable cards (tool name, input, output). Mutations show an **Approve / Reject** card that writes to `agent_actions`.

Example prompts it should handle on day one:
- "Which deals haven't moved in 30 days in Diligence?"
- "Summarize all call notes for Acme and draft a follow-up email."
- "Find investors who write $500k–$1M into seed fintech."

---

## Phase 2 — Auto-score & enrich new deals

Triggered manually ("Run agent" button on a deal) and automatically when a deal is created.

- Supabase trigger on `deals` insert → enqueues an `agent_runs` row → background invocation of the agent function with `agent_type=enrich`.
- Agent flow: `web_search` company + founders → fill missing fields (website, location, sector, description) → propose `deal_score` + written rationale → write proposals to `agent_actions` as pending.
- Deal detail view gets an **"Agent suggestions"** panel that shows pending actions and lets the owner approve, edit, or reject. Approved suggestions are applied via existing update hooks.

---

## Phase 3 — Deal triage & next-step tasks

Manual button ("Triage my pipeline") on the Dashboard, plus a scheduled nightly run per user.

- Agent reads the user's deals + last call/task activity, identifies stale or at-risk deals using rules ("no activity 14d in Diligence", "scored ≥80 but no next step", etc.) plus LLM judgment.
- For each flagged deal, proposes a next action and creates a draft task assigned to the deal owner.
- Output shown as a "Triage report" (markdown, rendered in the assistant panel) with one-click apply on each suggested task. Applied tasks reuse the existing task-notification email path.

---

## Phase 4 — Investor matching + email drafting

Triggered from a deal's detail page ("Find investors") or from chat.

- Agent ranks investors by sector/stage/check-size fit, returns top 5–10 with reasoning.
- For each match, can draft a personalized intro email (subject + body) using deal context + investor profile. Drafts are saved to `agent_actions`; sending requires explicit user approval and goes through a new `send-investor-email` edge function (Resend, same pattern as task notifications). Nothing is sent without a click.

---

## Technical Details

- **Stack**: Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`) + Lovable AI Gateway. Default model `google/gemini-3-flash-preview`; bump to `openai/gpt-5` for harder reasoning steps.
- **Edge function**: `supabase/functions/agent/index.ts` — handles streaming chat, tool execution, run/action persistence. Validates JWT in code, scopes every tool query by `auth.uid()`.
- **Approval queue UI**: a single `AgentActionsPanel` component reused on Deal detail, Dashboard, and Assistant.
- **Web search**: server-side tool calling Lovable's web search; results summarized before being passed back to the model.
- **Cost control**: tool deferral (`tool_search` / `tool_invoke`) keeps prompts small even as catalog grows; `agent_runs` records token usage so we can show per-run cost.
- **Security**: agents never receive `SUPABASE_SERVICE_ROLE_KEY`; they use the caller's JWT so RLS continues to enforce row ownership.
- **No new connectors required for Phases 0–3.** Phase 4 reuses existing `RESEND_API_KEY`. Crunchbase/LinkedIn/Apollo can be added later behind the same tool interface if needed.

---

## Suggested order of implementation

```text
Phase 0  Foundation (tables, edge function, AI gateway, tool library)
Phase 1  Conversational Assistant + approval queue UI
Phase 2  Auto-score & enrich (manual + on-create trigger)
Phase 3  Triage & next-step tasks (manual + scheduled)
Phase 4  Investor matching + email drafting
```

Each phase is independently shippable. After Phase 1 you'll have a working agent platform you can extend just by adding tools — most future "workflows" become a new system prompt + a few tools, not new infrastructure.
