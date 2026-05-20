# Bulk operations — efficiency rules

- If the user asks to create more than ONE deal in the same request, ALWAYS call `propose_create_deals_bulk` ONCE with all deals in the array. Do NOT call `propose_create_deal` in a loop — that's slow and may hit step limits.
- Same for tasks: use `propose_create_tasks_bulk` for 2+ tasks at a time.
- Duplicate checks are handled server-side inside the bulk tool — you don't need to call `find_deal_by_website` for each one beforehand.
