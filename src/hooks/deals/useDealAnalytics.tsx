
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { DealAnalytics } from './analytics/analyticsTypes';
import { calculatePipelineDistribution } from './analytics/pipelineAnalytics';
import { calculateSectorDistribution } from './analytics/sectorAnalytics';
import { calculateRoundStageDistribution } from './analytics/roundStageAnalytics';
import { calculateMonthlyTrends } from './analytics/monthlyTrendsAnalytics';
import { calculateValuationAnalysis } from './analytics/valuationAnalytics';
import { calculateConversionMetrics } from './analytics/conversionAnalytics';

export type { DealAnalytics };

export function useDealAnalytics(deals: Deal[]): DealAnalytics {
  return useMemo(() => {
    if (!deals.length) {
      return {
        pipelineDistribution: [],
        sectorDistribution: [],
        roundStageDistribution: [],
        monthlyTrends: [],
        valuationAnalysis: {
          averageValuation: 0,
          medianValuation: 0,
          totalDealValue: 0,
          valuationRanges: []
        },
        conversionMetrics: {
          overallConversionRate: 0,
          stageConversionRates: []
        }
      };
    }

    return {
      pipelineDistribution: calculatePipelineDistribution(deals),
      sectorDistribution: calculateSectorDistribution(deals),
      roundStageDistribution: calculateRoundStageDistribution(deals),
      monthlyTrends: calculateMonthlyTrends(deals),
      valuationAnalysis: calculateValuationAnalysis(deals),
      conversionMetrics: calculateConversionMetrics(deals)
    };
  }, [deals]);
}
