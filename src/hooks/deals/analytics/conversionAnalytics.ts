
import { Deal } from '@/types/deal';
import { PIPELINE_STAGES } from '../dealStagesConfig';

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

export function calculateConversionMetrics(deals: Deal[]) {
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
    overallConversionRate,
    stageConversionRates
  };
}
