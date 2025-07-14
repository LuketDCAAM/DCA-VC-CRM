
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, MapPin, Mail, Phone, Calendar, DollarSign, ExternalLink, Linkedin } from 'lucide-react';
import { LPEngagement } from '@/types/lpEngagement';

interface LPEngagementCardProps {
  engagement: LPEngagement;
  onView: (engagement: LPEngagement) => void;
  onEdit: (engagement: LPEngagement) => void;
}

const formatCurrency = (amount?: number) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatUrl = (url: string) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const getEngagementStageColor = (stage: string) => {
  switch (stage) {
    case 'Committed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Active':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Negotiation':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Due Diligence':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Initial Contact':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Prospect':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Inactive':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Declined':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function LPEngagementCard({ engagement, onView, onEdit }: LPEngagementCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{engagement.lp_name}</h3>
            {engagement.lp_type && (
              <p className="text-sm text-muted-foreground">{engagement.lp_type}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(engagement)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(engagement)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getEngagementStageColor(engagement.engagement_stage)}>
            {engagement.engagement_stage}
          </Badge>
          {engagement.commitment_amount && (
            <div className="flex items-center gap-1 text-sm font-medium">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(engagement.commitment_amount)}
            </div>
          )}
        </div>

        {engagement.contact_name && (
          <div className="space-y-2">
            <p className="font-medium text-sm">{engagement.contact_name}</p>
            <div className="flex flex-col gap-1">
              {engagement.contact_email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{engagement.contact_email}</span>
                </div>
              )}
              {engagement.contact_phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{engagement.contact_phone}</span>
                </div>
              )}
              {engagement.linkedin_url && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Linkedin className="h-3 w-3" />
                  <a
                    href={formatUrl(engagement.linkedin_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline transition-colors"
                  >
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {engagement.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{engagement.location}</span>
          </div>
        )}

        {engagement.committed_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Committed: {new Date(engagement.committed_date).toLocaleDateString()}</span>
          </div>
        )}

        {engagement.investment_focus && engagement.investment_focus.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {engagement.investment_focus.slice(0, 3).map((focus, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {focus}
              </Badge>
            ))}
            {engagement.investment_focus.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{engagement.investment_focus.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
