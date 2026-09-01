import { Deal } from '@/types/deal';

const PLACEHOLDERS = new Set(['unknown', 'n/a', 'na', 'not specified', 'none', '-']);

/**
 * Splits a sector string into individual tags.
 * Multi-sector values use ';', ',', '|' or ' / ' as separators.
 * Note: a bare '/' is NOT a separator so values like "AI/ML" stay intact.
 */
export function splitSectors(sector?: string | null): string[] {
  if (!sector) return [];
  return sector
    .split(/[;,|]| \/ |\n/)
    .map(s => s.trim())
    .filter(s => s !== '' && !PLACEHOLDERS.has(s.toLowerCase()));
}

/** All sector tags on a deal. */
export function getDealSectors(deal: Deal): string[] {
  return splitSectors(deal.sector);
}

/** True when the deal carries any of the selected sector tags. */
export function dealMatchesSectors(deal: Deal, selected: string[]): boolean {
  if (!selected.length) return true;
  const tags = getDealSectors(deal).map(t => t.toLowerCase());
  return selected.some(s => tags.includes(String(s).trim().toLowerCase()));
}

/** Counts of each individual sector tag across deals. */
export function countSectorTags(deals: Deal[]): Record<string, number> {
  const counts: Record<string, number> = {};
  deals.forEach(deal => {
    getDealSectors(deal).forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return counts;
}
