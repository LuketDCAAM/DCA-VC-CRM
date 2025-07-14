
import React, { useEffect, useState } from 'react';
import { Deal } from '@/types/deal';
import { DealHeaderCard } from './overview/DealHeaderCard';
import { DealContactCard } from './overview/DealContactCard';
import { DealCompanyDetailsCard } from './overview/DealCompanyDetailsCard';
import { DealFinancialCard } from './overview/DealFinancialCard';
import { DealMetricsCard } from './overview/DealMetricsCard';
import { DealSourceCard } from './overview/DealSourceCard';
import { DealInvestorCard } from './overview/DealInvestorCard';
import { DealNextStepsCard } from './overview/DealNextStepsCard';
import { DealExternalDataCard } from './overview/DealExternalDataCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Paperclip, Link, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileAttachment {
  id: string;
  deal_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

interface DealOverviewProps {
  deal: Deal;
}

export function DealOverview({ deal }: DealOverviewProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttachments = async () => {
      setAttachmentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('file_attachments')
          .select('*')
          .eq('deal_id', deal.id)
          .neq('file_type', 'investor_info') // Exclude investor info from general attachments
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching file attachments:', error);
          toast({
            title: "Error",
            description: "Failed to load attachments.",
            variant: "destructive",
          });
          setAttachments([]);
        } else {
          setAttachments(data || []);
        }
      } catch (err: any) {
        console.error('Unexpected error fetching file attachments:', err);
        toast({
          title: "Error",
          description: `An unexpected error occurred: ${err.message}`,
          variant: "destructive",
        });
        setAttachments([]);
      } finally {
        setAttachmentsLoading(false);
      }
    };

    if (deal?.id) {
      fetchAttachments();
    } else {
      setAttachments([]);
      setAttachmentsLoading(false);
    }
  }, [deal?.id, toast]);

  return (
    <div className="space-y-6">
      <DealHeaderCard deal={deal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DealContactCard deal={deal} />
        <DealCompanyDetailsCard deal={deal} />
        <DealFinancialCard deal={deal} />
        <DealMetricsCard deal={deal} />
        <DealSourceCard deal={deal} />
        <DealInvestorCard deal={deal} />

        {/* External Data Card */}
        <DealExternalDataCard deal={deal} />

        {/* Next Steps Card */}
        <DealNextStepsCard deal={deal} />

        {/* Attachments Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Paperclip className="h-5 w-5" /> Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attachmentsLoading ? (
              <div className="text-center text-sm text-muted-foreground">Loading attachments...</div>
            ) : attachments.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">No attachments found for this deal.</div>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                    {attachment.file_type === 'link' ? (
                      <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline truncate flex items-center gap-1 transition-colors"
                      title={attachment.file_name}
                    >
                      {attachment.file_name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {attachment.file_size > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({(attachment.file_size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
