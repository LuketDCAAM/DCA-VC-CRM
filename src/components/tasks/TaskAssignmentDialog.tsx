
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { TaskAssignmentForm } from './TaskAssignmentForm';

interface TaskAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
  portfolioCompanyId?: string;
  investorId?: string;
  onTaskCreated?: () => void;
}

export function TaskAssignmentDialog({
  open,
  onOpenChange,
  dealId,
  portfolioCompanyId,
  investorId,
  onTaskCreated,
}: TaskAssignmentDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onTaskCreated?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Task
          </DialogTitle>
        </DialogHeader>

        <TaskAssignmentForm
          dealId={dealId}
          portfolioCompanyId={portfolioCompanyId}
          investorId={investorId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
