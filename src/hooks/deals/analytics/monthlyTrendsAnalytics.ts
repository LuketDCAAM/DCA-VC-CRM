
import { Deal } from '@/types/deal';
import { CallNote } from '@/hooks/useAllCallNotes';

export function calculateMonthlyTrends(deals: Deal[], callNotes: CallNote[] = []) {
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

    // Calculate first calls per month
    // For each deal, find the earliest call date and group by month
    const firstCallsThisMonth = new Set();
    
    deals.forEach(deal => {
      // Find the earliest call for this deal
      const dealCalls = callNotes.filter(callNote => callNote.deal_id === deal.id);
      if (dealCalls.length > 0) {
        const earliestCall = dealCalls.reduce((earliest, current) => {
          return current.call_date < earliest.call_date ? current : earliest;
        });
        
        // Check if this earliest call happened in the current month
        if (earliestCall.call_date && earliestCall.call_date.startsWith(monthKey)) {
          firstCallsThisMonth.add(deal.id);
        }
      }
    });

    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      deals: monthDeals.length,
      invested: investedDeals.length,
      calls: firstCallsThisMonth.size // Renamed from firstCalls to maintain compatibility
    };
  }).reverse();
}
