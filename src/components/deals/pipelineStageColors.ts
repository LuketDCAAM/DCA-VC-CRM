
// Centralized pipeline stage color system - Updated to match current stages
export const PIPELINE_STAGE_COLORS = {
  // Screening stages - Gray tones
  'Inactive': {
    badge: 'bg-stone-100 text-stone-800 border-stone-200',
    variant: 'secondary' as const,
    background: 'bg-stone-50',
    border: 'border-stone-200',
    text: 'text-stone-700'
  },
  'Initial Review': {
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    variant: 'secondary' as const,
    background: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700'
  },
  
  // Active pipeline stages - Blue progression
  'Scorecard': {
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    variant: 'default' as const,
    background: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700'
  },
  'One Pager': {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    variant: 'default' as const,
    background: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700'
  },
  'Due Diligence': {
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    variant: 'default' as const,
    background: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700'
  },
  'Memo': {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    variant: 'default' as const,
    background: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700'
  },
  'Legal Review': {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    variant: 'default' as const,
    background: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700'
  },
  
  // Final stages
  'Invested': {
    badge: 'bg-green-100 text-green-800 border-green-200',
    variant: 'default' as const,
    background: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700'
  },
  'Passed': {
    badge: 'bg-red-100 text-red-800 border-red-200',
    variant: 'destructive' as const,
    background: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700'
  }
} as const;

// Utility functions
export const getPipelineStageColor = (stage: string) => {
  const stageColors = PIPELINE_STAGE_COLORS[stage as keyof typeof PIPELINE_STAGE_COLORS];
  return stageColors?.variant || 'secondary';
};

export const getPipelineStageClasses = (stage: string) => {
  const stageColors = PIPELINE_STAGE_COLORS[stage as keyof typeof PIPELINE_STAGE_COLORS];
  return stageColors?.badge || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getPipelineStageBackground = (stage: string) => {
  const stageColors = PIPELINE_STAGE_COLORS[stage as keyof typeof PIPELINE_STAGE_COLORS];
  return stageColors?.background || 'bg-gray-50';
};

export const getPipelineStageBorder = (stage: string) => {
  const stageColors = PIPELINE_STAGE_COLORS[stage as keyof typeof PIPELINE_STAGE_COLORS];
  return stageColors?.border || 'border-gray-200';
};

export const getPipelineStageTextColor = (stage: string) => {
  const stageColors = PIPELINE_STAGE_COLORS[stage as keyof typeof PIPELINE_STAGE_COLORS];
  return stageColors?.text || 'text-gray-700';
};
