
import { TableColumn } from './tableColumnDefinitions';

const STORAGE_KEY = 'deals-table-columns';

export function saveColumnsToStorage(columns: TableColumn[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch (error) {
    console.error('Error saving column configuration:', error);
  }
}

export function loadColumnsFromStorage(): TableColumn[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading saved column configuration:', error);
  }
  return null;
}

export function clearColumnStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing column storage:', error);
  }
}
