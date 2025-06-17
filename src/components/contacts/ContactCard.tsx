
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building2, Edit, Trash2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company_or_firm: string | null;
  email: string | null;
  phone: string | null;
  deal_id: string | null;
  investor_id: string | null;
  portfolio_company_id: string | null;
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const getContactType = () => {
    if (contact.deal_id) return 'Deal Contact';
    if (contact.investor_id) return 'Investor Contact';
    if (contact.portfolio_company_id) return 'Portfolio Contact';
    return 'General Contact';
  };

  const getContactTypeColor = () => {
    if (contact.deal_id) return 'bg-blue-100 text-blue-800';
    if (contact.investor_id) return 'bg-green-100 text-green-800';
    if (contact.portfolio_company_id) return 'bg-teal-100 text-teal-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {contact.name}
            </CardTitle>
            {contact.title && (
              <p className="text-sm text-gray-600 mt-1">{contact.title}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Badge className={getContactTypeColor()}>
                {getContactType()}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(contact)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(contact.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {contact.company_or_firm && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4" />
            {contact.company_or_firm}
          </div>
        )}
        
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${contact.email}`} className="hover:underline">
              {contact.email}
            </a>
          </div>
        )}
        
        {contact.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <a href={`tel:${contact.phone}`} className="hover:underline">
              {contact.phone}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
