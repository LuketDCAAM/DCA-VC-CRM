
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DealsStatsProps {
  totalDeals: number;
  activeDeals: number;
  investedDeals: number;
  passedDeals: number;
  screeningDeals?: number; // Optional for backwards compatibility
}

export function DealsStats({
  totalDeals,
  activeDeals,
  investedDeals,
  passedDeals,
  screeningDeals = 0,
}: DealsStatsProps) {
  console.log('=== DEALS STATS COMPONENT RENDER ===');
  console.log('DealsStats received props:', {
    totalDeals,
    activeDeals,
    investedDeals,
    passedDeals,
    screeningDeals
  });

  // Data validation and consistency check
  const calculatedTotal = activeDeals + investedDeals + passedDeals + screeningDeals;
  const hasConsistencyIssue = calculatedTotal !== totalDeals;
  
  if (hasConsistencyIssue) {
    console.warn('⚠️ DEAL COUNT INCONSISTENCY DETECTED!');
    console.warn('Total deals:', totalDeals);
    console.warn('Sum of categories:', calculatedTotal);
    console.warn('Difference:', Math.abs(totalDeals - calculatedTotal));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            {hasConsistencyIssue && (
              <div className="text-xs text-red-500 mt-1">
                ⚠️ Count mismatch detected
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeDeals}</div>
            <div className="text-xs text-gray-500 mt-1">
              Initial Contact → Legal Review
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{investedDeals}</div>
            <div className="text-xs text-gray-500 mt-1">
              Completed investments
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{passedDeals}</div>
            <div className="text-xs text-gray-500 mt-1">
              Declined opportunities
            </div>
          </CardContent>
        </Card>
      </div>
      
      {screeningDeals > 0 && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Screening ({screeningDeals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Deals in "Seen Not Reviewed" and "Initial Review" stages
            </div>
          </CardContent>
        </Card>
      )}
      
      {hasConsistencyIssue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="text-sm text-red-700">
              <strong>Data Inconsistency Detected:</strong> The sum of categorized deals ({calculatedTotal}) 
              doesn't match the total count ({totalDeals}). This may indicate missing pipeline stages 
              or data synchronization issues.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
