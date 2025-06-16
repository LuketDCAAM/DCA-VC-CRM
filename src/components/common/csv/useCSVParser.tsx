
import { useState } from 'react';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function useCSVParser() {
  const parseCSV = (csvText: string): any[] => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];

      // Handle CSV parsing with proper quote handling
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      console.log('Parsed CSV headers:', headers);
      
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Only add rows that have at least one non-empty value
        if (Object.values(row).some(val => val && String(val).trim() !== '')) {
          data.push(row);
        }
      }

      console.log('Parsed CSV data:', data.length, 'rows');
      return data;
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw new Error('Failed to parse CSV file. Please check the file format.');
    }
  };

  const validateData = (data: any[], templateColumns: { key: string; label: string; required?: boolean }[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      templateColumns.forEach(column => {
        if (column.required && (!row[column.key] || String(row[column.key]).trim() === '')) {
          errors.push({
            row: index + 1,
            field: column.label,
            message: `${column.label} is required`
          });
        }
      });
    });

    return errors;
  };

  return {
    parseCSV,
    validateData,
  };
}
