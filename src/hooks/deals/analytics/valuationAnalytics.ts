
import { Deal } from '@/types/deal';

export function calculateValuationAnalysis(deals: Deal[]) {
  // Valuation Analysis
  const dealsWithValuation = deals.filter(deal => 
    deal.post_money_valuation && deal.post_money_valuation > 0
  );

  const valuations = dealsWithValuation.map(deal => deal.post_money_valuation!);
  const averageValuation = valuations.length > 0 
    ? valuations.reduce((sum, val) => sum + val, 0) / valuations.length 
    : 0;

  const sortedValuations = [...valuations].sort((a, b) => a - b);
  const medianValuation = sortedValuations.length > 0
    ? sortedValuations[Math.floor(sortedValuations.length / 2)]
    : 0;

  const totalDealValue = deals
    .filter(deal => deal.round_size && deal.round_size > 0)
    .reduce((sum, deal) => sum + deal.round_size!, 0);

  // Valuation ranges in millions
  const valuationRanges = [
    { range: '<$5M', count: 0 },
    { range: '$5M-$10M', count: 0 },
    { range: '$10M-$25M', count: 0 },
    { range: '$25M-$50M', count: 0 },
    { range: '$50M-$100M', count: 0 },
    { range: '>$100M', count: 0 }
  ];

  dealsWithValuation.forEach(deal => {
    const valuation = deal.post_money_valuation! / 100; // Convert from cents
    if (valuation < 5000000) valuationRanges[0].count++;
    else if (valuation < 10000000) valuationRanges[1].count++;
    else if (valuation < 25000000) valuationRanges[2].count++;
    else if (valuation < 50000000) valuationRanges[3].count++;
    else if (valuation < 100000000) valuationRanges[4].count++;
    else valuationRanges[5].count++;
  });

  // Quarterly trends
  const quarterlyTrends = calculateQuarterlyValuationTrends(dealsWithValuation);

  return {
    averageValuation,
    medianValuation,
    totalDealValue,
    valuationRanges,
    quarterlyTrends
  };
}

function calculateQuarterlyValuationTrends(deals: Deal[]) {
  const quarterlyData: Record<string, { valuations: number[], dealCount: number }> = {};
  
  deals.forEach(deal => {
    // Use source_date if available, otherwise fall back to created_at
    const date = deal.source_date ? new Date(deal.source_date) : new Date(deal.created_at);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const quarterKey = `${year} Q${quarter}`;
    
    if (!quarterlyData[quarterKey]) {
      quarterlyData[quarterKey] = { valuations: [], dealCount: 0 };
    }
    
    quarterlyData[quarterKey].valuations.push(deal.post_money_valuation!);
    quarterlyData[quarterKey].dealCount++;
  });

  // Calculate trends for the last 8 quarters
  const sortedQuarters = Object.keys(quarterlyData).sort();
  const recentQuarters = sortedQuarters.slice(-8);
  
  return recentQuarters.map(quarter => {
    const data = quarterlyData[quarter];
    const averageValuation = data.valuations.length > 0 
      ? data.valuations.reduce((sum, val) => sum + val, 0) / data.valuations.length 
      : 0;
    
    const sortedVals = [...data.valuations].sort((a, b) => a - b);
    const medianValuation = sortedVals.length > 0
      ? sortedVals[Math.floor(sortedVals.length / 2)]
      : 0;

    return {
      quarter,
      averageValuation,
      medianValuation,
      dealCount: data.dealCount
    };
  });
}
