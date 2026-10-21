import { beforeEach, expect, mock, test } from 'bun:test';

let result: { data: { id: string } | null; error: Error | null };
let payload: Record<string, unknown>;
const refresh = mock(async () => {});
const select = mock(() => ({ single: async () => result }));
mock.module('@/integrations/supabase/client', () => ({ supabase: { from: () => ({
  upsert: (values: Record<string, unknown>) => { payload = values; return { select }; },
}) } }));
const { savePerformance } = await import('./savePerformance');

const values = { last_round_post_money_valuation: 10000000.25, last_round_price_per_share: 1.23, current_ownership_percentage: 0.025 };
beforeEach(() => { result = { data: { id: 'valuation-1' }, error: null }; refresh.mockClear(); });

test('ownership saves persist fractional ownership and refresh after a verified write', async () => {
  await savePerformance('company-1', values, refresh);
  expect(payload.current_ownership_percentage).toBe(0.025);
  expect(payload.last_round_post_money_valuation).toBe(1000000025);
  expect(payload.last_round_price_per_share).toBe(123);
  expect(refresh).toHaveBeenCalledTimes(1);
});

test('performance save waits until refreshed values are available', async () => {
  let release: (() => void) | undefined;
  let completed = false;
  const pending = savePerformance('company-1', values, () => new Promise<void>(resolve => { release = resolve; })).then(() => { completed = true; });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(completed).toBe(false);
  expect(release).toBeDefined();
  release?.();
  await pending;
  expect(completed).toBe(true);
});

test('a missing saved row cannot report a successful performance save', async () => {
  result = { data: null, error: null };
  await expect(savePerformance('company-1', values, refresh)).rejects.toThrow('Performance could not be saved');
  expect(refresh).not.toHaveBeenCalled();
});

test('rejected ownership writes surface the error without refreshing', async () => {
  result = { data: null, error: new Error('Write rejected') };
  await expect(savePerformance('company-1', values, refresh)).rejects.toThrow('Write rejected');
  expect(refresh).not.toHaveBeenCalled();
});

test('zero ownership and zero valuation are saved without becoming null', async () => {
  await savePerformance('company-1', { last_round_post_money_valuation: 0, last_round_price_per_share: 0, current_ownership_percentage: 0 }, refresh);
  expect(payload.current_ownership_percentage).toBe(0);
  expect(payload.last_round_post_money_valuation).toBe(0);
});