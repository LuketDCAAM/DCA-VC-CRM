
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, User, Mail, Phone, Globe, MapPin, DollarSign } from 'lucide-react';

interface Deal {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  pipeline_stage: string;
  round_stage: string | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
}

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStageColor = (stage: string) => {
  const colors = {
    'Initial Contact': 'bg-gray-100 text-gray-800',
    'First Meeting': 'bg-blue-100 text-blue-800',
    'Due Diligence': 'bg-yellow-100 text-yellow-800',
    'Term Sheet': 'bg-purple-100 text-purple-800',
    'Legal Review': 'bg-orange-100 text-orange-800',
    'Invested': 'bg-green-100 text-green-800',
    'Passed': 'bg-red-100 text-red-800',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export function DealCard({ deal, onEdit }: DealCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {deal.company_name}
            </CardTitle>
            <div className="flex gap-2 mt-2">
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
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(deal)}>
              Edit
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

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">Round Size</p>
            <p className="text-sm font-medium">{formatCurrency(deal.round_size)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Valuation</p>
            <p className="text-sm font-medium">{formatCurrency(deal.post_money_valuation)}</p>
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
