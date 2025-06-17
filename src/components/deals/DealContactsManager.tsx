
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User, Mail, Phone, Building2, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface Deal {
  id: string;
  company_name: string;
}

interface DealContactsManagerProps {
  deal: Deal;
}

function ContactCard({ contact, onEdit, onDelete }: {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
}) {
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

export function DealContactsManager({ deal }: DealContactsManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching contacts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    fetchContacts();
  }, [deal.id, user]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Associated Contacts</h3>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map(contact => (
            <ContactCard 
              key={contact.id} 
              contact={contact}
              onDelete={deleteContact}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No contacts associated with this deal yet.</p>
      )}
    </div>
  );
}
