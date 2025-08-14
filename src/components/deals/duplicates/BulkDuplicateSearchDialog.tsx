import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Search, Trash2 } from 'lucide-react';
import { Deal } from '@/types/deal';
import { PotentialDuplicate } from '@/types/duplicates';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { supabase } from '@/integrations/supabase/client';
import { DuplicateComparisonCard } from './DuplicateComparisonCard';
import { useToast } from '@/hooks/use-toast';

interface BulkDuplicateSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: Deal[];
  onDealsDeleted: () => void;
}

interface DuplicateGroup {
  mainDeal: Deal;
  duplicates: PotentialDuplicate[];
}

export function BulkDuplicateSearchDialog({
  open,
  onOpenChange,
  deals,
  onDealsDeleted,
}: BulkDuplicateSearchDialogProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { checkForDuplicates } = useDuplicateDetection();
  const { toast } = useToast();

  const handleSearchDuplicates = async () => {
    setIsSearching(true);
    setDuplicateGroups([]);
    setSelectedDuplicates(new Set());
    setSearchProgress({ current: 0, total: deals.length });

    try {
      const groups: DuplicateGroup[] = [];
      const processedDeals = new Set<string>();

      // Create promises for all deals at once with progress tracking
      const dealPromises = deals.map(async (deal, index) => {
        try {
          const duplicateResult = await checkForDuplicates({
            company_name: deal.company_name,
            website: deal.website,
            linkedin_url: deal.linkedin_url,
            contact_email: deal.contact_email,
          });
          
          // Update progress
          setSearchProgress(prev => ({ ...prev, current: prev.current + 1 }));
          
          return {
            deal,
            duplicates: duplicateResult.duplicates || [],
            index
          };
        } catch (error) {
          console.error(`Error checking duplicates for ${deal.company_name}:`, error);
          setSearchProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return { deal, duplicates: [], index };
        }
      });

      // Wait for all duplicate checks to complete
      const allResults = await Promise.all(dealPromises);

      // Process results in order to build groups
      for (const { deal, duplicates } of allResults) {
        if (processedDeals.has(deal.id)) continue;

        // Filter out the current deal and already processed deals
        const relevantDuplicates = duplicates.filter(
          dup => dup.deal_id !== deal.id && !processedDeals.has(dup.deal_id)
        );

        if (relevantDuplicates.length > 0) {
          groups.push({
            mainDeal: deal,
            duplicates: relevantDuplicates,
          });

          // Mark all deals in this group as processed
          processedDeals.add(deal.id);
          relevantDuplicates.forEach(dup => processedDeals.add(dup.deal_id));
        }
      }

      setDuplicateGroups(groups);
      
      if (groups.length === 0) {
        toast({
          title: "No duplicates found",
          description: "No potential duplicate deals were detected in your database.",
        });
      } else {
        toast({
          title: "Duplicate search complete",
          description: `Found ${groups.length} group(s) of potential duplicate deals.`,
        });
      }
    } catch (error) {
      console.error('Error searching for duplicates:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for duplicate deals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
      setSearchProgress({ current: 0, total: 0 });
    }
  };

  const handleToggleDuplicate = (dealId: string) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDuplicates(newSelected);
  };

  const handleSelectAllInGroup = (group: DuplicateGroup) => {
    const newSelected = new Set(selectedDuplicates);
    group.duplicates.forEach(dup => newSelected.add(dup.deal_id));
    setSelectedDuplicates(newSelected);
  };

  const handleDeselectAllInGroup = (group: DuplicateGroup) => {
    const newSelected = new Set(selectedDuplicates);
    group.duplicates.forEach(dup => newSelected.delete(dup.deal_id));
    setSelectedDuplicates(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedDuplicates.size === 0) return;

    setIsDeleting(true);
    try {
      const dealIds = Array.from(selectedDuplicates);
      
      // Delete the selected deals from the database
      const { error } = await supabase
        .from('deals')
        .delete()
        .in('id', dealIds);

      if (error) {
        throw error;
      }
      
      toast({
        title: "Deals deleted",
        description: `Successfully deleted ${selectedDuplicates.size} duplicate deals.`,
      });

      onDealsDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting deals:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete selected deals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search for Duplicate Deals
          </DialogTitle>
          <DialogDescription>
            Search through your deals database to find potential duplicates and manage them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {duplicateGroups.length === 0 && !isSearching && (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                Click the button below to search for potential duplicate deals in your database.
              </div>
              <Button onClick={handleSearchDuplicates} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search for Duplicates'}
              </Button>
            </div>
          )}

          {isSearching && (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">
                Searching for duplicate deals...
              </div>
              <div className="text-sm text-muted-foreground">
                Progress: {searchProgress.current} / {searchProgress.total} deals checked
              </div>
            </div>
          )}

          {duplicateGroups.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Found {duplicateGroups.length} group(s) of potential duplicates
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSearchDuplicates} 
                    disabled={isSearching}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Again
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={selectedDuplicates.size === 0 || isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedDuplicates.size})
                  </Button>
                </div>
              </div>

              <div className="h-[60vh] overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-6 pr-4">
                    {duplicateGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">
                            Main Deal: {group.mainDeal.company_name}
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAllInGroup(group)}
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeselectAllInGroup(group)}
                            >
                              Deselect All
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {group.duplicates.map((duplicate) => (
                            <div key={duplicate.deal_id} className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedDuplicates.has(duplicate.deal_id)}
                                onCheckedChange={() => handleToggleDuplicate(duplicate.deal_id)}
                                className="mt-2"
                              />
                              <div className="flex-1">
                                <DuplicateComparisonCard
                                  duplicate={duplicate}
                                  newDealData={{
                                    company_name: group.mainDeal.company_name,
                                    website: group.mainDeal.website,
                                    linkedin_url: group.mainDeal.linkedin_url,
                                    contact_email: group.mainDeal.contact_email,
                                    contact_name: group.mainDeal.contact_name,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedDuplicates.size > 0 
              ? `${selectedDuplicates.size} deal(s) selected for deletion`
              : 'Select deals to delete them'
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}