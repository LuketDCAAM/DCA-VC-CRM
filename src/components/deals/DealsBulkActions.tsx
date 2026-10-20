
import React from 'react';
import { Edit, Archive, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';

interface DealsBulkActionsProps {
  selectedDeals: string[];
  totalDeals: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (actionId: string, selectedIds: string[]) => Promise<void>;
  isAllSelected: boolean;
}

export function DealsBulkActions({
  selectedDeals,
  totalDeals,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
  isAllSelected,
}: DealsBulkActionsProps) {
  const navigate = useNavigate();
  const bulkActions: BulkAction[] = [
    {
      id: 'find-investors',
      label: 'Find investors',
      icon: Users,
      variant: 'default'
    },
    {
      id: 'move-to-stage',
      label: 'Move to Stage',
      icon: Edit,
      variant: 'default'
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'secondary'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true
    }
  ];

  return (
    <BulkActions
      selectedItems={selectedDeals}
      totalItems={totalDeals}
      onSelectAll={onSelectAll}
      onDeselectAll={onDeselectAll}
      actions={bulkActions}
      onAction={async (id, ids) => {
        if (id === 'find-investors') {
          navigate(`/outreach/match?deals=${ids.join(',')}`);
          return;
        }
        await onBulkAction(id, ids);
      }}
      isAllSelected={isAllSelected}
    />
  );
}
