
import { Deal } from '@/types/deal';

export function calculateRoundStageDistribution(deals: Deal[]) {
  const roundStageCounts = deals.reduce((acc, deal) => {
    const stage = deal.round_stage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(roundStageCounts)
    .map(([stage, count]) => ({
      stage,
      count,
      percentage: Math.round((count / deals.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}
