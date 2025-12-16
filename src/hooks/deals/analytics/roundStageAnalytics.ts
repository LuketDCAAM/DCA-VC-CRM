
import { Deal } from '@/types/deal';

export function calculateRoundStageDistribution(deals: Deal[]) {
  // Filter out deals without valid round stage data
  const dealsWithStage = deals.filter(deal => {
    const stage = deal.round_stage?.trim().toLowerCase();
    return stage && stage !== '' && stage !== 'unknown' && stage !== 'n/a';
  });

  const roundStageCounts = dealsWithStage.reduce((acc, deal) => {
    const stage = deal.round_stage!.trim();
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalWithStage = dealsWithStage.length;
  return Object.entries(roundStageCounts)
    .map(([stage, count]) => ({
      stage,
      count,
      percentage: totalWithStage > 0 ? Math.round((count / totalWithStage) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}
