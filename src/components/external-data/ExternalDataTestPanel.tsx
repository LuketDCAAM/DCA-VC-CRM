
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestTube, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useExternalDataSync } from '@/hooks/useExternalDataSync';
import type { APIProvider } from '@/types/external-data';
import type { Deal } from '@/types/deal';

interface ExternalDataTestPanelProps {
  deal: Deal;
}

export const ExternalDataTestPanel: React.FC<ExternalDataTestPanelProps> = ({ deal }) => {
  const { apiConfigs, syncDealData, isSyncing } = useExternalDataSync();
  const [selectedProvider, setSelectedProvider] = useState<APIProvider | ''>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testNotes, setTestNotes] = useState('');

  const availableProviders = apiConfigs?.map(config => config.provider as APIProvider) || [];

  const runTest = async () => {
    if (!selectedProvider) return;

    const testStart = Date.now();
    setTestResults(prev => [...prev, {
      id: Date.now(),
      provider: selectedProvider,
      status: 'running',
      startTime: new Date(),
      notes: testNotes || 'Manual test run'
    }]);

    try {
      await syncDealData({ dealId: deal.id, providers: [selectedProvider] });
      
      setTestResults(prev => prev.map(result => 
        result.id === testStart ? {
          ...result,
          status: 'success',
          endTime: new Date(),
          duration: Date.now() - testStart
        } : result
      ));
    } catch (error) {
      setTestResults(prev => prev.map(result => 
        result.id === testStart ? {
          ...result,
          status: 'failed',
          endTime: new Date(),
          duration: Date.now() - testStart,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : result
      ));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <TestTube className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          External Data Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Provider</label>
            <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as APIProvider)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider to test" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Test Notes</label>
            <Textarea
              placeholder="Add notes about this test..."
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <Button 
          onClick={runTest}
          disabled={!selectedProvider || isSyncing}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Run Test
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.provider}</span>
                      <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                        {result.status}
                      </Badge>
                    </div>
                    {result.duration && (
                      <span className="text-xs text-muted-foreground">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Started: {result.startTime.toLocaleString()}
                    {result.endTime && (
                      <> • Ended: {result.endTime.toLocaleString()}</>
                    )}
                  </div>
                  
                  {result.notes && (
                    <div className="text-xs mt-1 p-2 bg-muted rounded">
                      {result.notes}
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-xs mt-1 p-2 bg-red-50 text-red-800 rounded">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
