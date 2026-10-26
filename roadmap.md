# Roadmap

## Deals loading speed
- [ ] Remove redundant work and optimize the measured loading bottlenecks without changing filters or views.
- [ ] Run targeted checks; signed-in verification depends on external Supabase access.

## Current ownership performance
- [x] Verify performance saves, refresh before closing, and calculate the holding's value multiple from current ownership.
- [x] Run ownership/save regression tests (8 passed; investment regressions also passed).
- [ ] Verify signed-in performance editing — external unmanaged Supabase prevents authenticated testing here.

## Investment saves
- [x] Refresh the open company details after investment saves and verify affected-row results.
- [x] Run investment refresh regression tests (3 passed; preview build OK).
- [ ] Verify saving and reopening investments while signed in — external unmanaged Supabase prevents authenticated testing here.

## Bulk Outlook drafts
- [x] Add one action for all ready, unsynced drafts owned by the signed-in user, with progress and partial-failure feedback.
- [x] Test eligibility and bulk processing (6 passing tests; preview build OK).
- [ ] Verify bulk creation in the user's Outlook Drafts folder — external unmanaged Supabase prevents authenticated testing here.

## Draft creation error
- [x] Restore missing Supabase service binding and redeploy draft/Outlook functions.
- [x] Fix sign-in check in draft, Outlook, scoring and fill-blanks functions (token passed explicitly).
- [ ] Verify investor draft generation while signed in — blocked on the user's retry because external Supabase authenticated testing is unavailable.

## Interactive Outreach (in progress)
- [x] Tables: outreach_follow_ups, outreach_templates, outreach_batches, outreach_batch_items, investor_cadences (+ seeded templates)
- [x] Follow-up scheduling + Outreach queue page
- [x] outreach-draft edge function + draft editor
- [x] Outlook draft push with disconnected fallback + queued push on connect
- [x] Investor cadence settings + overview
- [x] Investor matching + monthly digest batch flow
- [x] Assignment to teammates, template settings

## Blocked
- Microsoft/Outlook email connection needs IT approval (multi-tenant Azure registration + Graph admin consent). Drafts queue in the CRM until then.

## Back burner
- Sourcing/screening: find deals we are not seeing, auto-screen and auto-delegate.
- [x] Portfolio company check-in rhythm (Outreach → Portcos)

## Deals tab redesign
- [x] List view + pipeline board redesign (header, stats, view toggle, board cards)
