# Track step-ups and financials over time

## Where things stand today

Time-series financials already exist: `portco_quarterly_metrics` stores one row per company per quarter (ARR, revenue, margin, burn, cash, headcount, NRR/GRR, churn, targets, status), and the Financials tab compares companies for a chosen quarter. What's missing is **time**: no charts over history, and no valuation history at all.

Valuation today is only two things: `investments` (the rounds we wrote a check into, with post-money and price per share) and `current_valuations` (a single current snapshot per company). So there is no full round history, no price-per-share step-up math, and no quarterly valuation marks. That part needs to be built.

## What gets built

### 1. Round history per portfolio company (new)
A new table holding **every** financing round for a portco, whether or not we participated:
round name/type, close date, price per share, pre-money, post-money, amount raised, lead investor, our participation flag and our amount/shares, plus notes and a source field.

Step-up per round = price per share ÷ prior round's price per share (post-money multiple shown alongside as a secondary read). Also computed: implied step-up vs. our own entry round, months between rounds, and cumulative step-up since first investment.

Entry: an inline editor (add/edit/delete rounds) inside the portco detail dialog, plus a CSV importer with a downloadable template, matching the pattern already used for positions and quarterly financials. Existing `investments` rows can be seeded into the round history in one click so nothing is retyped.

### 2. Quarterly valuation marks (extends existing quarterly data)
Add valuation fields to the quarterly record: mark date/basis, company valuation at mark, our ownership %, our FMV, and mark method (last round, secondary, DCF, write-down). This makes MOIC / TVPI / unrealized value chartable quarter by quarter instead of only "as of now". The current FMV on the position keeps working — it becomes the latest mark, so nothing breaks.

Both the quarterly form and the financials CSV template gain these columns.

### 3. New "Trends" tab on Portfolio
- **Step-up chart**: price per share by round date, with the step-up multiple labelled between rounds; per company, and a portfolio-wide median step-up by round stage.
- **Metric over time chart**: pick a metric (ARR, revenue, net burn, cash, runway, headcount, margin, NRR) and one or more companies, plotted by quarter. Indexed view option so companies of different sizes are comparable.
- **Valuation over time**: invested vs. FMV vs. realized, and MOIC/TVPI by quarter, per company and portfolio-wide.
- **Step-up table**: every round for every portco with step-up multiple, months since prior round, and our participation — sortable and CSV exportable.

### 4. Portco detail dialog
New "Valuation history" section: round-by-round table with step-ups, and a small sparkline of ARR and FMV over the quarters reported.

## Technical notes

- Migration adds `portco_funding_rounds` (owner-scoped RLS mirroring `portfolio_positions`, with GRANTs) and new valuation columns on `portco_quarterly_metrics`.
- All money stays in **cents**, percentages as decimals, consistent with `kpiFields.ts` / `metrics.ts`.
- Step-up and time-series math goes in a new `src/lib/portfolio/timeseries.ts` (round chains, step-up multiples, indexed series, MOIC-by-quarter), unit-testable and separate from components.
- New hooks: `useAllPortcoRounds` (all rounds, grouped by company, realtime) alongside the existing `useAllPortcoQuarters`.
- Charts use Recharts with the existing `--chart-1`..`--chart-5` pink-to-purple tokens.
- Rounds where price per share is missing fall back to post-money step-up and are flagged in the UI rather than silently dropped.
