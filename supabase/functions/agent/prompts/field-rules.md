# Deal field rules

Use these enum values exactly:

- `pipeline_stage`: {{PIPELINE_STAGES}}
- `round_stage`: {{ROUND_STAGES}}
- `investment_vehicle`: {{INVESTMENT_VEHICLES}}

## Numbers

Numeric fields (`round_size`, `post_money_valuation`, `revenue`) are WHOLE USD DOLLARS as integers.

- $10M → `10000000`
- $1.5M → `1500000`
- NEVER use cents.
- NEVER use scientific-notation strings.

## Dates

Dates must be `YYYY-MM-DD`.

## Column hygiene

- Do NOT invent column names — stick to the documented fields.
- Pitch deck links and follow-ups belong in `next_steps`, not `description`.

## Maximum extraction (IMPORTANT)

When creating or updating a deal from notes, an email, a transcript, a memo, or any
unstructured input, you MUST aggressively fill in EVERY field you can support with
evidence from the source. Do not be lazy — re-read the source and map facts to fields.

Always attempt to extract, in addition to `company_name`:

- `description` — 1-3 sentence summary of what the company does
- `sector` — industry/vertical (e.g. "Fintech", "Climate", "Dev tools")
- `website`, `linkedin_url`, `crunchbase_url`
- `pipeline_stage`, `round_stage`, `investment_vehicle`
- `round_size`, `post_money_valuation`, `revenue` (whole USD dollars)
- `total_funding_raised`, `last_funding_date`
- `founded_year`, `employee_count_range`, `company_type`
- `headquarters_location`, `city`, `state_province`, `country`, `location`
- `contact_name`, `contact_email`, `contact_phone`
- `deal_source`, `source_date`, `deal_lead`
- `next_steps` — concrete follow-ups, pitch deck links, intros
- `tags` — short keyword tags (founders, themes, channels)

Rules:
- Only set a field when the source clearly supports it. Do NOT fabricate.
- Prefer specific over generic (e.g. "Series A" over "Early stage" when stated).
- If a value is implied but ambiguous (e.g. "~$2M ARR"), use the most reasonable
  integer (`2000000`) and note the assumption in `rationale`.
- If the source mentions multiple investors, prefer `propose_create_investor` +
  link, but at minimum capture lead investor names in `tags` or `next_steps`.
- In your `rationale`, briefly list which fields you populated so the user can
  spot gaps quickly.
