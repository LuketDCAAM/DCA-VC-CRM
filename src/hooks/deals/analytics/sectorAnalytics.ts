
import { Deal } from '@/types/deal';

export function calculateSectorDistribution(deals: Deal[]) {
  console.log('=== DEAL ANALYTICS DEBUG ===');
  console.log('Total deals:', deals.length);
  
  // Debug sector data
  const dealsWithSector = deals.filter(deal => deal.sector && deal.sector.trim() !== '');
  const dealsWithoutSector = deals.filter(deal => !deal.sector || deal.sector.trim() === '');
  console.log('Deals with sector:', dealsWithSector.length);
  console.log('Deals without sector:', dealsWithoutSector.length);
  
  if (dealsWithSector.length > 0) {
    console.log('Sample sectors:', dealsWithSector.slice(0, 5).map(d => d.sector));
  }

  // Sector Distribution - improved handling
  const sectorCounts = deals.reduce((acc, deal) => {
    // Handle null, undefined, or empty sectors
    let sector = deal.sector?.trim();
    if (!sector) {
      sector = 'Not Specified';
    }
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Sector counts:', sectorCounts);

  const sectorDistribution = Object.entries(sectorCounts)
    .map(([sector, count]) => ({
      sector,
      count,
      percentage: Math.round((count / deals.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  console.log('Final sector distribution:', sectorDistribution);
  
  return sectorDistribution;
}
