## Goal

Replicate the pasted lavender / soft-purple theme across the entire app — light + dark, all components, charts, sidebar, fonts, radius, and shadows — without breaking the existing Tailwind v3 setup.

## Key compatibility note

The pasted snippet is **Tailwind v4 syntax** (`@import "tailwindcss"`, `@theme inline`, `@custom-variant`). This project is **Tailwind v3** with the `hsl(var(--token))` wrapper pattern. We will keep v3 and port the theme by:

1. Storing the raw `oklch(...)` values in the CSS variables.
2. Changing `tailwind.config.ts` color wrappers from `hsl(var(--x))` → `var(--x)` so any color space (oklch, hsl, hex) works.

This is the cleanest way to replicate the look without a framework upgrade.

## Plan

### 1. Rewrite `src/index.css`
- Replace `:root` and `.dark` blocks with the pasted oklch tokens (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart-1…5, sidebar-* tokens, fonts, radius, shadows).
- Rename `--sidebar` → `--sidebar-background` (our config expects that name) — keep both for safety.
- Add the shadow tokens (`--shadow-sm` … `--shadow-2xl`) and font tokens (`--font-sans`, `--font-serif`, `--font-mono`).
- Keep `@tailwind base/components/utilities` directives (v3).
- Keep the `@layer base` body/border rules.

### 2. Update `tailwind.config.ts`
- Swap every `hsl(var(--token))` to `var(--token)` so oklch resolves correctly.
- Add `fontFamily`: `sans: ['var(--font-sans)']`, `serif: ['var(--font-serif)']`, `mono: ['var(--font-mono)']`.
- Add `boxShadow` entries mapping to `var(--shadow-*)`.
- Keep existing chart-1…5, sidebar, keyframes, animations.

### 3. Load the fonts
- Add Geist, Lora, Fira Code via `<link>` tags in `index.html` (Google Fonts).

### 4. Audit hard-coded colors
- Grep the codebase for raw hex / `text-white` / `bg-black` / `text-green-600` / chart hardcodes and replace with semantic tokens where they slipped in (memory rule: never use raw colors).
- Known offender: `ThesisSettings.tsx` uses `text-green-600` / `text-destructive` — normalize.

### 5. Verify charts & gradients
- Project memory: pink→purple gradient lives in `--chart-1` … `--chart-5`. The new palette is purple/rose/teal/amber/blue — confirm with you before swapping, since this changes dashboard chart colors meaningfully.

### 6. QA pass
- Visit: Dashboard, Deals table, Assistant (chat + inline approvals + sidebar), Approvals, Thesis settings, Auth pages, Settings — confirm contrast and that no component renders unstyled.
- Light + dark mode toggle check.

## Technical details

```text
src/index.css          → replace token blocks, add shadows + font vars
tailwind.config.ts     → hsl(var(--x)) → var(--x); add fontFamily + boxShadow
index.html             → <link> Geist / Lora / Fira Code
components             → fix any remaining literal color classes
```

## One question before I build

The new palette replaces the existing **pink→purple chart gradient** (a core brand rule in memory) with `purple / rose / teal / amber / blue`. Do you want me to:

- **(A)** Apply the new palette literally as pasted (charts become multi-hue), or
- **(B)** Keep charts on the pink→purple gradient and only apply the new theme to UI chrome (background, primary, sidebar, etc.)?

If you don't answer, I'll default to **(A)** since you pasted the theme verbatim and update the memory accordingly.