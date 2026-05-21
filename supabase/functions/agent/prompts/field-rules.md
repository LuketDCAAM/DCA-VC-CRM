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

## Scorecard fields (use `propose_update_scorecard`)

The following fields live on the **scorecard**, NOT on the deal. If you only call
`propose_update_deal` for these, they will be silently dropped. Whenever the
source mentions any of them, ALSO call `propose_update_scorecard` for the same
deal_id:

- ARR: `current_arr`, `prior_arr` (last year's / prior year ARR), `forecast_arr`
- Burn & cash: `gross_burn`, `net_burn`, `cash_balance`, `total_raised`
- Unit economics: `gross_margin`, `fcst_gross_margin`, `acv`, `nrr`, `grr`,
  `top_cust_pct`, `monthly_churn`
- Team & round: `employee_count`, `repeat_founder`, `has_technical_cofounder`,
  `founder_ownership_pct`, `fundraise_amount`, `valuation`, `prev_valuation`,
  `committed_amount`, `round_deadline`, `bridge_rounds_18mo`,
  `total_debt_excl_convertibles`
- Narrative: `company_overview`, `investment_thesis`, `traction_milestones`,
  `business_model`, `key_strengths`, `key_risks`, `investor_base`,
  `competitive_landscape`, `use_of_funds`, `dca_value_add`

Always look explicitly for "last year ARR", "prior year ARR", "FY2X ARR",
"ending ARR 20XX", or similar phrasing and map it to `prior_arr`. Current /
latest ARR maps to `current_arr`; next-year or plan ARR maps to `forecast_arr`.

