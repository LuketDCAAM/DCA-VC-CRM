import { describe, expect, test } from 'bun:test';
import { computePortfolioIrr, xirr } from './irr';

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
});
