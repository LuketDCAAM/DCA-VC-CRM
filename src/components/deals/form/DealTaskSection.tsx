
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { TaskAssignmentDialog } from '@/components/tasks/TaskAssignmentDialog';

interface DealTaskSectionProps {
  dealId: string;
}

export function DealTaskSection({ dealId }: DealTaskSectionProps) {
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  return (
    <div className="md:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Task Assignment
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTaskDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Task
        </Button>
      </div>
      
      <p className="text-sm text-gray-600">
        Assign tasks to team members for this deal.
      </p>

      <TaskAssignmentDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        dealId={dealId}
        onTaskCreated={() => {
          // Could refresh deal tasks here if needed
        }}
      />
    </div>
  );
}
