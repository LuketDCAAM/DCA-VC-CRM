import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, DollarSign, TrendingUp, MapPin, Globe, User, Mail, Phone, ClipboardList } from 'lucide-react';
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
  updated_at: string;
  deal_score: number | null;
  source_date: string | null;
  deal_source: string | null;
  deal_lead: string | null;
}

interface DealOverviewProps {
  deal: Deal;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
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

export function DealOverview({ deal }: DealOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
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
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created: {new Date(deal.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                Updated: {new Date(deal.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.contact_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{deal.contact_name}</span>
              </div>
            )}
            {deal.contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <a href={`mailto:${deal.contact_email}`} className="text-blue-600 hover:underline">
                  {deal.contact_email}
                </a>
              </div>
            )}
            {deal.contact_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${deal.contact_phone}`} className="text-blue-600 hover:underline">
                  {deal.contact_phone}
                </a>
              </div>
            )}
            {deal.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <a href={deal.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {deal.website}
                </a>
              </div>
            )}
            {deal.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{deal.location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Round Size</div>
              <div className="font-medium">{formatCurrency(deal.round_size)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Post-Money Valuation</div>
              <div className="font-medium">{formatCurrency(deal.post_money_valuation)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Revenue</div>
              <div className="font-medium">{formatCurrency(deal.revenue)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Deal Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Time in Pipeline</div>
              <div className="font-medium">
                {Math.ceil((new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 3600 * 24))} days
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Last Updated</div>
              <div className="font-medium">
                {Math.ceil((new Date().getTime() - new Date(deal.updated_at).getTime()) / (1000 * 3600 * 24))} days ago
              </div>
            </div>
            {deal.round_size && deal.post_money_valuation && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Dilution</div>
                <div className="font-medium">
                  {((deal.round_size / deal.post_money_valuation) * 100).toFixed(2)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Source Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.deal_lead && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Deal Lead</div>
                <div className="font-medium">{deal.deal_lead}</div>
              </div>
            )}
            {deal.deal_source && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Deal Source</div>
                <div className="font-medium">{deal.deal_source}</div>
              </div>
            )}
            {deal.source_date && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Source Date</div>
                <div className="font-medium">{new Date(deal.source_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
