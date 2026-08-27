// Core quarterly KPI catalogue shared by the grid, the update form and the CSV import.

export type KpiUnit = 'money' | 'percent' | 'number';

export interface KpiField {
  key: string;
  label: string;
  unit: KpiUnit;
  higherIsBetter: boolean;
  targetable?: boolean;
  hint?: string;
}

export const CORE_KPI_FIELDS: KpiField[] = [
  { key: 'arr', label: 'ARR', unit: 'money', higherIsBetter: true, targetable: true },
  { key: 'revenue', label: 'Revenue (quarter)', unit: 'money', higherIsBetter: true, targetable: true },
  { key: 'gross_margin', label: 'Gross Margin', unit: 'percent', higherIsBetter: true },
  { key: 'gross_burn', label: 'Gross Burn (monthly)', unit: 'money', higherIsBetter: false },
  { key: 'net_burn', label: 'Net Burn (monthly)', unit: 'money', higherIsBetter: false },
  { key: 'cash_balance', label: 'Cash Balance', unit: 'money', higherIsBetter: true },
  { key: 'headcount', label: 'Headcount', unit: 'number', higherIsBetter: true },
  { key: 'customer_count', label: 'Customers', unit: 'number', higherIsBetter: true },
  { key: 'nrr', label: 'NRR', unit: 'percent', higherIsBetter: true },
  { key: 'grr', label: 'GRR', unit: 'percent', higherIsBetter: true },
  { key: 'monthly_churn', label: 'Monthly Churn', unit: 'percent', higherIsBetter: false },
];

export const MONEY_KEYS = CORE_KPI_FIELDS.filter((f) => f.unit === 'money').map((f) => f.key);
export const PERCENT_KEYS = CORE_KPI_FIELDS.filter((f) => f.unit === 'percent').map((f) => f.key);

/** Convert a user-entered display value into the stored representation. */
export function toStored(raw: string, unit: KpiUnit): number | null {
  const cleaned = raw.replace(/[$,%\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (unit === 'money') return Math.round(n * 100);
  if (unit === 'percent') return n / 100;
  return n;
}

/** Convert a stored value into an editable display string. */
export function toEditable(value: number | null | undefined, unit: KpiUnit): string {
  if (value == null) return '';
  if (unit === 'money') return String(value / 100);
  if (unit === 'percent') return String(Number((value * 100).toFixed(4)));
  return String(value);
}
