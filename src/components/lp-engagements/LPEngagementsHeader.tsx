
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface LPEngagementsHeaderProps {
  onAddClick: () => void;
}

export function LPEngagementsHeader({ onAddClick }: LPEngagementsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-3xl font-bold">LP Engagements</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onAddClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add LP Engagement
        </Button>
      </div>
    </div>
  );
}
