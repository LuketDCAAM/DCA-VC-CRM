
import { Deal } from '@/types/deal';

export function calculateMonthlyTrends(deals: Deal[]) {
  // Monthly Trends (last 12 months) - Now using source_date instead of created_at
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
    
    // Filter deals by source_date instead of created_at
    const monthDeals = deals.filter(deal => {
      if (!deal.source_date) return false;
      return deal.source_date.startsWith(monthKey);
    });
    
    const investedDeals = monthDeals.filter(deal => 
      deal.pipeline_stage === 'Invested'
    );

    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      deals: monthDeals.length,
      invested: investedDeals.length
    };
  }).reverse();
}
