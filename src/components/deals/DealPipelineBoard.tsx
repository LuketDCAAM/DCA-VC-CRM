import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, Eye, Calendar, Star } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type PipelineStage = Database['public']['Enums']['pipeline_stage'];
type RoundStage = Database['public']['Enums']['round_stage'];

interface Deal {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  description: string | null;
  pipeline_stage: PipelineStage;
  round_stage: RoundStage | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
  updated_at: string;
  deal_score: number | null;
  source_date: string | null;
  deal_source: string | null;
  deal_lead: string | null;
}

interface DealPipelineBoardProps {
  deals: Deal[];
  onViewDetails?: (deal: Deal) => void;
  onDealUpdated?: () => void;
}

const pipelineStages: PipelineStage[] = [
  'Seen Not Reviewed',
  'Initial Review',
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Term Sheet',
  'Legal Review',
  'Invested',
  'Passed'
];

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

const getStageColor = (stage: string) => {
  const colors = {
    'Seen Not Reviewed': 'bg-stone-100 text-stone-800 border-stone-200',
    'Initial Review': 'bg-gray-100 text-gray-800 border-gray-200',
    'Initial Contact': 'bg-sky-100 text-sky-800 border-sky-200',
    'First Meeting': 'bg-blue-100 text-blue-800 border-blue-200',
    'Due Diligence': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Term Sheet': 'bg-purple-100 text-purple-800 border-purple-200',
    'Legal Review': 'bg-orange-100 text-orange-800 border-orange-200',
    'Invested': 'bg-green-100 text-green-800 border-green-200',
    'Passed': 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export function DealPipelineBoard({ deals, onViewDetails, onDealUpdated }: DealPipelineBoardProps) {
  const dealsByStage = pipelineStages.reduce((acc, stage) => {
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
      {pipelineStages.map(stage => (
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
