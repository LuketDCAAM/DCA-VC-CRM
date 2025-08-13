
import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeleteDeal } from '@/hooks/useDeleteDeal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Deal } from '@/types/deal';

interface DealCardActionsProps {
  deal: Deal;
  onViewDetails?: (deal: Deal) => void;
  onEdit?: (deal: Deal) => void;
  onDealDeleted?: () => void;
}

export const DealCardActions: React.FC<DealCardActionsProps> = ({
  deal,
  onViewDetails,
  onEdit,
  onDealDeleted,
}) => {
  const { deleteDeal, isDeleting } = useDeleteDeal();

  const handleDelete = async () => {
    const success = await deleteDeal(deal.id);
    if (success && onDealDeleted) {
      onDealDeleted();
    }
  };
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onViewDetails && (
            <DropdownMenuItem onClick={() => onViewDetails(deal)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(deal)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Deal
            </DropdownMenuItem>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem 
                onSelect={(e) => e.preventDefault()}
                className="text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Deal
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deal.company_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
