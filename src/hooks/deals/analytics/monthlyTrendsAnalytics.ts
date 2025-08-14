
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

    // Filter call notes by call_date for this month
    const monthCalls = callNotes.filter(callNote => {
      if (!callNote.call_date) return false;
      return callNote.call_date.startsWith(monthKey);
    });

    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      deals: monthDeals.length,
      invested: investedDeals.length,
      calls: monthCalls.length
    };
  }).reverse();
}
