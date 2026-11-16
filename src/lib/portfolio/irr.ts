// Portfolio IRR (XIRR) as of a chosen date.
// Realized = exited positions only, using their dated cash flows up to the date.
// Gross = every position's cash flows up to the date (incl. exits/distributions) plus open positions' current FMV as a terminal value.

export interface DatedFlow {
  date: string;
  amount: number;
  flowType?: string | null;
  description?: string | null;
  dateIsEstimated?: boolean;
}

export interface IrrPositionInput {
  companyId: string;
  status: string | null | undefined;
  currentFmv: number;
  investments: Array<{ investment_date: string | null; amount_invested: number }>;
}

export interface IrrCompanyInput extends IrrPositionInput {
  companyName: string;
  invested: number;
  realized: number;
}

const DAY = 86_400_000;

export function xirr(flows: DatedFlow[]): number | null {
  const valid = flows.filter((f) => f.amount !== 0 && f.date);
  if (!valid.some((f) => f.amount < 0) || !valid.some((f) => f.amount > 0)) return null;
  const t0 = Math.min(...valid.map((f) => Date.parse(f.date)));
  const pts = valid.map((f) => ({ y: (Date.parse(f.date) - t0) / DAY / 365, a: f.amount }));
  const npv = (r: number) => pts.reduce((s, p) => s + p.a / Math.pow(1 + r, p.y), 0);
  let lo = -0.9999, hi = 100;
  let fLo = npv(lo);
  if ((fLo > 0) === (npv(hi) > 0)) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-6 || hi - lo < 1e-10) return mid;
    if ((fLo > 0) === (fMid > 0)) { lo = mid; fLo = fMid; } else { hi = mid; }
  }
  return (lo + hi) / 2;
}

export const isExitedStatus = (s: string | null | undefined) => !!s && s.startsWith('Exited');

export function flowsForCompany(
  p: IrrPositionInput,
  cashFlows: DatedFlow[] | undefined,
  asOf: string,
): DatedFlow[] {
  const base = cashFlows && cashFlows.length
    ? cashFlows
    : p.investments
        .filter((i) => i.investment_date)
        .map((i) => ({ date: i.investment_date as string, amount: -Math.abs(i.amount_invested) }));
  return base.filter((f) => f.date <= asOf);
}

/** Dated rows behind one company's IRR: the flows it uses, plus the marked value for open positions. */
export interface LedgerEntry {
  date: string;
  label: string;
  amount: number; // cents; negative = money out of the fund
  kind: 'investment' | 'cash_flow' | 'terminal';
  description: string | null;
  dateIsEstimated: boolean;
  included: boolean; // counted in the IRR as of the date
  running: number;   // cumulative net cash position after this row
}

export function buildCashFlowLedger(
  p: IrrPositionInput,
  cashFlows: DatedFlow[] | undefined,
  asOf: string,
): LedgerEntry[] {
  const hasDatedFlows = !!cashFlows && cashFlows.length > 0;
  const rows: Array<Omit<LedgerEntry, 'included' | 'running'>> = [];

  if (hasDatedFlows) {
    for (const f of cashFlows!) {
      rows.push({
        date: f.date,
        label: f.flowType?.trim() || 'Cash flow',
        amount: f.amount,
        kind: 'cash_flow',
        description: f.description ?? null,
        dateIsEstimated: !!f.dateIsEstimated,
      });
    }
  } else {
    for (const i of p.investments) {
      if (!i.investment_date) continue;
      rows.push({
        date: i.investment_date,
        label: 'Investment',
        amount: -Math.abs(i.amount_invested),
        kind: 'investment',
        description: null,
        dateIsEstimated: false,
      });
    }
  }

  const baseUpToDate = rows.filter((r) => r.date <= asOf);
  if (!isExitedStatus(p.status) && p.currentFmv > 0 && baseUpToDate.length) {
    rows.push({
      date: asOf,
      label: 'Current value (not received)',
      amount: p.currentFmv,
      kind: 'terminal',
      description: 'Marked at current fair value; not cash in the fund',
      dateIsEstimated: false,
    });
  }

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.kind === 'terminal' ? 1 : -1));

  let running = 0;
  return rows.map((r) => {
    const included = r.date <= asOf;
    if (included) running += r.amount;
    return { ...r, included, running };
  });
}

export interface CompanyIrrRow {
  companyId: string;
  companyName: string;
  status: string | null;
  exited: boolean;
  invested: number;
  fmv: number;
  realized: number;
  irr: number | null;
  baseFlows: DatedFlow[];
  flows: DatedFlow[];
  source: 'cash_flows' | 'investments';
  countedInRealized: boolean;
  countedInGross: boolean;
}

export interface IrrBreakdown {
  realized: number | null;
  total: number | null;
  rows: CompanyIrrRow[];
}

export function computeIrrBreakdown(
  positions: IrrCompanyInput[],
  cashFlowsByCompany: Map<string, DatedFlow[]>,
  asOf: string,
): IrrBreakdown {
  const realized: DatedFlow[] = [];
  const gross: DatedFlow[] = [];
  const rows: CompanyIrrRow[] = [];

  for (const p of positions) {
    const cf = cashFlowsByCompany.get(p.companyId);
    const hasDatedFlows = !!cf && cf.length > 0;
    const flows = flowsForCompany(p, cf, asOf);
    const exited = isExitedStatus(p.status);
    const withTerminal = !exited && p.currentFmv > 0 && flows.length
      ? [...flows, { date: asOf, amount: p.currentFmv }]
      : flows;

    if (flows.length) {
      gross.push(...withTerminal);
      if (exited) realized.push(...flows);
    }

    rows.push({
      companyId: p.companyId,
      companyName: p.companyName,
      status: p.status ?? null,
      exited,
      invested: p.invested,
      fmv: p.currentFmv,
      realized: p.realized,
      irr: xirr(withTerminal),
      baseFlows: flows,
      flows: withTerminal,
      source: hasDatedFlows ? 'cash_flows' : 'investments',
      countedInRealized: exited && flows.length > 0,
      countedInGross: flows.length > 0,
    });
  }

  rows.sort((a, b) => b.invested - a.invested || a.companyName.localeCompare(b.companyName));
  return { realized: xirr(realized), total: xirr(gross), rows };
}

export function computePortfolioIrr(
  positions: IrrPositionInput[],
  cashFlowsByCompany: Map<string, DatedFlow[]>,
  asOf: string,
): { realized: number | null; total: number | null } {
  const { realized, total } = computeIrrBreakdown(
    positions.map((p) => ({
      ...p,
      companyName: p.companyId,
      invested: p.investments.reduce((s, i) => s + Math.abs(i.amount_invested), 0),
      realized: 0,
    })),
    cashFlowsByCompany,
    asOf,
  );
  return { realized, total };
}
