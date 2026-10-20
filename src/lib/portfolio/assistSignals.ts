// "Where we can help" flags for a portfolio company, derived from its latest quarterly numbers.
import { currentQuarter, periodIndex, periodLabel, runwayMonths } from './metrics';

export interface SignalQuarter {
  fiscal_year: number;
  fiscal_quarter: number;
  arr: number | null;
  net_burn: number | null;
  cash_balance: number | null;
  headcount: number | null;
  nrr: number | null;
  monthly_churn: number | null;
  targets?: Record<string, number | null> | null;
  performance_status?: string | null;
  status_override?: string | null;
}

export type SignalLevel = 'risk' | 'watch' | 'info';

export interface AssistSignal {
  key: string;
  level: SignalLevel;
  label: string;
  /** How DCA could help. */
  offer: string;
}

export const RUNWAY_ALERT_MONTHS = 9;

/** `quarters` should be sorted oldest → newest. */
export function assistSignals(quarters: SignalQuarter[], today = new Date()): AssistSignal[] {
  const out: AssistSignal[] = [];
  const latest = quarters[quarters.length - 1];
  const prior = quarters[quarters.length - 2];
  const now = currentQuarter(today);

  if (!latest) {
    out.push({ key: 'no_data', level: 'info', label: 'No numbers on file yet', offer: 'Ask for a first KPI update' });
    return out;
  }

  const lag = periodIndex(now.fiscal_year, now.fiscal_quarter) - periodIndex(latest.fiscal_year, latest.fiscal_quarter);
  if (lag > 1) {
    out.push({
      key: 'stale',
      level: 'watch',
      label: `Last numbers are from ${periodLabel(latest.fiscal_year, latest.fiscal_quarter)}`,
      offer: 'Ask for an updated KPI pack',
    });
  }

  const status = latest.status_override || latest.performance_status;
  if (status === 'At Risk') {
    out.push({ key: 'at_risk', level: 'risk', label: 'Marked At Risk', offer: 'Offer a working session on priorities' });
  }

  const runway = runwayMonths(latest.cash_balance, latest.net_burn);
  if (runway != null && runway < RUNWAY_ALERT_MONTHS) {
    out.push({
      key: 'runway',
      level: runway < 6 ? 'risk' : 'watch',
      label: `Runway about ${runway.toFixed(1)} months`,
      offer: 'Offer fundraising prep and investor intros',
    });
  }

  const target = latest.targets?.arr ?? null;
  if (target && latest.arr != null && (latest.arr - target) / Math.abs(target) < -0.1) {
    const pct = Math.round((Math.abs(latest.arr - target) / Math.abs(target)) * 100);
    out.push({ key: 'below_plan', level: 'watch', label: `ARR ${pct}% below plan`, offer: 'Offer customer and channel intros' });
  }

  if (prior?.arr != null && latest.arr != null && latest.arr < prior.arr) {
    out.push({ key: 'arr_down', level: 'risk', label: 'ARR fell last quarter', offer: 'Offer go-to-market support' });
  }

  if (prior?.nrr != null && latest.nrr != null && prior.nrr - latest.nrr >= 0.05) {
    out.push({ key: 'nrr_down', level: 'watch', label: 'Net retention slipping', offer: 'Offer customer success playbooks' });
  }

  if (prior?.monthly_churn != null && latest.monthly_churn != null && latest.monthly_churn > prior.monthly_churn) {
    out.push({ key: 'churn_up', level: 'watch', label: 'Monthly churn rising', offer: 'Offer retention support' });
  }

  if (prior?.headcount && latest.headcount != null && (prior.headcount - latest.headcount) / prior.headcount >= 0.1) {
    out.push({ key: 'headcount_down', level: 'info', label: 'Team shrank 10%+', offer: 'Offer hiring and talent help' });
  }

  return out;
}
