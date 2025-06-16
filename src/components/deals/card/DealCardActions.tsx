
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealCardActionsProps {
  deal: Deal;
  onViewDetails?: (deal: Deal) => void;
}

export function DealCardActions({ deal, onViewDetails }: DealCardActionsProps) {
  if (!onViewDetails) return null;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => onViewDetails(deal)}
      className="hover:bg-primary/10 hover:text-primary transition-colors"
    >
      <Eye className="h-4 w-4 mr-2" />
      View
    </Button>
  );
}
