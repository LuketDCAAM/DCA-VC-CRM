
import { BulkAction } from '@/components/common/BulkActions';
import { Trash2, Edit, Archive } from 'lucide-react';

export const contactsBulkActions: BulkAction[] = [
  {
    id: 'export-selected',
    label: 'Export Selected',
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
