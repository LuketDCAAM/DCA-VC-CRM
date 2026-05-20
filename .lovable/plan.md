
# DCA Investment Scorecard — In-App Migration

Replace the Excel workbook with a deal-attached scorecard inside the CRM. A team member uploads pitch decks, transcripts, data-room docs, and/or links; an AI agent drafts the full scorecard (inputs, qualitative ratings, narrative, hard-stop verdict, risk flags); the deal owner reviews, edits, and approves before it overwrites the live deal score.

## End-to-end flow

```text
Deal page → "Scorecard" tab
  │
  ├─ Uploads panel  ── decks, transcripts, financials, Notion/Drive URLs
  │      │                                  │
  │      └─ pitch-decks bucket + file_attachments + scorecard_documents
  │
  ├─ [Run AI Analyst]
  │      │
  │      ▼
  │   score-deal edge function
  │   (parses files → reads thesis + call_notes → calls Lovable AI Gateway
  │    with structured output → writes a DRAFT scorecard row)
  │
  ├─ Draft review panel
  │   Inputs · Quant metrics · Qualitative 1-5 · Narrative · Hard stops · Risk flags
  │   Each field shows AI value + rationale + source (deck p.4 / transcript / web)
  │
  └─ [Approve]
        → freezes draft as a versioned scorecard
        → updates deals.deal_score and scored_at
        → drops a row in agent_actions for the audit trail
```

## Data model

New tables (all RLS-scoped to approved users, like the rest of the app):

- `deal_scorecards` — one row per scorecard version per deal.
  - `id`, `deal_id`, `version`, `status` (`draft` | `approved` | `archived`), `is_current bool`
  - **Inputs** (every field from the workbook's `Inputs` sheet): sector, stage, geography, geography_tier, founding_year, deal_lead, vehicle, repeat_founder, has_technical_cofounder, fundraise_amount, valuation, prev_valuation, committed_amount, round_deadline, founder_ownership_pct, bridge_rounds_18mo, total_debt_excl_convertibles, current_arr, prior_arr, forecast_arr, gross_burn, net_burn, cash_balance, total_raised, gross_margin, fcst_gross_margin, acv, employee_count, nrr, grr, top_cust_pct, monthly_churn
  - **Narrative** (free text): company_overview, investment_thesis, traction_milestones, business_model, key_strengths, key_risks, investor_base, competitive_landscape, use_of_funds, dca_value_add
  - **Qualitative ratings** (jsonb `{market, product, business_model, team, exit}` each `{score:1-5, rationale, source}`)
  - **Per-metric notes** jsonb (DCA Notes column)
  - **Computed snapshot** jsonb: tiers, weighted scores, quant_total, qual_total, blended_score, classification, hard_stops, risk_flags, dilution, runway, ev_revenue, etc.
  - `ai_run_id` → `analyst_runs.id`, `approved_by`, `approved_at`, `created_by`, timestamps

- `scorecard_benchmarks` — sector × stage benchmark grid extracted from the workbook (`Reference & Benchmarks` tab).
  - `(sector, stage, metric)` unique, columns: `target_value`, `tier_thresholds jsonb`, `weight`, `inverted bool`, `notes`
  - Seeded from this Excel; admin-only editable via a new settings page.

- `scorecard_documents` — bridge between a scorecard and the source files the AI used.
  - `id`, `scorecard_id`, `file_attachment_id` (nullable), `external_url` (nullable), `kind` (`deck` | `transcript` | `financials` | `link`), `parsed_excerpt`, `parsed_at`

Reuse:
- `file_attachments` + the existing **pitch-decks** Storage bucket for uploads.
- `call_notes` (already deal-scoped) as a transcript source the agent reads automatically.
- `analyst_runs` and `agent_actions` for the run record and approval queue.

## Score engine (deterministic TypeScript)

Single module `src/lib/scorecard/engine.ts` mirroring the workbook formulas:

- `computeAutoCalcs(inputs)` → ev_revenue, runway, arr_per_employee, burn_to_round, implied_dilution, burn_multiple, company_age, annual_growth, mom_growth.
- `tierMetric(value, benchmark, inverted)` → 1-5 using the workbook's variance buckets (>25% → 5, >10% → 4, ±10% → 3, etc.).
- `computeQuantitative(inputs, benchmarks)` → per-metric `{tier, weight, adj_weight, wtd_score}` + total /25.
- `computeQualitativeTotal(ratings)` → sum of 1-5 ratings × 1 (max 25).
- `composite(qual, quant)` → `qual*2.4 + quant*1.6` → blended /100, plus band (`HIGHLY ATTRACTIVE` ≥80, `MODERATE FIT` ≥56, `BELOW THRESHOLD` ≥32, else `NO FIT`).
- `evaluateHardStops(inputs)` → stage cap (Series B+), sector exclusion (Pharma/MedDev), founder equity <20% pre-round, stagnancy >3.5yr + <$100K ARR.
- `evaluateRiskFlags(inputs)` → the 11 red/yellow rules from the workbook (cap-table impairment, missing technical co-founder for AI/Robotics, NRR<80% / churn>5%, ≥2 bridges in 18mo, single-thread revenue, excessive debt, high burn, zombie velocity, platform dependency, low GM, burn>25% of round).

This engine is imported by both the React UI (live recompute as the analyst edits inputs) and the edge function (final snapshot stored on approve).

## AI agent — `score-deal` edge function

New function `supabase/functions/score-deal/index.ts` built on the same AI SDK + Lovable Gateway pattern as `analyst-run`.

1. Load deal + active `investment_thesis` + last 10 `call_notes` for the deal.
2. Fetch all uploaded `scorecard_documents`: pull each file from Storage and pass to the document parser; for external URLs, fetch (Notion uses existing connector; Drive/Web via fetch tool).
3. Call the model with `streamText` + Zod `Output.object` schema that mirrors `deal_scorecards` (inputs, narrative, qualitative ratings each with `{score, rationale, source}`, manual risk-flag judgments like `platform_dependency`).
4. Run the deterministic engine on the model's inputs → produces tiers, totals, hard stops, blended score.
5. Insert a `deal_scorecards` row with `status='draft'`, link `scorecard_documents`, log `analyst_runs` row, and queue a single `agent_actions` row of type `approve_scorecard` so the existing approval UI surfaces it.
6. Always cite source per field (`deck:p4`, `transcript:Q&A`, `web:url`, `manual`).

## UI

New route `/deals/:id?tab=scorecard` (sibling to existing tabs).

`src/components/scorecard/`:
- `ScorecardTab.tsx` — version dropdown, status badge, "Run AI Analyst", "Edit", "Approve", "Export PDF".
- `UploadsPanel.tsx` — drag-drop for decks/transcripts/financials + paste-URL input; lists processed documents.
- `InputsForm.tsx` — every Inputs field, grouped (Company / Round / Financials / Auto-Calc read-only). Live recompute via engine.
- `QualitativePanel.tsx` — five categories, 1-5 selector each, rubric tooltip from the workbook, rationale textarea, AI-source chip.
- `QuantitativeTable.tsx` — metric × value × benchmark × tier × weighted score; expandable per-row DCA notes.
- `HardStopsCard.tsx` and `RiskFlagsCard.tsx` — show rule, data, verdict; manual override for "Platform Dependency".
- `NarrativePanel.tsx` — ten narrative sections with markdown.
- `CompositeScoreHeader.tsx` — qual /25, quant /25, blended /100, classification band, decision next-step.

Existing `AnalystPanel.tsx` gets a link to the new scorecard so the older 0-100 score and the new scorecard stay in sync; on approve, `deals.deal_score` is set to the blended score.

## Admin / settings

- `/admin/benchmarks` page (admin role only) — editable grid for `scorecard_benchmarks` seeded from the workbook.
- Hard-stop / risk-flag rules surfaced as readable rules but not yet user-editable (defer to v2).
- Investment Thesis MD page already exists and is admin-editable; agent reads it as system context.

## Phasing

1. **Migration + benchmarks seed** — create three tables, RLS, indexes, port the workbook benchmark grid via a one-shot seed script.
2. **Engine + types** — `src/lib/scorecard/engine.ts` + Zod types shared with the edge function.
3. **Scorecard UI (manual mode)** — tab, inputs form, live engine, narrative, qualitative, quant table, composite header, approve flow writing back to `deals.deal_score`. Usable end-to-end without AI.
4. **Uploads pipeline** — UploadsPanel wired to `pitch-decks` bucket + `scorecard_documents` + parser.
5. **AI `score-deal` edge function** — drafting + approval queue integration.
6. **Admin benchmarks page** — editable grid, audit who changed what.
7. **Polish** — PDF export of an approved scorecard styled like the workbook dashboard; version history view.

## Out of scope (now)

- Bulk-scoring across deals (per-deal only first).
- Editing hard-stop / risk-flag rule definitions in-app.
- Auto-running the scorecard on deal creation (the simpler `analyst-run` already does that; we'll wire auto-run after v1 lands).
