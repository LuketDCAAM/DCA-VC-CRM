
import { Deal } from '@/types/deal';

export function calculateSectorDistribution(deals: Deal[]) {
  console.log('=== DEAL ANALYTICS DEBUG ===');
  console.log('Total deals:', deals.length);
  
  // Filter out deals without valid sector data
  const dealsWithSector = deals.filter(deal => {
    const sector = deal.sector?.trim().toLowerCase();
    return sector && sector !== '' && sector !== 'unknown' && sector !== 'n/a' && sector !== 'not specified';
  });
  
  console.log('Deals with valid sector:', dealsWithSector.length);
  
  if (dealsWithSector.length > 0) {
    console.log('Sample sectors:', dealsWithSector.slice(0, 5).map(d => d.sector));
  }

  // Sector Distribution - exclude unknown/null values
  const sectorCounts = dealsWithSector.reduce((acc, deal) => {
    const sector = deal.sector!.trim();
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Sector counts:', sectorCounts);

  const totalWithSector = dealsWithSector.length;
  const sectorDistribution = Object.entries(sectorCounts)
    .map(([sector, count]) => ({
      sector,
      count,
      percentage: totalWithSector > 0 ? Math.round((count / totalWithSector) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  console.log('Final sector distribution:', sectorDistribution);
  
  return sectorDistribution;
}
