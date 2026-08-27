# Portfolio Management Tool

Turn the Portfolio page from a simple company list into a working portfolio-management workspace modeled on your DCA Master Valuation workbook: position-level valuation, quarterly KPIs per portco, and performance status with AI commentary.

## What you get

### 1. Position detail (Positions tab in the workbook)
Each portfolio company gains the fields your Positions tab tracks:
sector, stage, vehicle (Balance Sheet, Fund I, SPV - DCA Led, SPV - Third Party, Co-Invest), lifecycle status (Active, Exited - Strategic, Exited - Financial, Exited - IPO, Written Off, Defunct, On Hold), first/last investment date, total invested, current FMV, realized proceeds, ownership %, and notes.

Derived automatically (never typed in): unrealized value, MOIC, TVPI, DPI, vintage year.

### 2. Portfolio dashboard
Top-of-page KPI tiles: Total Invested, Current FMV, Realized, Unrealized, TVPI, DPI, Net MOIC, # Positions, # Active — matching the workbook Dashboard.
Below: a By Vehicle roll-up table (#, Invested, FMV, Realized, Unrealized, MOIC, TVPI, DPI, % of NAV) and a By Vintage roll-up, plus a status distribution chart.

### 3. Positions table
A sortable, filterable table view (toggle against the existing card grid) with the same columns as your Positions tab, filters on vehicle / status / sector / stage / vintage, and CSV export.

### 4. Quarterly KPIs per portco
A quarter-by-quarter grid per company (2024Q1 forward), with:
- Core metrics: revenue, ARR, gross margin, gross burn, net burn, cash balance, runway (auto), headcount, NRR, GRR, monthly churn, customer count
- Custom KPIs: define your own metric per company (name, unit, direction) and track it quarterly alongside the core set
- Plan vs actual: optional target per metric per quarter so variance can be computed
- QoQ / YoY growth computed automatically; a trend sparkline per metric

Entry two ways: a quarterly update form per company, and a CSV/Excel import of a quarterly template covering all portcos at once (template downloadable from the app).

### 5. Performance status (auto + AI commentary)
Each quarterly record gets a computed RAG status:
- **On Track** — growth at/above target, runway >= 12 months, no plan miss
- **Watch** — runway 6-12 months, growth softening, or 10-25% below plan
- **At Risk** — runway < 6 months, negative growth, or >25% below plan
Rules are transparent (shown on hover) and you can override the status manually with a reason; the override is preserved.

An "AI quarterly commentary" button drafts a short summary per portco per quarter from that quarter's KPIs, the prior quarter's trend, and the company's call notes — reusing the same AI provider setup as the scorecard. You review and can edit before it saves.

### 6. Portco detail
The company dialog gets tabs: Overview (position + valuation), Quarterly KPIs, Performance (status history + commentary timeline), Investments, Notes, Files.

## Not in this phase
NAV roll-forward bridge, cash flow ledger, and Fund I economics/waterfall (fees, capital calls, LP commitments, carry). Those are a natural phase two once positions and KPIs are live.

## Technical notes
New tables (all RLS-protected, with grants and updated_at triggers):
- `portfolio_positions` — one row per portfolio company: sector, stage, vehicle, position_status, first/last investment date, current_fmv, realized_proceeds, ownership_pct, notes. New enums `portfolio_vehicle` and `position_status`.
- `portco_kpi_definitions` — custom KPI definitions per company (label, unit, higher_is_better, sort order).
- `portco_quarterly_metrics` — one row per company per quarter (`fiscal_year`, `fiscal_quarter`), core metric columns plus `custom_metrics jsonb`, `targets jsonb`, `performance_status`, `status_override`, `status_reason`, `ai_commentary`, `computed jsonb`.

Money stays in cents to match the existing `investments` / `current_valuations` convention; percentages stored as decimals.

Frontend:
- `src/lib/portfolio/metrics.ts` — pure functions for MOIC/TVPI/DPI/unrealized, runway, QoQ/YoY, RAG status. Unit-testable, no DB access.
- Hooks: `usePortfolioPositions`, `usePortcoQuarters`, `usePortfolioRollups` (vehicle/vintage aggregation), all with realtime invalidation matching the existing pattern.
- Components under `src/components/portfolio/`: `PortfolioKpiTiles`, `VehicleRollupTable`, `VintageRollupTable`, `PositionsTable`, `QuarterlyKpiGrid`, `QuarterlyUpdateDialog`, `PerformanceStatusBadge`, `QuarterlyImportDialog`.
- Edge function `portco-quarterly-commentary` for the AI draft, following `fill-scorecard-blanks`.

Existing invested-deal sync, delete, and CSV import keep working; nothing is removed.

## Build order
1. Migration for the three tables + enums
2. Metrics library + position fields UI (portco detail Overview)
3. Positions table + dashboard roll-ups
4. Quarterly KPI grid + update form + custom KPIs
5. Status engine + override
6. Excel/CSV quarterly import
7. AI commentary edge function + UI
