import * as z from 'zod';

/**
 * Normalizes user-entered URLs.
 * Accepts values like "example.com", "www.example.com", "http://example.com/path"
 * and always returns a value with a protocol, or null when empty.
 */
export function normalizeUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Strip accidental leading slashes or partial protocols
  const cleaned = trimmed.replace(/^\/+/, '').replace(/^(https?:?\/*)/i, '');
  return `https://${cleaned}`;
}

/** True when the value looks like a usable web address (protocol optional). */
export function isLikelyUrl(value: string): boolean {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;
  try {
    const url = new URL(normalized);
    // hostname must contain a dot and no spaces
    return /^[^\s]+\.[^\s.]{2,}$/.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Lenient URL field for forms: allows blank, allows omitting https://.
 */
export const optionalUrlField = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || v === '' || isLikelyUrl(v), {
    message: 'Enter a valid web address, e.g. example.com',
  });
