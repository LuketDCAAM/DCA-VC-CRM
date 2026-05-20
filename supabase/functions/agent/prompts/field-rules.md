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
