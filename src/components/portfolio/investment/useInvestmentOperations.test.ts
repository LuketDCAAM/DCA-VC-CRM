import { beforeEach, expect, mock, test } from 'bun:test';

const events: string[] = [];
let updateResult: { data: { id: string } | null; error: Error | null };
let savedPayload: Record<string, unknown>;
const toast = mock(() => {});
const onSave = mock(() => { events.push('close'); });
const single = mock(async () => updateResult);
const query = {
  eq: mock(() => query),
  select: mock(() => query),
  single,
};
mock.module('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: async () => { events.push('refresh'); } }),
}));
mock.module('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
mock.module('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ update: (payload: Record<string, unknown>) => {
    savedPayload = payload;
    return query;
  } }) },
}));
const { useInvestmentOperations } = await import('./useInvestmentOperations');

const investment = {
  id: 'investment-1', investment_date: '2026-10-21', amount_invested: 1250.25,
  post_money_valuation: null, price_per_share: 1.25,
  revenue_at_investment: null, ownership_percentage: 0.05,
};

beforeEach(() => {
  events.length = 0;
  toast.mockClear();
  onSave.mockClear();
  updateResult = { data: { id: investment.id }, error: null };
});

test('investment edits refresh company data before leaving the editor', async () => {
  await useInvestmentOperations('company-1', onSave).saveInvestments([investment]);
  expect(events).toEqual(['refresh', 'close']);
  expect(savedPayload.amount_invested).toBe(125025);
  expect(savedPayload.price_per_share).toBe(125);
  expect(query.eq).toHaveBeenCalledWith('portfolio_company_id', 'company-1');
});

test('a four decimal share price survives an investment save', async () => {
  await useInvestmentOperations('company-1', onSave).saveInvestments([{ ...investment, price_per_share: 0.1234 }]);
  expect(savedPayload.price_per_share).toBe(12.34);
});

test('a zero-row investment update does not report success or close the editor', async () => {
  updateResult = { data: null, error: null };
  await useInvestmentOperations('company-1', onSave).saveInvestments([investment]);
  expect(onSave).not.toHaveBeenCalled();
  expect(events).toEqual([]);
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
});

test('a rejected investment update preserves the editor and displays the error', async () => {
  updateResult = { data: null, error: new Error('Update rejected') };
  await useInvestmentOperations('company-1', onSave).saveInvestments([investment]);
  expect(onSave).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Update rejected' }));
});