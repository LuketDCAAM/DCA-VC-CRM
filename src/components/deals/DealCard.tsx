
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, User, Mail, Phone, Globe, MapPin, DollarSign, Eye, Star, ClipboardList } from 'lucide-react';
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
  pipeline_stage: PipelineStage;
  round_stage: RoundStage | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
  deal_score: number | null;
  source_date: string | null;
  deal_source: string | null;
  deal_lead: string | null;
}

interface DealCardProps {
  deal: Deal;
  onViewDetails?: (deal: Deal) => void;
  isSelected?: boolean;
  onToggleSelection?: (dealId: string) => void;
  showSelection?: boolean;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Convert from cents
};

const getStageColor = (stage: string) => {
  const colors = {
    'Seen Not Reviewed': 'bg-stone-100 text-stone-800',
    'Initial Review': 'bg-gray-100 text-gray-800',
    'Initial Contact': 'bg-sky-100 text-sky-800',
    'First Meeting': 'bg-blue-100 text-blue-800',
    'Due Diligence': 'bg-yellow-100 text-yellow-800',
    'Term Sheet': 'bg-purple-100 text-purple-800',
    'Legal Review': 'bg-orange-100 text-orange-800',
    'Invested': 'bg-green-100 text-green-800',
    'Passed': 'bg-red-100 text-red-800',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export function DealCard({ 
  deal, 
  onViewDetails, 
  isSelected = false, 
  onToggleSelection,
  showSelection = false 
}: DealCardProps) {
  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {showSelection && onToggleSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(deal.id)}
                  className="mt-1"
                  aria-label={`Select ${deal.company_name}`}
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {deal.company_name}
                </CardTitle>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className={getStageColor(deal.pipeline_stage)}>
                    {deal.pipeline_stage}
                  </Badge>
                  {deal.round_stage && (
                    <Badge variant="outline">
                      {deal.round_stage}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          {onViewDetails && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onViewDetails(deal)}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {deal.contact_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            {deal.contact_name}
          </div>
        )}
        
        {deal.contact_email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${deal.contact_email}`} className="hover:underline">
              {deal.contact_email}
            </a>
          </div>
        )}
        
        {deal.contact_phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <a href={`tel:${deal.contact_phone}`} className="hover:underline">
              {deal.contact_phone}
            </a>
          </div>
        )}
        
        {deal.website && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="h-4 w-4" />
            <a href={deal.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {deal.website}
            </a>
          </div>
        )}
        
        {deal.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            {deal.location}
          </div>
        )}

        {deal.deal_lead && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Lead: {deal.deal_lead}</span>
          </div>
        )}
        
        {deal.deal_source && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClipboardList className="h-4 w-4" />
            <span>Source: {deal.deal_source}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">Round Size</p>
            <p className="text-sm font-medium">{formatCurrency(deal.round_size)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Valuation</p>
            <p className="text-sm font-medium">{formatCurrency(deal.post_money_valuation)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Deal Score</p>
            <div className="flex items-center text-sm font-medium">
              <Star className={`h-4 w-4 mr-1 ${deal.deal_score && deal.deal_score > 50 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              {deal.deal_score ?? 'N/A'}
            </div>
          </div>
        </div>

        {deal.revenue && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">Revenue:</span>
            <span className="font-medium">{formatCurrency(deal.revenue)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
