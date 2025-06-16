
import { Deal } from '@/types/deal';
import { ACTIVE_PIPELINE_STAGES, SCREENING_STAGES, FINAL_STAGES } from './dealStagesConfig';

export interface DealStats {
  totalDeals: number;
  activeDeals: number;
  investedDeals: number;
  passedDeals: number;
  screeningDeals: number;
}

export function calculateDealStats(deals: Deal[]): DealStats {
  console.log('=== DEAL STATISTICS CALCULATION ===');
  console.log('Total deals in array:', deals.length);
  
  const totalDeals = deals.length;
  
  const activeDealsList = deals.filter(deal => 
    ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage)
  );
  console.log('Active deals:', activeDealsList.length, 'deals in stages:', ACTIVE_PIPELINE_STAGES);
  console.log('Active deals list:', activeDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));
  
  const investedDealsList = deals.filter(deal => 
    deal.pipeline_stage === FINAL_STAGES.INVESTED
  );
  console.log('Invested deals:', investedDealsList.length, 'deals');
  console.log('Invested deals list:', investedDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));
  
  const passedDealsList = deals.filter(deal => 
    deal.pipeline_stage === FINAL_STAGES.PASSED
  );
  console.log('Passed deals:', passedDealsList.length, 'deals');
  console.log('Passed deals list:', passedDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));

  const screeningDealsList = deals.filter(deal => 
    SCREENING_STAGES.includes(deal.pipeline_stage)
  );
  console.log('Screening deals:', screeningDealsList.length, 'deals in stages:', SCREENING_STAGES);
  console.log('Screening deals list:', screeningDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));

  const categorizedCount = activeDealsList.length + investedDealsList.length + passedDealsList.length + screeningDealsList.length;
  console.log('Total categorized deals:', categorizedCount, 'vs total deals:', totalDeals);
  
  if (categorizedCount !== totalDeals) {
    const uncategorized = deals.filter(deal => 
      !ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage) &&
      deal.pipeline_stage !== FINAL_STAGES.INVESTED &&
      deal.pipeline_stage !== FINAL_STAGES.PASSED &&
      !SCREENING_STAGES.includes(deal.pipeline_stage)
    );
    console.warn('UNCATEGORIZED DEALS FOUND:', uncategorized.length);
    console.warn('Uncategorized deals:', uncategorized.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));
  }

  const finalStats = {
    totalDeals,
    activeDeals: activeDealsList.length,
    investedDeals: investedDealsList.length,
    passedDeals: passedDealsList.length,
    screeningDeals: screeningDealsList.length
  };

  console.log('=== FINAL DEAL STATISTICS ===', finalStats);
  console.log('=====================================');

  return finalStats;
}
