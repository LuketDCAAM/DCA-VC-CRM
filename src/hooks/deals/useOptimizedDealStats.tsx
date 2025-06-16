
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { DealStats } from './dealStatsCalculator';

// Pre-compute stage sets for better performance
const ACTIVE_STAGES_SET = new Set([
  'Inactive',
  'Initial Review', 
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Term Sheet',
  'Legal Review'
]);

const SCREENING_STAGES_SET = new Set([
  'Inactive',
  'Initial Review',
  'Initial Contact'
]);

export function useOptimizedDealStats(deals: Deal[]): DealStats {
  return useMemo(() => {
    if (!deals.length) {
      return {
        totalDeals: 0,
        activeDeals: 0,
        investedDeals: 0,
        passedDeals: 0,
        screeningDeals: 0
      };
    }

    let activeDeals = 0;
    let investedDeals = 0;
    let passedDeals = 0;
    let screeningDeals = 0;

    // Single pass through deals array for better performance
    for (const deal of deals) {
      const stage = deal.pipeline_stage;
      
      if (ACTIVE_STAGES_SET.has(stage)) {
        activeDeals++;
      }
      
      if (stage === 'Invested') {
        investedDeals++;
      } else if (stage === 'Passed') {
        passedDeals++;
      }
      
      if (SCREENING_STAGES_SET.has(stage)) {
        screeningDeals++;
      }
    }

    return {
      totalDeals: deals.length,
      activeDeals,
      investedDeals,
      passedDeals,
      screeningDeals
    };
  }, [deals]);
}
