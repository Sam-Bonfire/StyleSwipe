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

  // Vector generation is now handled by the caller (Application Service or UI) using real Inference Engine.
  // Core remains pure and environment-agnostic.
  const vector: number[] = [];

  return Effect.succeed({
    gender,
    vibes: answers.vibe ? [answers.vibe.toLowerCase()] : [],
    sizes: {
      top: answers.fit,
    },
    budget: {
      min: 0,
      max: 10000,
    },
    preferenceVector: vector,
  });
};
