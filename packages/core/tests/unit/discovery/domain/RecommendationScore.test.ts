import { describe, expect, it } from 'vitest';

import type { Product } from '../../../../shared/domain/types';

import {
  DIVERSITY_CAPS,
  SCORING_WEIGHTS,
  diversifyAndLimit,
  scoreCandidate,
} from '../../../../src/discovery/domain/RecommendationScore';

const product = (overrides: Partial<Product>): Product => ({
  id: 'p',
  title: 'Tee',
  brand: 'BrandA',
  price: 50,
  mrp: 60,
  category: 'T-Shirts',
  images: [],
  ...overrides,
});

describe('scoreCandidate', () => {
  it('weights vector similarity, budget, and affinities', () => {
    const userVector = new Array(384).fill(0.1);
    const profile = { budget: { min: 20, max: 100 }, vibes: ['branda'] };

    const score = scoreCandidate(userVector, profile, product({ embedding: new Array(384).fill(0.1) }));
    // similarity 1.0 * 2 + in budget 1.0 + brand match 0.5 (category T-Shirts has no vibe match)
    expect(score).toBeCloseTo(
      1.0 * SCORING_WEIGHTS.vector + SCORING_WEIGHTS.budgetInRange + SCORING_WEIGHTS.brandMatch,
    );
  });

  it('penalizes out-of-budget products', () => {
    const score = scoreCandidate(new Array(384).fill(0.1), { budget: { min: 20, max: 100 } }, product({ price: 500 }));
    expect(score).toBe(SCORING_WEIGHTS.budgetOutOfRange);
  });
});

describe('diversifyAndLimit', () => {
  it('caps brands and fills up with highest-scored leftovers', () => {
    const scored = [1, 2, 3, 4].map((i) => ({
      product: product({ id: `p${i}`, brand: 'Same' }),
      score: 10 - i,
    }));
    const ranked = diversifyAndLimit(scored, 3);
    expect(ranked.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(ranked.length).toBeLessThanOrEqual(3);
    expect(DIVERSITY_CAPS.maxPerBrand).toBe(2);
  });
});
