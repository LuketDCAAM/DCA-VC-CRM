// Shared outreach vocabulary: follow-up purposes, statuses and investor cadence math.

export type FollowUpPurpose =
  | 'check_in'
  | 'post_call_recap'
  | 're_engage'
  | 'pass_note'
  | 'investor_digest';

export const FOLLOW_UP_PURPOSES: { value: FollowUpPurpose; label: string; hint: string }[] = [
  { value: 'check_in', label: 'Metrics check-in', hint: 'Ask for an update on progress and key numbers' },
  { value: 'post_call_recap', label: 'Post-call recap', hint: 'Recap the call and confirm next steps' },
  { value: 're_engage', label: 'Re-engage', hint: 'Restart a conversation that went quiet' },
  { value: 'pass_note', label: 'Pass note', hint: 'Politely decline, keep the door open' },
  { value: 'investor_digest', label: 'Investor note', hint: 'Share deals with a co-investor' },
];

export function purposeLabel(purpose: string | null | undefined) {
  return FOLLOW_UP_PURPOSES.find((p) => p.value === purpose)?.label ?? 'Follow-up';
}

export type FollowUpStatus = 'scheduled' | 'drafting' | 'drafted' | 'sent' | 'snoozed' | 'done';

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  scheduled: 'Scheduled',
  drafting: 'Drafting',
  drafted: 'Draft ready',
  sent: 'Sent',
  snoozed: 'Snoozed',
  done: 'Done',
};

export type SyncStatus = 'pending' | 'queued' | 'synced' | 'error' | 'not_connected';

// ---------------------------------------------------------------- cadence

export type CadenceInterval =
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'none';

export const CADENCE_INTERVALS: { value: CadenceInterval; label: string; months: number | null }[] = [
  { value: 'monthly', label: 'Monthly', months: 1 },
  { value: 'bimonthly', label: 'Every 2 months', months: 2 },
  { value: 'quarterly', label: 'Quarterly', months: 3 },
  { value: 'semiannual', label: 'Twice a year', months: 6 },
  { value: 'annual', label: 'Yearly', months: 12 },
  { value: 'none', label: 'No cadence', months: null },
];

export function intervalMonths(key: string | null | undefined): number | null {
  return CADENCE_INTERVALS.find((i) => i.value === key)?.months ?? null;
}

export function intervalLabel(key: string | null | undefined): string {
  return CADENCE_INTERVALS.find((i) => i.value === key)?.label ?? 'No cadence';
}

export type AnchorRule = 'day_of_month' | 'first_monday' | 'last_business_day';

export const ANCHOR_RULES: { value: AnchorRule; label: string }[] = [
  { value: 'day_of_month', label: 'On a specific day of the month' },
  { value: 'first_monday', label: 'First Monday of the month' },
  { value: 'last_business_day', label: 'Last business day of the month' },
];

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Resolve the anchor day within a given month. */
export function anchoredDate(year: number, monthIndex: number, rule: string, day: number): Date {
  if (rule === 'first_monday') {
    const d = new Date(year, monthIndex, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    return d;
  }
  if (rule === 'last_business_day') {
    const d = new Date(year, monthIndex, daysInMonth(year, monthIndex));
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d;
  }
  const safeDay = Math.min(Math.max(day || 1, 1), daysInMonth(year, monthIndex));
  return new Date(year, monthIndex, safeDay);
}

export function toDateOnly(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? new Date(value) : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateOnly(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface CadenceLike {
  interval_key: string | null;
  anchor_rule: string | null;
  anchor_day: number | null;
  paused: boolean | null;
  resume_on: string | null;
  last_contacted_at: string | null;
}

/** When is this investor next due, given their cadence and last real contact? */
export function computeNextDue(cadence: CadenceLike, today = new Date()): Date | null {
  const months = intervalMonths(cadence.interval_key);
  if (!months) return null;

  const rule = cadence.anchor_rule || 'day_of_month';
  const day = cadence.anchor_day ?? 1;
  const last = toDateOnly(cadence.last_contacted_at);

  if (!last) {
    // Never contacted: due at the next anchor from today.
    const thisMonth = anchoredDate(today.getFullYear(), today.getMonth(), rule, day);
    if (thisMonth >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) return thisMonth;
    return anchoredDate(today.getFullYear(), today.getMonth() + 1, rule, day);
  }

  const target = new Date(last.getFullYear(), last.getMonth() + months, 1);
  return anchoredDate(target.getFullYear(), target.getMonth(), rule, day);
}

export type CadenceBucket = 'paused' | 'none' | 'overdue' | 'due' | 'upcoming';

export function cadenceBucket(cadence: CadenceLike, today = new Date()): CadenceBucket {
  if (!intervalMonths(cadence.interval_key)) return 'none';
  const resume = toDateOnly(cadence.resume_on);
  if (cadence.paused && (!resume || resume > today)) return 'paused';

  const next = computeNextDue(cadence, today);
  if (!next) return 'none';

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  if (next < startOfToday) return 'overdue';
  if (next <= endOfMonth) return 'due';
  return 'upcoming';
}

/** True when this investor should be included in the digest for `month` (any date in that month). */
export function isDueInMonth(cadence: CadenceLike, month: Date): boolean {
  if (!intervalMonths(cadence.interval_key)) return false;
  const resume = toDateOnly(cadence.resume_on);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  if (cadence.paused && (!resume || resume > monthEnd)) return false;

  const next = computeNextDue(cadence, monthEnd);
  if (!next) return false;
  return next <= monthEnd;
}

export const CADENCE_BUCKET_LABELS: Record<CadenceBucket, string> = {
  overdue: 'Overdue',
  due: 'Due this month',
  upcoming: 'Upcoming',
  paused: 'Paused',
  none: 'No cadence',
};
