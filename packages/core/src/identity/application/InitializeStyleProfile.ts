import { Effect } from 'effect';

import { StyleProfile } from '../domain/StyleProfile';

/**
 * Maps onboarding answers to a StyleProfile entity.
 * Generates a deterministic preference vector (placeholder for real ML embedding).
 */
export const initializeStyleProfile = (
  answers: Record<string, string>,
): Effect.Effect<StyleProfile, never> => {
  const gender = (answers.gender?.toLowerCase() || 'both') as 'men' | 'women' | 'both';

  const vector: number[] = [];

  const vibes: string[] = (() => {
    const raw = answers.vibe ?? answers.vibes ?? '';
    if (!raw) return [];
    return raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
  })();

  const sizes: { top?: string; bottom?: string; shoe?: string } = (() => {
    const s: { top?: string; bottom?: string; shoe?: string } = {};
    if (answers.sizes) s.top = answers.sizes;
    if (answers.fit) s.top = answers.fit;
    if (answers['sizes_top']) s.top = answers['sizes_top'];
    if (answers['sizes_bottom']) s.bottom = answers['sizes_bottom'];
    if (answers['sizes_shoe']) s.shoe = answers['sizes_shoe'];
    return s;
  })();

  const budget: { min: number; max: number } = (() => {
    const raw = answers.budget ?? '';
    if (!raw) return { min: 0, max: 10000 };
    const parts = raw.split('-');
    if (parts.length === 2) {
      const min = Number(parts[0]) || 0;
      const maxRaw = parts[1].replace('+', '');
      const max = maxRaw ? Number(maxRaw) || 10000 : 10000;
      return { min, max: maxRaw === '' || maxRaw === '+' ? 20000 : max };
    }
    if (raw.includes('+')) {
      const min = Number(raw.replace('+', '')) || 8000;
      return { min, max: 20000 };
    }
    return { min: 0, max: 10000 };
  })();

  const age = answers.age;

  return Effect.succeed({
    gender,
    vibes,
    sizes,
    budget,
    age,
    preferenceVector: vector,
  });
};
