import { describe, expect, test } from 'bun:test';
import {
  buildCashFlowLedger,
  computeIrrBreakdown,
  computePortfolioIrr,
  xirr,
  type DatedFlow,
  type IrrCompanyInput,
} from './irr';

const companies: IrrCompanyInput[] = [
  {
    companyId: 'a',
    companyName: 'Acme',
    status: 'Exited - Strategic',
    currentFmv: 0,
    invested: 100,
    realized: 150,
    investments: [{ investment_date: '2020-01-01', amount_invested: 100 }],
  },
  {
    companyId: 'b',
    companyName: 'Beta',
    status: 'Active',
    currentFmv: 121,
    invested: 100,
    realized: 0,
    investments: [{ investment_date: '2020-01-01', amount_invested: 100 }],
  },
];

const flows = new Map<string, DatedFlow[]>([
  ['a', [{ date: '2020-01-01', amount: -100 }, { date: '2021-01-01', amount: 150 }]],
  ['b', [{ date: '2020-01-01', amount: -100 }]],
]);

describe('irr', () => {
  test('doubling in one year is ~100%', () => {
    expect(xirr([{ date: '2024-01-01', amount: -100 }, { date: '2025-01-01', amount: 200 }])!).toBeCloseTo(1.0, 2);
  });
  test('realized uses exited only; gross combines exited flows with open FMV on as-of date', () => {
    const flows = new Map([
      ['a', [{ date: '2020-01-01', amount: -100 }, { date: '2021-01-01', amount: 150 }]],
      ['b', [{ date: '2020-01-01', amount: -100 }]],
    ]);
    const r = computePortfolioIrr([
      { companyId: 'a', status: 'Exited - Strategic', currentFmv: 0, investments: [] },
      { companyId: 'b', status: 'Active', currentFmv: 121, investments: [] },
    ], flows, '2022-01-01');
    expect(r.realized!).toBeCloseTo(0.5, 2);
    expect(r.total!).toBeGreaterThan(0.1);
    expect(r.total!).toBeLessThan(0.5);
  });
  test('flows after the as-of date are ignored', () => {
    const flows = new Map([['a', [{ date: '2020-01-01', amount: -100 }, { date: '2023-01-01', amount: 150 }]]]);
    const r = computePortfolioIrr([{ companyId: 'a', status: 'Exited - IPO', currentFmv: 0, investments: [] }], flows, '2022-01-01');
    expect(r.realized).toBeNull();
  });

  test('breakdown reports each company on its own money-weighted return', () => {
    const b = computeIrrBreakdown(companies, flows, '2022-01-01');
    expect(b.rows.map((r) => r.companyName)).toEqual(['Acme', 'Beta']);
    expect(b.rows[0].irr!).toBeCloseTo(0.5, 2);
    expect(b.rows[0].countedInRealized).toBe(true);
    expect(b.rows[1].irr!).toBeCloseTo(0.1, 2);
    expect(b.rows[1].countedInRealized).toBe(false);
    expect(b.realized!).toBeCloseTo(0.5, 2);
    expect(b.total!).toBeGreaterThan(0.1);
    expect(b.total!).toBeLessThan(0.5);
  });

  test('breakdown falls back to investment dates when a company has no cash-flow rows', () => {
    const b = computeIrrBreakdown(companies, new Map(), '2022-01-01');
    const beta = b.rows.find((r) => r.companyId === 'b')!;
    expect(beta.source).toBe('investments');
    expect(beta.baseFlows).toEqual([{ date: '2020-01-01', amount: -100 }]);
    expect(beta.irr!).toBeCloseTo(0.1, 2);
  });

  test('ledger lists dated movements, marks the marked value, and totals the net position', () => {
    const entries = buildCashFlowLedger(
      { companyId: 'b', status: 'Active', currentFmv: 121, investments: [] },
      flows.get('b'),
      '2022-01-01',
    );
    expect(entries.map((e) => e.kind)).toEqual(['cash_flow', 'terminal']);
    expect(entries[0].amount).toBe(-100);
    expect(entries[0].running).toBe(-100);
    expect(entries[1].amount).toBe(121);
    expect(entries[1].running).toBe(21);
    expect(entries.every((e) => e.included)).toBe(true);
  });

  test('ledger uses investment dates when no cash-flow rows exist and excludes rows after the date', () => {
    const p = {
      companyId: 'c',
      status: 'Active',
      currentFmv: 50,
      investments: [
        { investment_date: '2020-01-01', amount_invested: 100 },
        { investment_date: '2024-01-01', amount_invested: 25 },
      ],
    };
    const entries = buildCashFlowLedger(p, undefined, '2022-01-01');
    expect(entries.map((e) => e.label)).toEqual(['Investment', 'Current value (not received)', 'Investment']);
    expect(entries[0].included).toBe(true);
    expect(entries[0].running).toBe(-100);
    expect(entries[1].included).toBe(true);
    expect(entries[1].running).toBe(-50);

    const later = buildCashFlowLedger(p, undefined, '2025-01-01');
    expect(later.find((e) => e.date === '2024-01-01')!.included).toBe(true);
    expect(later.find((e) => e.kind === 'terminal')!.running).toBe(-75);
  });
});
