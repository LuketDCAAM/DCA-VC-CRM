
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, DollarSign, Target, UserPlus, Globe, ExternalLink, Calendar, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Investor } from '@/types/investor';

interface InvestorCardProps {
  investor: Investor;
  onViewDetails?: (investor: Investor) => void;
  onAddContact?: (investor: Investor) => void;
}

export function InvestorCard({ investor, onViewDetails, onAddContact }: InvestorCardProps) {
  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails?.(investor)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{investor.contact_name}</h3>
            {investor.firm_name && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <Building2 className="h-3 w-3" />
                {investor.firm_name}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {investor.firm_website && (
                <a
                  href={formatUrl(investor.firm_website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="h-3 w-3" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {investor.linkedin_url && (
                <a
                  href={formatUrl(investor.linkedin_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onAddContact && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddContact?.(investor);
                }}
                title="Add contact for this investor"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            {investor.preferred_investment_stage && (
              <Badge variant="secondary" className="text-xs">
                {investor.preferred_investment_stage}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-1">
          {investor.contact_email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-3 w-3" />
              <a 
                href={`mailto:${investor.contact_email}`}
                className="hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {investor.contact_email}
              </a>
            </div>
          )}
          {investor.contact_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3 w-3" />
              <a 
                href={`tel:${investor.contact_phone}`}
                className="hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {investor.contact_phone}
              </a>
            </div>
          )}
          {investor.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              {investor.location}
            </div>
          )}
          {investor.last_call_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Last Call: {formatDate(investor.last_call_date)}</span>
            </div>
          )}
        </div>

        {/* Investment Details */}
        <div className="space-y-1">
          {investor.average_check_size && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">Avg Check:</span>
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(investor.average_check_size / 100)}
              </span>
            </div>
          )}
        </div>

        {/* Preferred Sectors */}
        {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Target className="h-3 w-3" />
              Sectors:
            </div>
            <div className="flex flex-wrap gap-1">
              {investor.preferred_sectors.slice(0, 3).map((sector, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {sector}
                </Badge>
              ))}
              {investor.preferred_sectors.length > 3 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{investor.preferred_sectors.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {investor.tags && investor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {investor.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {investor.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{investor.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
