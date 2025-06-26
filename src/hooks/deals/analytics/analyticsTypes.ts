
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
    quarterlyTrends: Array<{ 
      quarter: string; 
      averageValuation: number; 
      medianValuation: number; 
      dealCount: number 
    }>;
  };
  conversionMetrics: {
    overallConversionRate: number;
    stageConversionRates: Array<{ from: string; to: string; rate: number }>;
  };
}
