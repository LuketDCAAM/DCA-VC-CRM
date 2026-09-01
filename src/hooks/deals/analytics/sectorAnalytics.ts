
import { Deal } from '@/types/deal';
import { countSectorTags, getDealSectors } from '@/utils/sectorUtils';

export function calculateSectorDistribution(deals: Deal[]) {
  // Each sector tag counts separately (e.g. "AI; Healthcare" -> AI + Healthcare)
  const dealsWithSector = deals.filter(deal => getDealSectors(deal).length > 0);
  const sectorCounts = countSectorTags(dealsWithSector);

  const totalWithSector = dealsWithSector.length;

  return Object.entries(sectorCounts)
    .map(([sector, count]) => ({
      sector,
      count,
      percentage: totalWithSector > 0 ? Math.round((count / totalWithSector) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}
