// Portfolio IRR (XIRR) as of a chosen date.
// Realized = exited positions only, using their dated cash flows up to the date.
// Unrealized = non-exited positions, cash flows up to the date plus current FMV as a terminal value on the date.

export interface DatedFlow { date: string; amount: number }

export interface IrrPositionInput {
  companyId: string;
  status: string | null | undefined;
  currentFmv: number;
  investments: Array<{ investment_date: string | null; amount_invested: number }>;
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

export function computePortfolioIrr(
  positions: IrrPositionInput[],
  cashFlowsByCompany: Map<string, DatedFlow[]>,
  asOf: string,
): { realized: number | null; unrealized: number | null } {
  const realized: DatedFlow[] = [];
  const unrealized: DatedFlow[] = [];
  for (const p of positions) {
    const flows = flowsForCompany(p, cashFlowsByCompany.get(p.companyId), asOf);
    if (!flows.length) continue;
    if (isExitedStatus(p.status)) {
      realized.push(...flows);
    } else {
      unrealized.push(...flows);
      if (p.currentFmv > 0) unrealized.push({ date: asOf, amount: p.currentFmv });
    }
  }
  return { realized: xirr(realized), unrealized: xirr(unrealized) };
}
