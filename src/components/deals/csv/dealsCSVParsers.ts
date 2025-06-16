
// Data parsing utilities for CSV import
export const parseCurrency = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  
  // Convert to string and remove currency symbols, commas, and spaces
  const cleanValue = String(value).replace(/[\$,\s]/g, '').trim();
  if (cleanValue === '') return null;
  
  const num = parseFloat(cleanValue);
  if (isNaN(num) || num < 0) return null;
  
  // Convert to cents (multiply by 100) and round to avoid floating point issues
  return Math.round(num * 100);
};

export const parseDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    const date = new Date(dateStr.trim());
    if (isNaN(date.getTime())) return null;
    
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

export const parseInteger = (value: string | number | null | undefined, min: number = 0, max: number = 100): number | null => {
  if (value === null || value === undefined || value === '') return null;
  
  const cleanValue = String(value).replace(/[^0-9.-]/g, '');
  if (cleanValue === '') return null;
  
  const num = parseInt(cleanValue, 10);
  if (isNaN(num) || num < min || num > max) return null;
  
  return num;
};
