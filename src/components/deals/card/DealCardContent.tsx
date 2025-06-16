
import React from 'react';
import { User, Mail, Phone, Globe, MapPin, ClipboardList } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealCardContentProps {
  deal: Deal;
}

export function DealCardContent({ deal }: DealCardContentProps) {
  return (
    <div className="space-y-3">
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
    </div>
  );
}
