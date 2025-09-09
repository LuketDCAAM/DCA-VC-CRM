
// Pipeline stage configurations - Updated to match new database schema
export const PIPELINE_STAGES = [
  'Inactive',
  'Watchlist',
  'Initial Review',    // Previously 'Initial Review' 
  'Scorecard',      // Previously 'Initial Contact'
  'Decision Making',    // New stage between Scorecard and One Pager
  'One Pager',          // Previously 'Scorecard'
  'Due Diligence',
  'Memo',    // Keeping as 'Memo' to match Supabase enum
  'Legal Review',
  'Invested',
  'Passed'
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// Active stages are those where deals are being actively worked on
export const ACTIVE_PIPELINE_STAGES: PipelineStage[] = [
  'Initial Review',    // Updated from 'Initial Review'
  'Scorecard',      // Updated from 'Initial Contact'
  'Decision Making',    // New active stage
  'One Pager',          // Previously 'Scorecard'
  'Due Diligence', 
  'Memo',
  'Legal Review'
];

// Screening stages are early pipeline stages
export const SCREENING_STAGES: PipelineStage[] = [
  'Inactive',
  'Watchlist'
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
