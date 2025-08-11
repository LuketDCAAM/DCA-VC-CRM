import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { PotentialDuplicate } from '@/types/duplicates';
import { DuplicateComparisonCard } from './DuplicateComparisonCard';

interface DuplicateDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: PotentialDuplicate[];
  newDealData: {
    company_name: string;
    website?: string;
    linkedin_url?: string;
    contact_email?: string;
    contact_name?: string;
  };
  onProceed: () => void;
  onCancel: () => void;
}

export function DuplicateDetectionDialog({
  open,
  onOpenChange,
  duplicates,
  newDealData,
  onProceed,
  onCancel,
}: DuplicateDetectionDialogProps) {
  const highConfidenceDuplicates = duplicates.filter(d => d.confidence_level === 'high');
  const mediumConfidenceDuplicates = duplicates.filter(d => d.confidence_level === 'medium');
  const lowConfidenceDuplicates = duplicates.filter(d => d.confidence_level === 'low');

  const getConfidenceBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Potential Duplicate Deals Found
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''} 
            for "{newDealData.company_name}". Please review before proceeding.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {highConfidenceDuplicates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-destructive mb-2">
                  High Confidence Matches ({highConfidenceDuplicates.length})
                </h3>
                <div className="space-y-2">
                  {highConfidenceDuplicates.map((duplicate) => (
                    <DuplicateComparisonCard
                      key={duplicate.deal_id}
                      duplicate={duplicate}
                      newDealData={newDealData}
                    />
                  ))}
                </div>
              </div>
            )}

            {mediumConfidenceDuplicates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-warning mb-2">
                  Medium Confidence Matches ({mediumConfidenceDuplicates.length})
                </h3>
                <div className="space-y-2">
                  {mediumConfidenceDuplicates.map((duplicate) => (
                    <DuplicateComparisonCard
                      key={duplicate.deal_id}
                      duplicate={duplicate}
                      newDealData={newDealData}
                    />
                  ))}
                </div>
              </div>
            )}

            {lowConfidenceDuplicates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Low Confidence Matches ({lowConfidenceDuplicates.length})
                </h3>
                <div className="space-y-2">
                  {lowConfidenceDuplicates.map((duplicate) => (
                    <DuplicateComparisonCard
                      key={duplicate.deal_id}
                      duplicate={duplicate}
                      newDealData={newDealData}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Review the matches above before deciding how to proceed
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onProceed}>
              Add Deal Anyway
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}