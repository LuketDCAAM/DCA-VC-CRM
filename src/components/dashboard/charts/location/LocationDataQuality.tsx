
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
  
  const mappingRate = qualityReport.totalDeals > 0 
    ? Math.round((qualityReport.mappedDeals / qualityReport.totalDeals) * 100)
    : 0;
  
  const highConfidenceRate = qualityReport.totalDeals > 0
    ? Math.round((qualityReport.highConfidenceDeals / qualityReport.totalDeals) * 100)
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
            Analysis of location data mapping accuracy and consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{qualityReport.totalDeals}</div>
              <div className="text-sm text-gray-600">Total Deals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mappingRate}%</div>
              <div className="text-sm text-gray-600">Mapping Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{highConfidenceRate}%</div>
              <div className="text-sm text-gray-600">High Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{qualityReport.unmappedDeals}</div>
              <div className="text-sm text-gray-600">Unmapped</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                High Confidence
              </Badge>
              <span className="text-sm">{qualityReport.highConfidenceDeals} deals</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Medium Confidence
              </Badge>
              <span className="text-sm">{qualityReport.mediumConfidenceDeals} deals</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Low Confidence
              </Badge>
              <span className="text-sm">{qualityReport.lowConfidenceDeals} deals</span>
            </div>
          </div>

          {mappingRate >= 90 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Excellent data quality! {mappingRate}% of locations are successfully mapped.
              </AlertDescription>
            </Alert>
          ) : mappingRate >= 70 ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Good data quality with room for improvement. {mappingRate}% mapping rate.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Location data quality needs attention. Only {mappingRate}% mapping rate.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {qualityReport.unmappedLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Unmapped Locations</CardTitle>
            <CardDescription>
              Locations that could not be automatically mapped to regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {qualityReport.unmappedLocations.slice(0, 12).map((location, index) => (
                <Badge key={index} variant="outline" className="justify-start">
                  {location}
                </Badge>
              ))}
            </div>
            {qualityReport.unmappedLocations.length > 12 && (
              <p className="text-sm text-gray-500 mt-2">
                ...and {qualityReport.unmappedLocations.length - 12} more
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {qualityReport.duplicateLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Duplicate Mappings</CardTitle>
            <CardDescription>
              Locations that map to multiple regions (may need manual review)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qualityReport.duplicateLocations.map((duplicate, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{duplicate.location}</span>
                  <div className="flex gap-1">
                    {duplicate.mappedTo.map((region, regionIndex) => (
                      <Badge key={regionIndex} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
