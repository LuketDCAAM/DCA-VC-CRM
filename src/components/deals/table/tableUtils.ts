
import { getPipelineStageColor } from '../pipelineStageColors';

export const formatCurrency = (amount: number | null) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

// Use centralized color system
export { getPipelineStageColor } from '../pipelineStageColors';

export const getDealScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 font-semibold';
  if (score >= 60) return 'text-yellow-600 font-semibold';
  if (score >= 40) return 'text-orange-600 font-semibold';
  return 'text-red-600 font-semibold';
};
