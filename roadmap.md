# Roadmap

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
