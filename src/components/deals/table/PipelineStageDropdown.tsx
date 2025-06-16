
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Deal, PipelineStage } from '@/types/deal';
import { getPipelineStageColor } from './tableUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PipelineStageDropdownProps {
  deal: Deal;
  onUpdate?: () => void;
}

const PIPELINE_STAGES: PipelineStage[] = [
  'Initial Contact',
  'First Meeting', 
  'Due Diligence',
  'Term Sheet',
  'Legal Review',
  'Initial Review',
  'Seen Not Reviewed',
  'Invested',
  'Passed'
];

export function PipelineStageDropdown({ deal, onUpdate }: PipelineStageDropdownProps) {
  const { toast } = useToast();

  const handleStageChange = async (newStage: PipelineStage) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          pipeline_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (error) {
        console.error('Error updating pipeline stage:', error);
        toast({
          title: "Error",
          description: "Failed to update pipeline stage",
          variant: "destructive",
        });
        return;
      }

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
    }
  };

  return (
    <Select value={deal.pipeline_stage} onValueChange={handleStageChange}>
      <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
        <SelectValue asChild>
          <Badge 
            variant={getPipelineStageColor(deal.pipeline_stage) as any}
            className="font-medium text-xs cursor-pointer"
          >
            {deal.pipeline_stage}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-50">
        {PIPELINE_STAGES.map((stage) => (
          <SelectItem key={stage} value={stage}>
            <Badge 
              variant={getPipelineStageColor(stage) as any}
              className="font-medium text-xs"
            >
              {stage}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
