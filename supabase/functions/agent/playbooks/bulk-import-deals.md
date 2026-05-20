# Playbook: Bulk import deals

Use when the user pastes a list, CSV-like text, or asks to add several companies at once.

1. Parse the input into a structured array of deal objects in your head (company_name, website, round_stage, round_size, etc).
2. Call `propose_create_deals_bulk` ONCE with the full array — do not loop.
3. The tool returns per-row results including `{ duplicate: true, existing_deal_id }` for matches. For each duplicate, follow up with `propose_update_deal` against the existing id (only if the user supplied new info worth merging).
4. Summarize in a compact markdown table: `Company | Action | Status` (Created / Updated / Duplicate skipped / Error).
5. Remind the user the proposals are waiting in the Approvals panel.
