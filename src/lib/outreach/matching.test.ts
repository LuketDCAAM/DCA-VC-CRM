import { describe, expect, test } from 'bun:test';
import { matchInvestorsForDeals, scoreInvestorForDeal } from './matching';

const deal = (o: any = {}) => ({ id: 'd1', company_name: 'Acme', sector: 'Healthcare', round_stage: 'Seed', round_size: 2_000_000, ...o }) as any;
const inv = (o: any = {}) => ({ id: 'i1', contact_name: 'Ann', preferred_sectors: ['Healthcare'], preferred_investment_stage: 'Seed', average_check_size: 500_000, ...o }) as any;

describe('scoreInvestorForDeal', () => {
  test('sector match adds 40', () => {
    expect(scoreInvestorForDeal(deal({ round_stage: null, round_size: null }), inv()).score).toBe(40);
  });
  test('exact stage adds 30, adjacent 15', () => {
    const base = { sector: 'Fintech', round_size: null };
    expect(scoreInvestorForDeal(deal(base), inv()).score).toBe(30);
    expect(scoreInvestorForDeal(deal({ ...base, round_stage: 'Series A' }), inv()).score).toBe(15);
  });
  test('check that fits the round adds 15', () => {
    expect(scoreInvestorForDeal(deal({ sector: 'Fintech', round_stage: null }), inv()).score).toBe(15);
  });
  test('deal score does not affect investor fit', () => {
    expect(scoreInvestorForDeal(deal({ deal_score: 90, is_priority_deal: true }), inv()).score).toBe(85);
  });
});

describe('matchInvestorsForDeals', () => {
  test('hides investors already sent the deal unless includeSent', () => {
    const sent = new Set(['d1:i1']);
    expect(matchInvestorsForDeals([deal()], [inv()], { sentPairs: sent })).toHaveLength(0);
    expect(matchInvestorsForDeals([deal()], [inv()], { sentPairs: sent, includeSent: true })[0].alreadySent).toBe(true);
  });
  test('drops investors below the minimum score', () => {
    expect(matchInvestorsForDeals([deal({ sector: 'Fintech', round_stage: null, round_size: null })], [inv()])).toHaveLength(0);
  });
  test('caps deals per investor at 4', () => {
    const deals = [1, 2, 3, 4, 5].map((n) => deal({ id: `d${n}` }));
    expect(matchInvestorsForDeals(deals, [inv()])[0].deals).toHaveLength(4);
  });
});
