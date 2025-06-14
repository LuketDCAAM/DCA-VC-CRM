
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { DealOverview } from './DealOverview';
import { DealEditForm } from './DealEditForm';
import { Database } from '@/integrations/supabase/types';
import { Separator } from '@/components/ui/separator';
import { DealInvestorsManager } from './DealInvestorsManager';
import { DealContactsManager } from './DealContactsManager';

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
  description: string | null;
  pipeline_stage: PipelineStage;
  round_stage: RoundStage | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
  updated_at: string;
  deal_score: number | null;
}

interface DealDetailDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: () => void;
}

export function DealDetailDialog({ deal, open, onOpenChange, onDealUpdated }: DealDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsEditing(false);
    }
  }, [open]);

  const handleSave = () => {
    setIsEditing(false);
    onDealUpdated();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              {isEditing ? 'Edit Deal' : 'Deal Details'}
            </DialogTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Deal
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-4">
          {isEditing ? (
            <DealEditForm
              deal={deal}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <DealOverview deal={deal} />
          )}
        </div>

        <div className="my-6">
          <Separator />
        </div>

        <DealInvestorsManager deal={deal} />

        <div className="my-6">
          <Separator />
        </div>

        <DealContactsManager deal={deal} />
      </DialogContent>
    </Dialog>
  );
}
