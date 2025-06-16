
import React from 'react';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';

interface DealsBulkActionsProps {
  selectedDeals: string[];
  totalDeals: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (actionId: string, selectedIds: string[]) => void;
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
  const bulkActions: BulkAction[] = [
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
      onAction={onBulkAction}
      isAllSelected={isAllSelected}
    />
  );
}
