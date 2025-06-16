
// Validation functions for CSV import
export const validatePipelineStage = (stage: string | null | undefined): string => {
  if (!stage) return 'Initial Contact';
  
  const validStages = [
    'Seen Not Reviewed',
    'Initial Review', 
    'Initial Contact',
    'First Meeting',
    'Due Diligence',
    'Term Sheet',
    'Legal Review',
    'Invested',
    'Passed'
  ];
  
  const normalizedStage = stage.trim();
  return validStages.includes(normalizedStage) ? normalizedStage : 'Initial Contact';
};

export const validateRoundStage = (stage: string | null | undefined): string | null => {
  if (!stage || stage.trim() === '') return null;
  
  const validStages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Growth'];
  const normalizedStage = stage.trim();
  
  return validStages.includes(normalizedStage) ? normalizedStage : null;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateWebsite = (website: string): string => {
  if (!website.startsWith('http')) {
    return `https://${website}`;
  }
  return website;
};
