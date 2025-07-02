
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { DealStats } from './dealStatsCalculator';
import { ACTIVE_PIPELINE_STAGES, SCREENING_STAGES } from './dealStagesConfig';

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
      
      if (ACTIVE_PIPELINE_STAGES.includes(stage as any)) {
        activeDeals++;
      }
      
      if (stage === 'Invested') {
        investedDeals++;
      } else if (stage === 'Passed') {
        passedDeals++;
      }
      
      if (SCREENING_STAGES.includes(stage as any)) {
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
