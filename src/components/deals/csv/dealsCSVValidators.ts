
// Validation functions for CSV import with improved location processing
import { LocationDataProcessor } from '@/components/dashboard/charts/location/LocationDataProcessor';

export const validatePipelineStage = (stage: string | null | undefined): string => {
  if (!stage) return 'Initial Contact';
  
  const validStages = [
    'Inactive',
    'Initial Review', 
    'Initial Contact',
    'First Meeting',
    'Due Diligence',
    'Memo',
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

export const validateLocation = (location: string | null | undefined): {
  isValid: boolean;
  normalizedLocation: string;
  suggestions: string[];
  confidence: 'high' | 'medium' | 'low';
} => {
  if (!location || location.trim() === '') {
    return {
      isValid: false,
      normalizedLocation: '',
      suggestions: [],
      confidence: 'low'
    };
  }

  const processed = LocationDataProcessor.processLocation(location);
  
  return {
    isValid: processed.region !== 'Unknown' && processed.region !== 'Other',
    normalizedLocation: processed.normalizedLocation,
    suggestions: processed.region !== 'Unknown' && processed.region !== 'Other' 
      ? [processed.region] 
      : [],
    confidence: processed.confidence
  };
};

// Enhanced validation for company names to detect potential duplicates
export const validateCompanyName = (companyName: string, existingCompanies: string[] = []): {
  isValid: boolean;
  normalizedName: string;
  potentialDuplicates: string[];
} => {
  if (!companyName || companyName.trim() === '') {
    return {
      isValid: false,
      normalizedName: '',
      potentialDuplicates: []
    };
  }

  const normalizedName = companyName
    .trim()
    .replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Limited)\b/gi, '')
    .replace(/[.,]/g, '')
    .trim();

  // Check for potential duplicates using fuzzy matching
  const potentialDuplicates = existingCompanies.filter(existing => {
    const normalizedExisting = existing
      .trim()
      .replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Limited)\b/gi, '')
      .replace(/[.,]/g, '')
      .trim();
    
    return normalizedExisting.toLowerCase() === normalizedName.toLowerCase() ||
           (normalizedExisting.length > 3 && normalizedName.length > 3 &&
            (normalizedExisting.toLowerCase().includes(normalizedName.toLowerCase()) ||
             normalizedName.toLowerCase().includes(normalizedExisting.toLowerCase())));
  });

  return {
    isValid: true,
    normalizedName: companyName.trim(),
    potentialDuplicates
  };
};
