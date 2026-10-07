import type { Product } from '../../../packages/core/shared/domain/types.js';
import type { RankedId } from '../types.js';

import { applyDisplacement } from '../../../packages/core/shared/domain/vectors.js';
import { diversifyAndLimit } from '../../../packages/core/src/discovery/domain/RecommendationScore.js';

export type SwipeAction = 'like' | 'pass' | 'super';

export interface SwipeStep {
  vector: number[];
  action: SwipeAction;
}

export interface LearningRates {
  alpha: number;
  beta: number;
  superLikeMultiplier: number;
}

/**
 * Replays a swipe session through the REAL core displacement (same function
 * the app calls on every swipe). Returns the vector after each step so the
 * runner can score the learning curve, not just the endpoint.
 */
export function runLearningSession(
  start: number[],
  steps: SwipeStep[],
  rates: LearningRates,
): { trajectory: number[][]; final: number[] } {
  const trajectory: number[][] = [start];
  let current = start;
  for (const step of steps) {
    current = applyDisplacement(current, step.vector, step.action, rates);
    trajectory.push(current);
  }
  return { trajectory, final: current };
}

/**
 * Builds a deterministic session: interleaved like/pass starting with a
 * like (mimics swiping a feed), first like upgraded to super when asked.
 */
export function buildSession(
  likeVectors: number[][],
  passVectors: number[][],
  superFirst: boolean,
): SwipeStep[] {
  const steps: SwipeStep[] = [];
  const rounds = Math.max(likeVectors.length, passVectors.length);
  for (let i = 0; i < rounds; i++) {
    if (i < likeVectors.length) {
      steps.push({
        vector: likeVectors[i] as number[],
        action: superFirst && i === 0 ? 'super' : 'like',
      });
    }
    if (i < passVectors.length) {
      steps.push({ vector: passVectors[i] as number[], action: 'pass' });
    }
  }
  return steps;
}

export interface CappedResult {
  ids: string[];
}

/**
 * Applies the REAL core diversity caps to an already-ranked list.
 * Products are projected to the fields diversifyAndLimit reads
 * (brand/category/id) with a single explicit cast — the caps logic is what
 * is under test, not the product schema.
 */
export function applyCaps(
  ranked: RankedId[],
  brandOf: (id: string) => string,
  categoryOf: (id: string) => string,
  limit: number,
  maxPerBrand: number,
  maxPerCategory: number,
): CappedResult {
  const scored = ranked.map((r) => ({
    product: { id: r.id, brand: brandOf(r.id), category: categoryOf(r.id) } as unknown as Product,
    score: r.score,
  }));
  const picked = diversifyAndLimit(scored, limit, { maxPerBrand, maxPerCategory });
  return { ids: picked.map((p) => p.id) };
}
