import { useState, useMemo } from 'react';
import { Deal } from '@/types/deal';
import { ACTIVE_PIPELINE_STAGES } from '@/hooks/deals/dealStagesConfig';

export function usePipelineFilter(deals: Deal[]) {
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredDeals = useMemo(() => {
    if (!showActiveOnly) {
      return deals;
    }

    return deals.filter(deal => 
      deal.pipeline_stage && ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage)
    );
  }, [deals, showActiveOnly]);

  return {
    showActiveOnly,
    setShowActiveOnly,
    filteredDeals,
  };
}