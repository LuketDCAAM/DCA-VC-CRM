
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

  // Updated stage conversion rates with new pipeline stages
  const stageConversionRates = [
    {
      from: 'Initial Contact',     // Updated from 'Initial Contact'
      to: 'First Meeting',         // Updated from 'First Meeting'
      rate: calculateStageConversion(deals, 'Initial Contact', 'First Meeting')
    },
    {
      from: 'First Meeting',       // Updated from 'First Meeting'
      to: 'One Pager',             // Previously 'Scorecard'
      rate: calculateStageConversion(deals, 'First Meeting', 'One Pager')
    },
    {
      from: 'One Pager',           // Previously 'Scorecard'
      to: 'Due Diligence',
      rate: calculateStageConversion(deals, 'One Pager', 'Due Diligence')
    },
    {
      from: 'Due Diligence',
      to: 'Memo',
      rate: calculateStageConversion(deals, 'Due Diligence', 'Memo')
    },
    {
      from: 'Memo',
      to: 'Invested',
      rate: calculateStageConversion(deals, 'Memo', 'Invested')
    }
  ];

  return {
    overallConversionRate,
    stageConversionRates
  };
}
