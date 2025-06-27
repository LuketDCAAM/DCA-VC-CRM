
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal';

interface DealInvestorCardProps {
  deal: Deal;
}

export function DealInvestorCard({ deal }: DealInvestorCardProps) {
  const [leadInvestor, setLeadInvestor] = useState<string>('');
  const [otherInvestors, setOtherInvestors] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestorInfo = async () => {
      setLoading(true);
      try {
        const { data: attachments, error } = await supabase
          .from('file_attachments')
          .select('file_name, file_url, file_type')
          .eq('deal_id', deal.id)
          .eq('file_type', 'investor_info');

        if (error) {
          console.error('Error fetching investor info:', error);
          return;
        }

        if (attachments) {
          const leadInvestorInfo = attachments.find(att => 
            att.file_url.startsWith('investor:lead:')
          );
          if (leadInvestorInfo) {
            setLeadInvestor(leadInvestorInfo.file_url.replace('investor:lead:', ''));
          }

          const otherInvestorInfo = attachments.find(att => 
            att.file_url.startsWith('investor:other:')
          );
          if (otherInvestorInfo) {
            setOtherInvestors(otherInvestorInfo.file_url.replace('investor:other:', ''));
          }
        }
      } catch (error) {
        console.error('Error fetching investor information:', error);
      } finally {
        setLoading(false);
      }
    };

    if (deal.id) {
      fetchInvestorInfo();
    }
  }, [deal.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Investors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading investor information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!leadInvestor && !otherInvestors) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Investors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No investor information available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Investors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leadInvestor && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Lead Investor</span>
            </div>
            <p className="text-sm bg-muted/50 p-2 rounded border-l-2 border-primary">
              {leadInvestor}
            </p>
          </div>
        )}
        
        {otherInvestors && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Other Investors</span>
            </div>
            <p className="text-sm bg-muted/30 p-2 rounded border-l-2 border-muted-foreground">
              {otherInvestors}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
