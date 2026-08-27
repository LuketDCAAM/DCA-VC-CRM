import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PositionDetailsForm } from './PositionDetailsForm';
import type { PortfolioPosition } from '@/hooks/portfolio/usePortfolioPositions';

interface Props {
  companyId: string | null;
  companyName: string;
  position: PortfolioPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSave: (
    companyId: string,
    values: Partial<Omit<PortfolioPosition, 'id' | 'portfolio_company_id' | 'updated_at'>>,
  ) => Promise<boolean>;
}

export function PositionEditDialog({
  companyId,
  companyName,
  position,
  open,
  onOpenChange,
  saving,
  onSave,
}: Props) {
  if (!companyId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{companyName} — position</DialogTitle>
        </DialogHeader>
        <PositionDetailsForm
          key={`${companyId}-${position?.updated_at ?? 'new'}`}
          companyId={companyId}
          position={position}
          saving={saving}
          onSave={async (id, values) => {
            const ok = await onSave(id, values);
            if (ok) onOpenChange(false);
            return ok;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
