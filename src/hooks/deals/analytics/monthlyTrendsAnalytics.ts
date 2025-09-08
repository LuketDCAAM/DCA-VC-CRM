
import { Deal } from '@/types/deal';
import { CallNote } from '@/hooks/useAllCallNotes';

export function calculateMonthlyTrends(deals: Deal[], callNotes: CallNote[] = []) {
  console.log('📊 Monthly Trends Calculation Started');
  console.log(`Total deals: ${deals.length}, Total call notes: ${callNotes.length}`);
  
  // Monthly Trends (last 12 months) - Now using source_date instead of created_at
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
    
    console.log(`\n🗓️ Processing month: ${monthKey}`);
    
    // Filter deals by source_date instead of created_at
    const monthDeals = deals.filter(deal => {
      if (!deal.source_date) return false;
      return deal.source_date.startsWith(monthKey);
    });
    
    console.log(`  Deals sourced in ${monthKey}: ${monthDeals.length}`);
    
    // Find ALL invested deals regardless of source date - we want to track when deals became invested
    const investedDeals = deals.filter(deal => 
      deal.pipeline_stage === 'Invested' && deal.updated_at && deal.updated_at.startsWith(monthKey)
    );
    
    console.log(`  Deals invested in ${monthKey}: ${investedDeals.length}`);

    // Calculate first calls per month
    // For each deal, find the earliest call date and group by month
    const firstCallsThisMonth = new Set();
    
    // Group call notes by deal_id for faster lookup
    const callsByDeal = new Map();
    callNotes.forEach(callNote => {
      if (!callsByDeal.has(callNote.deal_id)) {
        callsByDeal.set(callNote.deal_id, []);
      }
      callsByDeal.get(callNote.deal_id).push(callNote);
    });
    
    console.log(`  Call notes distributed across ${callsByDeal.size} deals`);
    
    deals.forEach(deal => {
      const dealCalls = callsByDeal.get(deal.id) || [];
      if (dealCalls.length > 0) {
        // Sort calls by date and get the earliest one
        const sortedCalls = dealCalls.sort((a, b) => a.call_date.localeCompare(b.call_date));
        const earliestCall = sortedCalls[0];
        
        // Check if this earliest call happened in the current month
        if (earliestCall.call_date) {
          const callMonthKey = typeof earliestCall.call_date === 'string'
            ? earliestCall.call_date.slice(0, 7)
            : new Date(earliestCall.call_date as any).toISOString().slice(0, 7);
          if (callMonthKey === monthKey) {
            firstCallsThisMonth.add(deal.id);
            console.log(`    First call for deal ${deal.company_name}: ${earliestCall.call_date}`);
          }
        }
      }
    });

    console.log(`  First calls in ${monthKey}: ${firstCallsThisMonth.size}`);

    const result = {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      deals: monthDeals.length,
      invested: investedDeals.length,
      firstCalls: firstCallsThisMonth.size
    };
    
    console.log(`  Final result for ${monthKey}:`, result);
    return result;
  }).reverse();
}
