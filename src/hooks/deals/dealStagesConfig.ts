
// Pipeline stage configurations - Updated to match new database schema
export const PIPELINE_STAGES = [
  'Inactive',
  'Initial Contact',    // Previously 'Initial Review' 
  'First Meeting',      // Previously 'Initial Contact'
  'Scorecard',          // New stage, previously 'First Meeting'
  'Due Diligence',
  'Memo',    // Keeping as 'Memo' to match Supabase enum
  'Legal Review',
  'Invested',
  'Passed'
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// Active stages are those where deals are being actively worked on
export const ACTIVE_PIPELINE_STAGES: PipelineStage[] = [
  'Initial Contact',    // Updated from 'Initial Review'
  'First Meeting',      // Updated from 'Initial Contact'
  'Scorecard',          // New stage
  'Due Diligence', 
  'Memo',
  'Legal Review'
];

// Screening stages are early pipeline stages
export const SCREENING_STAGES: PipelineStage[] = [
  'Inactive',
  'Initial Contact'     // Updated from 'Initial Review'
];

// Final outcome stages
export const FINAL_STAGES: PipelineStage[] = [
  'Invested',
  'Passed',
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
