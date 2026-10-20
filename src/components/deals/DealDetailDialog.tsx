
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DealDetailHeader } from './detail/DealDetailHeader';
import { DealDetailContent } from './detail/DealDetailContent';
import { DealDetailSections } from './detail/DealDetailSections';
import { FollowUpDialog } from '@/components/outreach/FollowUpDialog';
import { useFollowUps } from '@/hooks/outreach/useFollowUps';
import { Deal } from '@/types/deal';

interface DealDetailDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: () => void;
}

export function DealDetailDialog({ deal, open, onOpenChange, onDealUpdated }: DealDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const navigate = useNavigate();
  const { createFollowUp } = useFollowUps();

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

  const handleEditClick = () => {
    setIsEditing(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DealDetailHeader 
            isEditing={isEditing} 
            onEditClick={handleEditClick} 
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/outreach/match?deals=${deal.id}`)}>
              <Users className="h-4 w-4 mr-1" /> Find investors
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFollowUpOpen(true)}>
              <CalendarPlus className="h-4 w-4 mr-1" /> Schedule follow-up
            </Button>
          </div>

          <DealDetailContent
            deal={deal}
            isEditing={isEditing}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          <DealDetailSections deal={deal} />
        </DialogContent>
      </Dialog>

      <FollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        onCreate={createFollowUp}
        dealId={deal.id}
        defaultContactName={deal.contact_name}
        defaultContactEmail={deal.contact_email}
        entityLabel={deal.company_name}
      />
    </>
  );
}
