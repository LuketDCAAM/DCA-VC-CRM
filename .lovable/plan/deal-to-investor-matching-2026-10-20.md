# Deal-to-investor matching

Pick one or more deals, see a ranked list of investors who fit each one, and send a drafted intro email to the investors you choose. This is the existing monthly investor note turned around: it starts from a deal instead of an investor.

## What you'll get
- **Start from deals**: a "Find investors" button on the Deals table (works on selected rows) and in each deal's detail window. A new "Match" page under Outreach lets you pick deals from a searchable list.
- **Ranked investor matches per deal**: each investor gets a fit score and plain reasons, for example "Focus on Healthcare", "Seed matches their stage", "Check size fits the round", "Same region", "Already looked at a similar deal".
- **Filters and controls**: minimum score, stage, sector, location, and check size. Investors who were already sent this deal, or who passed on it, are hidden; you can show them again with a switch. You can include or exclude investors by hand.
- **Respects the rhythm**: investors who heard from us recently show a "contacted 5 days ago" warning so nobody gets too many emails. You can still include them.
- **Send step**: choose investors, and one email is drafted per investor covering the selected deals that fit them. Drafts are written in your voice using the deal summary, scorecard highlights and the match reasons. You review them in the same draft editor, then push them to Outlook or copy them.
- **History**: each deal shows which investors it was sent to and when. The deal is linked to those investors, and their "last contacted" date updates when you mark the email as sent.

## How it flows
```text
Select deals -> Ranked investors per deal -> Pick investors -> Drafts (one per investor) -> Review -> Outlook / copy -> Mark sent
```

## Questions to confirm while building (defaults in brackets)
- Should one email per investor cover several deals? [yes, up to 4]
- Is the match score set by fixed rules only, or should the AI also re-rank? [fixed rules, with an optional AI "why this fits" sentence]

## Technical details
- Add `scoreInvestorForDeal` to `src/lib/outreach/matching.ts` by inverting the current scoring and reusing the stage-neighbour rules. Add location and past-interest signals (from `deal_investors` and earlier batch items for similar sectors). Add unit tests in `matching.test.ts` covering the sector, stage and check-size scores and the exclusion rules.
- Reuse `outreach_batches` / `outreach_batch_items` with a new batch `kind = 'deal_match'`, a small migration adding a `kind` column, defaulting to `'digest'`. Each item already stores `deal_ids` and `match_rationale`, so drafting, regenerating and pushing to Outlook work as they do today.
- When an item is marked sent, insert rows into `deal_investors` (de-duplicated) and update `investor_cadences.last_contacted_at`.
- New page `src/pages/OutreachMatch.tsx` and components `DealPicker`, `InvestorMatchList`, `MatchSendDialog`. Add entry points in `DealsBulkActions`/table selection and in `DealDetailDialog`.
- `outreach-draft` gets a `deal_match` mode with a deal-first prompt (intro framing, a short pitch for each deal, and the reasons it fits the investor).
