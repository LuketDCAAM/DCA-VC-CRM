# Portfolio company check-in rhythm

Mirror the investor rhythm for portfolio companies: set how often you check in with each company, get a drafted check-in email that asks about its key numbers, and see where DCA can help.

## What you'll get
- **Rhythm per company**: monthly, quarterly, etc., on a chosen day. Pause/resume and "last contacted" work like they do for investors. You can set it from the company's detail window and from a new "Portfolio check-ins" panel on the Outreach page.
- **Overdue / due soon list** on the Outreach page, sorted by next due date.
- **Drafted check-in email** for each due company. It uses the latest quarter's numbers (ARR, burn, cash, runway, headcount, status) and asks for anything that's missing or old. It can go to Outlook like other drafts.
- **"Where we can help" hints**: rule-based flags from the numbers, for example cash runway under 9 months, ARR below target, falling NRR, rising churn, an "At Risk" status, or no update in more than one quarter. They show on the panel and feed into the draft (for example offering intros, fundraising help or hiring support).
- **Logging the reply**: marking a check-in as sent updates "last contacted". The company's KPI page still takes in the reply's numbers as it does today.

## Technical details
- New table `portco_cadences` (same shape as `investor_cadences`, keyed by `portfolio_company_id`, unique). Grants and RLS match investor cadences.
- Add a nullable `portfolio_company_id` to `outreach_follow_ups` so check-ins reuse the follow-up cards, Outlook push and the due-count badge. New purpose `portco_check_in` plus a seeded template.
- Reuse `computeNextDue` / `cadenceBucket` from `lib/outreach/constants.ts`. Add `lib/portfolio/assistSignals.ts` for the flag rules, with unit tests.
- Hook `usePortcoCadences`, `PortcoCadencePanel`, and a reused `CadenceSettingsDialog`. Add a "Portcos" tab on Outreach and a cadence control in `PortfolioDetailDialog`.
- `outreach-draft` adds a portfolio-company context: the latest quarter's metrics, targets and signals.
