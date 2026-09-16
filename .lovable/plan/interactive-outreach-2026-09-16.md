# Interactive Outreach

Turn the CRM from a record-keeper into something that nudges you and hands you ready-to-send emails. Two flows:

1. **Founder follow-ups** — set a follow-up date on a deal, and on that date a personalized draft is waiting.
2. **Monthly investor digests** — the app proposes 3-4 deals per investor, you approve, and it writes a tailored email to each.

Sourcing/screening ("find deals we aren't seeing") stays out of scope for now.

## Founder follow-ups

- On any deal, a **Schedule follow-up** action: pick a date, who owns it (you or a teammate), the purpose (metrics check-in, post-call recap, re-engage after quiet period, pass note), and any extra context.
- Each follow-up appears on a new **Outreach** page: Due today, Upcoming, Drafted, Sent, Snoozed. Assigned items show up for the owner.
- When a follow-up comes due, a draft is written using what the CRM already knows: last call notes, stage, round, scorecard highlights, next steps, and who at the firm owns the relationship. Tone and length follow a house style you can edit.
- You review the draft inline: edit subject/body, regenerate with a nudge ("shorter", "ask about ARR"), snooze, or mark done.
- Drafts are written for the owner's own mailbox, so it reads as if you wrote it.

## Monthly investor digests

- A **Monthly digest** action on the Investors page: choose the month and which investors to include.
- For each investor, the app proposes 3-4 deals matched on their sector focus, preferred stage, check size, and geography, with a one-line reason per match. You swap, remove, or add deals before drafting.
- It then writes one email per investor: short intro, then a paragraph per deal framed for that investor's thesis. Each is editable, and you can regenerate individually.
- The batch view shows every investor's status (proposed / approved / drafted / sent) so nothing gets missed.

## Investor follow-up cadence

So you're never overwhelmed, each investor carries their own contact rhythm:

- On an investor record, set a cadence: monthly, every two months, quarterly, twice a year, yearly, or none — plus the day it should land (e.g. the 1st, or "first Monday").
- Only investors actually due in the chosen month are pulled into that month's digest; everyone else is skipped automatically. You can still add someone manually.
- A cadence overview on the Investors page shows who's due this month, who's coming up, and who's overdue, with a warning when someone hasn't been contacted in over a cadence period.
- A pause switch (with an optional "resume on" date) keeps an investor out of rotation without losing their settings.
- Last-contacted is taken from their most recent sent outreach or logged call, so the schedule reflects real contact, not just the calendar.



## Getting drafts into Outlook

Every draft lands in your Outlook **Drafts** folder, ready to review and hit send from your own mailbox. Because your Microsoft email connection is still waiting on IT approval, the app is built Outlook-ready:

- Until the connection is live, drafts live in the CRM with **Copy** and **Open in email** buttons, and the Outreach page shows a "Connect Outlook to sync drafts" banner.
- The moment the connection is approved, drafts push to Outlook automatically — including any that were queued while it was disconnected. No rework needed.

## Delegation

- Follow-ups and digest sends can be assigned to any teammate; drafts are generated for and appear in the owner's mailbox.
- Reassigning discards the old draft and regenerates in the new owner's voice.
- Owners get the same in-app notification treatment as existing task assignments.

## Technical notes

**Data**
- New `outreach_follow_ups`: deal/investor link, purpose, due date, owner, status (`scheduled` / `drafting` / `drafted` / `sent` / `snoozed` / `done`), snooze date, generated subject/body, outlook draft id, sync status. RLS scoped to owner or creator, mirroring `reminders`. GRANTs for `authenticated` + `service_role`.
- New `outreach_batches` + `outreach_batch_items` for the monthly investor digests (batch = month + status; item = investor, selected deal ids, match rationale, draft subject/body, outlook draft id, status).
- New `outreach_templates`: per-purpose house-style prompt/tone, editable in settings, seeded with sensible defaults.
- New `investor_cadences`: investor id, interval (`monthly` / `bimonthly` / `quarterly` / `semiannual` / `annual` / `none`), anchor day rule, paused flag, resume date, last_contacted_at (maintained from sent outreach and `call_notes`), next_due_at. RLS on owner/creator; GRANTs for `authenticated` + `service_role`.


**Generation**
- New edge function `outreach-draft`: given a follow-up id or batch item id, gathers deal/investor context (`deals`, `call_notes`, `deal_scorecards`, `contacts`, `investors`, `file_attachments` metadata), builds the prompt from `outreach_templates`, calls the shared `_shared/ai-provider.ts` (BYOK key first, workspace Anthropic key as fallback), and writes the draft back.
- New edge function `outreach-match`: scores each deal against an investor's `preferred_sectors` / `preferred_investment_stage` / `average_check_size` / location using the existing `sectorUtils` split logic, returns top candidates with rationale. Deterministic scoring first, AI only for the rationale wording.

**Outlook sync**
- Extend `supabase/functions/outlook-app-user/index.ts` with a `create_draft` action: `POST /me/messages` via `callAsAppUser` with the owner's stored connection key, saving the returned draft id. Existing `outlook_connections` storage and `useOutlookAppUser` connection check are reused.
- A `sync_status` column plus a "Push to Outlook" retry action covers drafts created while disconnected; when a user connects, queued drafts for that user are pushed.

**Frontend**
- New `src/pages/Outreach.tsx` with follow-up queue tabs and the digest batch view, added to `AppSidebar`.
- New `src/components/outreach/` — `FollowUpDialog`, `FollowUpCard`, `DraftEditor` (subject/body + regenerate + copy + push-to-Outlook), `DigestBuilderDialog` (investor picker, per-investor deal suggestions with swap), `DigestBatchView`.
- New hooks `useFollowUps`, `useOutreachBatches`, `useOutreachDraft` following existing patterns; realtime subscriptions use the stable-channel-name convention from `useDealsSubscription`.
- Deal detail dialog and investor detail dialog each get a "Schedule follow-up" entry point.
- `CadenceSettingsDialog` on the investor record plus a `CadenceOverviewPanel` (due / upcoming / overdue) on the Investors page; `useInvestorCadences` computes `next_due_at` and pre-selects due investors in the digest builder.

## Build order

1. Tables, RLS, grants, seeded templates.
2. Follow-up scheduling + Outreach queue page (no AI yet).
3. `outreach-draft` function + draft editor.
4. Outlook draft push, with the disconnected fallback and queued-push-on-connect.
5. Investor cadence settings + overview, then matching and the monthly digest batch flow.
6. Assignment, notifications, and template settings.

