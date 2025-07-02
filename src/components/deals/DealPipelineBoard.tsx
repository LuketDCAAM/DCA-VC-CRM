
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, Eye, Calendar, Star } from 'lucide-react';
import { Deal } from '@/types/deal'; 
import { PIPELINE_STAGES, PipelineStage } from '../dealStagesConfig';
import { getPipelineStageClasses } from './pipelineStageColors';

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

// Use centralized color system
const getStageColor = (stage: PipelineStage) => { 
  return getPipelineStageClasses(stage);
};

interface DealPipelineBoardProps {
  deals: Deal[];
  onViewDetails?: (deal: Deal) => void;
  onDealUpdated?: () => void;
}

export function DealPipelineBoard({ deals, onViewDetails, onDealUpdated }: DealPipelineBoardProps) {
  const dealsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    // Filter deals by stage with proper type checking
    acc[stage] = deals.filter(deal => deal.pipeline_stage === stage);
    return acc;
  }, {} as Record<PipelineStage, Deal[]>);

  const DealCardMini = ({ deal }: { deal: Deal }) => (
    <Card className="mb-2 hover:shadow-md transition-shadow cursor-pointer bg-white border border-gray-200" onClick={() => onViewDetails?.(deal)}>
      <CardHeader className="pb-1 px-3 pt-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xs font-semibold flex items-center gap-1 text-gray-900">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{deal.company_name}</span>
          </CardTitle>
          {onViewDetails && (
            <Button variant="ghost" size="sm" className="h-auto p-0.5 opacity-60 hover:opacity-100">
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 space-y-1">
        <div className="flex items-center justify-between">
            {deal.round_stage && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {deal.round_stage}
              </Badge>
            )}
           {typeof deal.deal_score === 'number' && (
             <div className="flex items-center gap-0.5 text-xs text-gray-600 font-medium">
               <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
               <span className="text-xs">{deal.deal_score}</span>
             </div>
           )}
        </div>
        
        {deal.round_size && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <DollarSign className="h-2.5 w-2.5 text-green-600" />
            <span className="font-medium">{formatCurrency(deal.round_size)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-2.5 w-2.5" />
          <span>{new Date(deal.updated_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map(stage => (
        <div key={stage} className="flex-shrink-0 w-64">
          <Card className={`h-full ${getStageColor(stage)} shadow-sm`}>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="truncate">{stage}</span>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-white/70">
                  {dealsByStage[stage].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto px-3 pb-3">
              {dealsByStage[stage].length > 0 ? (
                dealsByStage[stage].map(deal => (
                  <DealCardMini key={deal.id} deal={deal} />
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No deals in this stage
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
