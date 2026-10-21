// Price per share is stored in cents, but a share price is a small dollar figure
// that needs up to 4 decimal places — so we keep fractional cents instead of
// rounding to whole cents (which would silently drop the 3rd and 4th decimals).

/** Decimal places of a dollar share price we keep end to end. */
export const PRICE_DECIMALS = 4;

/** Parse an entered share price (dollars) into stored cents, keeping 4 decimals. */
export function priceToStoredCents(value: string | number | null | undefined): number | null {
  const raw = typeof value === 'number' ? String(value) : (value ?? '').replace(/[$,\s]/g, '');
  if (raw.trim() === '') return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars)) return null;
  // Rounding to whole hundredths of a cent removes floating point noise.
  return Number((dollars * 100).toFixed(2));
}

/** Stored cents -> editable dollar number. */
export function storedCentsToPriceNumber(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Number((value / 100).toFixed(PRICE_DECIMALS));
}

/** Stored cents -> editable dollar string. */
export function storedCentsToPrice(value: number | null | undefined): string {
  const dollars = storedCentsToPriceNumber(value);
  return dollars == null ? '' : String(dollars);
}

/** Stored cents -> display label showing up to 4 decimals, e.g. $0.1234. */
export function formatPricePerShare(value: number | null | undefined, fallback = '—'): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  const dollars = value / 100;
  const sign = dollars < 0 ? '-' : '';
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: PRICE_DECIMALS,
  })}`;
}
