
// Deal pipeline stage configurations
export const ACTIVE_PIPELINE_STAGES = [
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Term Sheet',
  'Legal Review'
];

export const SCREENING_STAGES = [
  'Seen Not Reviewed',
  'Initial Review'
];

export const FINAL_STAGES = {
  INVESTED: 'Invested',
  PASSED: 'Passed'
} as const;
