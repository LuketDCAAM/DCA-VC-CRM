
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Deal, PipelineStage } from '@/types/deal'; // Ensure correct import for Deal and PipelineStage
import { getPipelineStageColor } from '../pipelineStageColors';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';

interface PipelineStageDropdownProps {
  deal: Deal;
  onUpdate?: () => void;
}

// This array MUST precisely match the pipeline_stage enum from your Supabase types.
// (from src/integrations/supabase/types.ts -> Database.public.Enums.pipeline_stage)
const PIPELINE_STAGES: PipelineStage[] = [
  'Inactive',
  'Initial Review',   // Matches Supabase enum
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Memo',       // Using 'Memo' to match Supabase enum
  'Legal Review',
  'Invested',
  'Passed'
];

export function PipelineStageDropdown({ deal, onUpdate }: PipelineStageDropdownProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStageChange = async (newStage: PipelineStage) => { // Type newStage as PipelineStage
    if (newStage === deal.pipeline_stage) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          pipeline_stage: newStage, // Now correctly typed
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id); // 'id' should now exist on 'deal' due to the `Deal` interface fix

      if (error) {
        console.error('Error updating pipeline stage:', error);
        toast({
          title: "Error",
          description: "Failed to update pipeline stage",
          variant: "destructive",
        });
        return;
      }

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);

      toast({
        title: "Success",
        description: `Pipeline stage updated to ${newStage}`,
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      toast({
        title: "Error", 
        description: "Failed to update pipeline stage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Select 
      value={deal.pipeline_stage} 
      onValueChange={handleStageChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-muted/50 focus:ring-0 transition-colors duration-200">
        <SelectValue asChild>
          <div className="relative">
            <Badge 
              variant={getPipelineStageColor(deal.pipeline_stage) as any} // Still need 'as any' if getPipelineStageColor returns a generic string that Badge expects as a literal
              className="font-medium text-xs cursor-pointer transition-all duration-200 hover:scale-105 pr-6"
            >
              {deal.pipeline_stage}
            </Badge>
            {isLoading && (
              <Loader2 className="h-3 w-3 animate-spin absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            )}
            {showSuccess && (
              <Check className="h-3 w-3 absolute right-1 top-1/2 transform -translate-y-1/2 text-green-600 animate-in fade-in-0 duration-300" />
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-50 min-w-[180px]">
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
            Select Pipeline Stage
          </div>
          {PIPELINE_STAGES.map((stage) => (
            <SelectItem 
              key={stage} 
              value={stage}
              className="cursor-pointer focus:bg-muted/50 transition-colors duration-150"
            >
              <div className="flex items-center gap-2 w-full">
                <Badge 
                  variant={getPipelineStageColor(stage) as any}
                  className="font-medium text-xs"
                >
                  {stage}
                </Badge>
                {stage === deal.pipeline_stage && (
                  <Check className="h-3 w-3 text-green-600 ml-auto" />
                )}
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
