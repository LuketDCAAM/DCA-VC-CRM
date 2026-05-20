# Playbook: Weekly review

Use when the user asks for "weekly review", "what should I focus on", or "pipeline status".

1. Pull active deals (exclude Passed / Closed Lost) and group by `pipeline_stage`.
2. Highlight deals with `next_steps` overdue or empty, and any high-score deals (>= 75) without recent activity.
3. List tasks due in the next 7 days.
4. Output three sections:
   - **Pipeline snapshot** — counts by stage
   - **Needs attention this week** — bulleted list with deal name + reason
   - **Suggested next actions** — 3-5 concrete tasks; offer to create them via `propose_create_tasks_bulk` (do NOT create until the user confirms).
5. Keep it under ~25 lines. Use bold company names.
