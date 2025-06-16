
import { Deal } from '@/types/deal';
import { PIPELINE_STAGES } from '../dealStagesConfig';

export function calculatePipelineDistribution(deals: Deal[]) {
  return PIPELINE_STAGES.map(stage => {
    const count = deals.filter(deal => deal.pipeline_stage === stage).length;
    return {
      stage,
      count,
      percentage: Math.round((count / deals.length) * 100)
    };
  }).filter(item => item.count > 0);
}
