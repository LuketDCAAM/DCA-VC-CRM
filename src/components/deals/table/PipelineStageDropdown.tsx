
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { Deal, PipelineStage } from '@/types/deal';
import { PIPELINE_STAGES } from '@/hooks/deals/dealStagesConfig';
import { getPipelineStageClasses } from '../pipelineStageColors';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PipelineStageDropdownProps {
  deal: Deal;
  onUpdate?: () => void;
}

export function PipelineStageDropdown({ deal, onUpdate }: PipelineStageDropdownProps) {
  const handleStageChange = async (newStage: PipelineStage) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ 
          pipeline_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (error) throw error;

      toast.success(`Pipeline stage updated to ${newStage}`);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      toast.error('Failed to update pipeline stage');
    }
  };

  return (
    <Select value={deal.pipeline_stage} onValueChange={handleStageChange}>
      <SelectTrigger className="h-auto p-0 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0">
        <Badge 
          variant="outline" 
          className={`${getPipelineStageClasses(deal.pipeline_stage)} cursor-pointer hover:opacity-80 transition-opacity border font-medium text-xs px-2.5 py-1 flex items-center gap-1`}
        >
          {deal.pipeline_stage}
          <ChevronDown className="h-2.5 w-2.5 opacity-60" />
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {PIPELINE_STAGES.map((stage) => (
          <SelectItem key={stage} value={stage}>
            <Badge 
              variant="outline" 
              className={`${getPipelineStageClasses(stage)} border font-medium text-xs px-2.5 py-1`}
            >
              {stage}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
