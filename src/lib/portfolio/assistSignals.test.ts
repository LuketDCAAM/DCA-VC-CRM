import { describe, expect, test } from 'bun:test';
import { assistSignals, type SignalQuarter } from './assistSignals';

const today = new Date(2026, 9, 20); // Q4 2026
const q = (over: Partial<SignalQuarter>): SignalQuarter => ({
  fiscal_year: 2026, fiscal_quarter: 3, arr: null, net_burn: null, cash_balance: null,
  headcount: null, nrr: null, monthly_churn: null, ...over,
});
const keys = (qs: SignalQuarter[]) => assistSignals(qs, today).map((s) => s.key);

describe('assistSignals', () => {
  test('runway under 9 months is flagged', () => {
    expect(keys([q({ cash_balance: 800, net_burn: 100 })])).toContain('runway');
  });
  test('runway of 9+ months is not flagged', () => {
    expect(keys([q({ cash_balance: 900, net_burn: 100 })])).not.toContain('runway');
  });
  test('numbers older than one quarter are stale', () => {
    expect(keys([q({ fiscal_quarter: 2 })])).toContain('stale');
    expect(keys([q({ fiscal_quarter: 3 })])).not.toContain('stale');
  });
  test('ARR more than 10% below plan is flagged', () => {
    expect(keys([q({ arr: 85, targets: { arr: 100 } })])).toContain('below_plan');
    expect(keys([q({ arr: 95, targets: { arr: 100 } })])).not.toContain('below_plan');
  });
  test('no quarters asks for first update', () => {
    expect(keys([])).toEqual(['no_data']);
  });
});
