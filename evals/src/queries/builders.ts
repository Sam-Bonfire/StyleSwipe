import type { QueryBuilder } from '../types.js';

/** Raw persona text, as-is. */
const raw: QueryBuilder = {
  id: 'raw',
  build: (q) => q.text,
};

/**
 * Taste-expanded: strips non-taste tokens (budget ranges, sizes, age) that
 * act as noise, and expands vibe words into color/fit/occasion vocabulary
 * the product side actually contains.
 */
const VIBE_EXPANSIONS: Record<string, string> = {
  dark: 'black navy charcoal dark colors',
  casual: 'casual relaxed daily wear',
  minimalist: 'minimalist solid simple',
  formal: 'formal office work',
  office: 'formal office work',
  party: 'party evening satin sequin',
  sports: 'sports athletic workout',
  festive: 'festive embroidered wedding',
};

const tasteExpanded: QueryBuilder = {
  id: 'taste-expanded',
  build: (q) => {
    const withoutNoise = q.text
      .replace(/\b\d[\d\-+]*\b/g, ' ')
      .replace(/\b(xs|s|m|l|xl|xxl|\d{2})\b/gi, ' ')
      .replace(/\b(18-24|25-34|35-44|45\+|men|women|both)\b/gi, ' ');
    const words = withoutNoise.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const expansions = words.flatMap((w) => VIBE_EXPANSIONS[w] ?? [w]);
    return [...new Set(expansions)].join(' ');
  },
};

export const queryBuilders: QueryBuilder[] = [raw, tasteExpanded];
