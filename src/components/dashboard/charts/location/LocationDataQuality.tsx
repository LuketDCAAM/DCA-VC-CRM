
import React from 'react';
import { Deal } from '@/types/deal';
import { useLocationQualityReport } from './useLocationData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface LocationDataQualityProps {
  deals: Deal[];
}

export function LocationDataQuality({ deals }: LocationDataQualityProps) {
  const qualityReport = useLocationQualityReport(deals);
  
  const completionRate = qualityReport.total > 0 
    ? Math.round((qualityReport.withCountry / qualityReport.total) * 100)
    : 0;
  
  const stateRate = qualityReport.total > 0
    ? Math.round((qualityReport.withState / qualityReport.total) * 100)
    : 0;

  const cityRate = qualityReport.total > 0
    ? Math.round((qualityReport.withCity / qualityReport.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Location Data Quality Report
          </CardTitle>
          <CardDescription>
            Analysis of location data completeness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{qualityReport.total}</div>
              <div className="text-sm text-gray-600">Total Deals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
              <div className="text-sm text-gray-600">With Country</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stateRate}%</div>
              <div className="text-sm text-gray-600">With State</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">{cityRate}%</div>
              <div className="text-sm text-gray-600">With City</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{qualityReport.missingLocation}</div>
              <div className="text-sm text-gray-600">Missing Location</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Complete
              </Badge>
              <span className="text-sm">{qualityReport.withCompleteLocation} deals</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Partial
              </Badge>
              <span className="text-sm">{qualityReport.withCountry - qualityReport.withCompleteLocation} deals</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Missing
              </Badge>
              <span className="text-sm">{qualityReport.missingLocation} deals</span>
            </div>
          </div>

          {completionRate >= 90 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Excellent data quality! {completionRate}% of deals have country information.
              </AlertDescription>
            </Alert>
          ) : completionRate >= 70 ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Good data quality with room for improvement. {completionRate}% have country data.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Location data quality needs attention. Only {completionRate}% have country information.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
