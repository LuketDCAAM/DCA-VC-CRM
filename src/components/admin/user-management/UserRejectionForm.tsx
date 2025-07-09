
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UserRejectionFormProps {
  userId: string;
  rejectionReason: string;
  onReasonChange: (reason: string) => void;
  onConfirmReject: (userId: string) => Promise<void>;
  onCancel: () => void;
}

export function UserRejectionForm({ 
  userId, 
  rejectionReason, 
  onReasonChange, 
  onConfirmReject, 
  onCancel 
}: UserRejectionFormProps) {
  return (
    <div className="space-y-2 p-3 border rounded-lg bg-red-50">
      <Label htmlFor="rejection-reason">Rejection Reason (optional)</Label>
      <Textarea
        id="rejection-reason"
        value={rejectionReason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Provide a reason for rejection..."
        className="resize-none"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onConfirmReject(userId)}
        >
          Confirm Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
