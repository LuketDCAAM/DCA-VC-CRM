
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealContactCardProps {
  deal: Deal;
}

export function DealContactCard({ deal }: DealContactCardProps) {
  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
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
            <a 
              href={`mailto:${deal.contact_email}`} 
              className="text-blue-600 hover:underline transition-colors"
            >
              {deal.contact_email}
            </a>
          </div>
        )}
        {deal.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <a 
              href={`tel:${deal.contact_phone}`} 
              className="text-blue-600 hover:underline transition-colors"
            >
              {deal.contact_phone}
            </a>
          </div>
        )}
        {deal.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <a 
              href={formatUrl(deal.website)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline transition-colors"
            >
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
  );
}
