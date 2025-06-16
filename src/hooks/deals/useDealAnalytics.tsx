import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { PIPELINE_STAGES } from './dealStagesConfig';

export interface DealAnalytics {
  pipelineDistribution: Array<{ stage: string; count: number; percentage: number }>;
  sectorDistribution: Array<{ sector: string; count: number; percentage: number }>;
  roundStageDistribution: Array<{ stage: string; count: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; deals: number; invested: number }>;
  valuationAnalysis: {
    averageValuation: number;
    medianValuation: number;
    totalDealValue: number;
    valuationRanges: Array<{ range: string; count: number }>;
  };
  conversionMetrics: {
    overallConversionRate: number;
    stageConversionRates: Array<{ from: string; to: string; rate: number }>;
  };
}

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

    // Pipeline Distribution
    const pipelineDistribution = PIPELINE_STAGES.map(stage => {
      const count = deals.filter(deal => deal.pipeline_stage === stage).length;
      return {
        stage,
        count,
        percentage: Math.round((count / deals.length) * 100)
      };
    }).filter(item => item.count > 0);

    // Sector Distribution
    const sectorCounts = deals.reduce((acc, deal) => {
      const sector = deal.sector || 'Unknown';
      acc[sector] = (acc[sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sectorDistribution = Object.entries(sectorCounts)
      .map(([sector, count]) => ({
        sector,
        count,
        percentage: Math.round((count / deals.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Round Stage Distribution
    const roundStageCounts = deals.reduce((acc, deal) => {
      const stage = deal.round_stage || 'Unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roundStageDistribution = Object.entries(roundStageCounts)
      .map(([stage, count]) => ({
        stage,
        count,
        percentage: Math.round((count / deals.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Monthly Trends (last 12 months)
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthDeals = deals.filter(deal => 
        deal.created_at.startsWith(monthKey)
      );
      
      const investedDeals = monthDeals.filter(deal => 
        deal.pipeline_stage === 'Invested'
      );

      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        deals: monthDeals.length,
        invested: investedDeals.length
      };
    }).reverse();

    // Valuation Analysis
    const dealsWithValuation = deals.filter(deal => 
      deal.post_money_valuation && deal.post_money_valuation > 0
    );

    const valuations = dealsWithValuation.map(deal => deal.post_money_valuation!);
    const averageValuation = valuations.length > 0 
      ? valuations.reduce((sum, val) => sum + val, 0) / valuations.length 
      : 0;

    const sortedValuations = [...valuations].sort((a, b) => a - b);
    const medianValuation = sortedValuations.length > 0
      ? sortedValuations[Math.floor(sortedValuations.length / 2)]
      : 0;

    const totalDealValue = deals
      .filter(deal => deal.round_size && deal.round_size > 0)
      .reduce((sum, deal) => sum + deal.round_size!, 0);

    // Valuation ranges in millions
    const valuationRanges = [
      { range: '<$5M', count: 0 },
      { range: '$5M-$10M', count: 0 },
      { range: '$10M-$25M', count: 0 },
      { range: '$25M-$50M', count: 0 },
      { range: '$50M-$100M', count: 0 },
      { range: '>$100M', count: 0 }
    ];

    dealsWithValuation.forEach(deal => {
      const valuation = deal.post_money_valuation! / 100; // Convert from cents
      if (valuation < 5000000) valuationRanges[0].count++;
      else if (valuation < 10000000) valuationRanges[1].count++;
      else if (valuation < 25000000) valuationRanges[2].count++;
      else if (valuation < 50000000) valuationRanges[3].count++;
      else if (valuation < 100000000) valuationRanges[4].count++;
      else valuationRanges[5].count++;
    });

    // Conversion Metrics
    const investedCount = deals.filter(deal => deal.pipeline_stage === 'Invested').length;
    const overallConversionRate = deals.length > 0 
      ? Math.round((investedCount / deals.length) * 100)
      : 0;

    // Stage conversion rates (simplified)
    const stageConversionRates = [
      {
        from: 'Initial Contact',
        to: 'First Meeting',
        rate: calculateStageConversion(deals, 'Initial Contact', 'First Meeting')
      },
      {
        from: 'First Meeting',
        to: 'Due Diligence',
        rate: calculateStageConversion(deals, 'First Meeting', 'Due Diligence')
      },
      {
        from: 'Due Diligence',
        to: 'Term Sheet',
        rate: calculateStageConversion(deals, 'Due Diligence', 'Term Sheet')
      },
      {
        from: 'Term Sheet',
        to: 'Invested',
        rate: calculateStageConversion(deals, 'Term Sheet', 'Invested')
      }
    ];

    return {
      pipelineDistribution,
      sectorDistribution,
      roundStageDistribution,
      monthlyTrends,
      valuationAnalysis: {
        averageValuation,
        medianValuation,
        totalDealValue,
        valuationRanges
      },
      conversionMetrics: {
        overallConversionRate,
        stageConversionRates
      }
    };
  }, [deals]);
}

function calculateStageConversion(deals: Deal[], fromStage: string, toStage: string): number {
  // Find the index of stages safely by checking if they exist in PIPELINE_STAGES
  const fromStageIndex = PIPELINE_STAGES.findIndex(stage => stage === fromStage);
  const toStageIndex = PIPELINE_STAGES.findIndex(stage => stage === toStage);
  
  // If stages are not found, return 0
  if (fromStageIndex === -1 || toStageIndex === -1) {
    return 0;
  }
  
  const fromStageDeals = deals.filter(deal => {
    const dealStageIndex = PIPELINE_STAGES.findIndex(stage => stage === deal.pipeline_stage);
    return dealStageIndex >= fromStageIndex;
  });
  
  const toStageDeals = deals.filter(deal => {
    const dealStageIndex = PIPELINE_STAGES.findIndex(stage => stage === deal.pipeline_stage);
    return dealStageIndex >= toStageIndex;
  });

  return fromStageDeals.length > 0 
    ? Math.round((toStageDeals.length / fromStageDeals.length) * 100)
    : 0;
}
