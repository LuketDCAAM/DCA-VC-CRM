

// Pipeline stage configurations
export const PIPELINE_STAGES = [
  'Initial Review',
  'Initial Contact', 
  'First Meeting',
  'Due Diligence',
  'Term Sheet',
  'Legal Review',
  'Invested',
  'Passed',
  'Inactive'
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// Active stages are those where deals are being actively worked on
export const ACTIVE_PIPELINE_STAGES: PipelineStage[] = [
  'Initial Review',
  'Initial Contact',
  'First Meeting',
  'Due Diligence', 
  'Term Sheet',
  'Legal Review'
];

// Screening stages are early pipeline stages
export const SCREENING_STAGES: PipelineStage[] = [
  'Initial Review',
  'Initial Contact'
];

// Final outcome stages
export const FINAL_STAGES: PipelineStage[] = [
  'Invested',
  'Passed',
  'Inactive'
];

// Helper functions
export const isActiveStage = (stage: string): boolean => {
  return ACTIVE_PIPELINE_STAGES.includes(stage as PipelineStage);
};

export const isScreeningStage = (stage: string): boolean => {
  return SCREENING_STAGES.includes(stage as PipelineStage);
};

export const isInvestedStage = (stage: string): boolean => {
  return stage === 'Invested';
};

export const isPassedStage = (stage: string): boolean => {
  return stage === 'Passed';
};

export const isInactiveStage = (stage: string): boolean => {
  return stage === 'Inactive';
};

