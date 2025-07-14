
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Deal } from '@/types/deal';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, User, Calendar } from 'lucide-react';

interface DealContactCardProps {
  deal: Deal;
}

export function DealContactCard({ deal }: DealContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deal.contact_name && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
            <p className="text-base font-medium">{deal.contact_name}</p>
          </div>
        )}
        
        {deal.contact_email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`mailto:${deal.contact_email}`}
              className="text-blue-600 hover:underline"
            >
              {deal.contact_email}
            </a>
          </div>
        )}
        
        {deal.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`tel:${deal.contact_phone}`}
              className="text-blue-600 hover:underline"
            >
              {deal.contact_phone}
            </a>
          </div>
        )}

        {deal.last_call_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Call Date</p>
              <Badge variant="outline" className="text-xs">
                {new Date(deal.last_call_date).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        )}
        
        {!deal.contact_name && !deal.contact_email && !deal.contact_phone && !deal.last_call_date && (
          <p className="text-sm text-muted-foreground">No contact information available</p>
        )}
      </CardContent>
    </Card>
  );
}
