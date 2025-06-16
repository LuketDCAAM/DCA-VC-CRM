
import { getPipelineStageClasses } from '../pipelineStageColors';

export const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Convert from cents
};

// Use centralized color system
export const getStageColor = (stage: string) => {
  return getPipelineStageClasses(stage);
};
