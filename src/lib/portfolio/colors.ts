// Stable per-company chart colors so a portco keeps the same hue everywhere.

export const COMPANY_PALETTE = [
  'hsl(330 81% 60%)',
  'hsl(262 83% 63%)',
  'hsl(199 89% 48%)',
  'hsl(160 84% 39%)',
  'hsl(43 96% 50%)',
  'hsl(24 95% 55%)',
  'hsl(291 64% 55%)',
  'hsl(221 83% 60%)',
  'hsl(174 72% 40%)',
  'hsl(84 70% 42%)',
  'hsl(0 72% 58%)',
  'hsl(240 60% 68%)',
  'hsl(188 78% 41%)',
  'hsl(56 80% 45%)',
  'hsl(14 80% 50%)',
  'hsl(310 70% 45%)',
];

/** Deterministic hash so a company's color does not change as the list grows. */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Build a company -> color map. Companies get palette slots in list order first
 * (so the common case is maximally distinct), then hash-based fallbacks.
 */
export function buildCompanyColorMap(ids: string[]): Map<string, string> {
  const map = new Map<string, string>();
  ids.forEach((id, i) => {
    const color =
      i < COMPANY_PALETTE.length
        ? COMPANY_PALETTE[i]
        : COMPANY_PALETTE[hash(id) % COMPANY_PALETTE.length];
    map.set(id, color);
  });
  return map;
}

export function companyColor(map: Map<string, string>, id: string): string {
  return map.get(id) ?? COMPANY_PALETTE[hash(id) % COMPANY_PALETTE.length];
}
