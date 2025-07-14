
import React, { useState } from 'react';
import { LPEngagementsHeader } from '@/components/lp-engagements/LPEngagementsHeader';
import { LPEngagementCard } from '@/components/lp-engagements/LPEngagementCard';
import { AddLPEngagementDialog } from '@/components/lp-engagements/AddLPEngagementDialog';
import { useLPEngagements } from '@/hooks/useLPEngagements';
import { LPEngagement } from '@/types/lpEngagement';

export default function LPEngagements() {
  const { lpEngagements, loading, addLPEngagement } = useLPEngagements();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleView = (engagement: LPEngagement) => {
    console.log('View engagement:', engagement);
    // TODO: Implement view dialog
  };

  const handleEdit = (engagement: LPEngagement) => {
    console.log('Edit engagement:', engagement);
    // TODO: Implement edit dialog
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading LP engagements...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <LPEngagementsHeader onAddClick={() => setIsAddDialogOpen(true)} />
      
      {lpEngagements.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No LP engagements yet</h3>
          <p className="text-gray-500 mb-4">Start by adding your first LP engagement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lpEngagements.map((engagement) => (
            <LPEngagementCard
              key={engagement.id}
              engagement={engagement}
              onView={handleView}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <AddLPEngagementDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={addLPEngagement}
      />
    </div>
  );
}
