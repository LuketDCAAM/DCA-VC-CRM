
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Archive, CheckSquare, Square } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirmation?: boolean;
}

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions: BulkAction[];
  onAction: (actionId: string, selectedIds: string[]) => void;
  isAllSelected: boolean;
}

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onDeselectAll,
  actions,
  onAction,
  isAllSelected
}: BulkActionsProps) {
  if (selectedItems.length === 0) {
    return null;
  }

  const handleAction = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action?.requiresConfirmation) {
      if (confirm(`Are you sure you want to ${action.label.toLowerCase()} ${selectedItems.length} item(s)?`)) {
        onAction(actionId, selectedItems);
      }
    } else {
      onAction(actionId, selectedItems);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {selectedItems.length} of {totalItems} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Bulk Actions:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Choose Action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => (
                <React.Fragment key={action.id}>
                  <DropdownMenuItem
                    onClick={() => handleAction(action.id)}
                    className="flex items-center gap-2"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                  {index < actions.length - 1 && <DropdownMenuSeparator />}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
